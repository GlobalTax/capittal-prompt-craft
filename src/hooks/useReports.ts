import { useState, useEffect } from 'react';
import { reportRepository, ValuationReport } from '@/repositories/ReportRepository';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
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
      console.error('Error creating report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
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
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el reporte',
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
