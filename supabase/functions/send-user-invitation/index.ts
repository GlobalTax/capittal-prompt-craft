import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { SendInvitationSchema, validateInput, sanitizeError, escapeHtml } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request received`);

  try {
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log(`[${requestId}] Missing Authorization header`);
      return new Response(JSON.stringify({ error: 'Authorization header requerido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log(`[${requestId}] Auth failed:`, authError?.message);
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.email}`);

    // Check superadmin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isSuperAdmin = roles?.some(r => r.role === 'superadmin');
    const isAdmin = roles?.some(r => r.role === 'admin');

    // Admin client for RPC calls
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // PRIORITY 1: Check if user has admin/superadmin role
    if (!isSuperAdmin && !isAdmin) {
      console.log(`[${requestId}] Permission denied for user ${user.email}`);
      await supabaseAdmin.rpc('log_security_event_safe', {
        p_event_type: 'unauthorized_invitation_attempt',
        p_severity: 'high',
        p_description: `User ${user.email} attempted to send invitation without admin role`,
        p_metadata: {},
        p_user_id: user.id
      });
      return new Response(JSON.stringify({ error: 'Solo administradores y superadministradores pueden invitar usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PRIORITY 2: Rate limiting - ONLY for admins (superadmins bypass)
    if (!isSuperAdmin) {
      // Apply rate limit for regular admins: 10 invitations per hour
      const { data: rateLimitOk, error: rateLimitError } = await supabaseAdmin
        .rpc('check_rate_limit', {
          p_identifier: user.id,
          p_action_type: 'send_invitation',
          p_max_attempts: 10,
          p_window_minutes: 60
        });

      if (rateLimitError || !rateLimitOk) {
        console.error(`[${requestId}] Rate limit exceeded for admin:`, user.email);
        await supabaseAdmin.rpc('log_security_event_safe', {
          p_event_type: 'rate_limit_exceeded',
          p_severity: 'medium',
          p_description: `Admin ${user.email} exceeded invitation rate limit`,
          p_metadata: { action: 'send_invitation' },
          p_user_id: user.id
        });
        return new Response(
          JSON.stringify({ 
            error: 'Demasiadas invitaciones enviadas. Intenta de nuevo en 1 hora.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`[${requestId}] [bypass] Superadmin ${user.email} can send unlimited invitations`);
    }

    // Input validation with Zod
    const rawBody = await req.json();
    const validation = validateInput(SendInvitationSchema, rawBody);

    if (!validation.success) {
      console.warn(`[${requestId}] Validation failed:`, validation.errors);
      return new Response(JSON.stringify({ 
        error: 'Datos inválidos',
        details: validation.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email: cleanEmail, role, app_url } = validation.data;
    console.log(`[${requestId}] Creating invitation for ${cleanEmail} with role ${role}`);

    // Create invitation via DB function
    const { data, error } = await supabaseClient.rpc('create_user_invitation', {
      p_email: cleanEmail,
      p_role: role
    });

    if (error) {
      console.error(`[${requestId}] RPC error:`, error);
      
      // Handle enum cast error
      if (error.code === '22P02' || error.message?.includes('invalid input value for enum')) {
        return new Response(JSON.stringify({ 
          error: 'Rol no válido para el sistema',
          details: error.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle duplicate
      if (error.code === '23505') {
        console.log(`[${requestId}] Duplicate invitation, retrieving existing`);
        const { data: existing, error: fetchError } = await supabaseClient
          .from('pending_invitations')
          .select('token')
          .eq('email', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError || !existing) {
          console.error(`[${requestId}] Failed to retrieve existing:`, fetchError);
          return new Response(JSON.stringify({ 
            error: 'Invitación duplicada pero no se pudo recuperar',
            details: fetchError?.message 
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const frontendUrl = Deno.env.get('FRONTEND_URL') || app_url || req.headers.get('origin') || 'http://localhost:5173';
        const invitationUrl = `${frontendUrl}/invite?token=${existing.token}`;
        console.log(`[${requestId}] Existing invitation returned for ${cleanEmail}`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          invitation_id: existing.token,
          invitation_url: invitationUrl,
          message: 'Invitación ya existía, se devuelve el link existente'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Other DB errors
      return new Response(JSON.stringify({ 
        error: 'Error al crear invitación',
        details: error.message,
        code: error.code,
        hint: error.hint
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use frontend URL for invitation links
    const frontendUrl = Deno.env.get('FRONTEND_URL') || app_url || req.headers.get('origin') || 'http://localhost:5173';
    const invitationUrl = `${frontendUrl}/invite?token=${data}`;
    console.log(`[${requestId}] Success: invitation created by ${user.email} for ${cleanEmail}`);
    
    // Log successful invitation with security event
    await supabaseAdmin.rpc('log_security_event_safe', {
      p_event_type: 'user_invitation_sent',
      p_severity: 'low',
      p_description: `${isSuperAdmin ? 'Superadmin' : 'Admin'} ${user.email} invited ${cleanEmail} as ${role}`,
      p_metadata: { target_email: cleanEmail, role, is_superadmin: isSuperAdmin },
      p_user_id: user.id
    });
    
    // Redact token from logs for security (F10)
    const redactedUrl = invitationUrl.replace(/token=([^&]+)/, 'token=[REDACTED]');
    console.log(`[${requestId}] Invitation URL: ${redactedUrl}`);

    // Send email via Resend
    let emailSent = false;
    let emailError = null;
    
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      // TEMPORAL: Usando dominio de prueba de Resend hasta verificar algopasa.com
      const fromEmail = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';
      
      const { error: resendError } = await resend.emails.send({
        from: fromEmail,
        to: [cleanEmail],
        subject: 'Invitación a Algopasa',
        html: `
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                  line-height: 1.6; 
                  color: #1e293b;
                  background-color: #f8fafc;
                  padding: 20px;
                }
                .email-wrapper { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .header { 
                  background: linear-gradient(135deg, #0B6FF3 0%, #0956b8 100%);
                  padding: 40px 30px;
                  text-align: center;
                }
                .header h1 { 
                  color: #ffffff; 
                  font-size: 28px; 
                  font-weight: 600;
                  margin: 0;
                  letter-spacing: -0.5px;
                }
                .content { 
                  padding: 40px 30px;
                  background: #ffffff;
                }
                .content p { 
                  margin: 0 0 16px 0;
                  font-size: 16px;
                  color: #475569;
                }
                .role-badge {
                  display: inline-block;
                  background: #f1f5f9;
                  color: #0B6FF3;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 14px;
                  text-transform: capitalize;
                  margin: 8px 0;
                }
                .cta-container { 
                  text-align: center; 
                  margin: 32px 0;
                }
                .button { 
                  display: inline-block; 
                  background: #0B6FF3;
                  color: #ffffff !important;
                  padding: 16px 32px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  transition: background-color 0.2s;
                  box-shadow: 0 4px 6px -1px rgba(11, 111, 243, 0.3);
                }
                .button:hover { 
                  background: #0956b8;
                }
                .divider {
                  margin: 32px 0;
                  border-top: 1px solid #e2e8f0;
                }
                .link-section {
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 24px 0;
                }
                .link-section p {
                  font-size: 14px;
                  color: #64748b;
                  margin-bottom: 8px;
                }
                .link { 
                  color: #0B6FF3;
                  word-break: break-all;
                  font-size: 14px;
                  text-decoration: none;
                }
                .footer { 
                  text-align: center;
                  padding: 30px;
                  background: #f8fafc;
                  border-top: 1px solid #e2e8f0;
                }
                .footer p { 
                  color: #94a3b8;
                  font-size: 14px;
                  margin: 0;
                }
                .security-note {
                  margin-top: 32px;
                  padding-top: 24px;
                  border-top: 1px solid #e2e8f0;
                  font-size: 13px;
                  color: #64748b;
                }
                @media only screen and (max-width: 600px) {
                  body { padding: 10px; }
                  .header { padding: 30px 20px; }
                  .header h1 { font-size: 24px; }
                  .content { padding: 30px 20px; }
                  .button { padding: 14px 24px; font-size: 15px; }
                }
              </style>
            </head>
            <body>
              <div class="email-wrapper">
                <div class="header">
                  <h1>✉️ Has sido invitado</h1>
                </div>
                <div class="content">
                  <p style="font-size: 18px; color: #1e293b; font-weight: 500;">¡Bienvenido!</p>
                  <p>Has sido invitado a unirte a nuestra plataforma. Tu cuenta ha sido configurada con el siguiente rol:</p>
                  <div style="text-align: center; margin: 24px 0;">
                    <span class="role-badge">${role}</span>
                  </div>
                  <p>Para completar tu registro y establecer tu contraseña, haz clic en el botón de abajo:</p>
                  <div class="cta-container">
                    <a href="${invitationUrl}" class="button">Aceptar invitación →</a>
                  </div>
                  <div class="divider"></div>
                  <div class="link-section">
                    <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <a href="${invitationUrl}" class="link">${invitationUrl}</a>
                  </div>
                  <div class="security-note">
                    <p>🔒 <strong>Nota de seguridad:</strong> Este enlace es único y personal. No lo compartas con nadie. Si no esperabas esta invitación, puedes ignorar este correo de forma segura.</p>
                  </div>
                </div>
                <div class="footer">
                  <p>Este es un correo automático generado por el sistema.</p>
                  <p style="margin-top: 8px;">Por favor, no respondas a este mensaje.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (resendError) {
        console.error(`[${requestId}] Failed to send email:`, resendError);
        emailError = resendError.message;
      } else {
        console.log(`[${requestId}] Email sent successfully to ${cleanEmail}`);
        emailSent = true;
      }
    } catch (emailErr: any) {
      console.error(`[${requestId}] Email sending error:`, emailErr);
      emailError = emailErr.message;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      invitation_id: data,
      invitation_url: invitationUrl,
      email_sent: emailSent,
      email_error: emailError 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(JSON.stringify({ 
      error: sanitizeError(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
