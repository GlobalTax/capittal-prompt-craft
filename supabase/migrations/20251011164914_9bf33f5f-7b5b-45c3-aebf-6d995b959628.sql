-- Create valuation_reports table
CREATE TABLE IF NOT EXISTS public.valuation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('ejecutivo', 'due-diligence', 'comparativo', 'valoracion-rapida')),
  title TEXT NOT NULL,
  client_name TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.valuation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for valuation_reports
CREATE POLICY "Users can view their own reports"
  ON public.valuation_reports
  FOR SELECT
  USING (auth.uid() = generated_by);

CREATE POLICY "Users can create their own reports"
  ON public.valuation_reports
  FOR INSERT
  WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "Users can delete their own reports"
  ON public.valuation_reports
  FOR DELETE
  USING (auth.uid() = generated_by);

-- Create index for performance
CREATE INDEX idx_valuation_reports_valuation_id ON public.valuation_reports(valuation_id);
CREATE INDEX idx_valuation_reports_generated_by ON public.valuation_reports(generated_by);

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'immediate' CHECK (alert_frequency IN ('immediate', 'daily', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notification_settings
CREATE POLICY "Users can manage their own notification settings"
  ON public.user_notification_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_notification_settings_updated_at
  BEFORE UPDATE ON public.user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();