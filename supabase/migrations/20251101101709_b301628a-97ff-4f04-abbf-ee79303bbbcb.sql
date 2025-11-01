-- Security Fix: Address Critical Error-Level Issues (FINAL)
-- Issue 1: RLS disabled on public tables
-- Issue 2: Overly permissive INSERT policy on sell_business_leads

-- ============================================================================
-- CRITICAL FIX 1: Ensure RLS is enabled on all public tables
-- ============================================================================

-- Enable RLS on all public tables that should have it
DO $$ 
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN (
      'schema_migrations',
      'supabase_migrations',
      '_prisma_migrations'
    )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- CRITICAL FIX 2: Remove overly permissive INSERT policy on sell_business_leads
-- ============================================================================

-- Drop the dangerous "anyone can create" policy
DROP POLICY IF EXISTS "Anyone can create sell business leads" ON public.sell_business_leads;

-- Drop conflicting policy if exists
DROP POLICY IF EXISTS "Users can create sell business leads" ON public.sell_business_leads;

-- New secure policy: Only authenticated advisors and admins can INSERT directly
-- Anonymous leads from public landing are handled by edge function with SERVICE_ROLE_KEY
CREATE POLICY "authenticated_advisors_create_leads"
ON public.sell_business_leads
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated AND is the advisor referring the lead
  (auth.uid() IS NOT NULL AND auth.uid() = advisor_user_id)
  OR
  -- OR if it's an admin or superadmin (for admin panel)
  (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  )
);

-- Note: Anonymous leads from public landing page (/sell-business-contact) 
-- are handled by the edge function 'send-sell-business-lead' which:
-- ✅ Uses SERVICE_ROLE_KEY to bypass RLS in a controlled way
-- ✅ Has Zod validation for all inputs
-- ✅ Has rate limiting (3 requests/hour per IP)
-- ✅ Sanitizes HTML to prevent XSS
-- ✅ Validates email format and company data

-- ============================================================================
-- FIX 3: Update other policies to use correct roles
-- ============================================================================

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

-- Fix sell_business_leads view/update policies
DROP POLICY IF EXISTS "Admins can view all leads" ON public.sell_business_leads;
CREATE POLICY "Admins can view all leads"
ON public.sell_business_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

DROP POLICY IF EXISTS "Admins can update leads" ON public.sell_business_leads;
CREATE POLICY "Admins can update leads"
ON public.sell_business_leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

DROP POLICY IF EXISTS "Admins can delete leads" ON public.sell_business_leads;
CREATE POLICY "Admins can delete leads"
ON public.sell_business_leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

-- Fix advisor_collaboration_requests policies
DROP POLICY IF EXISTS "Admins can view all collaboration requests" ON public.advisor_collaboration_requests;
CREATE POLICY "Admins can view all collaboration requests"
ON public.advisor_collaboration_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

-- Fix security_logs policies
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.security_logs;
CREATE POLICY "Admins can view all security logs"
ON public.security_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- VERIFICATION: Check that critical tables have RLS enabled
-- ============================================================================

DO $$
DECLARE
  rls_disabled_tables TEXT[];
BEGIN
  SELECT array_agg(tablename)
  INTO rls_disabled_tables
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'user_profiles',
    'user_roles', 
    'valuations',
    'valuation_years',
    'monthly_budgets',
    'sell_business_leads',
    'advisor_collaboration_requests',
    'security_logs',
    'document_templates',
    'advisor_profiles',
    'commissions'
  )
  AND c.relrowsecurity = false;

  IF array_length(rls_disabled_tables, 1) > 0 THEN
    RAISE WARNING 'RLS not enabled on critical tables: %', array_to_string(rls_disabled_tables, ', ');
  END IF;
END $$;

-- ============================================================================
-- SECURITY ENHANCEMENT: Add policy comments for documentation
-- ============================================================================

COMMENT ON POLICY "authenticated_advisors_create_leads" ON public.sell_business_leads IS 
'Only authenticated advisors and admins can INSERT directly. Anonymous leads from public landing are created via edge function with SERVICE_ROLE_KEY, including rate limiting, validation, and XSS sanitization.';