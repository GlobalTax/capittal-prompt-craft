import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BudgetTableSection } from '@/components/valuation/DynamicBudgetTable';

export interface MonthlyBudget {
  id: string;
  user_id: string;
  year: number;
  budget_name: string;
  sections: BudgetTableSection[];
  month_statuses: ('real' | 'presupuestado')[];
  created_at: string;
  updated_at: string;
}

export function useMonthlyBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (error) throw error;
      setBudgets(data as MonthlyBudget[]);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  const createBudget = async (year: number, budgetName: string, initialSections: BudgetTableSection[]) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .insert([{
          user_id: user.id,
          year,
          budget_name: budgetName,
          sections: initialSections,
          month_statuses: Array(12).fill('presupuestado')
        }])
        .select()
        .single();

      if (error) throw error;
      
      setBudgets(prev => [data as MonthlyBudget, ...prev]);
      return data as MonthlyBudget;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<MonthlyBudget>) => {
    try {
      const { error } = await supabase
        .from('monthly_budgets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBudgets(prev =>
        prev.map(budget => (budget.id === id ? { ...budget, ...updates } : budget))
      );
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBudgets(prev => prev.filter(budget => budget.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  return {
    budgets,
    loading,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets
  };
}
