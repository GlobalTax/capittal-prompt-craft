import { supabase } from '@/integrations/supabase/client';
import { Valuation } from '@/hooks/useValuations';

export class ValuationRepository {
  async findAll(userId: string): Promise<Valuation[]> {
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as Valuation[];
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
