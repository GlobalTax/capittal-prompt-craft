-- ============================================
-- ORGANIZATIONS SYSTEM - COMPLETE IMPLEMENTATION
-- ============================================

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  company_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add organization_id to user_roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Add organization_id to valuations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'valuations' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.valuations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Create global_admins table
CREATE TABLE IF NOT EXISTS public.global_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);

-- 5. Create function to get current user's organization
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Get organization_id from user_roles
  SELECT organization_id INTO org_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

-- 6. Create function to get user organization (returns org_id directly)
CREATE OR REPLACE FUNCTION public.get_user_organization()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

-- 7. Create function to check if user is global admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.global_admins
    WHERE user_id = auth.uid()
  );
END;
$$;

-- 8. Create function to create organization with admin
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  _org_name TEXT,
  _org_slug TEXT,
  _company_id TEXT DEFAULT NULL,
  _email TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Create organization
  INSERT INTO public.organizations (name, slug, company_id, email, phone, created_by)
  VALUES (_org_name, _org_slug, _company_id, _email, _phone, current_user_id)
  RETURNING id INTO new_org_id;
  
  -- Assign current user as admin of the organization
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (current_user_id, 'admin', new_org_id)
  ON CONFLICT (user_id, role) DO UPDATE SET organization_id = new_org_id;
  
  RETURN new_org_id;
END;
$$;

-- 9. Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update their organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    ) OR
    EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Global admins can view all organizations"
  ON public.organizations
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid()));

CREATE POLICY "Global admins can delete organizations"
  ON public.organizations
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid()));

-- 11. Enable RLS on global_admins
ALTER TABLE public.global_admins ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for global_admins
CREATE POLICY "Global admins can view all global admins"
  ON public.global_admins
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid()));

CREATE POLICY "Global admins can manage global admins"
  ON public.global_admins
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid()));

-- 13. Update valuations RLS to include organization context
DROP POLICY IF EXISTS "Users can view their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "Users can create their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "Users can update their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "Users can delete their own valuations" ON public.valuations;

CREATE POLICY "Users can view their organization's valuations"
  ON public.valuations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create valuations in their organization"
  ON public.valuations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    (organization_id IS NULL OR organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their organization's valuations"
  ON public.valuations
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    ) OR
    EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own valuations"
  ON public.valuations
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.global_admins WHERE user_id = auth.uid())
  );

-- 14. Create trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 15. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_valuations_organization_id ON public.valuations(organization_id);
CREATE INDEX IF NOT EXISTS idx_global_admins_user_id ON public.global_admins(user_id);