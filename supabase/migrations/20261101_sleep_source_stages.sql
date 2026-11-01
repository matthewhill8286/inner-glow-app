-- Where each night came from, what affected it, and its sleep stages (06 §6 items 5 and 6).
ALTER TABLE public.sleep
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','sleep_mode','health')),
  ADD COLUMN IF NOT EXISTS factors TEXT[] NOT NULL DEFAULT '{}'
    CHECK (factors <@ ARRAY['caffeine','screen_time','stress','exercise','late_meal','noise','wind_down','nap']::TEXT[]);

-- Stages only come from Apple Health or Health Connect, so most nights have none.
CREATE TABLE IF NOT EXISTS public.sleep_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sleep_id UUID NOT NULL REFERENCES public.sleep(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('awake','rem','light','deep')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS sleep_stages_sleep_id ON public.sleep_stages(sleep_id, start_at);

ALTER TABLE public.sleep_stages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sleep_stages FROM anon;
GRANT SELECT, INSERT, DELETE ON public.sleep_stages TO authenticated;
GRANT ALL ON public.sleep_stages TO service_role;

CREATE POLICY "Read own sleep stages" ON public.sleep_stages
  FOR SELECT USING (user_id = auth.uid());
-- A stage can only be attached to a night the same user owns.
CREATE POLICY "Add stages to own nights" ON public.sleep_stages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.sleep s WHERE s.id = sleep_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Delete own sleep stages" ON public.sleep_stages
  FOR DELETE USING (user_id = auth.uid());
