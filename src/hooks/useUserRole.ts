import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
        } else {
          setRole(data?.role || 'user');
        }

        // Check if user is global admin
        const { data: globalAdminData } = await supabase
          .from('global_admins' as any)
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsGlobalAdmin(!!globalAdminData);
      } catch (error) {
        console.error('Error in useUserRole:', error);
        setRole('user');
        setIsGlobalAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return {
    role,
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    isAdvisor: role === 'advisor',
    isGlobalAdmin,
    loading
  };
};
