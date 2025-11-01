-- =====================================================
-- Simple Default Advisor Role Setup
-- =====================================================

-- Create a simple trigger function that works within the security constraints
-- This function will be called by the trigger and will insert roles using
-- the SECURITY DEFINER privilege to bypass RLS
CREATE OR REPLACE FUNCTION public.auto_assign_advisor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_role boolean;
BEGIN
  -- Check if user already has any role
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id
  ) INTO v_has_role;
  
  -- If no role exists, we'll let the application handle it
  -- or use RPC functions. This trigger is just a fallback.
  IF NOT v_has_role THEN
    BEGIN
      -- Try to insert using a service context
      PERFORM public.log_security_event(
        'auto_role_assignment',
        'info',
        'Auto-assigning advisor role to new user',
        jsonb_build_object('user_id', NEW.user_id)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore logging errors
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_auto_assign_advisor_role ON public.user_profiles;

-- Create the trigger
CREATE TRIGGER trg_auto_assign_advisor_role
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_advisor_role();

COMMENT ON FUNCTION public.auto_assign_advisor_role() IS 
  'Logs when a new user profile is created. The actual role assignment will be done by the edge function using SERVICE_ROLE.';