-- Fix foreign key constraints to allow user deletion
-- This migration adjusts all foreign keys in the public schema that reference auth.users
-- and have NO ACTION or RESTRICT delete rules

DO $$
DECLARE
  r RECORD;
  col_is_nullable boolean;
  on_delete_action text;
BEGIN
  -- Loop through all foreign keys in public schema that reference auth.users
  -- with NO ACTION ('a') or RESTRICT ('r') delete rules
  FOR r IN
    SELECT
      n.nspname AS table_schema,
      c.relname AS table_name,
      a.attname AS column_name,
      con.conname AS constraint_name,
      con.confdeltype
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ord) ON TRUE
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = cols.attnum
    WHERE con.contype = 'f' 
      AND con.confrelid = 'auth.users'::regclass 
      AND n.nspname = 'public' 
      AND con.confdeltype IN ('a', 'r') -- NO ACTION / RESTRICT
  LOOP
    -- Check if the column is nullable
    SELECT (isc.is_nullable = 'YES') INTO col_is_nullable 
    FROM information_schema.columns isc
    WHERE isc.table_schema = r.table_schema 
      AND isc.table_name = r.table_name 
      AND isc.column_name = r.column_name;
    
    -- Determine the appropriate ON DELETE action
    on_delete_action := CASE
      -- Tables where we want cascade deletion
      WHEN r.table_name IN ('user_roles', 'user_profiles', 'valuation_reports', 'advisor_profiles') THEN 'CASCADE'
      -- If column is nullable, set to NULL on delete
      WHEN col_is_nullable THEN 'SET NULL'
      -- Otherwise cascade
      ELSE 'CASCADE'
    END;
    
    -- Drop the existing constraint
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', 
      r.table_schema, r.table_name, r.constraint_name);
    
    -- Recreate with the new ON DELETE action
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE %s', 
      r.table_schema, r.table_name, r.constraint_name, r.column_name, on_delete_action);
    
    RAISE NOTICE 'Updated constraint % on %.% with ON DELETE %', 
      r.constraint_name, r.table_schema, r.table_name, on_delete_action;
  END LOOP;
END$$;