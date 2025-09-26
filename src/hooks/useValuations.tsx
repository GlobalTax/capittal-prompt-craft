import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface FinancialData {
  revenue: number;
  ebitda: number;
  netIncome: number;
  employees: number;
  partners: number;
  totalExpenses: number;
  personalCosts: number;
  yearFounded: number;
}

export interface ValuationResult {
  netMargin: number;
  contributionMargin: number;
  ebitdaMargin: number;
  revenuePerEmployee: number;
  revenuePerPartner: number;
  conservativeValuation: number;
  moderateValuation: number;
  optimisticValuation: number;
  premiumValuation: number;
  weightedAverage: number;
}

export interface SavedValuation {
  id: string;
  name: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  financialData: FinancialData;
  results: ValuationResult;
  notes?: string;
}

export const useValuations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedValuations, setSavedValuations] = useState<SavedValuation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchValuations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('valuations')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          financial_data,
          results,
          notes,
          companies (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((valuation: any) => ({
        id: valuation.id,
        name: valuation.name,
        companyName: valuation.companies?.name || 'Sin nombre',
        createdAt: valuation.created_at,
        updatedAt: valuation.updated_at,
        financialData: valuation.financial_data,
        results: valuation.results,
        notes: valuation.notes,
      })) || [];

      setSavedValuations(formattedData);
    } catch (error) {
      console.error('Error fetching valuations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las valoraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveValuation = async (
    name: string,
    companyName: string,
    financialData: FinancialData,
    results: ValuationResult,
    notes?: string
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar valoraciones",
        variant: "destructive",
      });
      return null;
    }

    try {
      // First, create or get the company
      let { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .eq('user_id', user.id)
        .single();

      if (companyError && companyError.code !== 'PGRST116') {
        throw companyError;
      }

      if (!company) {
        const { data: newCompany, error: createCompanyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            sector: 'Servicios Profesionales',
            user_id: user.id,
          })
          .select('id')
          .single();

        if (createCompanyError) throw createCompanyError;
        company = newCompany;
      }

      // Save the valuation
      const { data, error } = await supabase
        .from('valuations')
        .insert({
          name,
          company_id: company.id,
          user_id: user.id,
          financial_data: financialData,
          results,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Valoración guardada",
        description: `La valoración "${name}" se ha guardado correctamente`,
      });

      fetchValuations(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error saving valuation:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la valoración",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteValuation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('valuations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Valoración eliminada",
        description: "La valoración se ha eliminado correctamente",
      });

      fetchValuations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting valuation:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la valoración",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchValuations();
    }
  }, [user]);

  return {
    savedValuations,
    loading,
    saveValuation,
    deleteValuation,
    refreshValuations: fetchValuations,
  };
};