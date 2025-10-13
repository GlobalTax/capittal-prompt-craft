-- Asegurar que pgcrypto esté en el esquema extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Eliminar función existente para poder cambiar el tipo de retorno
DROP FUNCTION IF EXISTS public.create_user_invitation(text, app_role);

-- Crear tabla pending_invitations si no existe
CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

-- Habilitar RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pending_invitations
DROP POLICY IF EXISTS "Superadmins can insert invitations" ON public.pending_invitations;
CREATE POLICY "Superadmins can insert invitations"
ON public.pending_invitations
FOR INSERT
TO authenticated
WITH CHECK (has_role_secure(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Superadmins can view invitations" ON public.pending_invitations;
CREATE POLICY "Superadmins can view invitations"
ON public.pending_invitations
FOR SELECT
TO authenticated
USING (has_role_secure(auth.uid(), 'superadmin'::app_role));

-- Función auxiliar para generar tokens
CREATE OR REPLACE FUNCTION public.create_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(32), 'hex');
END;
$$;

-- Crear nueva función create_user_invitation que devuelva el token
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
BEGIN
  -- Verificar permisos de superadmin
  IF NOT has_role_secure(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Solo los superadministradores pueden crear invitaciones';
  END IF;

  -- Generar token único
  invitation_token := public.create_invitation_token();

  -- Insertar invitación
  INSERT INTO public.pending_invitations(email, token, role, invited_by)
  VALUES (LOWER(TRIM(p_email)), invitation_token, p_role, auth.uid());

  -- Retornar el token generado
  RETURN invitation_token;
END;
$$;