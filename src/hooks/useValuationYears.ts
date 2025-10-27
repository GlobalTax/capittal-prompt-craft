import { useState, useEffect } from 'react';
import { valuationYearRepository, ValuationYear } from '@/repositories/ValuationYearRepository';
import { useToast } from '@/hooks/use-toast';

export function useValuationYears(valuationId: string) {
  const [years, setYears] = useState<ValuationYear[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchYears = async () => {
    try {
      const data = await valuationYearRepository.findByValuationId(valuationId);
      setYears(data || []);
    } catch (error: any) {
      toast({
        title: 'Error al cargar años',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (valuationId) {
      fetchYears();
    }
  }, [valuationId]);

  const addYear = async (year: string, yearStatus: 'closed' | 'projected') => {
    // Check for duplicate year
    if (years.some(y => y.year === year)) {
      toast({
        title: 'Error',
        description: 'Este año ya existe',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newYear = await valuationYearRepository.create({
        valuation_id: valuationId,
        year,
        year_status: yearStatus,
        revenue: 0,
        fiscal_recurring: 0,
        accounting_recurring: 0,
        labor_recurring: 0,
        other_revenue: 0,
        personnel_costs: 0,
        other_costs: 0,
        owner_salary: 0,
        employees: 0,
      });
      
      setYears([...years, newYear].sort((a, b) => a.year.localeCompare(b.year)));
      toast({ title: 'Año añadido correctamente' });
    } catch (error: any) {
      toast({
        title: 'Error al añadir año',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteYear = async (id: string) => {
    if (years.length <= 2) {
      toast({
        title: 'Mínimo 2 años requeridos',
        description: 'Debes mantener al menos 2 años en la valoración',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await valuationYearRepository.delete(id);
      setYears(years.filter(y => y.id !== id));
      toast({ title: 'Año eliminado' });
    } catch (error: any) {
      toast({
        title: 'Error al eliminar año',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateYear = async (id: string, updates: Partial<ValuationYear>) => {
    try {
      await valuationYearRepository.update(id, updates);
      setYears(years.map(y => y.id === id ? { ...y, ...updates } : y));
    } catch (error: any) {
      toast({
        title: 'Error al actualizar año',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { 
    years, 
    loading, 
    addYear, 
    deleteYear, 
    updateYear, 
    refetch: fetchYears 
  };
}
