-- Hacer la columna email UNIQUE si no lo es
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pending_invitations_email_key'
  ) THEN
    ALTER TABLE public.pending_invitations ADD CONSTRAINT pending_invitations_email_key UNIQUE (email);
  END IF;
END $$;

-- Recrear función create_user_invitation para ser idempotente
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email text,
  p_role app_role DEFAULT 'user'::app_role
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_token text;
  normalized_email text;
BEGIN
  -- Verificar permisos de superadmin
  IF NOT has_role_secure(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Solo los superadministradores pueden crear invitaciones';
  END IF;

  -- Normalizar email
  normalized_email := LOWER(TRIM(p_email));

  -- Generar token único
  invitation_token := public.create_invitation_token();

  -- Insertar o actualizar invitación (idempotente)
  INSERT INTO public.pending_invitations(email, token, role, invited_by)
  VALUES (normalized_email, invitation_token, p_role, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET token = EXCLUDED.token,
        role = EXCLUDED.role,
        invited_by = EXCLUDED.invited_by,
        created_at = now(),
        accepted_at = NULL
  RETURNING token INTO invitation_token;

  -- Retornar el token generado
  RETURN invitation_token;
END;
$$;