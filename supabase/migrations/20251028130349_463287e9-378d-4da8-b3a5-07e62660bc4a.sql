-- =====================================================
-- FASE 4.3: MEJORAR POLÍTICAS RLS DE TABLA ACTIVITIES (CORREGIDO)
-- =====================================================
-- Fecha: 2025-10-28
-- Descripción: Restringir acceso a activities basado en user_id y company_id

-- ============================================
-- ELIMINAR POLÍTICA PERMISIVA ACTUAL
-- ============================================
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;

-- ============================================
-- CREAR POLÍTICAS RESTRICTIVAS
-- ============================================
-- Los usuarios pueden ver sus propias actividades
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

-- Los admins y superadmins pueden ver todas las actividades de su organización
CREATE POLICY "Admins can view organization activities"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Los usuarios pueden ver actividades relacionadas con sus empresas
CREATE POLICY "Users can view company activities"
  ON public.activities FOR SELECT
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = activities.company_id
        AND c.created_by = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view own activities" ON public.activities IS 
  'Permite que los usuarios vean sus propias actividades (donde user_id = auth.uid()).';

COMMENT ON POLICY "Admins can view organization activities" ON public.activities IS 
  'Permite que los administradores y superadministradores vean todas las actividades.';

COMMENT ON POLICY "Users can view company activities" ON public.activities IS 
  'Permite que los usuarios vean actividades relacionadas con empresas que les pertenecen.';