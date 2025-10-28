-- Fix handle_new_user trigger to correctly populate user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    user_id,
    first_name,
    last_name,
    company,
    phone,
    city,
    advisory_type,
    tax_id,
    professional_number,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'company',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'advisory_type',
    NEW.raw_user_meta_data ->> 'tax_id',
    NEW.raw_user_meta_data ->> 'professional_number',
    timezone('utc', now()),
    timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        first_name = COALESCE(EXCLUDED.first_name, public.user_profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.user_profiles.last_name),
        company = COALESCE(EXCLUDED.company, public.user_profiles.company),
        phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
        city = COALESCE(EXCLUDED.city, public.user_profiles.city),
        advisory_type = COALESCE(EXCLUDED.advisory_type, public.user_profiles.advisory_type),
        tax_id = COALESCE(EXCLUDED.tax_id, public.user_profiles.tax_id),
        professional_number = COALESCE(EXCLUDED.professional_number, public.user_profiles.professional_number),
        updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;