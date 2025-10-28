
-- =====================================================
-- FASE 3.2: CORREGIR FUNCIONES SECURITY DEFINER SIN SET search_path
-- =====================================================
-- Fecha: 2025-10-28
-- Descripción: Agregar SET search_path a funciones SECURITY DEFINER para prevenir schema poisoning

-- ============================================
-- 1. CLEANUP_OLD_PRESENCE
-- ============================================
-- Función para limpiar registros de presencia antiguos
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ⚠️ AGREGADO: Previene schema poisoning
AS $$
BEGIN
  -- Eliminar registros de presencia más antiguos que 24 horas
  DELETE FROM public.user_presence
  WHERE updated_at < NOW() - INTERVAL '24 hours';
  
  -- Log de la operación
  RAISE NOTICE 'Limpieza de presencia antigua completada';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_presence() IS 
  'Limpia registros de presencia de usuarios con más de 24 horas de antigüedad. Función segura para ejecutar desde cron jobs.';

-- ============================================
-- 2. CLEANUP_RATE_LIMIT_TRACKING
-- ============================================
-- Función para limpiar registros antiguos de rate limiting
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ⚠️ AGREGADO: Previene schema poisoning
AS $$
BEGIN
  -- Eliminar registros de rate limit más antiguos que 2 horas
  DELETE FROM public.rate_limit_tracking
  WHERE attempt_time < NOW() - INTERVAL '2 hours';
  
  -- Log de la operación
  RAISE NOTICE 'Limpieza de rate limit tracking completada';
END;
$$;

COMMENT ON FUNCTION public.cleanup_rate_limit_tracking() IS 
  'Limpia registros de rate limiting con más de 2 horas de antigüedad. Función segura para ejecutar desde cron jobs.';

-- ============================================
-- VALIDACIÓN: Verificar que todas las funciones SECURITY DEFINER tienen search_path
-- ============================================
-- Esta query debe retornar 0 filas después de esta migración:
DO $$
DECLARE
  missing_functions TEXT;
BEGIN
  SELECT string_agg(proname, ', ')
  INTO missing_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL;
  
  IF missing_functions IS NOT NULL THEN
    RAISE WARNING 'Funciones SECURITY DEFINER sin SET search_path: %', missing_functions;
  ELSE
    RAISE NOTICE '✅ Todas las funciones SECURITY DEFINER tienen SET search_path configurado';
  END IF;
END;
$$;
