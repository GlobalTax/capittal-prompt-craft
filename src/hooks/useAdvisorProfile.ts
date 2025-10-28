import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError, logError } from '@/lib/utils';

export interface AdvisorProfile {
  user_id: string;
  business_name: string;
  professional_title?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  logo_url?: string;
  brand_color?: string;
  footer_disclaimer?: string;
  created_at?: string;
  updated_at?: string;
}

export function useAdvisorProfile() {
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('advisor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error: any) {
      logError(error, 'useAdvisorProfile.fetchProfile');
      toast({
        title: 'Error al cargar perfil',
        description: sanitizeError(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AdvisorProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // If business_name is missing and no existing profile, throw error
      if (!updates.business_name && !profile?.business_name) {
        throw new Error('Debes indicar "Nombre del Negocio"');
      }

      // Build profile data with required business_name
      const profileData: any = {
        user_id: user.id,
        ...updates,
      };

      // If business_name is not in updates and we have a profile, use existing business_name
      if (!updates.business_name && profile?.business_name) {
        profileData.business_name = profile.business_name;
      }

      const { data, error } = await supabase
        .from('advisor_profiles')
        .upsert([profileData])
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios se han guardado correctamente',
      });
      return data;
    } catch (error: any) {
      logError(error, 'useAdvisorProfile.updateProfile');
      toast({
        title: 'Error al actualizar',
        description: sanitizeError(error),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadLogo = async (file: File, fallbackBusinessName?: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check if business_name is available
      const businessName = profile?.business_name || fallbackBusinessName;
      if (!businessName) {
        throw new Error('Primero guarda el "Nombre del Negocio"');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (profile?.logo_url) {
        const oldPath = profile.logo_url.split('/').slice(-2).join('/');
        await supabase.storage.from('advisor-logos').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('advisor-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('advisor-logos')
        .getPublicUrl(fileName);

      await updateProfile({ logo_url: publicUrl, business_name: businessName });
      
      return publicUrl;
    } catch (error: any) {
      logError(error, 'useAdvisorProfile.uploadLogo');
      toast({
        title: 'Error al subir logo',
        description: sanitizeError(error),
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteLogo = async () => {
    try {
      if (!profile?.logo_url) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const oldPath = profile.logo_url.split('/').slice(-2).join('/');
      await supabase.storage.from('advisor-logos').remove([oldPath]);

      await updateProfile({ logo_url: null });
      
      toast({
        title: 'Logo eliminado',
      });
    } catch (error: any) {
      logError(error, 'useAdvisorProfile.deleteLogo');
      toast({
        title: 'Error al eliminar logo',
        description: sanitizeError(error),
        variant: 'destructive',
      });
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    uploadLogo,
    deleteLogo,
    refetch: fetchProfile,
  };
}
