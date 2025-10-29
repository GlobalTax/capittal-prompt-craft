import { useState, useEffect } from 'react';
import { valuationRepository } from '@/repositories/ValuationRepository';
import { valuationYearRepository } from '@/repositories/ValuationYearRepository';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeError, logError } from '@/lib/utils';

export type ValuationType = 'own_business' | 'potential_acquisition' | 'client_business';

export interface Valuation {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed';
  tags: string[];
  
  // Tipo de valoración
  valuation_type: ValuationType;
  
  // Campos para clientes
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  
  // Campos para objetivos de compra
  target_company_name?: string;
  target_industry?: string;
  target_location?: string;
  contact_person?: string;
  
  // Información sectorial
  cnae_code?: string;
  business_description?: string;
  
  // Notas privadas
  private_notes?: string;
  
  year_1: string;
  revenue_1: number;
  fiscal_recurring_1: number;
  accounting_recurring_1: number;
  labor_recurring_1: number;
  other_revenue_1: number;
  personnel_costs_1: number;
  other_costs_1: number;
  owner_salary_1: number;
  employees_1: number;
  year_2: string;
  revenue_2: number;
  fiscal_recurring_2: number;
  accounting_recurring_2: number;
  labor_recurring_2: number;
  other_revenue_2: number;
  personnel_costs_2: number;
  other_costs_2: number;
  owner_salary_2: number;
  employees_2: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  
  // Campos para calculadoras
  dcf_results?: any;
  comparable_multiples_results?: any;
  last_dcf_calculation?: string;
  last_multiples_calculation?: string;
  
  // Metadata para labels personalizados y otros datos
  metadata?: any;
}

export function useValuations() {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchValuations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await valuationRepository.findAll(user.id);
      setValuations((data || []) as Valuation[]);
    } catch (error: any) {
      logError(error, 'useValuations.fetchValuations');
      toast({
        title: 'Error al cargar valoraciones',
        description: sanitizeError(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const createValuation = async (
    title: string, 
    tags: string[] = [], 
    valuation_type: ValuationType = 'own_business',
    options?: { closedYear: string; projectedYear: string }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const currentYear = new Date().getFullYear();
      const closedYear = options?.closedYear || (currentYear - 1).toString();
      const projectedYear = options?.projectedYear || currentYear.toString();

      const newValuation = await valuationRepository.create({ 
        title, 
        tags, 
        user_id: user.id, 
        valuation_type,
        year_1: closedYear,
        year_2: projectedYear,
      });

      // Crear los dos registros en valuation_years
      try {
        await valuationYearRepository.create({
          valuation_id: newValuation.id,
          year: closedYear,
          year_status: 'closed',
          revenue: 0,
          fiscal_recurring: 0,
          accounting_recurring: 0,
          labor_recurring: 0,
          other_revenue: 0,
          personnel_costs: 0,
          other_costs: 0,
          owner_salary: 0,
          depreciation: 0,
          employees: 0,
        });

        await valuationYearRepository.create({
          valuation_id: newValuation.id,
          year: projectedYear,
          year_status: 'projected',
          revenue: 0,
          fiscal_recurring: 0,
          accounting_recurring: 0,
          labor_recurring: 0,
          other_revenue: 0,
          personnel_costs: 0,
          other_costs: 0,
          owner_salary: 0,
          depreciation: 0,
          employees: 0,
        });
      } catch (yearError: any) {
        logError(yearError, 'useValuations.createValuation.years');
        toast({
          title: 'Advertencia',
          description: 'Valoración creada pero los años no se inicializaron correctamente',
          variant: 'destructive',
        });
      }

      setValuations([newValuation, ...valuations]);
      toast({
        title: 'Valoración creada',
        description: 'La valoración se creó correctamente',
      });
      
      return newValuation;
    } catch (error: any) {
      logError(error, 'useValuations.createValuation');
      toast({
        title: 'Error al crear valoración',
        description: sanitizeError(error),
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateValuation = async (id: string, updates: Partial<Valuation>) => {
    try {
      await valuationRepository.update(id, updates);
      
      setValuations(valuations.map(v => v.id === id ? { ...v, ...updates } : v));
    } catch (error: any) {
      logError(error, 'useValuations.updateValuation');
      toast({
        title: 'Error al actualizar',
        description: sanitizeError(error),
        variant: 'destructive',
      });
    }
  };

  const deleteValuation = async (id: string) => {
    try {
      await valuationRepository.delete(id);
      
      setValuations(valuations.filter(v => v.id !== id));
      toast({
        title: 'Valoración eliminada',
        description: 'La valoración se eliminó correctamente',
      });
    } catch (error: any) {
      logError(error, 'useValuations.deleteValuation');
      toast({
        title: 'Error al eliminar',
        description: sanitizeError(error),
        variant: 'destructive',
      });
    }
  };

  return {
    valuations,
    loading,
    createValuation,
    updateValuation,
    deleteValuation,
    refetch: fetchValuations,
  };
}
