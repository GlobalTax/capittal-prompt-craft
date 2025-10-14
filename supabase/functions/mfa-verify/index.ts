import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple TOTP implementation
function generateTOTP(secret: string, timeStep = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(time), false);
  
  const key = base32Decode(secret);
  return hmacSHA1(key, new Uint8Array(buffer))
    .toString()
    .slice(-6)
    .padStart(6, '0');
}

function verifyTOTP(token: string, secret: string, window = 1): boolean {
  const currentTime = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -window; i <= window; i++) {
    const testTime = currentTime + i;
    const testToken = generateTOTPAtTime(secret, testTime);
    if (testToken === token) {
      return true;
    }
  }
  return false;
}

function generateTOTPAtTime(secret: string, time: number): string {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(time), false);
  
  const key = base32Decode(secret);
  const hmac = hmacSHA1(key, new Uint8Array(buffer));
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = 
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

function base32Decode(secret: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  secret = secret.toUpperCase().replace(/=+$/, '');
  
  let bits = '';
  for (const char of secret) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  
  return bytes;
}

function hmacSHA1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  
  if (key.length > blockSize) {
    key = sha1(key);
  }
  
  const keyPadded = new Uint8Array(blockSize);
  keyPadded.set(key);
  
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = keyPadded[i] ^ 0x36;
    opad[i] = keyPadded[i] ^ 0x5c;
  }
  
  const innerHash = sha1(concat(ipad, message));
  return sha1(concat(opad, innerHash));
}

function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;
  
  const ml = data.length * 8;
  const paddedLength = Math.ceil((data.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[data.length] = 0x80;
  
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 4, ml, false);
  
  for (let offset = 0; offset < paddedLength; offset += 64) {
    const w = new Uint32Array(80);
    
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16], 1);
    }
    
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5A827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      
      const temp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }
    
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  
  const result = new Uint8Array(20);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false);
  resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false);
  resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false);
  
  return result;
}

function rotl(n: number, b: number): number {
  return ((n << b) | (n >>> (32 - b))) >>> 0;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, user_id } = await req.json();
    
    if (!token || !user_id) {
      return new Response(
        JSON.stringify({ error: 'token y user_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Obtener secret del usuario
    const { data: mfaFactor, error: fetchError } = await supabase
      .from('user_mfa_factors')
      .select('secret, id')
      .eq('user_id', user_id)
      .eq('is_verified', true)
      .single();
    
    if (fetchError || !mfaFactor) {
      console.error('[mfa-verify] MFA factor not found:', fetchError);
      return new Response(
        JSON.stringify({ valid: false, error: 'MFA no configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar TOTP
    const valid = verifyTOTP(token, mfaFactor.secret, 1);
    
    if (valid) {
      // Actualizar last_used_at
      await supabase
        .from('user_mfa_factors')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', mfaFactor.id);
      
      console.log(`[mfa-verify] Valid token for user: ${user_id}`);
    } else {
      console.log(`[mfa-verify] Invalid token for user: ${user_id}`);
    }
    
    return new Response(
      JSON.stringify({ valid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[mfa-verify] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
