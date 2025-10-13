-- Fix foreign key constraint on valuation_reports to allow CASCADE delete
-- This allows deleting users who have generated reports

-- Drop the existing constraint
ALTER TABLE public.valuation_reports 
DROP CONSTRAINT IF EXISTS valuation_reports_generated_by_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE public.valuation_reports
ADD CONSTRAINT valuation_reports_generated_by_fkey
FOREIGN KEY (generated_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;