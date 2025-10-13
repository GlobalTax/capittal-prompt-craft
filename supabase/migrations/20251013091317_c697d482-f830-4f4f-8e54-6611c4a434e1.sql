-- Drop all overloaded versions of create_user_invitation to eliminate ambiguity
DROP FUNCTION IF EXISTS public.create_user_invitation(text, app_role);
DROP FUNCTION IF EXISTS public.create_user_invitation(text, text);

-- Create single canonical function with proper security and idempotency
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
  -- Check authorization: only superadmins can create invitations
  IF NOT has_role_secure(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Solo los superadministradores pueden crear invitaciones';
  END IF;
  
  -- Normalize email
  v_normalized_email := lower(trim(p_email));
  
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update invitation (idempotent behavior)
  INSERT INTO public.pending_invitations (email, role, token, created_at, accepted_at, invited_by)
  VALUES (v_normalized_email, p_role::app_role, v_token, now(), NULL, auth.uid())
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