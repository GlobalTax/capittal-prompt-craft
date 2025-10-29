-- Add metadata column to valuations table
ALTER TABLE public.valuations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.valuations.metadata IS 'Additional metadata including valuationMethods, customLabels, sectorCode, etc.';