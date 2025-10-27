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
    const { data, error } = await supabase
      .from('valuations')
      .select('status, client_name, dcf_results, comparable_multiples_results')
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);

    const valuations = data || [];
    const total = valuations.length;
    const draft = valuations.filter(v => v.status === 'draft').length;
    const in_progress = valuations.filter(v => v.status === 'in_progress').length;
    const completed = valuations.filter(v => v.status === 'completed').length;
    
    // Calculate total value from dcf_results or comparable_multiples_results
    const totalValue = valuations.reduce((sum, v) => {
      const dcfValue = (v.dcf_results as any)?.enterpriseValue || 0;
      const multiplesValue = (v.comparable_multiples_results as any)?.enterpriseValue || 0;
      return sum + Math.max(dcfValue, multiplesValue);
    }, 0);
    
    const activeClients = new Set(valuations.map(v => v.client_name).filter(Boolean)).size;
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

    const { data, error } = await supabase
      .from('valuations')
      .select('created_at, dcf_results, comparable_multiples_results')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());
    
    if (error) throw new Error(error.message);

    // Group by month
    const monthlyMap = new Map<string, { count: number; value: number }>();
    
    (data || []).forEach(v => {
      const date = new Date(v.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { count: 0, value: 0 };
      
      const dcfValue = (v.dcf_results as any)?.enterpriseValue || 0;
      const multiplesValue = (v.comparable_multiples_results as any)?.enterpriseValue || 0;
      const value = Math.max(dcfValue, multiplesValue);
      
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
    const { data, error } = await supabase
      .from('valuations')
      .select('dcf_results, comparable_multiples_results, revenue_1, personnel_costs_1, other_costs_1')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (error) throw new Error(error.message);

    const valuations = data || [];
    
    if (valuations.length === 0) {
      return {
        avgEbitda: 0,
        avgEnterpriseValue: 0,
        minValue: 0,
        maxValue: 0,
        avgMultiple: 0
      };
    }

    // Calculate EBITDA from revenue and costs
    const ebitdas = valuations.map(v => {
      const revenue = v.revenue_1 || 0;
      const personnel = v.personnel_costs_1 || 0;
      const other = v.other_costs_1 || 0;
      return revenue - personnel - other;
    }).filter(e => e > 0);
    
    // Get enterprise values from results
    const values = valuations.map(v => {
      const dcfValue = (v.dcf_results as any)?.enterpriseValue || 0;
      const multiplesValue = (v.comparable_multiples_results as any)?.enterpriseValue || 0;
      return Math.max(dcfValue, multiplesValue);
    }).filter(v => v > 0);
    
    // Get multiples from results
    const multiples = valuations.map(v => {
      return (v.comparable_multiples_results as any)?.appliedMultiple || 
             (v.dcf_results as any)?.impliedMultiple || 0;
    }).filter(m => m > 0);

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
      .select('id, client_name, valuation_type, status, updated_at, dcf_results, comparable_multiples_results')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return data as RecentValuation[];
  }
}

export const dashboardRepository = new DashboardRepository();
