import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { sanitizeError, logError } from '@/lib/utils';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('¡Bienvenido de nuevo!');
      return { data, error: null };
    } catch (error: any) {
      logError(error, 'useAuth.signIn');
      toast.error(sanitizeError(error, 'Error al iniciar sesión'));
      return { data: null, error };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string,
    company?: string,
    phone?: string,
    city?: string,
    advisoryType?: string,
    taxId?: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            company,
            phone,
            city,
            advisory_type: advisoryType,
            tax_id: taxId
          }
        }
      });

      if (error) throw error;
      
      // Create organization for new user
      if (data.user && company) {
        try {
          const orgSlug = company
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          const { error: orgError } = await supabase.rpc('create_organization_with_admin' as any, {
            _org_name: company,
            _org_slug: `${orgSlug}-${Date.now()}`,
            _company_id: taxId || null,
            _email: email,
            _phone: phone || null
          });

          if (orgError) {
            logError(orgError, 'useAuth.signUp.createOrg');
            toast.error('Cuenta creada, pero hubo un problema al configurar la organización. Contacta con soporte.');
          }
        } catch (orgError: any) {
          logError(orgError, 'useAuth.signUp.createOrg');
          toast.error('Cuenta creada, pero hubo un problema al configurar la organización. Contacta con soporte.');
        }
      }
      
      toast.success('¡Cuenta creada exitosamente!');
      return { data, error: null };
    } catch (error: any) {
      logError(error, 'useAuth.signUp');
      toast.error(sanitizeError(error, 'Error al registrarse'));
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Sesión cerrada');
      return { error: null };
    } catch (error: any) {
      logError(error, 'useAuth.signOut');
      toast.error(sanitizeError(error, 'Error al cerrar sesión'));
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
