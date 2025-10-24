-- =====================================================
-- FASE 2.1 CORREGIDA: Sistema de Rate Limiting
-- =====================================================

-- Tabla para tracking de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance (sin predicado con NOW())
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint_time 
ON public.rate_limit_tracking(ip_address, endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created 
ON public.rate_limit_tracking(created_at);

-- Función de rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip inet,
  p_endpoint text,
  p_max_requests int DEFAULT 3,
  p_window_minutes int DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Contar requests recientes desde esta IP
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_tracking
  WHERE ip_address = p_ip
    AND endpoint = p_endpoint
    AND created_at > NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- Si excede el límite, retornar false
  IF v_count >= p_max_requests THEN
    -- Log en security_logs
    INSERT INTO security_logs (
      event_type, severity, description, metadata, ip_address
    ) VALUES (
      'rate_limit_exceeded',
      'medium',
      format('Rate limit exceeded from IP %s on endpoint %s', p_ip, p_endpoint),
      jsonb_build_object(
        'ip', p_ip,
        'endpoint', p_endpoint,
        'count', v_count,
        'limit', p_max_requests,
        'window_minutes', p_window_minutes
      ),
      p_ip
    );
    
    RETURN false;
  END IF;
  
  -- Registrar el request actual
  INSERT INTO rate_limit_tracking (ip_address, endpoint)
  VALUES (p_ip, p_endpoint);
  
  RETURN true;
END;
$$;

-- Función de limpieza
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- RLS: Solo admins leen rate_limit_tracking
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins view rate limiting"
ON public.rate_limit_tracking FOR SELECT
TO authenticated
USING (is_admin_or_superadmin());