-- Crear tabla para alertas/notificaciones del sistema
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('market_change', 'valuation_update', 'due_date', 'threshold', 'data_sync')),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_read boolean DEFAULT false,
  action_required boolean DEFAULT false,
  related_entity text,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para system_alerts
CREATE INDEX idx_system_alerts_user_id ON system_alerts(user_id);
CREATE INDEX idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_type ON system_alerts(type);

-- RLS para system_alerts
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON system_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON system_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON system_alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts"
  ON system_alerts FOR INSERT
  WITH CHECK (true);

-- Crear tabla para reglas de alertas
CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  condition text NOT NULL,
  threshold numeric NOT NULL,
  enabled boolean DEFAULT true,
  frequency text DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  channels jsonb DEFAULT '["in-app"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para alert_rules
CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);

-- RLS para alert_rules
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert rules"
  ON alert_rules FOR ALL
  USING (auth.uid() = user_id);

-- Crear tabla para due diligence items
CREATE TABLE IF NOT EXISTS due_diligence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id uuid REFERENCES valuations(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('financial', 'legal', 'operational', 'market')),
  title text NOT NULL,
  description text NOT NULL,
  impact text NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  checked boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para due_diligence_items
CREATE INDEX idx_dd_items_valuation_id ON due_diligence_items(valuation_id);
CREATE INDEX idx_dd_items_category ON due_diligence_items(category);
CREATE INDEX idx_dd_items_checked ON due_diligence_items(checked);

-- RLS para due_diligence_items
ALTER TABLE due_diligence_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view DD items on their valuations"
  ON due_diligence_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = due_diligence_items.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create DD items on their valuations"
  ON due_diligence_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = due_diligence_items.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update DD items on their valuations"
  ON due_diligence_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = due_diligence_items.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete DD items on their valuations"
  ON due_diligence_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM valuations
      WHERE valuations.id = due_diligence_items.valuation_id
      AND valuations.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dd_items_updated_at
  BEFORE UPDATE ON due_diligence_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();