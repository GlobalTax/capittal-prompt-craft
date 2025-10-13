-- Fix log_security_event function ambiguity
-- Drop the 5-parameter version that's causing conflicts
-- Keep only the 4-parameter version that GoTrue uses

DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, jsonb, uuid);