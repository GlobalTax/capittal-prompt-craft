-- Step 1: Backfill user_verification_status para usuarios existentes sin registro
INSERT INTO public.user_verification_status (user_id, verification_status, created_at, updated_at)
SELECT u.id, 'pending', now(), now()
FROM auth.users u
LEFT JOIN public.user_verification_status v ON v.user_id = u.id
WHERE v.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Políticas RLS explícitas para user_verification_status
DROP POLICY IF EXISTS "Admin users can manage verification status" ON public.user_verification_status;
DROP POLICY IF EXISTS "Admin users can view verification status" ON public.user_verification_status;

-- SELECT policy
CREATE POLICY "Admins can view verification status"
ON public.user_verification_status
FOR SELECT
TO authenticated
USING (
  has_role_secure(auth.uid(), 'admin'::app_role) OR 
  has_role_secure(auth.uid(), 'superadmin'::app_role)
);

-- INSERT policy
CREATE POLICY "Admins can insert verification status"
ON public.user_verification_status
FOR INSERT
TO authenticated
WITH CHECK (
  has_role_secure(auth.uid(), 'admin'::app_role) OR 
  has_role_secure(auth.uid(), 'superadmin'::app_role)
);

-- UPDATE policy
CREATE POLICY "Admins can update verification status"
ON public.user_verification_status
FOR UPDATE
TO authenticated
USING (
  has_role_secure(auth.uid(), 'admin'::app_role) OR 
  has_role_secure(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role_secure(auth.uid(), 'admin'::app_role) OR 
  has_role_secure(auth.uid(), 'superadmin'::app_role)
);