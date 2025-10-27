-- Fix infinite recursion in RLS policies by disabling RLS on global_admins
-- and using the security definer function is_global_admin() instead

-- 1. Disable RLS on global_admins (control table, doesn't need RLS)
ALTER TABLE public.global_admins DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on affected tables
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on global_admins
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'global_admins' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.global_admins', pol.policyname);
    END LOOP;
    
    -- Drop all policies on organizations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'organizations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol.policyname);
    END LOOP;
    
    -- Drop all policies on valuations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'valuations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.valuations', pol.policyname);
    END LOOP;
END $$;

-- 3. Create organization policies using security definer function
CREATE POLICY "Users can view their organization"
  ON public.organizations
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()) OR
    public.is_global_admin() = true
  );

CREATE POLICY "Organization creators can update"
  ON public.organizations
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    public.is_global_admin() = true
  );

CREATE POLICY "Global admins can delete organizations"
  ON public.organizations
  FOR DELETE
  USING (public.is_global_admin() = true);

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Create valuation policies using security definer function
CREATE POLICY "Users can view their own valuations"
  ON public.valuations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    ) OR
    public.is_global_admin() = true
  );

CREATE POLICY "Users can insert valuations"
  ON public.valuations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    (
      organization_id IN (
        SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
      ) OR
      organization_id IS NULL
    )
  );

CREATE POLICY "Users can update their organization's valuations"
  ON public.valuations
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    ) OR
    public.is_global_admin() = true
  );

CREATE POLICY "Users can delete their own valuations"
  ON public.valuations
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_global_admin() = true
  );