import { useState, useEffect } from 'react';
import { reportRepository, ValuationReport } from '@/repositories/ReportRepository';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeError, logError } from '@/lib/utils';

export function useReports() {
  const [reports, setReports] = useState<ValuationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchReports();
    }
  }, [user?.id]);

  const fetchReports = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await reportRepository.getReports(user.id);
      setReports(data);
    } catch (error) {
      logError(error, 'useReports.fetchReports');
      toast({
        title: 'Error',
        description: sanitizeError(error, 'No se pudieron cargar los reportes'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData: Partial<ValuationReport>) => {
    if (!user?.id) return;

    try {
      const newReport = await reportRepository.createReport({
        ...reportData,
        generated_by: user.id,
        generated_at: new Date().toISOString()
      });
      
      setReports(prev => [newReport, ...prev]);
      toast({
        title: 'Reporte generado',
        description: 'El reporte se ha generado correctamente',
      });
      
      return newReport;
    } catch (error) {
      logError(error, 'useReports.createReport');
      toast({
        title: 'Error',
        description: sanitizeError(error, 'No se pudo generar el reporte'),
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await reportRepository.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast({
        title: 'Reporte eliminado',
      });
    } catch (error) {
      logError(error, 'useReports.deleteReport');
      toast({
        title: 'Error',
        description: sanitizeError(error, 'No se pudo eliminar el reporte'),
        variant: 'destructive',
      });
    }
  };

  return {
    reports,
    loading,
    createReport,
    deleteReport,
    refetch: fetchReports,
  };
}
