-- Add DCF and Comparable Multiples results fields to valuations table
ALTER TABLE public.valuations 
ADD COLUMN IF NOT EXISTS dcf_results jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS comparable_multiples_results jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_dcf_calculation timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_multiples_calculation timestamp with time zone DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_valuations_last_dcf ON public.valuations(last_dcf_calculation DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_last_multiples ON public.valuations(last_multiples_calculation DESC);

-- Add comments
COMMENT ON COLUMN public.valuations.dcf_results IS 'Resultados históricos de cálculos DCF en formato JSONB';
COMMENT ON COLUMN public.valuations.comparable_multiples_results IS 'Resultados históricos de análisis de múltiplos comparables en formato JSONB';
COMMENT ON COLUMN public.valuations.last_dcf_calculation IS 'Fecha del último cálculo DCF';
COMMENT ON COLUMN public.valuations.last_multiples_calculation IS 'Fecha del último análisis de múltiplos';