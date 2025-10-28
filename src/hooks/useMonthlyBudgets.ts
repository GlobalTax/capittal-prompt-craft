import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BudgetTableSection } from '@/components/valuation/DynamicBudgetTable';
import { logError } from '@/lib/utils';

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

interface QueuedUpdate {
  id: string;
  updates: Partial<MonthlyBudget>;
  timestamp: number;
  attempts: number;
}

interface LocalDraft {
  sections: BudgetTableSection[];
  month_statuses: ('real' | 'presupuestado')[];
  timestamp: number;
}

export function useMonthlyBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<QueuedUpdate[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (error) throw error;
      setBudgets(data as any);
    } catch (error) {
      logError(error, 'useMonthlyBudgets.fetchBudgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      console.info('[Budget] Conexión restaurada');
      setIsOnline(true);
      setLastError(null);
    };
    const handleOffline = () => {
      console.info('[Budget] Conexión perdida');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && saveQueue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [isOnline, saveQueue.length]);

  const getDraftKey = (year: number) => {
    return user ? `mb_draft_${user.id}_${year}` : null;
  };

  const saveDraft = (year: number, sections: BudgetTableSection[], monthStatuses: ('real' | 'presupuestado')[]) => {
    const key = getDraftKey(year);
    if (!key) return;
    
    const draft: LocalDraft = {
      sections,
      month_statuses: monthStatuses,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      console.info('[Budget] Draft guardado localmente', year);
    } catch (error) {
      console.error('[Budget] Error guardando draft:', error);
    }
  };

  const loadDraft = (year: number): LocalDraft | null => {
    const key = getDraftKey(year);
    if (!key) return null;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const draft: LocalDraft = JSON.parse(stored);
      console.info('[Budget] Draft cargado', year);
      return draft;
    } catch (error) {
      console.error('[Budget] Error cargando draft:', error);
      return null;
    }
  };

  const clearDraft = (year: number) => {
    const key = getDraftKey(year);
    if (!key) return;
    
    try {
      localStorage.removeItem(key);
      console.info('[Budget] Draft eliminado', year);
    } catch (error) {
      console.error('[Budget] Error eliminando draft:', error);
    }
  };

  const enqueueUpdate = (id: string, updates: Partial<MonthlyBudget>) => {
    console.info('[Budget] Encolando actualización', id);
    
    setSaveQueue(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return [...filtered, { id, updates, timestamp: Date.now(), attempts: 0 }];
    });

    const budget = budgets.find(b => b.id === id);
    if (budget && updates.sections) {
      saveDraft(budget.year, updates.sections as BudgetTableSection[], updates.month_statuses || budget.month_statuses);
    }
  };

  const processQueue = async () => {
    if (!isOnline || processingRef.current || saveQueue.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsSyncing(true);

    const item = saveQueue[0];
    const backoffDelay = Math.min(1000 * Math.pow(2, item.attempts), 30000);

    if (item.attempts > 0) {
      console.info(`[Budget] Reintentando después de ${backoffDelay}ms (intento ${item.attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    try {
      console.info('[Budget] Procesando guardado', item.id);
      const { error } = await supabase
        .from('monthly_budgets')
        .update(item.updates as any)
        .eq('id', item.id);

      if (error) throw error;

      console.info('[Budget] ✓ Guardado exitoso', item.id);
      setSaveQueue(prev => prev.filter(q => q.id !== item.id));
      setLastError(null);

      const budget = budgets.find(b => b.id === item.id);
      if (budget) {
        clearDraft(budget.year);
      }

      setBudgets(prev =>
        prev.map(budget => (budget.id === item.id ? { ...budget, ...item.updates } : budget))
      );
    } catch (error: any) {
      console.error('[Budget] Error guardando:', error);
      setLastError(error.message || 'Error al guardar');
      
      setSaveQueue(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], attempts: updated[0].attempts + 1 };
        return updated;
      });
    } finally {
      processingRef.current = false;
      setIsSyncing(false);
    }
  };

  const createBudget = async (year: number, budgetName: string, initialSections: BudgetTableSection[]) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .insert([{
          user_id: user.id,
          year,
          budget_name: budgetName,
          sections: initialSections as any,
          month_statuses: Array(12).fill('presupuestado') as any
        }])
        .select()
        .single();

      if (error) throw error;
      
      setBudgets(prev => [data as any, ...prev]);
      return data as any;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  };

  const updateBudget = (id: string, updates: Partial<MonthlyBudget>) => {
    enqueueUpdate(id, updates);
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
    refetch: fetchBudgets,
    isOnline,
    isSyncing,
    lastError,
    hasPending: saveQueue.length > 0,
    loadDraft,
    clearDraft,
    retrySync: processQueue
  };
}
