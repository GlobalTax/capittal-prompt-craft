-- Add RLS policies for pending_invitations table
-- Permitir a superadmins crear invitaciones
CREATE POLICY "Superadmins can create invitations"
ON public.pending_invitations FOR INSERT
TO authenticated
WITH CHECK (
  has_role_secure(auth.uid(), 'superadmin'::app_role)
);

-- Permitir a superadmins ver todas las invitaciones
CREATE POLICY "Superadmins can view all invitations"
ON public.pending_invitations FOR SELECT
TO authenticated
USING (
  has_role_secure(auth.uid(), 'superadmin'::app_role)
);