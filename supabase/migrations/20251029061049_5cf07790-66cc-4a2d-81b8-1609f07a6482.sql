-- Remediate SECURITY DEFINER views by recreating with SECURITY INVOKER
-- This ensures views respect RLS policies of the querying user, not the view creator

-- 1. Fix feature_adoption_summary view
DROP VIEW IF EXISTS public.feature_adoption_summary;

CREATE VIEW public.feature_adoption_summary
WITH (security_invoker = on)
AS
WITH base AS (
  SELECT 
    date_trunc('day', feature_analytics.timestamp) AS metric_day,
    feature_analytics.feature_key,
    COALESCE(feature_analytics.metadata ->> 'environment', 'unknown') AS environment,
    feature_analytics.action
  FROM feature_analytics
)
SELECT 
  metric_day::date AS metric_date,
  feature_key,
  environment,
  count(*) FILTER (WHERE action = 'dialog_opened') AS dialog_opened,
  count(*) FILTER (WHERE action = 'entity_created') AS entity_created,
  count(*) FILTER (WHERE action = 'entity_creation_failed') AS entity_creation_failed,
  CASE
    WHEN count(*) FILTER (WHERE action IN ('entity_created', 'entity_creation_failed')) = 0 THEN 0::numeric
    ELSE round(
      count(*) FILTER (WHERE action = 'entity_created')::numeric / 
      NULLIF(count(*) FILTER (WHERE action IN ('entity_created', 'entity_creation_failed')), 0)::numeric, 
      4
    )
  END AS success_rate
FROM base
GROUP BY metric_day, feature_key, environment
ORDER BY metric_day DESC;

COMMENT ON VIEW public.feature_adoption_summary IS 
'Vista con SECURITY INVOKER - respeta RLS de feature_analytics del usuario que consulta';

-- 2. Fix vw_leads_funnel view
DROP VIEW IF EXISTS public.vw_leads_funnel;

CREATE VIEW public.vw_leads_funnel
WITH (security_invoker = on)
AS
WITH base AS (
  SELECT 
    leads.id,
    leads.pipeline_stage_id,
    CASE
      WHEN leads.pipeline_stage_id IS NOT NULL THEN 'PIPE_' || leads.pipeline_stage_id::text
      ELSE 'UNKNOWN'
    END AS stage_label
  FROM leads
), totals AS (
  SELECT count(*) AS total
  FROM base
)
SELECT 
  b.pipeline_stage_id,
  b.stage_label,
  count(*) AS stage_count,
  round(count(*)::numeric / NULLIF(t.total, 0)::numeric * 100, 2) AS stage_percent
FROM base b
CROSS JOIN totals t
GROUP BY b.pipeline_stage_id, b.stage_label, t.total
ORDER BY count(*) DESC;

COMMENT ON VIEW public.vw_leads_funnel IS 
'Vista con SECURITY INVOKER - respeta RLS de leads y organización del usuario que consulta';

-- 3. Create validation function to detect views without security_invoker (for CI/CD)
CREATE OR REPLACE FUNCTION public.check_security_invoker_views()
RETURNS TABLE(view_name text, has_security_invoker boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.relname::text,
    (c.reloptions IS NOT NULL AND c.reloptions::text LIKE '%security_invoker%')
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'v' 
    AND n.nspname = 'public';
$$;

COMMENT ON FUNCTION public.check_security_invoker_views() IS 
'Función helper para detectar vistas sin security_invoker en validaciones CI/CD';