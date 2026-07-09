-- Add INSERT policy for notifications table to allow authenticated users to create notifications
CREATE POLICY "Users can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
