import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('[Zapier Queue Processor] Starting webhook queue processing...');

    // Get Zapier webhook URL from secrets
    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'ZAPIER_WEBHOOK_URL')
      .single();

    if (secretError || !secretData?.decrypted_secret) {
      console.error('[Zapier Queue Processor] Webhook URL not configured');
      return new Response(
        JSON.stringify({ error: 'Zapier webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookUrl = secretData.decrypted_secret;

    // Get pending webhooks (max 3 attempts)
    const { data: pendingWebhooks, error: queueError } = await supabase
      .from('zapier_webhook_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`);
    }

    if (!pendingWebhooks || pendingWebhooks.length === 0) {
      console.log('[Zapier Queue Processor] No pending webhooks');
      return new Response(
        JSON.stringify({ message: 'No pending webhooks', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Zapier Queue Processor] Processing ${pendingWebhooks.length} webhooks`);

    let successCount = 0;
    let failureCount = 0;

    // Process each webhook
    for (const webhook of pendingWebhooks) {
      try {
        console.log(`[Zapier Queue Processor] Sending webhook ${webhook.id}...`);

        // Send webhook to Zapier
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhook.payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Mark as sent
        await supabase
          .from('zapier_webhook_queue')
          .update({
            status: 'sent',
            processed_at: new Date().toISOString(),
            attempts: webhook.attempts + 1,
          })
          .eq('id', webhook.id);

        console.log(`[Zapier Queue Processor] ✓ Webhook ${webhook.id} sent successfully`);
        successCount++;

      } catch (error) {
        console.error(`[Zapier Queue Processor] ✗ Failed to send webhook ${webhook.id}:`, error);

        const newAttempts = webhook.attempts + 1;
        const status = newAttempts >= 3 ? 'failed' : 'pending';
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Update with error and increment attempts
        await supabase
          .from('zapier_webhook_queue')
          .update({
            status,
            last_error: errorMessage,
            attempts: newAttempts,
            ...(status === 'failed' && { processed_at: new Date().toISOString() }),
          })
          .eq('id', webhook.id);

        failureCount++;
      }
    }

    const result = {
      processed: pendingWebhooks.length,
      successful: successCount,
      failed: failureCount,
    };

    console.log('[Zapier Queue Processor] Processing complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Zapier Queue Processor] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
