-- Enable pgcrypto extension for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Ensure pending_invitations has required columns and constraints
ALTER TABLE public.pending_invitations 
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Create unique constraint on email if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pending_invitations_email_key'
  ) THEN
    ALTER TABLE public.pending_invitations 
      ADD CONSTRAINT pending_invitations_email_key UNIQUE (email);
  END IF;
END $$;

-- Drop all existing versions of create_user_invitation to eliminate ambiguity
DROP FUNCTION IF EXISTS public.create_user_invitation(text, app_role);
DROP FUNCTION IF EXISTS public.create_user_invitation(text, text);

-- Create single canonical function with proper token generation
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email text,
  p_role text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_email text;
BEGIN
  -- Check authorization: only superadmins can create invitations
  IF NOT has_role_secure(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Solo los superadministradores pueden crear invitaciones';
  END IF;
  
  -- Normalize email
  v_email := lower(trim(p_email));
  
  -- Generate secure token using pgcrypto with fallback
  BEGIN
    v_token := encode(extensions.gen_random_bytes(32), 'hex');
  EXCEPTION
    WHEN undefined_function THEN
      -- Fallback: 64 hex chars using md5
      v_token := md5(random()::text || clock_timestamp()::text || v_email)
                 || md5(clock_timestamp()::text || random()::text || v_email);
  END;
  
  -- Insert or update invitation (idempotent behavior)
  INSERT INTO public.pending_invitations (email, role, token, created_at, accepted_at, invited_by)
  VALUES (v_email, p_role::app_role, v_token, now(), NULL, auth.uid())
  ON CONFLICT (email) 
  DO UPDATE SET
    role = EXCLUDED.role,
    token = EXCLUDED.token,
    created_at = now(),
    accepted_at = NULL,
    invited_by = EXCLUDED.invited_by;
  
  -- Return the token
  RETURN v_token;
END;
$$;