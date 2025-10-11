-- Create storage bucket for advisor logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('advisor-logos', 'advisor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para logos
CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advisor-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'advisor-logos');

CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'advisor-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advisor-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);