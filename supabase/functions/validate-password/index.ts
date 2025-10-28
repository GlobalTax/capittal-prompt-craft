import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting for edge function
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, maxAttempts: number = 10, windowMinutes: number = 1): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(ip) || [];
  
  // Clean old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < windowMinutes * 60 * 1000);
  
  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    return false;
  }
  
  // Add new attempt
  recentAttempts.push(now);
  rateLimitMap.set(ip, recentAttempts);
  
  // Cleanup: Remove entries older than 5 minutes
  if (rateLimitMap.size > 1000) {
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    for (const [key, times] of rateLimitMap.entries()) {
      const validTimes = times.filter(t => t > fiveMinutesAgo);
      if (validTimes.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, validTimes);
      }
    }
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Rate limiting: 10 attempts per minute per IP
    if (!checkRateLimit(clientIp, 10, 1)) {
      console.warn(`[Rate Limit] IP ${clientIp} exceeded password validation limit`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          errors: ['Demasiados intentos. Intenta de nuevo en 1 minuto.'] 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { password } = await req.json();
    
    if (!password) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          errors: ['La contraseña es requerida'] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .rpc('validate_password_strength', { password });

    if (error) {
      console.error('[validate-password] Database error:', error.code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          errors: ['Error al validar la contraseña. Intenta de nuevo.'] 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-password] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ 
        valid: false, 
        errors: ['Error al procesar la solicitud'] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});