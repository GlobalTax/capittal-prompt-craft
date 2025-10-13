-- ============================================================================
-- SCRIPT CONSOLIDADO DE SEGURIDAD Y RLS
-- ============================================================================

-- ============================================================================
-- MEJORA DE FUNCIÓN has_role_secure CON JERARQUÍA COMPLETA
-- ============================================================================

-- Actualizar función manteniendo firma para no romper dependencias
CREATE OR REPLACE FUNCTION public.has_role_secure(_user_id uuid, _required_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	highest_role app_role;
BEGIN
	-- Obtener el rol más alto del usuario basado en jerarquía
	SELECT role INTO highest_role
	FROM public.user_roles
	WHERE user_id = _user_id
	ORDER BY 
		CASE role
			WHEN 'superadmin' THEN 1
			WHEN 'admin' THEN 2
			WHEN 'manager' THEN 3
			WHEN 'sales_rep' THEN 4
			WHEN 'marketing' THEN 4
			WHEN 'support' THEN 4
			WHEN 'user' THEN 5
		END
	LIMIT 1;

	IF highest_role IS NULL THEN
		RETURN FALSE;
	END IF;

	-- Jerarquía: superadmin >= admin >= manager >= [sales_rep, marketing, support] >= user
	IF highest_role = 'superadmin' THEN
		RETURN TRUE;
	ELSIF highest_role = 'admin' THEN
		RETURN _required_role != 'superadmin';
	ELSIF highest_role = 'manager' THEN
		RETURN _required_role IN ('manager','sales_rep','marketing','support','user');
	ELSIF highest_role IN ('sales_rep','marketing','support') THEN
		RETURN _required_role IN ('sales_rep','marketing','support','user');
	ELSIF highest_role = 'user' THEN
		RETURN _required_role = 'user';
	END IF;

	RETURN FALSE;
END;
$$;

-- ============================================================================
-- ÍNDICE ADICIONAL PARA MEJORAR RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================================
-- RLS CONSOLIDADO PARA VALUATIONS
-- ============================================================================

-- Limpiar políticas antiguas
DROP POLICY IF EXISTS "Users can view their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "Users can create their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "Users can update their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "Users can delete their own valuations" ON public.valuations;
DROP POLICY IF EXISTS "valuations_select_own" ON public.valuations;
DROP POLICY IF EXISTS "valuations_insert_own" ON public.valuations;
DROP POLICY IF EXISTS "valuations_update_own" ON public.valuations;
DROP POLICY IF EXISTS "valuations_delete_own" ON public.valuations;
DROP POLICY IF EXISTS "valuations_admin_all" ON public.valuations;

-- Políticas consolidadas de usuario propietario
CREATE POLICY "valuations_select_own"
	ON public.valuations FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "valuations_insert_own"
	ON public.valuations FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "valuations_update_own"
	ON public.valuations FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY "valuations_delete_own"
	ON public.valuations FOR DELETE
	USING (auth.uid() = user_id);

-- Política admin/superadmin para acceso total
CREATE POLICY "valuations_admin_all"
	ON public.valuations FOR ALL
	USING (has_role_secure(auth.uid(), 'admin'::app_role))
	WITH CHECK (has_role_secure(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- RLS CONSOLIDADO PARA VALUATION_REPORTS
-- ============================================================================

-- Limpiar políticas antiguas
DROP POLICY IF EXISTS "Users can view their own reports" ON public.valuation_reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON public.valuation_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.valuation_reports;
DROP POLICY IF EXISTS "valuation_reports_select_own" ON public.valuation_reports;
DROP POLICY IF EXISTS "valuation_reports_insert_own" ON public.valuation_reports;
DROP POLICY IF EXISTS "valuation_reports_update_own" ON public.valuation_reports;
DROP POLICY IF EXISTS "valuation_reports_delete_own" ON public.valuation_reports;
DROP POLICY IF EXISTS "valuation_reports_admin_all" ON public.valuation_reports;

-- Políticas consolidadas de usuario propietario
CREATE POLICY "valuation_reports_select_own"
	ON public.valuation_reports FOR SELECT
	USING (auth.uid() = generated_by);

CREATE POLICY "valuation_reports_insert_own"
	ON public.valuation_reports FOR INSERT
	WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "valuation_reports_update_own"
	ON public.valuation_reports FOR UPDATE
	USING (auth.uid() = generated_by);

CREATE POLICY "valuation_reports_delete_own"
	ON public.valuation_reports FOR DELETE
	USING (auth.uid() = generated_by);

-- Política admin/superadmin para acceso total
CREATE POLICY "valuation_reports_admin_all"
	ON public.valuation_reports FOR ALL
	USING (has_role_secure(auth.uid(), 'admin'::app_role))
	WITH CHECK (has_role_secure(auth.uid(), 'admin'::app_role));