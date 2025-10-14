-- FASE 3: MFA y Gestión de Sesiones

-- ==============================================
-- Tarea 3.1: MFA (Multi-Factor Authentication)
-- ==============================================

-- Tabla para almacenar factores MFA
CREATE TABLE IF NOT EXISTS public.user_mfa_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  factor_type text NOT NULL DEFAULT 'totp',
  secret text NOT NULL,
  is_verified boolean DEFAULT false,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, factor_type)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_mfa_user_lookup ON public.user_mfa_factors(user_id);

-- RLS para MFA
ALTER TABLE public.user_mfa_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own MFA factors"
ON public.user_mfa_factors
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Función para generar códigos de backup
CREATE OR REPLACE FUNCTION public.generate_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codes text[] := ARRAY[]::text[];
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    codes := array_append(codes, 
      upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8))
    );
  END LOOP;
  RETURN codes;
END;
$$;

-- ==============================================
-- Tarea 3.2: Validación de Sesiones
-- ==============================================

-- Tabla para rastrear sesiones activas
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  location_country text,
  location_city text,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '8 hours'
);

CREATE INDEX idx_active_sessions ON public.user_sessions(user_id, is_active);

-- RLS para sesiones
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Función para detectar cambio de IP sospechoso
CREATE OR REPLACE FUNCTION public.detect_suspicious_ip_change(
  p_user_id uuid,
  p_new_ip inet
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_known_ip inet;
  result jsonb;
BEGIN
  -- Obtener última IP conocida
  SELECT ip_address INTO last_known_ip
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
  ORDER BY last_activity DESC
  LIMIT 1;
  
  IF last_known_ip IS NULL THEN
    RETURN jsonb_build_object('suspicious', false, 'reason', 'first_session');
  END IF;
  
  -- Comparar IPs
  IF host(last_known_ip) != host(p_new_ip) THEN
    -- Log evento de seguridad
    PERFORM public.enhanced_log_security_event(
      'suspicious_ip_change',
      'high',
      'Cambio de IP detectado en sesión activa',
      jsonb_build_object(
        'user_id', p_user_id,
        'old_ip', last_known_ip,
        'new_ip', p_new_ip
      )
    );
    
    RETURN jsonb_build_object(
      'suspicious', true,
      'reason', 'ip_change',
      'old_ip', last_known_ip,
      'new_ip', p_new_ip
    );
  END IF;
  
  RETURN jsonb_build_object('suspicious', false);
END;
$$;

-- ==============================================
-- Tarea 3.3: Gestión de Sesiones Concurrentes
-- ==============================================

-- Función para limitar sesiones concurrentes
CREATE OR REPLACE FUNCTION public.manage_concurrent_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count integer;
  oldest_session_id uuid;
BEGIN
  -- Contar sesiones activas
  SELECT count(*) INTO session_count
  FROM public.user_sessions
  WHERE user_id = NEW.user_id
    AND is_active = true;
  
  -- Si excede 3, invalidar la más antigua
  IF session_count > 3 THEN
    SELECT id INTO oldest_session_id
    FROM public.user_sessions
    WHERE user_id = NEW.user_id
      AND is_active = true
    ORDER BY last_activity ASC
    LIMIT 1;
    
    UPDATE public.user_sessions
    SET is_active = false
    WHERE id = oldest_session_id;
    
    -- Log evento
    PERFORM public.enhanced_log_security_event(
      'session_limit_exceeded',
      'medium',
      'Sesión antigua invalidada por límite concurrente',
      jsonb_build_object('user_id', NEW.user_id, 'revoked_session', oldest_session_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_session_limit
AFTER INSERT ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.manage_concurrent_sessions();