import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityAlertPayload {
  event_id: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  metadata?: any;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SecurityAlertPayload = await req.json();
    
    console.log('Security alert received:', {
      event_id: payload.event_id,
      event_type: payload.event_type,
      severity: payload.severity,
    });

    // Solo procesar alertas críticas o de alta severidad
    if (!['critical', 'high'].includes(payload.severity)) {
      console.log('Skipping alert - not critical/high severity');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'low_severity' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener emails de superadmins
    const { data: superadmins, error: adminsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'superadmin');

    if (adminsError) {
      console.error('Error fetching superadmins:', adminsError);
      throw adminsError;
    }

    if (!superadmins || superadmins.length === 0) {
      console.log('No superadmins found to notify');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_superadmins' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener emails de los superadmins
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const superadminIds = superadmins.map(sa => sa.user_id);
    const adminEmails = users.users
      .filter(u => superadminIds.includes(u.id))
      .map(u => u.email)
      .filter((email): email is string => !!email);

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_admin_emails' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending alert to ${adminEmails.length} superadmins`);

    // Verificar que RESEND_API_KEY existe
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos del email
    const severityEmoji = payload.severity === 'critical' ? '🔴' : '🟠';
    const severityColor = payload.severity === 'critical' ? '#dc2626' : '#ea580c';

    // Formatear metadata para el email
    const metadataHtml = payload.metadata 
      ? `<pre style="background: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(payload.metadata, null, 2)}</pre>`
      : '<p>No metadata available</p>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin: 12px 0; }
          .label { font-weight: 600; color: #6b7280; font-size: 0.875rem; }
          .value { margin-top: 4px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${severityEmoji} Alerta de Seguridad</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Severidad: ${payload.severity.toUpperCase()}</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Tipo de Evento</div>
              <div class="value"><strong>${payload.event_type}</strong></div>
            </div>
            
            <div class="field">
              <div class="label">Descripción</div>
              <div class="value">${payload.description}</div>
            </div>
            
            ${payload.user_email ? `
              <div class="field">
                <div class="label">Usuario Afectado</div>
                <div class="value">${payload.user_email}</div>
              </div>
            ` : ''}
            
            ${payload.ip_address ? `
              <div class="field">
                <div class="label">Dirección IP</div>
                <div class="value"><code>${payload.ip_address}</code></div>
              </div>
            ` : ''}
            
            <div class="field">
              <div class="label">Fecha y Hora</div>
              <div class="value">${new Date(payload.created_at).toLocaleString('es-ES', { 
                timeZone: 'Europe/Madrid',
                dateStyle: 'full',
                timeStyle: 'medium'
              })}</div>
            </div>
            
            ${payload.metadata ? `
              <div class="field">
                <div class="label">Detalles Técnicos</div>
                <div class="value">${metadataHtml}</div>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Este es un mensaje automático del sistema de monitoreo de seguridad.</p>
              <p>ID del Evento: <code>${payload.event_id}</code></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email usando fetch directo a Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Seguridad <security@algopasa.com>',
        to: adminEmails,
        subject: `${severityEmoji} Alerta de Seguridad: ${payload.event_type}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    // Registrar que la alerta fue enviada
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'alert_notification_sent',
        severity: 'low',
        description: `Notificación de alerta enviada a ${adminEmails.length} superadmins`,
        metadata: {
          original_event_id: payload.event_id,
          original_event_type: payload.event_type,
          recipients: adminEmails.length,
          email_result: emailResult,
        },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent_to: adminEmails.length,
        email_id: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in security-alerts function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});