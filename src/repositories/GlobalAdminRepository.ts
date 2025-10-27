import { supabase } from '@/integrations/supabase/client';
import { Organization } from './OrganizationRepository';

export interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  subscription_plan: string;
  created_at: string;
  user_count: number;
  valuation_count: number;
  lead_count: number;
}

export class GlobalAdminRepository {
  async getAllOrganizations(): Promise<OrganizationStats[]> {
    const { data: orgs, error } = await supabase
      .from('organizations' as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    
    // Get stats for each organization
    const orgsWithStats = await Promise.all(
      (orgs || []).map(async (org: any) => {
        const [userCount, valuationCount, leadCount] = await Promise.all([
          this.getOrganizationUserCount(org.id),
          this.getOrganizationValuationCount(org.id),
          this.getOrganizationLeadCount(org.id),
        ]);
        
        return {
          ...org,
          user_count: userCount,
          valuation_count: valuationCount,
          lead_count: leadCount,
        } as OrganizationStats;
      })
    );
    
    return orgsWithStats;
  }
  
  async getOrganizationUserCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_roles' as any)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    if (error) return 0;
    return count || 0;
  }
  
  async getOrganizationValuationCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('valuations' as any)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    if (error) return 0;
    return count || 0;
  }
  
  async getOrganizationLeadCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('leads' as any)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    if (error) return 0;
    return count || 0;
  }
  
  async updateOrganization(id: string, updates: Partial<Organization>): Promise<void> {
    const { error } = await supabase
      .from('organizations' as any)
      .update(updates)
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
  
  async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations' as any)
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
  
  async isGlobalAdmin(): Promise<boolean> {
    const { data } = await supabase.rpc('is_global_admin' as any);
    return data === true;
  }
}

export const globalAdminRepository = new GlobalAdminRepository();
