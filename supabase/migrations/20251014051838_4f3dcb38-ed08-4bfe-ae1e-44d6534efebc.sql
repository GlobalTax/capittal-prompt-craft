-- Fix admin-delete-user failure: missing column user_email in public.security_logs
-- Root cause from logs: "column \"user_email\" of relation \"security_logs\" does not exist"

BEGIN;
  ALTER TABLE public.security_logs
  ADD COLUMN IF NOT EXISTS user_email text;
COMMIT;