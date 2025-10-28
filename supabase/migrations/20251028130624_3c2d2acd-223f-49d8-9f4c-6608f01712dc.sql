-- =====================================================
-- FASE 4.5: ÚLTIMAS FUNCIONES SECURITY DEFINER
-- =====================================================

ALTER FUNCTION public.execute_stage_automations() SET search_path = public;
ALTER FUNCTION public.generate_tracking_pixel_url(p_email_id uuid) SET search_path = public;
ALTER FUNCTION public.process_automation_triggers() SET search_path = public;
ALTER FUNCTION public.process_email_tracking(p_email_id uuid, p_event_type text, p_event_data jsonb, p_ip_address inet, p_user_agent text) SET search_path = public;
ALTER FUNCTION public.quick_create_company_from_email(email_input text) SET search_path = public;
ALTER FUNCTION public.update_lead_probability_on_stage_change() SET search_path = public;
ALTER FUNCTION public.validate_contact_company_association() SET search_path = public;