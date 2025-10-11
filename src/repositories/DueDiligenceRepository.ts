import { supabase } from '@/integrations/supabase/client';

export interface DueDiligenceItem {
  id: string;
  valuation_id: string;
  category: 'financial' | 'legal' | 'operational' | 'market';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  checked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export class DueDiligenceRepository {
  async getItems(valuationId: string): Promise<DueDiligenceItem[]> {
    const { data, error } = await supabase
      .from('due_diligence_items')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('category')
      .order('created_at');
    
    if (error) throw new Error(error.message);
    return data as DueDiligenceItem[];
  }

  async createItem(item: Partial<DueDiligenceItem>): Promise<DueDiligenceItem> {
    const { data, error } = await supabase
      .from('due_diligence_items')
      .insert([item as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as DueDiligenceItem;
  }

  async initializeDefaultItems(valuationId: string): Promise<void> {
    const { defaultDDItems } = await import('@/utils/dueDiligenceDefaults');
    
    const items = defaultDDItems.map(item => ({
      ...item,
      valuation_id: valuationId,
      checked: false,
      notes: null
    }));

    const { error } = await supabase
      .from('due_diligence_items')
      .insert(items as any);
    
    if (error) throw new Error(error.message);
  }

  async updateItem(id: string, updates: Partial<DueDiligenceItem>): Promise<void> {
    const { error } = await supabase
      .from('due_diligence_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('due_diligence_items')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }

  async getCategoryStats(valuationId: string) {
    const items = await this.getItems(valuationId);
    
    const categories = ['financial', 'legal', 'operational', 'market'] as const;
    
    return categories.map(category => {
      const categoryItems = items.filter(item => item.category === category);
      const checkedItems = categoryItems.filter(item => item.checked);
      
      return {
        category,
        total: categoryItems.length,
        checked: checkedItems.length,
        percentage: categoryItems.length > 0 
          ? (checkedItems.length / categoryItems.length) * 100 
          : 0
      };
    });
  }
}

export const dueDiligenceRepository = new DueDiligenceRepository();
