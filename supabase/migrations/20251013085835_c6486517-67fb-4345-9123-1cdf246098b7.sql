-- Add missing accepted_at column to pending_invitations
ALTER TABLE public.pending_invitations 
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Ensure unique constraint on email exists
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

-- Re-create the create_user_invitation function with proper schema
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
  v_normalized_email text;
BEGIN
  -- Normalize email
  v_normalized_email := lower(trim(p_email));
  
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update invitation (idempotent)
  INSERT INTO public.pending_invitations (email, role, token, created_at, accepted_at)
  VALUES (v_normalized_email, p_role::app_role, v_token, now(), NULL)
  ON CONFLICT (email) 
  DO UPDATE SET
    role = EXCLUDED.role,
    token = EXCLUDED.token,
    created_at = now(),
    accepted_at = NULL;
  
  -- Return the token
  RETURN v_token;
END;
$$;