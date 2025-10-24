-- =====================================================
-- FASE 1.1: Proteger tabla operations - Eliminar acceso público
-- =====================================================

-- Paso 1: Eliminar políticas públicas existentes
DROP POLICY IF EXISTS "Anyone can view available operations" ON public.operations;
DROP POLICY IF EXISTS "Cualquiera puede ver operaciones disponibles" ON public.operations;
DROP POLICY IF EXISTS "Public can view available operations" ON public.operations;
DROP POLICY IF EXISTS "Users can create operations" ON public.operations;

-- Paso 2: Función helper para verificar roles admin/superadmin (si no existe)
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  -- Si no hay usuario autenticado, retornar false
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Obtener el rol más alto del usuario
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'advisor' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1;
  
  RETURN v_role IN ('admin', 'superadmin');
END;
$$;

-- Paso 3: Política segura - solo usuarios autenticados ven sus operaciones
CREATE POLICY "Users view own operations"
ON public.operations FOR SELECT
TO authenticated
USING (
  -- El usuario es el creador
  auth.uid() = created_by OR
  -- El usuario es el manager
  auth.uid() = manager_id OR
  -- El usuario es admin/superadmin (usar función existente o nueva)
  is_admin_user() OR
  is_admin_or_superadmin()
);

-- Paso 4: Política para INSERT - solo usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can insert operations" ON public.operations;
CREATE POLICY "Authenticated users can insert operations"
ON public.operations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Log en audit_trail
INSERT INTO public.audit_trail (
  table_name, operation, user_id, new_data, ip_address
) VALUES (
  'operations', 
  'SECURITY_FIX', 
  '00000000-0000-0000-0000-000000000000'::uuid,
  jsonb_build_object(
    'fix', 'Removed public access to operations table',
    'policies_removed', ARRAY['Anyone can view available operations', 'Cualquiera puede ver operaciones disponibles', 'Public can view available operations', 'Users can create operations'],
    'timestamp', NOW()
  ),
  inet '127.0.0.1'
);