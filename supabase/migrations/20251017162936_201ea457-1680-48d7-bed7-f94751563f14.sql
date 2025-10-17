-- Create webhook queue table for reliable delivery
CREATE TABLE IF NOT EXISTS public.zapier_webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.zapier_webhook_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook queue
CREATE POLICY "Admins can view webhook queue"
  ON public.zapier_webhook_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- System can manage queue
CREATE POLICY "System can manage webhook queue"
  ON public.zapier_webhook_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to queue Zapier webhook on new user signup
CREATE OR REPLACE FUNCTION public.queue_zapier_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  webhook_payload jsonb;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Build webhook payload
  webhook_payload := jsonb_build_object(
    'event_type', 'new_user_signup',
    'timestamp', now(),
    'user', jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'email', user_email,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'company', NEW.company,
      'phone', NEW.phone,
      'city', NEW.city,
      'advisory_type', NEW.advisory_type,
      'tax_id', NEW.tax_id,
      'professional_number', NEW.professional_number,
      'created_at', NEW.created_at
    )
  );
  
  -- Insert into webhook queue
  INSERT INTO public.zapier_webhook_queue (payload) 
  VALUES (webhook_payload);
  
  -- Log event
  PERFORM public.enhanced_log_security_event(
    'zapier_webhook_queued',
    'low',
    'New user signup queued for Zapier webhook',
    jsonb_build_object('user_id', NEW.user_id, 'email', user_email)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    PERFORM public.enhanced_log_security_event(
      'zapier_webhook_queue_error',
      'medium',
      'Failed to queue Zapier webhook: ' || SQLERRM,
      jsonb_build_object('user_id', NEW.user_id, 'error', SQLERRM)
    );
    RETURN NEW;
END;
$$;

-- Create trigger on user_profiles INSERT
DROP TRIGGER IF EXISTS on_new_user_profile_zapier ON public.user_profiles;
CREATE TRIGGER on_new_user_profile_zapier
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_zapier_webhook();

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_zapier_webhook_queue_status 
  ON public.zapier_webhook_queue(status, created_at) 
  WHERE status = 'pending';