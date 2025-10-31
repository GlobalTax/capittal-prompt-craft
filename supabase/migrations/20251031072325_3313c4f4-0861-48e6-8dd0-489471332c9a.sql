-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to expire old collaboration requests
-- Runs daily at 2:00 AM UTC
SELECT cron.schedule(
  'expire-old-collaboration-requests',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nbvvdaprcecaqvvkqcto.supabase.co/functions/v1/expire-collaboration-requests',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5idnZkYXByY2VjYXF2dmtxY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTQxMDEsImV4cCI6MjA2NTI5MDEwMX0.U-xmTVjSKNxSjCugemIdIqSLDuFEMt8BuvH0IifJAfo"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);