import { supabase } from '@/integrations/supabase/client';

export interface SystemAlert {
  id: string;
  user_id: string;
  type: 'market_change' | 'valuation_update' | 'due_date' | 'threshold' | 'data_sync';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  action_required: boolean;
  related_entity: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  type: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  channels: string[];
  created_at: string;
  updated_at: string;
}

export class AlertRepository {
  async getAlerts(userId: string): Promise<SystemAlert[]> {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as SystemAlert[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('system_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw new Error(error.message);
    return count || 0;
  }

  async markAsRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('system_alerts')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', alertId);
    
    if (error) throw new Error(error.message);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('system_alerts')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw new Error(error.message);
  }

  async deleteAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('system_alerts')
      .delete()
      .eq('id', alertId);
    
    if (error) throw new Error(error.message);
  }

  async getRules(userId: string): Promise<AlertRule[]> {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as AlertRule[];
  }

  async createRule(rule: Partial<AlertRule>): Promise<AlertRule> {
    const { data, error } = await supabase
      .from('alert_rules')
      .insert([rule as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as AlertRule;
  }

  async updateRule(id: string, updates: Partial<AlertRule>): Promise<void> {
    const { error } = await supabase
      .from('alert_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }

  async toggleRule(id: string, enabled: boolean): Promise<void> {
    await this.updateRule(id, { enabled });
  }
}

export const alertRepository = new AlertRepository();
