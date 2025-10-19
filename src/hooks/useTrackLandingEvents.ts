import { useEffect, useCallback } from 'react';

interface TrackEventProps {
  event: string;
  properties?: Record<string, any>;
}

export const useTrackLandingEvents = () => {
  // 1. Tracking de Scroll Depth automático
  useEffect(() => {
    let maxScroll = 0;
    const milestones = [50, 80];
    const tracked = new Set<number>();

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !tracked.has(milestone)) {
            trackEvent({
              event: 'SCROLL_DEPTH',
              properties: { 
                percentage: milestone,
                timestamp: new Date().toISOString()
              }
            });
            tracked.add(milestone);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Función genérica de tracking
  const trackEvent = useCallback(({ event, properties = {} }: TrackEventProps) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, properties);
    }
    
    // Google Tag Manager
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event,
        ...properties,
        timestamp: new Date().toISOString()
      });
    }
    
    // Console log en desarrollo
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', event, properties);
    }
  }, []);

  // 3. Tracking de CTA Clicks
  const trackCTAClick = useCallback((section: string, buttonText: string = 'Solicitar Colaboración') => {
    trackEvent({
      event: 'CTA_CLICK',
      properties: { 
        section,
        button_text: buttonText,
        destination: '/register'
      }
    });
  }, [trackEvent]);

  // 4. Tracking de Form Submission
  const trackFormSubmit = useCallback((data: { 
    email: string; 
    experiencia: string;
    especializacion: string[];
  }) => {
    trackEvent({
      event: 'FORM_SUBMITTED',
      properties: {
        email: data.email,
        asesorExperiencia: data.experiencia,
        especializaciones: data.especializacion.join(','),
        form_id: 'colaborador_signup'
      }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackCTAClick,
    trackFormSubmit
  };
};

// Tipos globales
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
