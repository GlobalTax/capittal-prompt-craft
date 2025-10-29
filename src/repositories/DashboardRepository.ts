import { supabase } from '@/integrations/supabase/client';

export interface DashboardKPI {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  change_percentage: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface ValuationStats {
  total: number;
  draft: number;
  in_progress: number;
  completed: number;
  totalValue: number;
  activeClients: number;
  completionRate: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  value: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
}

export interface FinancialSummary {
  avgEbitda: number;
  avgEnterpriseValue: number;
  minValue: number;
  maxValue: number;
  avgMultiple: number;
}

export interface RecentValuation {
  id: string;
  client_name: string | null;
  valuation_type: string;
  status: string;
  updated_at: string;
  dcf_results: any;
  comparable_multiples_results: any;
}

export class DashboardRepository {
  async getKPIs(userId: string): Promise<DashboardKPI[]> {
    const { data, error } = await supabase
      .from('dashboard_kpis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as DashboardKPI[];
  }
  
  async upsertKPI(kpi: Partial<DashboardKPI>): Promise<void> {
    const { error } = await supabase
      .from('dashboard_kpis')
      .upsert([kpi as any]);
    
    if (error) throw new Error(error.message);
  }

  async getValuationStats(userId: string): Promise<ValuationStats> {
    // Get valuations with their metadata
    const { data: valuations, error: valuationsError } = await supabase
      .from('valuations')
      .select('id, status, client_name, metadata, target_industry')
      .eq('user_id', userId);
    
    if (valuationsError) throw new Error(valuationsError.message);

    const valuationsList = valuations || [];
    const total = valuationsList.length;
    const draft = valuationsList.filter(v => v.status === 'draft').length;
    const in_progress = valuationsList.filter(v => v.status === 'in_progress').length;
    const completed = valuationsList.filter(v => v.status === 'completed').length;
    
    // Get all valuation years for these valuations
    const valuationIds = valuationsList.map(v => v.id);
    let years: any[] = [];
    if (valuationIds.length > 0) {
      const { data: yearsData, error: yearsError } = await supabase
        .from('valuation_years')
        .select('*')
        .in('valuation_id', valuationIds);
      
      if (yearsError) throw new Error(yearsError.message);
      years = yearsData || [];
    }
    
    // Get sector multiples
    const { data: sectorMultiples, error: multiplesError } = await supabase
      .from('sector_multiples')
      .select('*');
    
    if (multiplesError) throw new Error(multiplesError.message);
    
    // Calculate total value by computing enterprise value for each valuation
    let totalValue = 0;
    
    for (const valuation of valuationsList) {
      // Get latest projected year for this valuation
      const valuationYears = years.filter(y => y.valuation_id === valuation.id);
      const latestYear = valuationYears
        .filter(y => y.year_status === 'projected')
        .sort((a, b) => parseInt(b.year) - parseInt(a.year))[0] || valuationYears[valuationYears.length - 1];
      
      if (!latestYear) continue;
      
      // Calculate EBITDA
      const revenue = (latestYear.revenue || 0) + (latestYear.other_revenue || 0);
      const costs = (latestYear.personnel_costs || 0) + (latestYear.other_costs || 0) + (latestYear.owner_salary || 0);
      const ebitda = revenue - costs;
      
      if (ebitda <= 0) continue;
      
      // Get sector code from metadata or target_industry
      const sectorCode = (valuation.metadata as any)?.sector || valuation.target_industry || 'consulting';
      
      // Find sector multiple
      const sector = (sectorMultiples || []).find(s => s.sector_code === sectorCode);
      const multiple = sector?.ebitda_multiple_avg || 5.0; // Default to 5x if not found
      
      // Calculate enterprise value
      const enterpriseValue = ebitda * multiple;
      totalValue += enterpriseValue;
    }
    
    const activeClients = new Set(valuationsList.map(v => v.client_name).filter(Boolean)).size;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      draft,
      in_progress,
      completed,
      totalValue,
      activeClients,
      completionRate
    };
  }

  async getMonthlyTrends(userId: string, months: number = 6): Promise<MonthlyTrend[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: valuations, error: valuationsError } = await supabase
      .from('valuations')
      .select('id, created_at, metadata, target_industry')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());
    
    if (valuationsError) throw new Error(valuationsError.message);

    // Get valuation years for these valuations
    const valuationIds = (valuations || []).map(v => v.id);
    let years: any[] = [];
    if (valuationIds.length > 0) {
      const { data: yearsData, error: yearsError } = await supabase
        .from('valuation_years')
        .select('*')
        .in('valuation_id', valuationIds);
      
      if (yearsError) throw new Error(yearsError.message);
      years = yearsData || [];
    }

    // Get sector multiples
    const { data: sectorMultiples, error: multiplesError } = await supabase
      .from('sector_multiples')
      .select('*');
    
    if (multiplesError) throw new Error(multiplesError.message);

    // Group by month and calculate values
    const monthlyMap = new Map<string, { count: number; value: number }>();
    
    (valuations || []).forEach(v => {
      const date = new Date(v.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { count: 0, value: 0 };
      
      // Calculate enterprise value for this valuation
      const valuationYears = years.filter(y => y.valuation_id === v.id);
      const latestYear = valuationYears
        .filter(y => y.year_status === 'projected')
        .sort((a, b) => parseInt(b.year) - parseInt(a.year))[0] || valuationYears[valuationYears.length - 1];
      
      let value = 0;
      if (latestYear) {
        const revenue = (latestYear.revenue || 0) + (latestYear.other_revenue || 0);
        const costs = (latestYear.personnel_costs || 0) + (latestYear.other_costs || 0) + (latestYear.owner_salary || 0);
        const ebitda = revenue - costs;
        
        if (ebitda > 0) {
          const sectorCode = (v.metadata as any)?.sector || v.target_industry || 'consulting';
          const sector = (sectorMultiples || []).find(s => s.sector_code === sectorCode);
          const multiple = sector?.ebitda_multiple_avg || 5.0;
          value = ebitda * multiple;
        }
      }
      
      monthlyMap.set(monthKey, {
        count: current.count + 1,
        value: current.value + value
      });
    });

    // Convert to array and format
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trends: MonthlyTrend[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const data = monthlyMap.get(monthKey) || { count: 0, value: 0 };
      
      trends.push({
        month: monthNames[date.getMonth()],
        count: data.count,
        value: Math.round(data.value / 1000) // Convert to K
      });
    }

    return trends;
  }

  async getTypeDistribution(userId: string): Promise<TypeDistribution[]> {
    const { data, error } = await supabase
      .from('valuations')
      .select('valuation_type')
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);

    const typeMap = new Map<string, number>();
    (data || []).forEach(v => {
      const current = typeMap.get(v.valuation_type) || 0;
      typeMap.set(v.valuation_type, current + 1);
    });

    return Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count
    }));
  }

  async getFinancialSummary(userId: string): Promise<FinancialSummary> {
    const { data: valuations, error: valuationsError } = await supabase
      .from('valuations')
      .select('id, metadata, target_industry')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (valuationsError) throw new Error(valuationsError.message);

    const valuationsList = valuations || [];
    
    if (valuationsList.length === 0) {
      return {
        avgEbitda: 0,
        avgEnterpriseValue: 0,
        minValue: 0,
        maxValue: 0,
        avgMultiple: 0
      };
    }

    // Get valuation years for completed valuations
    const valuationIds = valuationsList.map(v => v.id);
    const { data: years, error: yearsError } = await supabase
      .from('valuation_years')
      .select('*')
      .in('valuation_id', valuationIds);
    
    if (yearsError) throw new Error(yearsError.message);

    // Get sector multiples
    const { data: sectorMultiples, error: multiplesError } = await supabase
      .from('sector_multiples')
      .select('*');
    
    if (multiplesError) throw new Error(multiplesError.message);

    // Calculate metrics for each valuation
    const ebitdas: number[] = [];
    const values: number[] = [];
    const multiples: number[] = [];
    
    for (const valuation of valuationsList) {
      const valuationYears = (years || []).filter(y => y.valuation_id === valuation.id);
      const latestYear = valuationYears
        .filter(y => y.year_status === 'projected')
        .sort((a, b) => parseInt(b.year) - parseInt(a.year))[0] || valuationYears[valuationYears.length - 1];
      
      if (!latestYear) continue;
      
      // Calculate EBITDA
      const revenue = (latestYear.revenue || 0) + (latestYear.other_revenue || 0);
      const costs = (latestYear.personnel_costs || 0) + (latestYear.other_costs || 0) + (latestYear.owner_salary || 0);
      const ebitda = revenue - costs;
      
      if (ebitda > 0) {
        ebitdas.push(ebitda);
        
        // Get sector multiple
        const sectorCode = (valuation.metadata as any)?.sector || valuation.target_industry || 'consulting';
        const sector = (sectorMultiples || []).find(s => s.sector_code === sectorCode);
        const multiple = sector?.ebitda_multiple_avg || 5.0;
        
        multiples.push(multiple);
        
        // Calculate enterprise value
        const enterpriseValue = ebitda * multiple;
        values.push(enterpriseValue);
      }
    }

    return {
      avgEbitda: ebitdas.length > 0 ? ebitdas.reduce((a, b) => a + b, 0) / ebitdas.length : 0,
      avgEnterpriseValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 0,
      avgMultiple: multiples.length > 0 ? multiples.reduce((a, b) => a + b, 0) / multiples.length : 0
    };
  }

  async getRecentValuations(userId: string, limit: number = 5): Promise<RecentValuation[]> {
    const { data, error } = await supabase
      .from('valuations')
      .select('id, client_name, valuation_type, status, updated_at, dcf_results, comparable_multiples_results, metadata, target_industry')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    
    // Get valuation years for these valuations
    const valuationIds = (data || []).map(v => v.id);
    let years: any[] = [];
    if (valuationIds.length > 0) {
      const { data: yearsData, error: yearsError } = await supabase
        .from('valuation_years')
        .select('*')
        .in('valuation_id', valuationIds);
      
      if (!yearsError) years = yearsData || [];
    }

    // Get sector multiples
    const { data: sectorMultiples } = await supabase
      .from('sector_multiples')
      .select('*');

    // Calculate enterprise value for each valuation
    const valuationsWithValues = (data || []).map(v => {
      const valuationYears = years.filter(y => y.valuation_id === v.id);
      const latestYear = valuationYears
        .filter(y => y.year_status === 'projected')
        .sort((a, b) => parseInt(b.year) - parseInt(a.year))[0] || valuationYears[valuationYears.length - 1];
      
      // Calculate enterprise value
      let calculatedValue = 0;
      if (latestYear) {
        const revenue = (latestYear.revenue || 0) + (latestYear.other_revenue || 0);
        const costs = (latestYear.personnel_costs || 0) + (latestYear.other_costs || 0) + (latestYear.owner_salary || 0);
        const ebitda = revenue - costs;
        
        if (ebitda > 0) {
          const sectorCode = (v.metadata as any)?.sector || v.target_industry || 'consulting';
          const sector = (sectorMultiples || []).find(s => s.sector_code === sectorCode);
          const multiple = sector?.ebitda_multiple_avg || 5.0;
          calculatedValue = ebitda * multiple;
        }
      }
      
      // Use saved results if available, otherwise use calculated value
      const dcfValue = (v.dcf_results as any)?.enterpriseValue || 0;
      const multiplesValue = (v.comparable_multiples_results as any)?.enterpriseValue || 0;
      const savedValue = Math.max(dcfValue, multiplesValue);
      
      return {
        ...v,
        dcf_results: savedValue > 0 ? v.dcf_results : { enterpriseValue: calculatedValue },
        comparable_multiples_results: savedValue > 0 ? v.comparable_multiples_results : null
      };
    });
    
    return valuationsWithValues as RecentValuation[];
  }
}

export const dashboardRepository = new DashboardRepository();
