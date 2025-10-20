-- =====================================================
-- FASE 4 + FASE 2: Tabla security_logs, triggers y funciones de validación
-- =====================================================

-- 1. Crear tabla security_logs para almacenar eventos de seguridad
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);

-- RLS para security_logs: solo superadmins pueden ver
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view security logs"
ON public.security_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'superadmin'::app_role
  )
);

CREATE POLICY "System can insert security logs"
ON public.security_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Función para validar colaboradores duplicados y auto-vincular user_id
CREATE OR REPLACE FUNCTION public.check_duplicate_collaborator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_collaborator_id UUID;
  user_id_from_email UUID;
BEGIN
  -- Verificar email duplicado
  IF NEW.email IS NOT NULL THEN
    SELECT id INTO existing_collaborator_id
    FROM public.collaborators
    WHERE LOWER(email) = LOWER(NEW.email)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF existing_collaborator_id IS NOT NULL THEN
      RAISE EXCEPTION 'Ya existe un colaborador con el email: %. ID: %', 
        NEW.email, existing_collaborator_id
      USING HINT = 'Revisa el colaborador existente antes de crear uno nuevo';
    END IF;
    
    -- Auto-vincular user_id si existe usuario con ese email
    IF NEW.user_id IS NULL THEN
      SELECT id INTO user_id_from_email
      FROM auth.users
      WHERE LOWER(email) = LOWER(NEW.email);
      
      IF user_id_from_email IS NOT NULL THEN
        NEW.user_id := user_id_from_email;
        
        -- Log en security_logs
        INSERT INTO public.security_logs (
          event_type, severity, description, metadata, user_id
        ) VALUES (
          'collaborator_auto_linked',
          'low',
          'Colaborador vinculado automáticamente con usuario',
          jsonb_build_object(
            'collaborator_id', NEW.id,
            'email', NEW.email,
            'linked_user_id', user_id_from_email
          ),
          auth.uid()
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar colaboradores
DROP TRIGGER IF EXISTS validate_collaborator_before_insert ON public.collaborators;
CREATE TRIGGER validate_collaborator_before_insert
BEFORE INSERT OR UPDATE ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.check_duplicate_collaborator();

-- 3. Función para detectar leads duplicados (warning, no bloquea)
CREATE OR REPLACE FUNCTION public.check_duplicate_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_lead_count INT;
  duplicate_lead_id UUID;
BEGIN
  -- Verificar leads del mismo email + empresa en últimos 30 días
  IF NEW.contact_email IS NOT NULL AND NEW.company_name IS NOT NULL THEN
    SELECT COUNT(*), id INTO recent_lead_count, duplicate_lead_id
    FROM public.sell_business_leads
    WHERE LOWER(contact_email) = LOWER(NEW.contact_email)
      AND LOWER(company_name) = LOWER(NEW.company_name)
      AND created_at >= NOW() - INTERVAL '30 days'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    GROUP BY id
    LIMIT 1;
    
    IF recent_lead_count > 0 THEN
      -- Log en security_logs (no bloquea)
      INSERT INTO public.security_logs (
        event_type, severity, description, metadata, user_id
      ) VALUES (
        'duplicate_lead_detected',
        'high',
        format('Lead duplicado detectado: %s de %s', NEW.contact_email, NEW.company_name),
        jsonb_build_object(
          'new_lead_id', NEW.id,
          'duplicate_lead_id', duplicate_lead_id,
          'company_name', NEW.company_name,
          'contact_email', NEW.contact_email
        ),
        NEW.advisor_user_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para detectar leads duplicados
DROP TRIGGER IF EXISTS check_lead_duplicates ON public.sell_business_leads;
CREATE TRIGGER check_lead_duplicates
AFTER INSERT ON public.sell_business_leads
FOR EACH ROW
EXECUTE FUNCTION public.check_duplicate_lead();

-- 4. Detectar leads sospechosos de alto valor
CREATE OR REPLACE FUNCTION public.check_suspicious_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Lead directo sin asesor con facturación > 5M
  IF NEW.advisor_user_id IS NULL AND NEW.annual_revenue > 5000000 THEN
    INSERT INTO public.security_logs (
      event_type, severity, description, metadata
    ) VALUES (
      'high_value_lead_unassigned',
      'high',
      format('Lead de alto valor sin asesor: %s (%s€)', NEW.company_name, NEW.annual_revenue),
      jsonb_build_object(
        'lead_id', NEW.id,
        'company_name', NEW.company_name,
        'annual_revenue', NEW.annual_revenue,
        'contact_email', NEW.contact_email
      )
    );
  END IF;
  
  -- Lead con facturación muy alta > 10M
  IF NEW.annual_revenue > 10000000 THEN
    INSERT INTO public.security_logs (
      event_type, severity, description, metadata, user_id
    ) VALUES (
      'extremely_high_value_lead',
      'critical',
      format('Lead de valor extremadamente alto: %s (%s€)', NEW.company_name, NEW.annual_revenue),
      jsonb_build_object(
        'lead_id', NEW.id,
        'company_name', NEW.company_name,
        'annual_revenue', NEW.annual_revenue,
        'contact_email', NEW.contact_email,
        'advisor_user_id', NEW.advisor_user_id
      ),
      NEW.advisor_user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para leads sospechosos
DROP TRIGGER IF EXISTS check_suspicious_leads ON public.sell_business_leads;
CREATE TRIGGER check_suspicious_leads
AFTER INSERT ON public.sell_business_leads
FOR EACH ROW
EXECUTE FUNCTION public.check_suspicious_lead();