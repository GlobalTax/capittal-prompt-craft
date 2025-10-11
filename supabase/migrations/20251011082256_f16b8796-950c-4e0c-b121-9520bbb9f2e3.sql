-- Create valuations table
CREATE TABLE valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  tags TEXT[] DEFAULT '{}',
  
  -- Financial data (year 1)
  year_1 TEXT DEFAULT '2023',
  revenue_1 NUMERIC DEFAULT 0,
  fiscal_recurring_1 NUMERIC DEFAULT 0,
  accounting_recurring_1 NUMERIC DEFAULT 0,
  labor_recurring_1 NUMERIC DEFAULT 0,
  other_revenue_1 NUMERIC DEFAULT 0,
  personnel_costs_1 NUMERIC DEFAULT 0,
  other_costs_1 NUMERIC DEFAULT 0,
  owner_salary_1 NUMERIC DEFAULT 0,
  employees_1 INTEGER DEFAULT 0,
  
  -- Financial data (year 2)
  year_2 TEXT DEFAULT '2024',
  revenue_2 NUMERIC DEFAULT 0,
  fiscal_recurring_2 NUMERIC DEFAULT 0,
  accounting_recurring_2 NUMERIC DEFAULT 0,
  labor_recurring_2 NUMERIC DEFAULT 0,
  other_revenue_2 NUMERIC DEFAULT 0,
  personnel_costs_2 NUMERIC DEFAULT 0,
  other_costs_2 NUMERIC DEFAULT 0,
  owner_salary_2 NUMERIC DEFAULT 0,
  employees_2 INTEGER DEFAULT 0,
  
  -- Metadata
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own valuations"
  ON valuations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own valuations"
  ON valuations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own valuations"
  ON valuations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own valuations"
  ON valuations FOR DELETE
  USING (auth.uid() = user_id);

-- Create valuation_tags table
CREATE TABLE valuation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for tags
ALTER TABLE valuation_tags ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view tags
CREATE POLICY "Authenticated users can view tags"
  ON valuation_tags FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags"
  ON valuation_tags FOR ALL
  USING (has_role_secure(auth.uid(), 'admin'::app_role) OR has_role_secure(auth.uid(), 'superadmin'::app_role));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_valuations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_valuations_updated_at
  BEFORE UPDATE ON valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_valuations_updated_at();

-- Insert some default tags
INSERT INTO valuation_tags (name, color) VALUES
  ('Consultoría', '#8B5CF6'),
  ('Fiscal', '#3B82F6'),
  ('Laboral', '#10B981'),
  ('Contable', '#F59E0B'),
  ('Urgente', '#EF4444')
ON CONFLICT (name) DO NOTHING;