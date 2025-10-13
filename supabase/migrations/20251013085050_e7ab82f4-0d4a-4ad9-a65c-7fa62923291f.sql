-- Drop old policy
DROP POLICY IF EXISTS "Users can manage own profile" ON public.advisor_profiles;

-- New policy: only advisors can manage their profile
CREATE POLICY "Advisors can manage own profile" 
ON public.advisor_profiles
FOR ALL 
USING (
  auth.uid() = user_id 
  AND has_role_secure(auth.uid(), 'advisor'::app_role)
);