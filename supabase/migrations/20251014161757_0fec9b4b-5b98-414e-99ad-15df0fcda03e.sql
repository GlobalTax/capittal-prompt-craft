-- Create enhanced security logging function with proper inet type casting
CREATE OR REPLACE FUNCTION public.log_security_event_safe(
  p_event_type text,
  p_severity text DEFAULT 'medium',
  p_description text DEFAULT '',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_email text;
  v_ip_address inet;
  v_raw_ip text;
BEGIN
  -- Get user email
  IF p_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  ELSE
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  END IF;

  -- Safely get IP address with proper inet casting
  BEGIN
    v_raw_ip := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
    IF v_raw_ip IS NOT NULL AND v_raw_ip != '' THEN
      -- Take first IP from comma-separated list
      v_ip_address := split_part(v_raw_ip, ',', 1)::inet;
    ELSE
      v_ip_address := inet_client_addr();
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails, try inet_client_addr()
    BEGIN
      v_ip_address := inet_client_addr();
    EXCEPTION WHEN OTHERS THEN
      -- If that also fails, use NULL
      v_ip_address := NULL;
    END;
  END;

  -- Insert security log
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
    COALESCE(p_user_id, auth.uid()),
    v_user_email,
    v_ip_address
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;