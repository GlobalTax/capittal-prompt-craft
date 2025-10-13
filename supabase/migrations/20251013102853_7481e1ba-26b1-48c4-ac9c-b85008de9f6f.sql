-- Política para permitir DELETE a superadmins en pending_invitations
CREATE POLICY "Superadmins can delete pending invitations"
ON public.pending_invitations
FOR DELETE
TO authenticated
USING (
  has_role_secure(auth.uid(), 'superadmin'::app_role)
);