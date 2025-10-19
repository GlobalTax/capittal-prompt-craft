import { supabase } from "@/integrations/supabase/client";

export const trackFunnelEvent = async (
  eventType: string,
  options?: {
    valuationId?: string;
    leadId?: string;
    metadata?: Record<string, any>;
  }
) => {
  try {
    const { data, error } = await supabase.rpc("log_funnel_event", {
      p_event_type: eventType,
      p_advisor_user_id: null, // Will be set automatically in the function
      p_valuation_id: options?.valuationId || null,
      p_sell_business_lead_id: options?.leadId || null,
      p_event_data: options?.metadata || {},
    });

    if (error) {
      console.error("Error tracking funnel event:", error);
    }

    return data;
  } catch (error) {
    console.error("Error in trackFunnelEvent:", error);
    return null;
  }
};