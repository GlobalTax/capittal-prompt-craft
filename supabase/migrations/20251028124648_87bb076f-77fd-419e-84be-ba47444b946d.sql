-- ==============================================
-- FASE 2: VALIDACIÓN Y RATE LIMITING (CORREGIDO)
-- Fecha: 2025-10-28
-- Descripción: Usa tabla rate_limit_tracking existente
-- ==============================================

-- La tabla rate_limit_tracking ya existe, solo agregamos nueva columna si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rate_limit_tracking' 
    AND column_name = 'action_type'
  ) THEN
    ALTER TABLE public.rate_limit_tracking ADD COLUMN action_type text;
  END IF;
END $$;

-- Crear índice adicional para action_type
CREATE INDEX IF NOT EXISTS idx_rate_limit_action_type 
  ON public.rate_limit_tracking(action_type, created_at);

-- Función genérica de rate limiting que usa ip_address como fallback
CREATE OR REPLACE FUNCTION public.check_rate_limit_generic(
  p_identifier text,
  p_action_type text,
  p_max_attempts int DEFAULT 10,
  p_window_minutes int DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Contar intentos en la ventana de tiempo
  -- Usa endpoint como action_type para compatibilidad con estructura existente
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_tracking
  WHERE (endpoint = p_action_type OR action_type = p_action_type)
    AND (ip_address::text = p_identifier OR endpoint LIKE '%' || p_identifier || '%')
    AND created_at > NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- Si excede el límite, retornar false
  IF v_count >= p_max_attempts THEN
    RETURN false;
  END IF;
  
  -- Registrar el intento en tabla existente
  INSERT INTO rate_limit_tracking (ip_address, endpoint, action_type)
  VALUES (p_identifier::inet, p_action_type, p_action_type)
  ON CONFLICT DO NOTHING;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error (ej: conversión inet), intentar insertar sin ip_address
    INSERT INTO rate_limit_tracking (endpoint, action_type, created_at)
    VALUES (p_action_type, p_action_type, NOW())
    ON CONFLICT DO NOTHING;
    RETURN true;
END;
$$;

-- Función de limpieza automática 
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_old_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar registros con más de 24 horas
  DELETE FROM public.rate_limit_tracking
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Comentarios de documentación
COMMENT ON FUNCTION public.check_rate_limit_generic IS 'Valida rate limiting genérico para cualquier acción. Usa tabla rate_limit_tracking existente.';
COMMENT ON FUNCTION public.cleanup_rate_limit_old_records IS 'Limpieza automática de registros de rate limiting antiguos (>24h).';