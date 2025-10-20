import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SellBusinessRequest {
  companyName: string;
  sector: string;
  revenue: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  message: string;
  advisorUserId?: string;
  valuationId?: string;
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

    const requestData: SellBusinessRequest = await req.json();

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
        message: requestData.message,
        advisor_user_id: requestData.advisorUserId || null,
        valuation_id: requestData.valuationId || null,
        status: "new",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting lead:", insertError);
      throw insertError;
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

    const {
      companyName: company_name,
      sector,
      revenue: annual_revenue,
      contactName: contact_name,
      contactEmail: contact_email,
      contactPhone: contact_phone,
      message,
      valuationId: valuation_id
    } = requestData;

    // Professional HTML template for company
    const companyEmail = await resend.emails.send({
      from: 'Capittal <onboarding@resend.dev>',
      to: ['info@capittal.com'],
      subject: `🎯 Nuevo Lead de Venta: ${company_name}`,
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
                          <td style="padding: 12px 0; color: #1a1a1a; font-weight: 500;">${company_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Sector:</td>
                          <td style="padding: 12px 0; color: #1a1a1a;">${sector}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Facturación Anual:</td>
                          <td style="padding: 12px 0; color: #10b981; font-weight: 600; font-size: 18px;">${annual_revenue?.toLocaleString()}€</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Contacto:</td>
                          <td style="padding: 12px 0; color: #1a1a1a;">${contact_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Email:</td>
                          <td style="padding: 12px 0;"><a href="mailto:${contact_email}" style="color: #667eea; text-decoration: none;">${contact_email}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Teléfono:</td>
                          <td style="padding: 12px 0;"><a href="tel:${contact_phone}" style="color: #667eea; text-decoration: none;">${contact_phone}</a></td>
                        </tr>
                        ${advisorInfo ? `
                        <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f0fdf4;">
                          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Referido por:</td>
                          <td style="padding: 12px 0; color: #10b981; font-weight: 600;">${advisorInfo.first_name} ${advisorInfo.last_name}</td>
                        </tr>
                        ` : ''}
                      </table>
                      ${message ? `
                      <div style="margin-top: 24px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #667eea; border-radius: 6px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Mensaje del cliente:</p>
                        <p style="margin: 0; color: #1a1a1a; line-height: 1.6;">${message}</p>
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
      to: [contact_email],
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
                      <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px 0;">Hola ${contact_name},</h2>
                      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                        Gracias por confiar en <strong style="color: #667eea;">Capittal</strong> para vender <strong>${company_name}</strong>.
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
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 6px;">
                        <h3 style="color: #d97706; margin: 0 0 12px 0; font-size: 16px;">💡 Mientras tanto, te recomendamos preparar:</h3>
                        <ul style="color: #78350f; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li>Estados financieros de los <strong>últimos 3 años</strong></li>
                          <li>Información sobre <strong>activos y pasivos</strong></li>
                          <li>Listado de <strong>clientes principales</strong> (sin datos sensibles)</li>
                          <li>Detalles de <strong>contratos importantes</strong></li>
                          <li>Organigrama y <strong>estructura del equipo</strong></li>
                        </ul>
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
                      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        Este email fue enviado automáticamente. Por favor, no respondas a esta dirección.
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
    console.error("Error in send-sell-business-lead:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});