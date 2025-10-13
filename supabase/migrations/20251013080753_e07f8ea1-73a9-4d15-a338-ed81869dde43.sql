
-- Asegurar que pgcrypto está habilitado en el esquema public
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Crear función auxiliar para generar tokens seguros
CREATE OR REPLACE FUNCTION public.create_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(public.gen_random_bytes(32), 'hex');
END;
$$;

-- Recrear la función create_user_invitation con la sintaxis correcta
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email TEXT,
  p_role app_role DEFAULT 'user'::app_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_id UUID;
  invitation_token TEXT;
BEGIN
  -- Verificar permisos de superadmin
  IF NOT has_role_secure(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Solo los superadministradores pueden crear invitaciones';
  END IF;
  
  -- Generar token seguro usando la función auxiliar
  invitation_token := public.create_invitation_token();
  
  -- Crear invitación
  INSERT INTO public.pending_invitations (email, token, role, invited_by)
  VALUES (LOWER(TRIM(p_email)), invitation_token, p_role, auth.uid())
  RETURNING id INTO invitation_id;
  
  -- Log de seguridad
  PERFORM public.enhanced_log_security_event(
    'invitation_created',
    'medium',
    'Nueva invitación creada para: ' || p_email,
    jsonb_build_object(
      'invited_email', p_email,
      'invited_role', p_role,
      'invitation_id', invitation_id
    )
  );
  
  RETURN invitation_id;
END;
$$;
