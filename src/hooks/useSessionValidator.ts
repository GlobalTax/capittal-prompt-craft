import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSessionValidator = () => {
  useEffect(() => {
    const validateSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get current IP with timeout and validation
        let ip = 'unknown';
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          
          const response = await fetch('https://api.ipify.org?format=json', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`IP service returned ${response.status}`);
          }
          
          const data = await response.json();
          
          // Validate IP format (IPv4 or IPv6)
          const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
          const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          
          if (data.ip && (ipv4Regex.test(data.ip) || ipv6Regex.test(data.ip))) {
            ip = data.ip;
          } else {
            console.warn('Invalid IP format received from external service:', data.ip);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.warn('IP fetch timeout - using fallback');
          } else {
            console.warn('Failed to fetch IP address:', error.message);
          }
          // Continue with 'unknown' - don't block session validation
        }

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
