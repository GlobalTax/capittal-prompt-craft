import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  company_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class OrganizationRepository {
  async getUserOrganization(userId: string): Promise<Organization | null> {
    try {
      // First get the organization_id from user_roles
      const { data: userRoleData, error: roleError } = await supabase
        .rpc('get_user_organization' as any);
      
      if (roleError || !userRoleData) return null;
      
      // Then get the organization details
      const { data, error } = await supabase
        .from('organizations' as any)
        .select('*')
        .eq('id', userRoleData)
        .single();
      
      if (error) return null;
      return data as unknown as Organization;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }
  
  async createOrganizationWithAdmin(
    orgName: string,
    orgSlug: string,
    companyId?: string,
    email?: string,
    phone?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_organization_with_admin' as any, {
      _org_name: orgName,
      _org_slug: orgSlug,
      _company_id: companyId,
      _email: email,
      _phone: phone
    });
    
    if (error) throw new Error(error.message);
    return data as string;
  }
  
  async updateOrganization(id: string, updates: Partial<Organization>): Promise<void> {
    const { error } = await supabase
      .from('organizations' as any)
      .update(updates)
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
}

export const organizationRepository = new OrganizationRepository();
