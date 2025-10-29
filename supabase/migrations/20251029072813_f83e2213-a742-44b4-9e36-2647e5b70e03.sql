-- ================================================================
-- DAY 6: MFA RATE LIMITING
-- ================================================================
-- Prevents brute force attacks on MFA codes
-- Limits: 5 attempts per 15 minutes per user

-- Create table to track MFA verification attempts
CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mfa_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view attempts (for security monitoring)
CREATE POLICY "Superadmins can view MFA attempts"
ON mfa_verification_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  )
);

-- System can insert attempts
CREATE POLICY "System can insert MFA attempts"
ON mfa_verification_attempts FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_time 
ON mfa_verification_attempts(user_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_mfa_attempts_ip_time 
ON mfa_verification_attempts(ip_address, attempted_at DESC);

-- ================================================================
-- Function: Check MFA Rate Limit
-- ================================================================
CREATE OR REPLACE FUNCTION check_mfa_rate_limit(
  p_user_id UUID,
  p_ip_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_attempts INT;
  v_window_start TIMESTAMPTZ;
  v_remaining INT;
  v_reset_at TIMESTAMPTZ;
  v_result JSON;
BEGIN
  -- Define time window (15 minutes)
  v_window_start := NOW() - INTERVAL '15 minutes';
  
  -- Count failed attempts in the last 15 minutes
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM mfa_verification_attempts
  WHERE user_id = p_user_id
    AND attempted_at >= v_window_start
    AND success = false;
  
  -- Calculate remaining attempts
  v_remaining := GREATEST(0, 5 - v_failed_attempts);
  
  -- Calculate reset time (15 min after first failed attempt)
  SELECT attempted_at + INTERVAL '15 minutes'
  INTO v_reset_at
  FROM mfa_verification_attempts
  WHERE user_id = p_user_id
    AND attempted_at >= v_window_start
    AND success = false
  ORDER BY attempted_at ASC
  LIMIT 1;
  
  -- If no reset time, set to now + 15 min
  IF v_reset_at IS NULL THEN
    v_reset_at := NOW() + INTERVAL '15 minutes';
  END IF;
  
  -- Return result as JSON
  v_result := json_build_object(
    'allowed', v_failed_attempts < 5,
    'remaining_attempts', v_remaining,
    'reset_at', v_reset_at,
    'failed_attempts', v_failed_attempts
  );
  
  RETURN v_result;
END;
$$;

-- ================================================================
-- Function: Record MFA Attempt
-- ================================================================
CREATE OR REPLACE FUNCTION record_mfa_attempt(
  p_user_id UUID,
  p_ip_address TEXT,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO mfa_verification_attempts (user_id, ip_address, success)
  VALUES (p_user_id, p_ip_address, p_success);
  
  -- If successful, clean up old failed attempts for this user
  IF p_success THEN
    DELETE FROM mfa_verification_attempts
    WHERE user_id = p_user_id
      AND success = false
      AND attempted_at < NOW() - INTERVAL '15 minutes';
  END IF;
END;
$$;

-- ================================================================
-- Function: Reset MFA Rate Limit (for admin use)
-- ================================================================
CREATE OR REPLACE FUNCTION reset_mfa_rate_limit(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only superadmins can reset
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only superadmins can reset MFA rate limits';
  END IF;
  
  -- Delete all failed attempts for this user
  DELETE FROM mfa_verification_attempts
  WHERE user_id = p_user_id
    AND success = false;
END;
$$;