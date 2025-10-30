-- Create security dashboard RPC functions
-- These functions provide aggregated security metrics for the admin security dashboard

-- Function 1: Get security dashboard metrics
-- Returns aggregated security data including login attempts, suspicious IPs, sessions, and MFA adoption
CREATE OR REPLACE FUNCTION public.get_security_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_failed_logins_24h integer;
  v_suspicious_ips_24h integer;
  v_active_sessions integer;
  v_critical_events_7d integer;
  v_high_events_7d integer;
  v_total_users integer;
  v_mfa_enabled integer;
  v_adoption_rate numeric;
  v_recent_events jsonb;
  v_top_events jsonb;
BEGIN
  -- Failed logins in last 24 hours
  SELECT COUNT(*)::integer INTO v_failed_logins_24h
  FROM security_logs
  WHERE event_type IN ('failed_login', 'login_failed', 'authentication_failed')
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Suspicious IPs in last 24 hours
  SELECT COUNT(DISTINCT ip_address)::integer INTO v_suspicious_ips_24h
  FROM security_logs
  WHERE event_type IN ('suspicious_ip', 'ip_blocked', 'multiple_failed_attempts')
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Active sessions now
  SELECT COUNT(*)::integer INTO v_active_sessions
  FROM user_sessions
  WHERE is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Critical events in last 7 days
  SELECT COUNT(*)::integer INTO v_critical_events_7d
  FROM security_logs
  WHERE severity = 'critical'
    AND created_at >= NOW() - INTERVAL '7 days';

  -- High severity events in last 7 days
  SELECT COUNT(*)::integer INTO v_high_events_7d
  FROM security_logs
  WHERE severity = 'high'
    AND created_at >= NOW() - INTERVAL '7 days';

  -- Total users (from auth.users)
  SELECT COUNT(*)::integer INTO v_total_users
  FROM auth.users
  WHERE deleted_at IS NULL;

  -- Users with MFA enabled
  SELECT COUNT(DISTINCT user_id)::integer INTO v_mfa_enabled
  FROM user_mfa_factors
  WHERE is_verified = true;

  -- MFA adoption rate
  IF v_total_users > 0 THEN
    v_adoption_rate := ROUND((v_mfa_enabled::numeric / v_total_users::numeric) * 100, 1);
  ELSE
    v_adoption_rate := 0;
  END IF;

  -- Recent critical events (last 10)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sl.id,
      'event_type', sl.event_type,
      'severity', sl.severity,
      'description', sl.description,
      'user_email', COALESCE(sl.user_email, au.email),
      'created_at', sl.created_at,
      'metadata', sl.metadata
    ) ORDER BY sl.created_at DESC
  ), '[]'::jsonb) INTO v_recent_events
  FROM (
    SELECT * FROM security_logs
    WHERE severity IN ('critical', 'high')
      AND created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 10
  ) sl
  LEFT JOIN auth.users au ON sl.user_id = au.id;

  -- Top event types (last 7 days)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'event_type', event_type,
      'count', count,
      'severity', severity
    ) ORDER BY count DESC
  ), '[]'::jsonb) INTO v_top_events
  FROM (
    SELECT 
      event_type,
      COUNT(*)::integer as count,
      MAX(severity) as severity
    FROM security_logs
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY event_type
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  -- Build result
  v_result := jsonb_build_object(
    'overview', jsonb_build_object(
      'failed_logins_24h', v_failed_logins_24h,
      'suspicious_ips_24h', v_suspicious_ips_24h,
      'active_sessions', v_active_sessions,
      'critical_events_7d', v_critical_events_7d,
      'high_events_7d', v_high_events_7d
    ),
    'mfa_adoption', jsonb_build_object(
      'total_users', v_total_users,
      'mfa_enabled', v_mfa_enabled,
      'adoption_rate', v_adoption_rate
    ),
    'recent_critical_events', v_recent_events,
    'top_event_types', v_top_events,
    'timestamp', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_security_dashboard_metrics() IS 
'Returns aggregated security metrics for the admin dashboard including failed logins, suspicious IPs, active sessions, MFA adoption, and recent critical events';

-- Function 2: Get security events timeline
-- Returns daily security event counts grouped by severity for a given time period
CREATE OR REPLACE FUNCTION public.get_security_events_timeline(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date', date,
      'critical', critical,
      'high', high,
      'medium', medium,
      'low', low,
      'total', total
    ) ORDER BY date
  ), '[]'::jsonb) INTO v_result
  FROM (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) FILTER (WHERE severity = 'critical')::integer as critical,
      COUNT(*) FILTER (WHERE severity = 'high')::integer as high,
      COUNT(*) FILTER (WHERE severity = 'medium')::integer as medium,
      COUNT(*) FILTER (WHERE severity = 'low')::integer as low,
      COUNT(*)::integer as total
    FROM security_logs
    WHERE created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  ) timeline;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_security_events_timeline(integer) IS 
'Returns timeline of security events grouped by date and severity level. Parameter p_days specifies how many days back to query (default: 7)';

-- Grant execution permissions to authenticated users
-- Note: Frontend already validates admin role before accessing the dashboard
GRANT EXECUTE ON FUNCTION public.get_security_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_events_timeline(integer) TO authenticated;