-- 1. Crear tabla valuation_years
CREATE TABLE public.valuation_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id uuid REFERENCES public.valuations(id) ON DELETE CASCADE NOT NULL,
  year text NOT NULL,
  year_status text CHECK (year_status IN ('closed', 'projected')) DEFAULT 'closed',
  revenue numeric DEFAULT 0,
  fiscal_recurring numeric DEFAULT 0,
  accounting_recurring numeric DEFAULT 0,
  labor_recurring numeric DEFAULT 0,
  other_revenue numeric DEFAULT 0,
  personnel_costs numeric DEFAULT 0,
  other_costs numeric DEFAULT 0,
  owner_salary numeric DEFAULT 0,
  employees integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(valuation_id, year)
);

-- 2. Habilitar RLS
ALTER TABLE public.valuation_years ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS basadas en user_id
CREATE POLICY "valuation_years_select" ON public.valuation_years
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      WHERE v.id = valuation_years.valuation_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "valuation_years_insert" ON public.valuation_years
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      WHERE v.id = valuation_years.valuation_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "valuation_years_update" ON public.valuation_years
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      WHERE v.id = valuation_years.valuation_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "valuation_years_delete" ON public.valuation_years
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      WHERE v.id = valuation_years.valuation_id
      AND v.user_id = auth.uid()
    )
  );

-- 4. Migrar datos existentes de year_1
INSERT INTO public.valuation_years (valuation_id, year, year_status, revenue, fiscal_recurring, accounting_recurring, labor_recurring, other_revenue, personnel_costs, other_costs, owner_salary, employees)
SELECT 
  id as valuation_id,
  year_1 as year,
  'closed' as year_status,
  revenue_1 as revenue,
  fiscal_recurring_1 as fiscal_recurring,
  accounting_recurring_1 as accounting_recurring,
  labor_recurring_1 as labor_recurring,
  other_revenue_1 as other_revenue,
  personnel_costs_1 as personnel_costs,
  other_costs_1 as other_costs,
  owner_salary_1 as owner_salary,
  employees_1 as employees
FROM public.valuations
WHERE year_1 IS NOT NULL;

-- 5. Migrar datos existentes de year_2
INSERT INTO public.valuation_years (valuation_id, year, year_status, revenue, fiscal_recurring, accounting_recurring, labor_recurring, other_revenue, personnel_costs, other_costs, owner_salary, employees)
SELECT 
  id as valuation_id,
  year_2 as year,
  'closed' as year_status,
  revenue_2 as revenue,
  fiscal_recurring_2 as fiscal_recurring,
  accounting_recurring_2 as accounting_recurring,
  labor_recurring_2 as labor_recurring,
  other_revenue_2 as other_revenue,
  personnel_costs_2 as personnel_costs,
  other_costs_2 as other_costs,
  owner_salary_2 as owner_salary,
  employees_2 as employees
FROM public.valuations
WHERE year_2 IS NOT NULL;

-- 6. Crear índices para mejorar performance
CREATE INDEX idx_valuation_years_valuation_id ON public.valuation_years(valuation_id);
CREATE INDEX idx_valuation_years_year ON public.valuation_years(year);