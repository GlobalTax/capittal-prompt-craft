import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSessionValidator = () => {
  useEffect(() => {
    const validateSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get current IP
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();

        // Check for suspicious IP change
        const { data: suspiciousCheck, error } = await supabase.rpc(
          'detect_suspicious_ip_change',
          { p_user_id: session.user.id, p_new_ip: ip }
        );

        if (error) {
          console.error('Session validation error:', error);
          return;
        }

        if (suspiciousCheck && typeof suspiciousCheck === 'object' && 'suspicious' in suspiciousCheck && suspiciousCheck.suspicious) {
          toast.warning('Actividad sospechosa detectada. Por favor, verifica tu identidad.', {
            duration: 5000
          });
        }

        // Update session activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_sessions')
            .upsert({
              user_id: user.id,
              session_token: session.access_token,
              ip_address: ip,
              user_agent: navigator.userAgent,
              last_activity: new Date().toISOString(),
              is_active: true
            });
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      }
    };

    validateSession();
    const interval = setInterval(validateSession, 5 * 60 * 1000); // every 5 min

    return () => clearInterval(interval);
  }, []);
};
