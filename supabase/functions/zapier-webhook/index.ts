import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event_type: string;
  timestamp: string;
  user: {
    id: string;
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    phone?: string;
    city?: string;
    advisory_type?: string;
    tax_id?: string;
    professional_number?: string;
    created_at?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Zapier webhook URL from secrets
    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'ZAPIER_WEBHOOK_URL')
      .single();

    if (secretError || !secretData?.decrypted_secret) {
      console.error('[Zapier Webhook] Webhook URL not configured:', secretError);
      return new Response(
        JSON.stringify({ error: 'Zapier webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookUrl = secretData.decrypted_secret;
    const payload: WebhookPayload = await req.json();

    console.log('[Zapier Webhook] Sending webhook:', {
      event: payload.event_type,
      user: payload.user.email,
    });

    // Send webhook to Zapier
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('[Zapier Webhook] Successfully sent to Zapier');

    // Log success
    await supabase.rpc('enhanced_log_security_event', {
      p_event_type: 'zapier_webhook_sent',
      p_severity: 'low',
      p_description: `Zapier webhook sent for ${payload.event_type}`,
      p_metadata: { user_email: payload.user.email },
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Zapier Webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
