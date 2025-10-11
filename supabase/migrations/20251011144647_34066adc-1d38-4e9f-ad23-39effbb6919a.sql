-- 1. Añadir campos de tipo de valoración y contexto a la tabla valuations
ALTER TABLE valuations 
  ADD COLUMN IF NOT EXISTS valuation_type TEXT DEFAULT 'own_business' 
    CHECK (valuation_type IN ('own_business', 'potential_acquisition', 'client_business'));

-- 2. Campos para valoraciones de clientes
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS client_company TEXT;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- 3. Campos para objetivos de compra
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS target_company_name TEXT;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS target_industry TEXT;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS target_location TEXT;
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- 4. Notas privadas del asesor
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS private_notes TEXT;

-- 5. Crear tabla advisor_profiles para personalización de marca
CREATE TABLE IF NOT EXISTS advisor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  business_name TEXT NOT NULL,
  professional_title TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  footer_disclaimer TEXT,
  brand_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Habilitar RLS en advisor_profiles
ALTER TABLE advisor_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para advisor_profiles
CREATE POLICY "Users can manage own profile" ON advisor_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 8. Trigger para actualizar updated_at en advisor_profiles
CREATE OR REPLACE FUNCTION update_advisor_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER advisor_profiles_updated_at
BEFORE UPDATE ON advisor_profiles
FOR EACH ROW
EXECUTE FUNCTION update_advisor_profiles_updated_at();