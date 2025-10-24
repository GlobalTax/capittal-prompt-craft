-- =====================================================
-- FASE 1.2: Proteger tabla security_companies - Eliminar acceso público
-- =====================================================

-- Paso 1: Obtener políticas públicas existentes
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'security_companies'
    AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.security_companies', policy_record.policyname);
  END LOOP;
END $$;

-- Paso 2: Política segura - solo usuarios autenticados
CREATE POLICY "Authenticated users view security companies"
ON public.security_companies FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Paso 3: Solo admins pueden modificar
CREATE POLICY "Admins manage security companies"
ON public.security_companies FOR ALL
TO authenticated
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Log en audit_trail
INSERT INTO public.audit_trail (
  table_name, operation, user_id, new_data, ip_address
) VALUES (
  'security_companies', 
  'SECURITY_FIX', 
  '00000000-0000-0000-0000-000000000000'::uuid,
  jsonb_build_object(
    'fix', 'Removed public access to security_companies table',
    'timestamp', NOW()
  ),
  inet '127.0.0.1'
);