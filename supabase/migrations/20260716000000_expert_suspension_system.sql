-- Add suspension columns to the speakers table to support ADMIN-6
ALTER TABLE public.speakers 
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_history JSONB DEFAULT '[]'::jsonb;

-- Add INSERT RLS policy to public.notification_preferences to fix SET-5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences"
      ON public.notification_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
