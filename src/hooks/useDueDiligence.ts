import { useState, useEffect } from 'react';
import { dueDiligenceRepository, DueDiligenceItem } from '@/repositories/DueDiligenceRepository';
import { useToast } from '@/hooks/use-toast';

export function useDueDiligence(valuationId: string | undefined) {
  const [items, setItems] = useState<DueDiligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (valuationId) {
      fetchItems();
    }
  }, [valuationId]);

  const fetchItems = async () => {
    if (!valuationId) return;
    
    try {
      setLoading(true);
      const data = await dueDiligenceRepository.getItems(valuationId);
      setItems(data);
    } catch (error) {
      console.error('Error fetching DD items:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los items de due diligence',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<DueDiligenceItem>) => {
    try {
      await dueDiligenceRepository.updateItem(id, updates);
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (error) {
      console.error('Error updating DD item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el item',
        variant: 'destructive',
      });
    }
  };

  const toggleCheck = async (id: string, checked: boolean) => {
    await updateItem(id, { checked });
  };

  const updateNotes = async (id: string, notes: string) => {
    await updateItem(id, { notes });
  };

  const getCategoryStats = async () => {
    if (!valuationId) return [];
    return dueDiligenceRepository.getCategoryStats(valuationId);
  };

  return {
    items,
    loading,
    toggleCheck,
    updateNotes,
    getCategoryStats,
    refetch: fetchItems,
  };
}
