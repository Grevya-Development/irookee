-- Expert Reporting System Schema Migration
-- Create expert_reports table to store community-reported violations against experts

CREATE TABLE IF NOT EXISTS public.expert_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expert_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spam', 'abuse', 'harassment', 'misleading', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'action_taken', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexing for lookup performance
CREATE INDEX IF NOT EXISTS idx_expert_reports_expert_id ON public.expert_reports(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_reports_reporter_id ON public.expert_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_expert_reports_status ON public.expert_reports(status);

-- Enable RLS
ALTER TABLE public.expert_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own reports"
  ON public.expert_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.expert_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
  ON public.expert_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION public.update_expert_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_expert_reports_updated_at
  BEFORE UPDATE ON public.expert_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expert_reports_updated_at();
