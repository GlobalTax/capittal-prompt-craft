-- ==============================================
-- FASE 1: REMEDIACIÓN CRÍTICA DE SEGURIDAD
-- Fecha: 2025-10-28
-- Descripción: Elimina almacenamiento de tokens de sesión
--              y crea políticas RLS para user_sessions
-- ==============================================

-- 1. Eliminar columna session_token (tokens NUNCA deben persistirse en BD)
ALTER TABLE public.user_sessions DROP COLUMN IF EXISTS session_token;

-- 2. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can update all sessions" ON public.user_sessions;

-- 3. Crear políticas RLS para user_sessions
-- Los usuarios solo pueden ver y gestionar sus propias sesiones
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Políticas adicionales para administradores
-- Los admins pueden ver todas las sesiones para auditoría
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Los admins pueden desactivar sesiones sospechosas
CREATE POLICY "Admins can update all sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- 5. Crear índices para mejorar rendimiento de queries de sesiones
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
  ON public.user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active 
  ON public.user_sessions(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity 
  ON public.user_sessions(last_activity DESC);

-- 6. Función para limpiar sesiones inactivas automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar como inactivas las sesiones con más de 30 días sin actividad
  UPDATE public.user_sessions
  SET is_active = false
  WHERE is_active = true
    AND last_activity < NOW() - INTERVAL '30 days';
  
  -- Eliminar sesiones inactivas con más de 90 días
  DELETE FROM public.user_sessions
  WHERE is_active = false
    AND last_activity < NOW() - INTERVAL '90 days';
END;
$$;

-- 7. Comentarios de documentación
COMMENT ON TABLE public.user_sessions IS 'Rastrea sesiones activas de usuarios para detección de actividad sospechosa. NO almacena tokens de sesión por seguridad.';
COMMENT ON COLUMN public.user_sessions.ip_address IS 'IP del cliente. Considerar hash para privacidad en futuras versiones.';
COMMENT ON COLUMN public.user_sessions.user_agent IS 'User agent del navegador. Datos limitados para identificar dispositivo sin comprometer privacidad.';
COMMENT ON FUNCTION public.cleanup_inactive_sessions IS 'Limpieza automática de sesiones antiguas. Ejecutar periódicamente vía cron o edge function.';