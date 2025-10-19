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
    let advisorInfo = "Lead directo desde la web";
    if (requestData.advisorUserId) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, email")
        .eq("id", requestData.advisorUserId)
        .single();

      if (profile) {
        advisorInfo = `${profile.first_name} ${profile.last_name} (${profile.email})`;
      }
    }

    // Send email to Capittal
    const emailToCapittal = await resend.emails.send({
      from: "Capittal Leads <onboarding@resend.dev>",
      to: ["info@capittal.com"], // Replace with actual email
      subject: `🎯 Nuevo Lead de Venta - ${requestData.companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Nuevo Lead de Venta</h1>
          
          <h2>Detalles de la Empresa</h2>
          <ul>
            <li><strong>Nombre:</strong> ${requestData.companyName}</li>
            <li><strong>Sector:</strong> ${requestData.sector}</li>
            <li><strong>Facturación estimada:</strong> €${requestData.revenue.toLocaleString()}</li>
          </ul>
          
          <h2>Contacto</h2>
          <ul>
            <li><strong>Nombre:</strong> ${requestData.contactName}</li>
            <li><strong>Email:</strong> ${requestData.contactEmail}</li>
            <li><strong>Teléfono:</strong> ${requestData.contactPhone}</li>
          </ul>
          
          <h2>Mensaje</h2>
          <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${requestData.message}</p>
          
          <h2>Origen del Lead</h2>
          <p><strong>Asesor:</strong> ${advisorInfo}</p>
          ${requestData.valuationId ? `<p><strong>Valoración origen:</strong> ${requestData.valuationId}</p>` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="text-align: center; color: #6b7280;">
            <a href="${supabaseUrl.replace('https://', 'https://app.')}/admin/sell-leads" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver en Dashboard
            </a>
          </p>
        </div>
      `,
    });

    // Send confirmation email to client
    const emailToClient = await resend.emails.send({
      from: "Capittal <onboarding@resend.dev>",
      to: [requestData.contactEmail],
      subject: "Hemos recibido tu solicitud - Capittal",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Gracias por contactarnos!</h1>
          
          <p>Hola ${requestData.contactName},</p>
          
          <p>Hemos recibido tu solicitud para vender <strong>${requestData.companyName}</strong>.</p>
          
          <p>Nuestro equipo especializado en M&A revisará la información y se pondrá en contacto contigo en las próximas 24-48 horas para analizar las mejores opciones para maximizar el valor de tu empresa.</p>
          
          <h2>Próximos Pasos</h2>
          <ol>
            <li>Un asesor de Capittal se pondrá en contacto contigo</li>
            <li>Realizaremos un análisis preliminar de tu empresa</li>
            <li>Te presentaremos una estrategia personalizada de venta</li>
          </ol>
          
          <p>Si tienes alguna pregunta urgente, puedes contactarnos directamente:</p>
          <ul>
            <li>📧 Email: info@capittal.com</li>
            <li>📱 Teléfono: +34 XXX XXX XXX</li>
          </ul>
          
          <p style="margin-top: 30px;">Saludos cordiales,<br><strong>Equipo Capittal</strong></p>
        </div>
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