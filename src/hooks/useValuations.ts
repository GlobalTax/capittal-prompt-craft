import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Valuation {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed';
  tags: string[];
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
}

export function useValuations() {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchValuations = async () => {
    try {
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setValuations((data || []) as Valuation[]);
    } catch (error: any) {
      toast({
        title: 'Error al cargar valoraciones',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const createValuation = async (title: string, tags: string[] = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('valuations')
        .insert({ title, tags, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      const newValuation = data as Valuation;
      setValuations([newValuation, ...valuations]);
      toast({
        title: 'Valoración creada',
        description: 'La valoración se creó correctamente',
      });
      
      return newValuation;
    } catch (error: any) {
      toast({
        title: 'Error al crear valoración',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateValuation = async (id: string, updates: Partial<Valuation>) => {
    try {
      const { error } = await supabase
        .from('valuations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setValuations(valuations.map(v => v.id === id ? { ...v, ...updates } : v));
    } catch (error: any) {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteValuation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('valuations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setValuations(valuations.filter(v => v.id !== id));
      toast({
        title: 'Valoración eliminada',
        description: 'La valoración se eliminó correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message,
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
