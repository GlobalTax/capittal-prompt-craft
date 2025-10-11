-- Crear tabla para KPIs del dashboard
CREATE TABLE IF NOT EXISTS dashboard_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  change_percentage numeric,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice para búsquedas por usuario
CREATE INDEX idx_dashboard_kpis_user_id ON dashboard_kpis(user_id);
CREATE INDEX idx_dashboard_kpis_metric_type ON dashboard_kpis(metric_type);

-- RLS para dashboard_kpis
ALTER TABLE dashboard_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KPIs"
  ON dashboard_kpis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KPIs"
  ON dashboard_kpis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KPIs"
  ON dashboard_kpis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own KPIs"
  ON dashboard_kpis FOR DELETE
  USING (auth.uid() = user_id);

-- Crear tabla para comentarios de colaboración
CREATE TABLE IF NOT EXISTS valuation_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id uuid REFERENCES valuations(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  section text,
  comment_type text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_valuation_comments_valuation_id ON valuation_comments(valuation_id);
CREATE INDEX idx_valuation_comments_author_id ON valuation_comments(author_id);

-- RLS para valuation_comments
ALTER TABLE valuation_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on valuations they own"
  ON valuation_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = valuation_comments.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on valuations they own"
  ON valuation_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = valuation_comments.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON valuation_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON valuation_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Crear tabla para tareas de workflow
CREATE TABLE IF NOT EXISTS valuation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id uuid REFERENCES valuations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  due_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_valuation_tasks_valuation_id ON valuation_tasks(valuation_id);
CREATE INDEX idx_valuation_tasks_assignee_id ON valuation_tasks(assignee_id);
CREATE INDEX idx_valuation_tasks_status ON valuation_tasks(status);

-- RLS para valuation_tasks
ALTER TABLE valuation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks on valuations they own"
  ON valuation_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = valuation_tasks.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks on valuations they own"
  ON valuation_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = valuation_tasks.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks on valuations they own"
  ON valuation_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = valuation_tasks.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks on valuations they own"
  ON valuation_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = valuation_tasks.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

-- Crear tabla para múltiplos de sector (configuración global)
CREATE TABLE IF NOT EXISTS sector_multiples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_code text UNIQUE NOT NULL,
  sector_name text NOT NULL,
  revenue_multiple_min numeric,
  revenue_multiple_avg numeric,
  revenue_multiple_max numeric,
  ebitda_multiple_min numeric,
  ebitda_multiple_avg numeric,
  ebitda_multiple_max numeric,
  pe_ratio_min numeric,
  pe_ratio_avg numeric,
  pe_ratio_max numeric,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índice
CREATE INDEX idx_sector_multiples_sector_code ON sector_multiples(sector_code);

-- RLS para sector_multiples (solo lectura para todos)
ALTER TABLE sector_multiples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sector multiples"
  ON sector_multiples FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage sector multiples"
  ON sector_multiples FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Insertar datos iniciales de múltiplos de sector
INSERT INTO sector_multiples (sector_code, sector_name, revenue_multiple_min, revenue_multiple_avg, revenue_multiple_max, ebitda_multiple_min, ebitda_multiple_avg, ebitda_multiple_max, pe_ratio_min, pe_ratio_avg, pe_ratio_max)
VALUES
  ('consulting', 'Consultoría y Servicios Profesionales', 0.6, 1.2, 2.0, 4.0, 7.0, 12.0, 8.0, 15.0, 25.0),
  ('technology', 'Tecnología y Software', 1.5, 3.0, 6.0, 8.0, 15.0, 25.0, 15.0, 25.0, 40.0),
  ('manufacturing', 'Manufactura', 0.4, 0.8, 1.5, 5.0, 8.0, 12.0, 10.0, 15.0, 20.0),
  ('retail', 'Comercio Minorista', 0.3, 0.6, 1.2, 4.0, 7.0, 10.0, 8.0, 12.0, 18.0),
  ('healthcare', 'Salud y Servicios Médicos', 0.8, 1.5, 3.0, 6.0, 10.0, 15.0, 12.0, 18.0, 25.0),
  ('real_estate', 'Inmobiliaria', 0.5, 1.0, 2.0, 8.0, 12.0, 18.0, 10.0, 15.0, 22.0),
  ('hospitality', 'Hostelería y Turismo', 0.4, 0.8, 1.5, 5.0, 8.0, 12.0, 8.0, 12.0, 18.0),
  ('construction', 'Construcción', 0.3, 0.6, 1.2, 4.0, 7.0, 10.0, 8.0, 12.0, 16.0),
  ('education', 'Educación', 0.8, 1.5, 2.5, 5.0, 9.0, 14.0, 10.0, 15.0, 22.0),
  ('financial', 'Servicios Financieros', 1.0, 2.0, 4.0, 6.0, 12.0, 20.0, 10.0, 16.0, 25.0)
ON CONFLICT (sector_code) DO NOTHING;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_kpis_updated_at
  BEFORE UPDATE ON dashboard_kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_valuation_comments_updated_at
  BEFORE UPDATE ON valuation_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_valuation_tasks_updated_at
  BEFORE UPDATE ON valuation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sector_multiples_updated_at
  BEFORE UPDATE ON sector_multiples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();