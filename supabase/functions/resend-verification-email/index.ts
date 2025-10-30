import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    console.log(`[resend-verification] Request from IP: ${ip} for email: ${email}`);

    // Check rate limit using database function
    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient
      .rpc('check_verification_email_rate_limit', {
        p_email: email.toLowerCase().trim(),
        p_max_per_hour: 3
      });

    if (rateLimitError) {
      console.error('[resend-verification] Rate limit check error:', rateLimitError);
      // Continue anyway - don't block user if rate limit check fails
    } else if (!rateLimitOk) {
      console.log('[resend-verification] Rate limit exceeded for:', email);
      // Always return success to prevent email enumeration
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Si el correo existe, recibirás un email de verificación.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resend verification email using Supabase auth
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `https://mivaloracion.es/auth/callback`
      }
    });

    // Log the attempt (regardless of success to track patterns)
    await supabaseClient.rpc('log_verification_email_sent', {
      p_user_id: null, // We don't have user_id in this context
      p_email: email.toLowerCase().trim(),
      p_ip_address: ip,
      p_user_agent: req.headers.get('user-agent')
    });

    // Always return success to prevent email enumeration
    // (Don't reveal if email exists or not)
    if (error) {
      console.error('[resend-verification] Supabase resend error:', error);
    } else {
      console.log('[resend-verification] Email sent successfully to:', email);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Si el correo existe, recibirás un email de verificación en breve.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[resend-verification] Unexpected error:', error);
    
    // Return generic success message to prevent information leakage
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Si el correo existe, recibirás un email de verificación.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
