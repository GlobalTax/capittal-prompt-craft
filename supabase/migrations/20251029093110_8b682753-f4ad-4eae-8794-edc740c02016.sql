-- =====================================================
-- FASE 1-5: Sistema Completo de Verificación de Email y Suspensión
-- =====================================================

-- Tabla para usuarios suspendidos
CREATE TABLE IF NOT EXISTS public.suspended_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suspended_by UUID REFERENCES auth.users(id),
  reason TEXT,
  notes TEXT,
  auto_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en suspended_users
ALTER TABLE public.suspended_users ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver usuarios suspendidos
CREATE POLICY "Admins can view suspended users"
ON public.suspended_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Política: Solo admins pueden suspender usuarios
CREATE POLICY "Admins can suspend users"
ON public.suspended_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Política: Solo admins pueden reactivar usuarios (DELETE = reactivar)
CREATE POLICY "Admins can reactivate users"
ON public.suspended_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Función para verificar si un usuario está suspendido
CREATE OR REPLACE FUNCTION public.is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.suspended_users
    WHERE user_id = p_user_id
  );
$$;

-- Función para verificar email manualmente (solo admins)
CREATE OR REPLACE FUNCTION public.verify_user_email_manually(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar que el usuario que llama es admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden verificar emails manualmente';
  END IF;
  
  -- Actualizar el email_confirmed_at en auth.users requiere admin API
  -- Por ahora, solo actualizamos el estado de verificación
  INSERT INTO public.user_verification_status (user_id, verification_status, verified_by, verified_at)
  VALUES (p_user_id, 'approved', auth.uid(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET verification_status = 'approved',
      verified_by = auth.uid(),
      verified_at = NOW(),
      updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Tabla para tracking de emails de verificación enviados (prevenir spam)
CREATE TABLE IF NOT EXISTS public.verification_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índice para rate limiting
CREATE INDEX IF NOT EXISTS idx_verification_email_logs_user_sent 
ON public.verification_email_logs(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_email_logs_email_sent 
ON public.verification_email_logs(email, sent_at DESC);

-- Función para verificar rate limit de emails de verificación
CREATE OR REPLACE FUNCTION public.check_verification_email_rate_limit(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_max_per_hour INTEGER DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar emails enviados en la última hora
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.verification_email_logs
    WHERE user_id = p_user_id
    AND sent_at > NOW() - INTERVAL '1 hour';
  ELSIF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.verification_email_logs
    WHERE email = p_email
    AND sent_at > NOW() - INTERVAL '1 hour';
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN v_count < p_max_per_hour;
END;
$$;

-- Función para registrar envío de email de verificación
CREATE OR REPLACE FUNCTION public.log_verification_email_sent(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.verification_email_logs (user_id, email, ip_address, user_agent)
  VALUES (p_user_id, p_email, p_ip_address, p_user_agent);
END;
$$;

-- Políticas RLS más restrictivas para usuarios no verificados
-- Nota: Estas políticas pueden ser demasiado restrictivas al inicio
-- Se pueden activar gradualmente según las necesidades

-- Política: Usuarios no verificados tienen acceso limitado a valoraciones
-- (Comentado por defecto - descomentar cuando se quiera aplicar restricción)
/*
CREATE POLICY "Unverified users cannot create valuations"
ON public.valuations
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT email_confirmed_at FROM auth.users WHERE id = auth.uid()) IS NOT NULL
);
*/

-- Trigger para auto-actualizar updated_at en suspended_users
CREATE OR REPLACE FUNCTION public.update_suspended_users_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_suspended_users_updated_at
BEFORE UPDATE ON public.suspended_users
FOR EACH ROW
EXECUTE FUNCTION public.update_suspended_users_timestamp();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_suspended_users_suspended_at 
ON public.suspended_users(suspended_at);

CREATE INDEX IF NOT EXISTS idx_suspended_users_auto_delete 
ON public.suspended_users(auto_delete_at) 
WHERE auto_delete_at IS NOT NULL;

-- Comentarios para documentación
COMMENT ON TABLE public.suspended_users IS 'Usuarios suspendidos temporalmente. Reversible sin pérdida de datos.';
COMMENT ON TABLE public.verification_email_logs IS 'Log de emails de verificación enviados para prevenir spam.';
COMMENT ON FUNCTION public.is_user_suspended IS 'Verifica si un usuario está suspendido actualmente.';
COMMENT ON FUNCTION public.verify_user_email_manually IS 'Permite a admins verificar emails manualmente en casos especiales.';
COMMENT ON FUNCTION public.check_verification_email_rate_limit IS 'Rate limiting para emails de verificación (3 por hora por defecto).';

-- Grant permisos necesarios
GRANT SELECT ON public.suspended_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_suspended TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_email_manually TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_verification_email_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_verification_email_sent TO anon, authenticated;