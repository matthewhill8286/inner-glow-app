-- Your week (11 task 14, `6801:6247`): one Glow AI reflection per person per week, written by the
-- weekly-reflection function with the service role. People can read and delete their own.
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own weekly reflections" ON public.weekly_reflections
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Delete own weekly reflections" ON public.weekly_reflections
  FOR DELETE TO authenticated USING (user_id = auth.uid());
GRANT SELECT, DELETE ON public.weekly_reflections TO authenticated;
