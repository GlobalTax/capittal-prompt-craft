import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface ReportIssueData {
  issueType: 'error' | 'bug' | 'feedback' | 'other';
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  errorStack?: string;
}

export function useReportIssue() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const reportIssue = async (data: ReportIssueData) => {
    if (!user) {
      toast({
        title: '❌ No autenticado',
        description: 'Debes iniciar sesión para reportar problemas.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Collect contextual information
      const reportData = {
        ...data,
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: data.severity || 'medium',
      };

      // Call edge function
      const { data: result, error } = await supabase.functions.invoke(
        'report-issue',
        { body: reportData }
      );

      if (error) throw error;

      toast({
        title: '✅ Reporte enviado',
        description: 'Gracias por tu reporte. Lo revisaremos pronto.',
      });

      return result;
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      
      if (error.message?.includes('Rate limit')) {
        toast({
          title: '⏱️ Límite alcanzado',
          description: 'Has enviado muchos reportes. Intenta de nuevo en una hora.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Error al enviar reporte',
          description: 'No se pudo enviar el reporte. Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { reportIssue, isSubmitting };
}
