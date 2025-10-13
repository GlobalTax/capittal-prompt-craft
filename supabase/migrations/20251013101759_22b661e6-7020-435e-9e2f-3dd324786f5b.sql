-- Backfill user_id en user_profiles para filas existentes
UPDATE public.user_profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- Reemplazar la función trigger para insertar user_id correctamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    timezone('utc', now()),
    timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = timezone('utc', now());
  
  RETURN NEW;
END;
$$;