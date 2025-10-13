-- Tabla para verificación de usuarios
CREATE TABLE IF NOT EXISTS public.user_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_verification_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage verifications"
  ON public.user_verification_status FOR ALL
  USING (has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role));

-- Tabla para plantillas de documentos
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  format TEXT NOT NULL,
  category TEXT NOT NULL,
  size_bytes BIGINT,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.document_templates FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage templates"
  ON public.document_templates FOR ALL
  USING (has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role));

-- Tabla para tracking de descargas
CREATE TABLE IF NOT EXISTS public.template_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.document_templates(id) ON DELETE CASCADE,
  user_id UUID,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their downloads"
  ON public.template_downloads FOR SELECT
  USING (user_id = auth.uid() OR has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "System can insert downloads"
  ON public.template_downloads FOR INSERT
  WITH CHECK (TRUE);

-- Función para incrementar contador de descargas
CREATE OR REPLACE FUNCTION public.increment_download_count(p_template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.document_templates
  SET download_count = download_count + 1
  WHERE id = p_template_id;
END;
$$;

-- Trigger para crear automáticamente el estado de verificación al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_verification_status (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_verification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_verification();

-- Crear bucket de storage para templates (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para templates
CREATE POLICY "Anyone can view templates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'templates');

CREATE POLICY "Admins can upload templates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'templates' AND 
    (has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role))
  );

CREATE POLICY "Admins can update templates"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'templates' AND 
    (has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role))
  );

CREATE POLICY "Admins can delete templates"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'templates' AND 
    (has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role))
  );