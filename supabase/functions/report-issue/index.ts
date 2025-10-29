import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportIssueBody {
  issueType: 'error' | 'bug' | 'feedback' | 'other';
  title: string;
  description: string;
  route?: string;
  errorStack?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const severityEmoji = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  critical: '🔴'
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Rate limiting check: max 5 reports per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentReports, error: countError } = await supabase
      .from('issue_reports')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    } else if (recentReports && recentReports.length >= 5) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Maximum 5 reports per hour." 
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const body: ReportIssueBody = await req.json();
    const { 
      issueType, 
      title, 
      description, 
      route, 
      errorStack, 
      userAgent, 
      timestamp,
      severity 
    } = body;

    // Validate required fields
    if (!issueType || !title || !description || !severity) {
      throw new Error("Missing required fields");
    }

    // Get user profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', user.id)
      .single();

    const userName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
      : 'Usuario desconocido';
    const userEmail = profile?.email || user.email || 'Email no disponible';

    // Save to database
    const { error: insertError } = await supabase
      .from('issue_reports')
      .insert({
        user_id: user.id,
        issue_type: issueType,
        title,
        description,
        route,
        error_stack: errorStack,
        user_agent: userAgent,
        severity,
        status: 'new'
      });

    if (insertError) {
      console.error('Error saving report:', insertError);
      throw new Error('Failed to save report');
    }

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #555; }
            .field-value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0; }
            .stack-trace { font-family: 'Courier New', monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
            .severity-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .severity-low { background: #e3f2fd; color: #1976d2; }
            .severity-medium { background: #fff3e0; color: #f57c00; }
            .severity-high { background: #ffe0b2; color: #e65100; }
            .severity-critical { background: #ffebee; color: #c62828; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${severityEmoji[severity]} Nuevo Reporte: ${issueType.toUpperCase()}</h2>
              <p style="margin: 0;">${title}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">Severidad:</div>
                <div class="field-value">
                  <span class="severity-badge severity-${severity}">${severity.toUpperCase()}</span>
                </div>
              </div>
              
              <div class="field">
                <div class="field-label">Usuario:</div>
                <div class="field-value">
                  <strong>${userName}</strong><br>
                  ${userEmail}<br>
                  ID: ${user.id}
                </div>
              </div>
              
              <div class="field">
                <div class="field-label">Descripción:</div>
                <div class="field-value">${description.replace(/\n/g, '<br>')}</div>
              </div>
              
              ${route ? `
              <div class="field">
                <div class="field-label">Ruta:</div>
                <div class="field-value">${route}</div>
              </div>
              ` : ''}
              
              ${errorStack ? `
              <div class="field">
                <div class="field-label">Stack Trace:</div>
                <div class="field-value stack-trace">${errorStack}</div>
              </div>
              ` : ''}
              
              ${userAgent ? `
              <div class="field">
                <div class="field-label">Navegador:</div>
                <div class="field-value">${userAgent}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="field-label">Timestamp:</div>
                <div class="field-value">${new Date(timestamp).toLocaleString('es-ES')}</div>
              </div>
              
              <div class="footer">
                <p>Este reporte ha sido registrado en la base de datos con estado "new".</p>
                <p>
                  <a href="https://supabase.com/dashboard/project/nbvvdaprcecaqvvkqcto/editor" 
                     style="color: #667eea; text-decoration: none;">
                    Ver en Supabase →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to support team
    const emailResponse = await resend.emails.send({
      from: "Capittal Soporte <onboarding@resend.dev>",
      to: ["Samuel@capittal.es", "Lluis@capittal.es"],
      subject: `${severityEmoji[severity]} [${severity.toUpperCase()}] Reporte de ${issueType}: ${title}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Report submitted successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in report-issue function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error" 
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
