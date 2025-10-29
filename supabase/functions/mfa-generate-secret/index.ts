import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base32 encoding para TOTP secret
function base32Encode(data: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[mfa-generate-secret] Request received');

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[mfa-generate-secret] Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[mfa-generate-secret] Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[mfa-generate-secret] User authenticated: ${user.id}`);

    // ✅ Generar secret en el servidor (NUNCA en el cliente)
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    const base32Secret = base32Encode(randomBytes);

    console.log('[mfa-generate-secret] Secret generated (not logged for security)');

    // ✅ Guardar secret en DB (sin verificar todavía)
    const { data: factor, error: insertError } = await supabase
      .from('user_mfa_factors')
      .insert({
        user_id: user.id,
        factor_type: 'totp',
        secret: base32Secret,
        is_verified: false, // ⚠️ Importante: no verificado aún
        verified_at: null
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[mfa-generate-secret] Error inserting factor:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al crear factor MFA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[mfa-generate-secret] Factor created: ${factor.id}`);

    // ✅ Generar QR code URL (otpauth format)
    const otpauthUrl = `otpauth://totp/Capittal:${user.email}?secret=${base32Secret}&issuer=Capittal`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    console.log('[mfa-generate-secret] QR code URL generated');

    // ✅ Solo devolver QR y factor_id al cliente (NO el secret)
    return new Response(
      JSON.stringify({
        qr_code_url: qrCodeUrl,
        factor_id: factor.id,
        // ❌ NUNCA enviar: secret: base32Secret
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[mfa-generate-secret] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
