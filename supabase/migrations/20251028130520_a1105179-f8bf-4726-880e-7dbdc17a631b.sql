-- =====================================================
-- FASE 4.4: AGREGAR SET search_path A FUNCIONES RESTANTES (CORREGIDO)
-- =====================================================
-- Fecha: 2025-10-28
-- Descripción: Agregar SET search_path = public a todas las funciones que no lo tienen

-- ============================================
-- ACTUALIZAR FUNCIONES SIN search_path
-- ============================================

ALTER FUNCTION public.auto_initiate_winback() SET search_path = public;
ALTER FUNCTION public.create_document_version() SET search_path = public;
ALTER FUNCTION public.create_event_from_booking() SET search_path = public;
ALTER FUNCTION public.extract_email_domain(email_input text) SET search_path = public;
ALTER FUNCTION public.generate_booking_slug(base_title text, user_id uuid) SET search_path = public;
ALTER FUNCTION public.handle_lead_stage_change() SET search_path = public;
ALTER FUNCTION public.handle_updated_at_time_tracking() SET search_path = public;
ALTER FUNCTION public.normalize_company_name(name_input text) SET search_path = public;
ALTER FUNCTION public.normalize_phone(phone_input text) SET search_path = public;
ALTER FUNCTION public.split_full_name(full_name text) SET search_path = public;
ALTER FUNCTION public.track_calendar_event() SET search_path = public;
ALTER FUNCTION public.trigger_normalize_company() SET search_path = public;
ALTER FUNCTION public.trigger_normalize_contact() SET search_path = public;
ALTER FUNCTION public.update_advisor_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_email_conversation() SET search_path = public;
ALTER FUNCTION public.update_feature_flags_updated_at() SET search_path = public;
ALTER FUNCTION public.update_folder_updated_at() SET search_path = public;
ALTER FUNCTION public.update_ma_pipeline_stages_updated_at() SET search_path = public;
ALTER FUNCTION public.update_mandate_matches_updated_at() SET search_path = public;
ALTER FUNCTION public.update_proposal_stats() SET search_path = public;
ALTER FUNCTION public.update_sell_business_leads_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_valuations_updated_at() SET search_path = public;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proconfig IS NULL;
  
  IF missing_count > 0 THEN
    RAISE WARNING '⚠️ Todavía hay % funciones sin SET search_path', missing_count;
  ELSE
    RAISE NOTICE '✅ Todas las funciones de public schema tienen SET search_path configurado';
  END IF;
END;
$$;

COMMENT ON SCHEMA public IS 
  'FASE 4.4: Todas las funciones ahora tienen SET search_path = public para prevenir schema poisoning attacks.';