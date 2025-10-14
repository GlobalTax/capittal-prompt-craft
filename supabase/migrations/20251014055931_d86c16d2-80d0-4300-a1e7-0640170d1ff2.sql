-- Safe logging and ip_address type fix to support user deletion
-- 1) Ensure security_logs has user_email column
ALTER TABLE public.security_logs
  ADD COLUMN IF NOT EXISTS user_email text;

-- 2) Remove any conflicting overload with 5th param default that can cause ambiguity
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, jsonb, uuid);

-- 3) Base logging function (4 params) - SECURITY DEFINER, uses inet_client_addr() (inet type)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text DEFAULT 'medium',
  p_description text DEFAULT '',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user_email text;
BEGIN
  -- Try to fetch current user email (if available)
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.security_logs (
    event_type,
    severity,
    description,
    metadata,
    user_id,
    user_email,
    ip_address
  ) VALUES (
    p_event_type,
    p_severity,
    p_description,
    COALESCE(p_metadata, '{}'::jsonb),
    auth.uid(),
    v_user_email,
    inet_client_addr()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 4) Overload with explicit user_id (no DEFAULT on 5th param to avoid ambiguity)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text,
  p_description text,
  p_metadata jsonb,
  p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user_email text;
BEGIN
  -- Fetch email of the explicit user when possible
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  INSERT INTO public.security_logs (
    event_type,
    severity,
    description,
    metadata,
    user_id,
    user_email,
    ip_address
  ) VALUES (
    p_event_type,
    p_severity,
    p_description,
    COALESCE(p_metadata, '{}'::jsonb),
    p_user_id,
    v_user_email,
    inet_client_addr()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
