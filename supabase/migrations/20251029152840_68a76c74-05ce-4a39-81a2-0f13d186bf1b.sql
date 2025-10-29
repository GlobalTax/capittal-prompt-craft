-- Add CNAE and business description fields to valuations table
ALTER TABLE valuations 
ADD COLUMN cnae_code text,
ADD COLUMN business_description text;