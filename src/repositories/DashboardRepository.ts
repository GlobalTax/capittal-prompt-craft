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
}

export const dashboardRepository = new DashboardRepository();
