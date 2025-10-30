import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestSellCollaborationBody {
  valuationId: string;
  advisorUserId: string;
  companyName: string;
  sector: string;
  annualRevenue: number;
  valuationAmount: number;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestSellCollaborationBody = await req.json();
    const { valuationId, advisorUserId, companyName, sector, annualRevenue, valuationAmount, notes } = body;

    console.log("Processing sell collaboration request:", {
      valuationId,
      advisorUserId,
      companyName,
    });

    // Rate limiting: Check if advisor has made more than 3 requests today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: recentRequests, error: rateLimitError } = await supabaseClient
      .from("advisor_collaboration_requests")
      .select("id")
      .eq("requesting_advisor_id", advisorUserId)
      .gte("created_at", today.toISOString());

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (recentRequests && recentRequests.length >= 3) {
      return new Response(
        JSON.stringify({ 
          error: "Has alcanzado el límite de 3 solicitudes por día. Por favor, intenta mañana." 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get advisor profile details
    const { data: advisorProfile, error: advisorError } = await supabaseClient
      .from("advisor_profiles")
      .select("user_id, business_name, contact_phone, website")
      .eq("user_id", advisorUserId)
      .maybeSingle();

    if (advisorError) {
      console.error("Error fetching advisor profile:", advisorError);
    }

    // Get email from authenticated user
    const advisorEmail = user.email || "No disponible";

    // Get additional user details
    const { data: advisorUserProfile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("first_name, last_name, company")
      .eq("user_id", advisorUserId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    const advisorName = advisorUserProfile
      ? `${advisorUserProfile.first_name || ''} ${advisorUserProfile.last_name || ''}`.trim() || "Asesor Desconocido"
      : "Asesor Desconocido";
    const advisorPhone = advisorProfile?.contact_phone || "No disponible";
    const advisorBusiness = advisorProfile?.business_name || "No especificado";

    // Create sell_business_lead
    const { data: leadData, error: leadError } = await supabaseClient
      .from("sell_business_leads")
      .insert({
        company_name: companyName,
        sector: sector,
        annual_revenue: annualRevenue,
        status: "new",
        source: "referral",
        advisor_user_id: advisorUserId,
        valuation_id: valuationId,
        contact_name: advisorName,
        contact_email: advisorEmail,
        contact_phone: advisorPhone,
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating sell business lead:", leadError);
      throw new Error("No se pudo crear el lead de venta");
    }

    console.log("Created sell business lead successfully:", {
      leadId: leadData.id,
      source: "referral",
      advisorUserId,
      valuationId,
      companyName,
    });

    // Create collaboration request
    const { data: collabData, error: collabError } = await supabaseClient
      .from("advisor_collaboration_requests")
      .insert({
        requesting_advisor_id: advisorUserId,
        target_advisor_id: null, // For Capittal team
        lead_id: leadData.id,
        collaboration_type: "expertise_needed",
        status: "pending",
        message: notes || "Solicitud de ayuda para vender empresa",
      })
      .select()
      .single();

    if (collabError) {
      console.error("Error creating collaboration request:", collabError);
      throw new Error("No se pudo crear la solicitud de colaboración");
    }

    console.log("Created collaboration request:", collabData.id);

    // Log funnel event
    try {
      await supabaseClient.rpc("log_funnel_event", {
        p_event_type: "sell_collaboration_requested",
        p_advisor_user_id: advisorUserId,
        p_valuation_id: valuationId,
        p_sell_business_lead_id: leadData.id,
        p_event_data: {
          collaboration_request_id: collabData.id,
          company_name: companyName,
          valuation_amount: valuationAmount,
        },
      });
    } catch (analyticsError) {
      console.error("Error logging funnel event:", analyticsError);
    }

    // Prepare email content
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section h2 { color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
            .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🤝 Nueva Solicitud de Colaboración para Venta</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Un asesor necesita ayuda para vender una empresa</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>👤 Datos del Asesor Solicitante</h2>
                <div class="data-row">
                  <span class="label">Nombre:</span>
                  <span class="value">${advisorName}</span>
                </div>
                <div class="data-row">
                  <span class="label">Email:</span>
                  <span class="value">${advisorEmail}</span>
                </div>
                <div class="data-row">
                  <span class="label">Teléfono:</span>
                  <span class="value">${advisorPhone}</span>
                </div>
                <div class="data-row">
                  <span class="label">Empresa/Despacho:</span>
                  <span class="value">${advisorBusiness}</span>
                </div>
              </div>

              <div class="section">
                <h2>🏢 Datos de la Empresa a Vender</h2>
                <div class="data-row">
                  <span class="label">Nombre:</span>
                  <span class="value">${companyName}</span>
                </div>
                <div class="data-row">
                  <span class="label">Sector:</span>
                  <span class="value">${sector}</span>
                </div>
                <div class="data-row">
                  <span class="label">Facturación Anual:</span>
                  <span class="value">${formatCurrency(annualRevenue)}</span>
                </div>
                <div class="data-row">
                  <span class="label">Valoración Estimada:</span>
                  <span class="value"><strong>${formatCurrency(valuationAmount)}</strong></span>
                </div>
              </div>

              ${notes ? `
              <div class="section">
                <h2>📝 Notas del Asesor</h2>
                <div class="highlight">
                  ${notes.replace(/\n/g, '<br>')}
                </div>
              </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://mivaloracion.es/valuation/${valuationId}" class="button">
                  📊 Ver Valoración Completa
                </a>
                <a href="https://mivaloracion.es/admin/sell-business-leads" class="button">
                  🎯 Gestionar Lead
                </a>
              </div>

              <div class="footer">
                <p>Solicitud recibida el ${new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p>Lead ID: ${leadData.id} | Collaboration Request ID: ${collabData.id}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to Samuel and Lluis
    const emailPromises = [
      resend.emails.send({
        from: "Capittal Platform <onboarding@resend.dev>",
        to: ["Samuel@capittal.es"],
        subject: `🤝 Nuevo Asesor Solicita Ayuda para Vender - ${companyName}`,
        html: emailHtml,
      }),
      resend.emails.send({
        from: "Capittal Platform <onboarding@resend.dev>",
        to: ["Lluis@capittal.es"],
        subject: `🤝 Nuevo Asesor Solicita Ayuda para Vender - ${companyName}`,
        html: emailHtml,
      }),
    ];

    const emailResults = await Promise.allSettled(emailPromises);

    emailResults.forEach((result, index) => {
      const recipient = index === 0 ? "Samuel" : "Lluis";
      if (result.status === "fulfilled") {
        console.log(`Email sent successfully to ${recipient}:`, result.value);
      } else {
        console.error(`Error sending email to ${recipient}:`, result.reason);
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        leadId: leadData.id,
        collaborationRequestId: collabData.id,
        message: "Solicitud enviada correctamente",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in request-sell-collaboration function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
