-- =====================================================
-- FASE 2: MITIGACIÓN DE HALLAZGOS CRÍTICOS
-- =====================================================

-- -------------------------------------------------------
-- Tarea 2.2: Sistema de Rate Limiting
-- -------------------------------------------------------

-- Tabla para rastrear intentos de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.rate_limit_attempts(identifier, action_type, window_start);

-- Función para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count integer;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Limpiar intentos antiguos
  DELETE FROM public.rate_limit_attempts
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND window_start < v_window_start;
  
  -- Contar intentos en ventana actual
  SELECT COALESCE(SUM(attempt_count), 0)
  INTO v_attempt_count
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND window_start >= v_window_start;
  
  -- Si excede el límite, retornar false
  IF v_attempt_count >= p_max_attempts THEN
    RETURN false;
  END IF;
  
  -- Registrar intento
  INSERT INTO public.rate_limit_attempts (identifier, action_type)
  VALUES (p_identifier, p_action_type)
  ON CONFLICT DO NOTHING;
  
  -- Si fue un nuevo registro, incrementar
  UPDATE public.rate_limit_attempts
  SET attempt_count = attempt_count + 1,
      window_start = CASE 
        WHEN window_start < v_window_start THEN now() 
        ELSE window_start 
      END
  WHERE identifier = p_identifier
    AND action_type = p_action_type;
  
  RETURN true;
END;
$$;

-- RLS para rate_limit_attempts
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
ON public.rate_limit_attempts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------
-- Tarea 2.3: Validación de contraseña en backend
-- -------------------------------------------------------

-- Nota: La función validate_password_strength ya existe en el sistema
-- según la vista de funciones. Verificamos que esté correcta:

CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb := '{"valid": true, "errors": []}'::jsonb;
    errors text[] := ARRAY[]::text[];
BEGIN
    -- Check minimum length
    IF length(password) < 8 THEN
        errors := array_append(errors, 'La contraseña debe tener al menos 8 caracteres');
    END IF;
    
    -- Check for uppercase letter
    IF password !~ '[A-Z]' THEN
        errors := array_append(errors, 'La contraseña debe contener al menos una letra mayúscula');
    END IF;
    
    -- Check for lowercase letter
    IF password !~ '[a-z]' THEN
        errors := array_append(errors, 'La contraseña debe contener al menos una letra minúscula');
    END IF;
    
    -- Check for number
    IF password !~ '[0-9]' THEN
        errors := array_append(errors, 'La contraseña debe contener al menos un número');
    END IF;
    
    -- Check for special character
    IF password !~ '[^a-zA-Z0-9]' THEN
        errors := array_append(errors, 'La contraseña debe contener al menos un carácter especial');
    END IF;
    
    -- Update result
    IF array_length(errors, 1) > 0 THEN
        result := jsonb_build_object('valid', false, 'errors', errors);
    END IF;
    
    RETURN result;
END;
$$;

-- -------------------------------------------------------
-- Tarea 2.4: Política de retención de logs
-- -------------------------------------------------------

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_security_logs_deleted integer;
  v_audit_trail_deleted integer;
  v_rate_limit_deleted integer;
BEGIN
  -- Eliminar security_logs > 90 días
  DELETE FROM public.security_logs
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_security_logs_deleted = ROW_COUNT;
  
  -- Eliminar audit_trail > 90 días
  DELETE FROM public.audit_trail
  WHERE timestamp < now() - interval '90 days';
  GET DIAGNOSTICS v_audit_trail_deleted = ROW_COUNT;
  
  -- Eliminar rate_limit_attempts > 24 horas
  DELETE FROM public.rate_limit_attempts
  WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS v_rate_limit_deleted = ROW_COUNT;
  
  -- Log de limpieza
  INSERT INTO public.security_logs (
    event_type,
    severity,
    description,
    user_id,
    metadata
  ) VALUES (
    'log_cleanup',
    'low',
    'Limpieza automática de logs antiguos ejecutada',
    NULL,
    jsonb_build_object(
      'retention_days', 90,
      'executed_at', now(),
      'security_logs_deleted', v_security_logs_deleted,
      'audit_trail_deleted', v_audit_trail_deleted,
      'rate_limit_deleted', v_rate_limit_deleted
    )
  );
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'security_logs_deleted', v_security_logs_deleted,
    'audit_trail_deleted', v_audit_trail_deleted,
    'rate_limit_deleted', v_rate_limit_deleted,
    'executed_at', now()
  );
END;
$$;