import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MFARateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  reset_at: string;
  failed_attempts: number;
}

export const useMFARateLimit = (userId: string | undefined) => {
  const [rateLimit, setRateLimit] = useState<MFARateLimitResult | null>(null);
  const [loading, setLoading] = useState(false);

  const checkRateLimit = async (ipAddress: string) => {
    if (!userId) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('check_mfa_rate_limit', {
        p_user_id: userId,
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('Error checking MFA rate limit:', error);
        return null;
      }

      const result = data as unknown as MFARateLimitResult;
      setRateLimit(result);
      return result;
    } catch (error) {
      console.error('Exception checking MFA rate limit:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetRateLimit = () => {
    setRateLimit(null);
  };

  return {
    rateLimit,
    loading,
    checkRateLimit,
    resetRateLimit,
    isBlocked: rateLimit ? !rateLimit.allowed : false,
    remainingAttempts: rateLimit?.remaining_attempts ?? 5
  };
};
