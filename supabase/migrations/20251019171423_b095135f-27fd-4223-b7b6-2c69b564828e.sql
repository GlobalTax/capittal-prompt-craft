-- Tabla para capturar leads de venta de empresas generados por asesores
CREATE TABLE IF NOT EXISTS public.sell_business_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la empresa
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  annual_revenue NUMERIC NOT NULL,
  reason_to_sell TEXT,
  
  -- Información de contacto
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  message TEXT,
  
  -- Trazabilidad del asesor que generó el lead
  advisor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE SET NULL,
  
  -- Estado del lead
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'in_negotiation', 'won', 'lost')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Comisiones y tracking
  estimated_commission NUMERIC,
  commission_paid BOOLEAN DEFAULT false,
  commission_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  source TEXT DEFAULT 'valuation_tool' CHECK (source IN ('valuation_tool', 'direct_form', 'landing_page', 'referral')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_contacted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sell_business_leads_advisor ON public.sell_business_leads(advisor_user_id);
CREATE INDEX IF NOT EXISTS idx_sell_business_leads_status ON public.sell_business_leads(status);
CREATE INDEX IF NOT EXISTS idx_sell_business_leads_assigned ON public.sell_business_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sell_business_leads_created ON public.sell_business_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sell_business_leads_valuation ON public.sell_business_leads(valuation_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_sell_business_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sell_business_leads_updated_at
  BEFORE UPDATE ON public.sell_business_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_sell_business_leads_updated_at();

-- Enable RLS
ALTER TABLE public.sell_business_leads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Cualquiera puede crear un lead (formulario público)
CREATE POLICY "Anyone can create sell business leads"
  ON public.sell_business_leads
  FOR INSERT
  WITH CHECK (true);

-- Los asesores pueden ver sus propios leads
CREATE POLICY "Advisors can view their own leads"
  ON public.sell_business_leads
  FOR SELECT
  USING (
    auth.uid() = advisor_user_id 
    OR auth.uid() = assigned_to
    OR has_role_secure(auth.uid(), 'admin'::app_role)
    OR has_role_secure(auth.uid(), 'superadmin'::app_role)
  );

-- Los admins pueden actualizar todos los leads
CREATE POLICY "Admins can update all leads"
  ON public.sell_business_leads
  FOR UPDATE
  USING (
    has_role_secure(auth.uid(), 'admin'::app_role)
    OR has_role_secure(auth.uid(), 'superadmin'::app_role)
  );

-- Los admins pueden eliminar leads
CREATE POLICY "Admins can delete leads"
  ON public.sell_business_leads
  FOR DELETE
  USING (
    has_role_secure(auth.uid(), 'admin'::app_role)
    OR has_role_secure(auth.uid(), 'superadmin'::app_role)
  );

-- Tabla de analytics de funnel para tracking completo
CREATE TABLE IF NOT EXISTS public.lead_funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  advisor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE CASCADE,
  sell_business_lead_id UUID REFERENCES public.sell_business_leads(id) ON DELETE CASCADE,
  
  -- Evento
  event_type TEXT NOT NULL CHECK (event_type IN (
    'valuation_created',
    'valuation_viewed',
    'sell_button_clicked',
    'form_started',
    'form_submitted',
    'lead_contacted',
    'lead_qualified',
    'deal_won',
    'commission_paid'
  )),
  
  -- Datos del evento
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_advisor ON public.lead_funnel_analytics(advisor_user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_event ON public.lead_funnel_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_created ON public.lead_funnel_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.lead_funnel_analytics ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera autenticado puede insertar eventos
CREATE POLICY "Authenticated users can insert analytics"
  ON public.lead_funnel_analytics
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Admins y el propio asesor pueden ver analytics
CREATE POLICY "Users can view their analytics"
  ON public.lead_funnel_analytics
  FOR SELECT
  USING (
    auth.uid() = advisor_user_id
    OR has_role_secure(auth.uid(), 'admin'::app_role)
    OR has_role_secure(auth.uid(), 'superadmin'::app_role)
  );

-- Función helper para registrar eventos de funnel
CREATE OR REPLACE FUNCTION log_funnel_event(
  p_event_type TEXT,
  p_advisor_user_id UUID DEFAULT NULL,
  p_valuation_id UUID DEFAULT NULL,
  p_sell_business_lead_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.lead_funnel_analytics (
    event_type,
    advisor_user_id,
    valuation_id,
    sell_business_lead_id,
    event_data
  ) VALUES (
    p_event_type,
    COALESCE(p_advisor_user_id, auth.uid()),
    p_valuation_id,
    p_sell_business_lead_id,
    p_event_data
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;