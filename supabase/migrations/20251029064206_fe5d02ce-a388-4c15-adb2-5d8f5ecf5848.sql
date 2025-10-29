-- Añadir timestamp de verificación
ALTER TABLE public.user_mfa_factors
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Índice para consultas rápidas de factores verificados
CREATE INDEX IF NOT EXISTS idx_user_mfa_factors_verified 
ON public.user_mfa_factors(user_id, is_verified) 
WHERE is_verified = true;

COMMENT ON COLUMN public.user_mfa_factors.verified_at IS 
'Timestamp when the MFA factor was successfully verified';