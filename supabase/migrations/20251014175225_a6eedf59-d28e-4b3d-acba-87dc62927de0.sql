-- Añadir columnas para datos de asesorías en user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS advisory_type text,
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS professional_number text;

-- Actualizar el trigger para manejar los nuevos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    first_name, 
    last_name,
    company,
    phone,
    city,
    advisory_type,
    tax_id,
    professional_number
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'company',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'advisory_type',
    NEW.raw_user_meta_data ->> 'tax_id',
    NEW.raw_user_meta_data ->> 'professional_number'
  );
  RETURN NEW;
END;
$$;