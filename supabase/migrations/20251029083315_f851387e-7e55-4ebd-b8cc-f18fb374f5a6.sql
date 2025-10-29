-- Create advisor_collaboration_requests table for managing collaboration requests between advisors
CREATE TABLE IF NOT EXISTS public.advisor_collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Advisor requesting the collaboration
  requesting_advisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Advisor being asked to collaborate
  target_advisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Related lead/company
  lead_id UUID REFERENCES public.sell_business_leads(id) ON DELETE CASCADE,
  
  -- Company information (denormalized for quick access)
  company_name TEXT NOT NULL,
  company_sector TEXT,
  annual_revenue NUMERIC,
  
  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  -- Collaboration details
  collaboration_type TEXT CHECK (collaboration_type IN ('referral', 'co_working', 'expertise_needed')),
  collaboration_terms JSONB,
  
  -- Message from requesting advisor
  message TEXT,
  
  -- Commission details
  estimated_commission NUMERIC,
  commission_percentage NUMERIC,
  
  -- Response from target advisor
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (requesting_advisor_id != target_advisor_id),
  UNIQUE(lead_id, target_advisor_id)
);

-- Create indexes for performance
CREATE INDEX idx_collab_requests_target ON public.advisor_collaboration_requests(target_advisor_id, status);
CREATE INDEX idx_collab_requests_requesting ON public.advisor_collaboration_requests(requesting_advisor_id);
CREATE INDEX idx_collab_requests_lead ON public.advisor_collaboration_requests(lead_id);
CREATE INDEX idx_collab_requests_created ON public.advisor_collaboration_requests(created_at DESC);
CREATE INDEX idx_collab_requests_status ON public.advisor_collaboration_requests(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.advisor_collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Advisors can view requests where they are target or requester
CREATE POLICY "Advisors can view their collaboration requests"
ON public.advisor_collaboration_requests FOR SELECT
USING (
  auth.uid() = target_advisor_id 
  OR auth.uid() = requesting_advisor_id
  OR has_role_secure(auth.uid(), 'admin'::app_role)
);

-- Policy: Advisors can create collaboration requests
CREATE POLICY "Advisors can create collaboration requests"
ON public.advisor_collaboration_requests FOR INSERT
WITH CHECK (
  auth.uid() = requesting_advisor_id
  AND has_role_secure(auth.uid(), 'advisor'::app_role)
);

-- Policy: Only target advisor can update (accept/reject)
CREATE POLICY "Target advisors can update requests"
ON public.advisor_collaboration_requests FOR UPDATE
USING (
  auth.uid() = target_advisor_id
  OR has_role_secure(auth.uid(), 'admin'::app_role)
);

-- Policy: Only requesting advisor or admins can delete
CREATE POLICY "Requesting advisors can delete their requests"
ON public.advisor_collaboration_requests FOR DELETE
USING (
  auth.uid() = requesting_advisor_id
  OR has_role_secure(auth.uid(), 'admin'::app_role)
);

-- Function to auto-expire requests
CREATE OR REPLACE FUNCTION public.check_collaboration_request_expiry()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for auto-expiration
CREATE TRIGGER auto_expire_collaboration_requests
BEFORE UPDATE ON public.advisor_collaboration_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_collaboration_request_expiry();

-- Function to update updated_at timestamp
CREATE TRIGGER update_collaboration_requests_updated_at
BEFORE UPDATE ON public.advisor_collaboration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_collaboration_requests TO authenticated;

-- Add comment
COMMENT ON TABLE public.advisor_collaboration_requests IS 'Manages collaboration requests between advisors for business leads';

-- Migrate existing assigned leads to collaboration requests (if any exist)
INSERT INTO public.advisor_collaboration_requests (
  requesting_advisor_id,
  target_advisor_id,
  lead_id,
  company_name,
  company_sector,
  annual_revenue,
  status,
  created_at,
  collaboration_type
)
SELECT 
  advisor_user_id,
  assigned_to,
  id,
  company_name,
  sector,
  annual_revenue,
  'accepted',
  created_at,
  'referral'
FROM public.sell_business_leads
WHERE assigned_to IS NOT NULL 
  AND advisor_user_id IS NOT NULL
  AND advisor_user_id != assigned_to
ON CONFLICT (lead_id, target_advisor_id) DO NOTHING;