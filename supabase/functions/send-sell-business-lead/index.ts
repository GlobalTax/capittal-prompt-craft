import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for validation
const SellBusinessSchema = z.object({
  companyName: z.string().trim().min(2, "El nombre de la empresa debe tener al menos 2 caracteres").max(200, "El nombre es demasiado largo"),
  sector: z.string().trim().min(2, "El sector es requerido").max(100),
  revenue: z.number().positive("La facturación debe ser positiva").max(999999999, "Valor demasiado grande"),
  contactName: z.string().trim().min(2, "El nombre de contacto es requerido").max(100),
  contactEmail: z.string().email("Email inválido").max(255),
  contactPhone: z.string().trim().min(9, "Teléfono inválido").max(20),
  message: z.string().trim().max(2000, "Mensaje demasiado largo").optional(),
  advisorUserId: z.string().uuid().optional(),
  valuationId: z.string().uuid().optional(),
});

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Error sanitization
function sanitizeError(error: any): string {
  console.error('[Internal Error]', error);
  
  // Map known errors to user-friendly messages
  if (error?.code === '23505') return 'Este registro ya existe';
  if (error?.code === '23503') return 'Referencia inválida';
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message).join(', ');
  }
  
  return 'Error al procesar la solicitud. Por favor contacta con soporte.';
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     '0.0.0.0';

    // Rate limiting: 3 submissions per hour per IP
    try {
      const { data: rateLimitOk, error: rlError } = await supabase.rpc(
        'check_rate_limit',
        {
          p_ip: clientIP,
          p_endpoint: 'sell_business_lead',
          p_max_requests: 3,
          p_window_minutes: 60
        }
      );

      if (rlError || !rateLimitOk) {
        console.warn(`[Rate Limit] IP ${clientIP} exceeded limit`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Demasiadas solicitudes. Máximo 3 envíos por hora.' 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (rateLimitError) {
      console.error('[Rate Limit] Error checking rate limit:', rateLimitError);
      // Continue processing if rate limit check fails (graceful degradation)
    }

    const rawData = await req.json();
    
    // Validate with Zod
    const validationResult = SellBusinessSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.warn('[Validation Error]', validationResult.error.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Datos inválidos',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData = validationResult.data;

    console.log("Processing sell business lead:", {
      companyName: requestData.companyName,
      advisorUserId: requestData.advisorUserId,
      valuationId: requestData.valuationId,
    });

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from("sell_business_leads")
      .insert({
        company_name: requestData.companyName,
        sector: requestData.sector,
        annual_revenue: requestData.revenue,
        contact_name: requestData.contactName,
        contact_email: requestData.contactEmail,
        contact_phone: requestData.contactPhone,
        message: requestData.message || null,
        advisor_user_id: requestData.advisorUserId || null,
        valuation_id: requestData.valuationId || null,
        status: "new",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting lead:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: sanitizeError(insertError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lead created successfully:", lead.id);

    // Log funnel analytics
    await supabase.rpc("log_funnel_event", {
      p_event_type: "form_submitted",
      p_advisor_user_id: requestData.advisorUserId || null,
      p_valuation_id: requestData.valuationId || null,
      p_sell_business_lead_id: lead.id,
      p_event_data: {
        company_name: requestData.companyName,
        sector: requestData.sector,
        revenue: requestData.revenue,
      },
    });

    // Get advisor info if exists
    let advisorInfo = null;
    if (requestData.advisorUserId) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, email")
        .eq("id", requestData.advisorUserId)
        .single();

      if (profile) {
        advisorInfo = profile;
      }
    }

    // Escape all user inputs for HTML
    const safe = {
      company_name: escapeHtml(requestData.companyName),
      sector: escapeHtml(requestData.sector),
      contact_name: escapeHtml(requestData.contactName),
      contact_email: escapeHtml(requestData.contactEmail),
      contact_phone: escapeHtml(requestData.contactPhone),
      message: escapeHtml(requestData.message || ''),
      annual_revenue: requestData.revenue
    };

    // Professional HTML template for company
    const companyEmail = await resend.emails.send({
      from: 'Capittal <onboarding@resend.dev>',
      to: ['info@capittal.com'],
      subject: `🎯 Nuevo Lead de Venta: ${safe.company_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎯 Nuevo Lead de Venta</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 20px 0;">Detalles de la Empresa</h2>
                      <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Empresa:</td>
                          <td style="padding: 12px 0; color: #1a1a1a; font-weight: 500;">${safe.company_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Sector:</td>
                          <td style="padding: 12px 0; color: #1a1a1a;">${safe.sector}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Facturación Anual:</td>
                          <td style="padding: 12px 0; color: #10b981; font-weight: 600; font-size: 18px;">${safe.annual_revenue.toLocaleString()}€</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Contacto:</td>
                          <td style="padding: 12px 0; color: #1a1a1a;">${safe.contact_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Email:</td>
                          <td style="padding: 12px 0;"><a href="mailto:${safe.contact_email}" style="color: #667eea; text-decoration: none;">${safe.contact_email}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Teléfono:</td>
                          <td style="padding: 12px 0;"><a href="tel:${safe.contact_phone}" style="color: #667eea; text-decoration: none;">${safe.contact_phone}</a></td>
                        </tr>
                        ${advisorInfo ? `
                        <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f0fdf4;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Referido por:</td>
                          <td style="padding: 12px 0; color: #10b981; font-weight: 600;">${escapeHtml(advisorInfo.first_name)} ${escapeHtml(advisorInfo.last_name)}</td>
                        </tr>
                        ` : ''}
                      </table>
                      ${safe.message ? `
                      <div style="margin-top: 24px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #667eea; border-radius: 6px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Mensaje del cliente:</p>
                        <p style="margin: 0; color: #1a1a1a; line-height: 1.6;">${safe.message}</p>
                      </div>
                      ` : ''}
                      <div style="margin-top: 32px; text-align: center;">
                        <a href="${supabaseUrl.replace('https://', 'https://app.')}/admin/sell-leads" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          Ver en Dashboard →
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">
                        © ${new Date().getFullYear()} Capittal. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    // Professional confirmation email to client
    const clientEmail = await resend.emails.send({
      from: 'Capittal <onboarding@resend.dev>',
      to: [requestData.contactEmail],
      subject: '✅ Hemos recibido tu solicitud - Capittal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">✅ Solicitud Recibida</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px 0;">Hola ${safe.contact_name},</h2>
                      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                        Gracias por confiar en <strong style="color: #667eea;">Capittal</strong> para vender <strong>${safe.company_name}</strong>.
                      </p>
                      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                        Hemos recibido tu solicitud y nuestro equipo de expertos la está revisando. Nos pondremos en contacto contigo en las <strong>próximas 24-48 horas</strong> para agendar una llamada inicial.
                      </p>
                      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 6px;">
                        <h3 style="color: #059669; margin: 0 0 12px 0; font-size: 18px;">📋 Próximos Pasos</h3>
                        <ol style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li><strong>Revisión inicial</strong> de tu empresa y mercado</li>
                          <li><strong>Llamada de descubrimiento</strong> (30-45 minutos)</li>
                          <li><strong>Valoración detallada</strong> y análisis de mercado</li>
                          <li><strong>Propuesta de colaboración</strong> personalizada</li>
                        </ol>
                      </div>
                      <p style="color: #4b5563; line-height: 1.6; margin: 24px 0 0 0; font-size: 16px;">
                        Si tienes alguna pregunta urgente, no dudes en responder a este email.
                      </p>
                      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Saludos cordiales,</p>
                        <p style="color: #667eea; margin: 0; font-size: 16px; font-weight: 600;">Equipo Capittal</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                        © ${new Date().getFullYear()} Capittal. Expertos en Valoración y Venta de Empresas.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Emails sent successfully to Capittal and client");

    return new Response(
      JSON.stringify({
        success: true,
        leadId: lead.id,
        message: "Lead creado y notificaciones enviadas",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});