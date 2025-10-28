-- =====================================================
-- FASE 4.1: HABILITAR RLS EN TABLA GLOBAL_ADMINS
-- =====================================================
-- Fecha: 2025-10-28
-- Descripción: Habilitar RLS en global_admins y crear políticas restrictivas

-- ============================================
-- HABILITAR RLS EN GLOBAL_ADMINS
-- ============================================
ALTER TABLE public.global_admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA GLOBAL_ADMINS
-- ============================================
-- Solo los global admins pueden ver la lista de global admins
CREATE POLICY "Global admins can view global admins list"
  ON public.global_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.global_admins ga
      WHERE ga.user_id = auth.uid()
    )
  );

-- Solo los global admins pueden agregar nuevos global admins
CREATE POLICY "Global admins can insert global admins"
  ON public.global_admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.global_admins ga
      WHERE ga.user_id = auth.uid()
    )
  );

-- Solo los global admins pueden eliminar global admins
CREATE POLICY "Global admins can delete global admins"
  ON public.global_admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.global_admins ga
      WHERE ga.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Global admins can view global admins list" ON public.global_admins IS 
  'Permite que los global admins vean la lista completa de global admins.';

COMMENT ON POLICY "Global admins can insert global admins" ON public.global_admins IS 
  'Permite que los global admins agreguen nuevos global admins al sistema.';

COMMENT ON POLICY "Global admins can delete global admins" ON public.global_admins IS 
  'Permite que los global admins eliminen global admins del sistema.';