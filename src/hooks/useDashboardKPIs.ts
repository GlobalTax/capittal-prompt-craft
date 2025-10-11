import { useState, useEffect } from 'react';
import { dashboardRepository, DashboardKPI } from '@/repositories/DashboardRepository';
import { useToast } from '@/hooks/use-toast';

export function useDashboardKPIs(userId: string | undefined) {
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchKPIs();
    }
  }, [userId]);

  const fetchKPIs = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await dashboardRepository.getKPIs(userId);
      setKpis(data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los KPIs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    kpis,
    loading,
    refetch: fetchKPIs,
  };
}
