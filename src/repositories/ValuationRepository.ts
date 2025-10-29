import { supabase } from '@/integrations/supabase/client';
import { Valuation } from '@/hooks/useValuations';
import { ValuationYear } from './ValuationYearRepository';

export class ValuationRepository {
  async findAll(userId: string): Promise<Valuation[]> {
    // Query principal de valoraciones
    const { data: valuations, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    if (!valuations || valuations.length === 0) return [];
    
    // Query de años para todas las valoraciones
    const valuationIds = valuations.map(v => v.id);
    const { data: years, error: yearsError } = await supabase
      .from('valuation_years')
      .select('*')
      .in('valuation_id', valuationIds);
    
    if (yearsError) throw new Error(yearsError.message);
    
    // Mapear años a valoraciones y calcular métricas
    const yearsMap = new Map<string, ValuationYear[]>();
    years?.forEach(year => {
      if (!yearsMap.has(year.valuation_id)) {
        yearsMap.set(year.valuation_id, []);
      }
      yearsMap.get(year.valuation_id)!.push(year as ValuationYear);
    });
    
    // Agregar datos calculados a cada valoración
    return valuations.map(v => {
      const vYears = yearsMap.get(v.id) || [];
      // Buscar el último año proyectado o el año más reciente
      const latestYear = vYears
        .filter(y => y.year_status === 'projected')
        .sort((a, b) => parseInt(b.year) - parseInt(a.year))[0] || vYears[vYears.length - 1];
      
      const computed_revenue = latestYear 
        ? (latestYear.revenue || 0) + (latestYear.other_revenue || 0)
        : 0;
      
      const computed_costs = latestYear
        ? (latestYear.personnel_costs || 0) + (latestYear.other_costs || 0) + (latestYear.owner_salary || 0)
        : 0;
      
      const computed_ebitda = computed_revenue - computed_costs;
      
      return {
        ...v,
        computed_revenue,
        computed_ebitda,
      } as Valuation;
    });
  }
  
  async findById(id: string): Promise<Valuation | null> {
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data as Valuation | null;
  }
  
  async create(valuation: Partial<Valuation>): Promise<Valuation> {
    // Get user's organization_id
    const { data: orgId } = await supabase.rpc('get_current_user_organization_id' as any);
    
    const { data, error } = await supabase
      .from('valuations')
      .insert([{ ...valuation, organization_id: orgId } as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as Valuation;
  }
  
  async update(id: string, updates: Partial<Valuation>): Promise<void> {
    const { error } = await supabase
      .from('valuations')
      .update(updates)
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('valuations')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
}

export const valuationRepository = new ValuationRepository();
