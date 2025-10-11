-- Crear tabla para presupuestos mensuales
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  budget_name TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  month_statuses JSONB NOT NULL DEFAULT '["presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado","presupuestado"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios presupuestos
CREATE POLICY "Users can view their own budgets"
  ON public.monthly_budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear sus propios presupuestos
CREATE POLICY "Users can create their own budgets"
  ON public.monthly_budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propios presupuestos
CREATE POLICY "Users can update their own budgets"
  ON public.monthly_budgets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios presupuestos
CREATE POLICY "Users can delete their own budgets"
  ON public.monthly_budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_monthly_budgets_updated_at
  BEFORE UPDATE ON public.monthly_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índice para mejorar rendimiento de consultas por usuario
CREATE INDEX idx_monthly_budgets_user_id ON public.monthly_budgets(user_id);

-- Índice para búsquedas por año
CREATE INDEX idx_monthly_budgets_year ON public.monthly_budgets(year);