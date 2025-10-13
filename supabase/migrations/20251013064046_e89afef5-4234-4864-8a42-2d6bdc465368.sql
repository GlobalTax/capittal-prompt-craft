-- Eliminar función con CASCADE
DROP FUNCTION IF EXISTS public.has_role_secure(uuid, app_role) CASCADE;

-- Recrear función mejorada con validación jerárquica
CREATE OR REPLACE FUNCTION public.has_role_secure(_user_id uuid, _required_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  CASE _required_role
    WHEN 'superadmin' THEN
      RETURN user_role = 'superadmin';
    WHEN 'admin' THEN
      RETURN user_role IN ('admin', 'superadmin');
    ELSE
      RETURN user_role IS NOT NULL;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.has_role_secure(uuid, app_role) IS 'Valida rol con jerarquía: superadmin > admin > user';

-- Recrear políticas eliminadas con CASCADE (nombres de columna corregidos)

CREATE POLICY "secure_user_roles_select_admin" ON public.user_roles FOR SELECT USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view audit trail" ON public.audit_trail FOR SELECT USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_view_assigned_leads" ON public.leads FOR SELECT USING (auth.uid() = assigned_to_id OR auth.uid() = created_by OR has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_update_leads" ON public.leads FOR UPDATE USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_delete_leads" ON public.leads FOR DELETE USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_view_companies" ON public.companies FOR SELECT USING (auth.uid() = created_by OR has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_update_companies" ON public.companies FOR UPDATE USING (auth.uid() = created_by OR has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_delete_companies" ON public.companies FOR DELETE USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_view_buying_mandates" ON public.buying_mandates FOR SELECT USING (auth.uid() = created_by OR has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_update_buying_mandates" ON public.buying_mandates FOR UPDATE USING (auth.uid() = created_by OR has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_delete_buying_mandates" ON public.buying_mandates FOR DELETE USING (has_role_secure(auth.uid(), 'admin'::app_role));

-- Nuevas políticas para valuations
CREATE POLICY "admins_can_view_all_valuations" ON public.valuations FOR SELECT USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_can_update_all_valuations" ON public.valuations FOR UPDATE USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_can_delete_all_valuations" ON public.valuations FOR DELETE USING (has_role_secure(auth.uid(), 'admin'::app_role));

-- Nuevas políticas para valuation_reports
CREATE POLICY "admins_can_view_all_reports" ON public.valuation_reports FOR SELECT USING (has_role_secure(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_can_delete_all_reports" ON public.valuation_reports FOR DELETE USING (has_role_secure(auth.uid(), 'admin'::app_role));

-- Índices
CREATE INDEX IF NOT EXISTS idx_valuations_user_id ON public.valuations(user_id);
CREATE INDEX IF NOT EXISTS idx_valuation_reports_generated_by ON public.valuation_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);