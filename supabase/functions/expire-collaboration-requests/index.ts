import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Calcular fecha límite (30 días atrás)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 30);

    console.log("Checking for expired collaboration requests older than:", expirationDate.toISOString());

    // Actualizar requests pendientes que expiraron
    const { data: expiredRequests, error } = await supabaseClient
      .from('advisor_collaboration_requests')
      .update({ 
        status: 'expired',
        response_message: 'Solicitud expirada automáticamente por falta de respuesta'
      })
      .eq('status', 'pending')
      .lt('created_at', expirationDate.toISOString())
      .select();

    if (error) {
      console.error("Error expiring requests:", error);
      throw error;
    }

    const expiredCount = expiredRequests?.length || 0;
    console.log(`Successfully expired ${expiredCount} collaboration requests`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        expired_ids: expiredRequests?.map(r => r.id),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in expire-collaboration-requests function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
