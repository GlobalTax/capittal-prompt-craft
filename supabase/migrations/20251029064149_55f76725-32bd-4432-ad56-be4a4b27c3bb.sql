-- ============================================
-- FIX 1: global_admins infinite recursion
-- ============================================

-- Crear función SECURITY DEFINER para romper recursión
CREATE OR REPLACE FUNCTION public.is_global_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM global_admins
    WHERE user_id = auth.uid()
  );
$$;

-- Eliminar políticas recursivas
DROP POLICY IF EXISTS "Global admins can view global admins list" ON global_admins;
DROP POLICY IF EXISTS "Global admins can insert global admins" ON global_admins;
DROP POLICY IF EXISTS "Global admins can delete global admins" ON global_admins;

-- Crear política única no-recursiva
CREATE POLICY "Global admins full access"
ON global_admins FOR ALL
TO authenticated
USING (is_global_admin_secure())
WITH CHECK (is_global_admin_secure());

COMMENT ON FUNCTION public.is_global_admin_secure IS 
'SECURITY DEFINER function to check global admin status without RLS recursion';

-- ============================================
-- FIX 2: document_permissions infinite recursion
-- ============================================

-- Crear función SECURITY DEFINER para document ownership
CREATE OR REPLACE FUNCTION public.can_manage_document_permissions_secure(
  p_document_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Owner del documento
  SELECT EXISTS (
    SELECT 1 FROM documents WHERE id = p_document_id AND created_by = auth.uid()
  ) 
  -- O tiene permiso 'owner' en document_permissions
  OR EXISTS (
    SELECT 1 FROM document_permissions 
    WHERE document_id = p_document_id 
    AND user_id = auth.uid() 
    AND permission_type = 'owner'
  );
$$;

-- Crear función para visualización de permisos
CREATE OR REPLACE FUNCTION public.can_view_document_permissions_secure(
  p_document_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND (
      created_by = auth.uid() 
      OR id IN (
        SELECT document_id FROM document_permissions 
        WHERE user_id = auth.uid() 
        AND permission_type = ANY(ARRAY['owner', 'editor', 'viewer', 'commenter'])
      )
    )
  );
$$;

-- Eliminar políticas recursivas
DROP POLICY IF EXISTS "Document owners can manage permissions" ON document_permissions;
DROP POLICY IF EXISTS "Users can view permissions for documents they can access" ON document_permissions;

-- Crear políticas no-recursivas
CREATE POLICY "Document owners can manage permissions"
ON document_permissions FOR ALL
TO authenticated
USING (can_manage_document_permissions_secure(document_id))
WITH CHECK (can_manage_document_permissions_secure(document_id));

CREATE POLICY "Users can view permissions for documents they can access"
ON document_permissions FOR SELECT
TO authenticated
USING (can_view_document_permissions_secure(document_id));

COMMENT ON FUNCTION public.can_manage_document_permissions_secure IS 
'SECURITY DEFINER function to check document permission management rights without RLS recursion';

COMMENT ON FUNCTION public.can_view_document_permissions_secure IS 
'SECURITY DEFINER function to check document permission viewing rights without RLS recursion';

-- ============================================
-- TESTING: Verificar que no hay recursión
-- ============================================

-- Este query no debe causar recursión infinita
DO $$
BEGIN
  -- Test global_admins
  PERFORM * FROM global_admins LIMIT 1;
  RAISE NOTICE 'global_admins: ✅ No infinite recursion';
  
  -- Test document_permissions
  PERFORM * FROM document_permissions LIMIT 1;
  RAISE NOTICE 'document_permissions: ✅ No infinite recursion';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'RLS recursion test failed: %', SQLERRM;
END;
$$;