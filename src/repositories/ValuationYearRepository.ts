import { supabase } from '@/integrations/supabase/client';

export interface ValuationYear {
  id: string;
  valuation_id: string;
  year: string;
  year_status: 'closed' | 'projected';
  revenue: number;
  fiscal_recurring: number;
  accounting_recurring: number;
  labor_recurring: number;
  other_revenue: number;
  personnel_costs: number;
  other_costs: number;
  owner_salary: number;
  employees: number;
  created_at: string;
}

export class ValuationYearRepository {
  async findByValuationId(valuationId: string): Promise<ValuationYear[]> {
    const { data, error } = await supabase
      .from('valuation_years')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('year', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data as ValuationYear[];
  }
  
  async create(yearData: Omit<ValuationYear, 'id' | 'created_at'>): Promise<ValuationYear> {
    const { data, error } = await supabase
      .from('valuation_years')
      .insert([yearData as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as ValuationYear;
  }
  
  async update(id: string, updates: Partial<ValuationYear>): Promise<void> {
    const { error } = await supabase
      .from('valuation_years')
      .update(updates)
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('valuation_years')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
}

export const valuationYearRepository = new ValuationYearRepository();
