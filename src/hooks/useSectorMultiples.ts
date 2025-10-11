import { useState, useEffect } from 'react';
import { sectorDataRepository, SectorMultiples } from '@/repositories/SectorDataRepository';
import { useToast } from '@/hooks/use-toast';

export function useSectorMultiples() {
  const [sectorMultiples, setSectorMultiples] = useState<SectorMultiples[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSectorMultiples();
  }, []);

  const fetchSectorMultiples = async () => {
    try {
      setLoading(true);
      const data = await sectorDataRepository.findAll();
      setSectorMultiples(data);
    } catch (error) {
      console.error('Error fetching sector multiples:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los múltiplos de sector',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    sectorMultiples,
    loading,
    refetch: fetchSectorMultiples,
  };
}
