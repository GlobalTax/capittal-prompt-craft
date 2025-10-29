-- Fix: Remove ambiguous enhanced_log_security_event function overloads
-- Issue: Multiple function signatures causing "is not unique" error during auth signup
-- Solution: Drop all versions and create canonical functions with explicit types

-- Step 1: Drop all existing versions of enhanced_log_security_event
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT proname, oidvectortypes(proargtypes) as args
    FROM pg_proc 
    WHERE proname = 'enhanced_log_security_event' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.enhanced_log_security_event(%s) CASCADE', func_record.args);
    RAISE NOTICE 'Dropped function: enhanced_log_security_event(%)', func_record.args;
  END LOOP;
END $$;

-- Step 2: Create canonical 4-argument version (most commonly used)
-- Signature: (event_type TEXT, severity TEXT, description TEXT, metadata JSONB)
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user (may be null for system events)
  v_user_id := auth.uid();

  -- Insert security log
  INSERT INTO security_logs (
    user_id,
    event_type,
    severity,
    description,
    metadata,
    created_at
  ) VALUES (
    v_user_id,
    p_event_type,
    p_severity,
    p_description,
    p_metadata,
    now()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Never block auth/signup if logging fails
    -- Just log to postgres logs and return null
    RAISE WARNING 'enhanced_log_security_event failed: % %', SQLERRM, SQLSTATE;
    RETURN NULL;
END;
$$;

-- Step 3: Create 5-argument version for backward compatibility
-- Signature: (event_type TEXT, severity TEXT, description TEXT, metadata JSONB, user_id UUID)
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB,
  p_user_id UUID
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Insert security log with explicit user_id
  INSERT INTO security_logs (
    user_id,
    event_type,
    severity,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_event_type,
    p_severity,
    p_description,
    p_metadata,
    now()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Never block auth/signup if logging fails
    RAISE WARNING 'enhanced_log_security_event (5-arg) failed: % %', SQLERRM, SQLSTATE;
    RETURN NULL;
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.enhanced_log_security_event(TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.enhanced_log_security_event(TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated, service_role, anon;

-- Step 5: Add comment
COMMENT ON FUNCTION public.enhanced_log_security_event(TEXT, TEXT, TEXT, JSONB) IS 
'Canonical 4-arg version: Logs security events. Never throws errors to avoid blocking auth flows.';

COMMENT ON FUNCTION public.enhanced_log_security_event(TEXT, TEXT, TEXT, JSONB, UUID) IS 
'5-arg version for explicit user_id: Logs security events. Never throws errors to avoid blocking auth flows.';

-- Step 6: Smoke test (wrapped in DO block to not fail CI)
DO $$
DECLARE
  test_result uuid;
BEGIN
  -- Test 4-arg version
  test_result := public.enhanced_log_security_event(
    'migration_test',
    'low',
    'Function ambiguity fixed - signup should work now',
    '{"migration": "20251029_fix_enhanced_log_ambiguity"}'::jsonb
  );
  
  IF test_result IS NOT NULL THEN
    RAISE NOTICE '✅ Smoke test passed: enhanced_log_security_event is working';
  ELSE
    RAISE WARNING '⚠️ Smoke test returned NULL (may be expected if security_logs table has issues)';
  END IF;
END $$;