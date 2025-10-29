-- Create issue_reports table for tracking user-reported issues
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('error', 'bug', 'feedback', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  route TEXT,
  error_stack TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_issue_reports_user_id ON public.issue_reports(user_id);
CREATE INDEX idx_issue_reports_status ON public.issue_reports(status);
CREATE INDEX idx_issue_reports_created_at ON public.issue_reports(created_at DESC);
CREATE INDEX idx_issue_reports_severity ON public.issue_reports(severity);

-- Enable Row Level Security
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON public.issue_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON public.issue_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.issue_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Policy: Admins can update reports (change status)
CREATE POLICY "Admins can update reports"
  ON public.issue_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_issue_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_issue_reports_updated_at
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_reports_updated_at();