import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cpuCores: number;
}

const generateDeviceFingerprint = (): DeviceFingerprint => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cpuCores: navigator.hardwareConcurrency || 0
  };
};

const hashFingerprint = (fingerprint: DeviceFingerprint): string => {
  const str = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const useSessionSecurity = () => {
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Generate device fingerprint
        const fingerprint = generateDeviceFingerprint();
        const fingerprintHash = hashFingerprint(fingerprint);

        // Get IP address
        let ipAddress = 'unknown';
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          ipAddress = data.ip;
        } catch (error) {
          console.error('Error fetching IP:', error);
        }

        // Check for suspicious IP change
        try {
          const { data: suspiciousCheck, error } = await supabase.rpc(
            'detect_suspicious_ip_change',
            {
              p_user_id: session.user.id,
              p_new_ip: ipAddress
            }
          );

          if (!error && suspiciousCheck) {
            const checkResult = suspiciousCheck as any;
            if (checkResult?.suspicious) {
              toast.warning('Actividad sospechosa detectada', {
                description: 'Cambio de ubicación detectado. Verifica tu identidad.',
                duration: 5000
              });
            }
          }
        } catch (error) {
          console.error('Session security check error:', error);
        }

        // Track session activity in user_sessions table
        try {
          await supabase
            .from('user_sessions')
            .upsert({
              user_id: session.user.id,
              device_fingerprint: fingerprintHash,
              ip_address: ipAddress,
              user_agent: fingerprint.userAgent,
              screen_resolution: fingerprint.screenResolution,
              timezone: fingerprint.timezone,
              language: fingerprint.language,
              platform: fingerprint.platform,
              last_activity: new Date().toISOString()
            }, {
              onConflict: 'user_id,device_fingerprint'
            });
        } catch (error) {
          console.error('Error tracking session:', error);
        }

        setSessionChecked(true);
      } catch (error) {
        console.error('Session validation failed:', error);
      }
    };

    validateSession();
    const interval = setInterval(validateSession, 5 * 60 * 1000); // every 5 min

    return () => clearInterval(interval);
  }, []);

  return {
    sessionChecked
  };
};
