-- Practices (docs/design-handoff/07 §5, 10 §3.5–3.8).
-- Sessions record which practice ran, how, and whether it was finished or ended early.
ALTER TABLE public.mindfulness
  ADD COLUMN IF NOT EXISTS practice_id TEXT CHECK (practice_id IS NULL OR practice_id ~ '^[a-z0-9-]{1,40}$'),
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IS NULL OR category IN ('breathing', 'relax-body', 'relax-mind', 'mindfulness', 'sleep')),
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS planned_seconds INT CHECK (planned_seconds IS NULL OR planned_seconds BETWEEN 0 AND 86400),
  ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(options) = 'object');

-- Daily goal in minutes (10 §3.7), 5 to 60 in steps the app offers.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mindful_goal_minutes INT NOT NULL DEFAULT 10 CHECK (mindful_goal_minutes BETWEEN 5 AND 60);

-- Favourites (10 §3.5–3.6): most recent first.
CREATE TABLE IF NOT EXISTS public.practice_favourites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id TEXT NOT NULL CHECK (practice_id ~ '^[a-z0-9-]{1,40}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, practice_id)
);
ALTER TABLE public.practice_favourites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their favourites" ON public.practice_favourites;
CREATE POLICY "Users read their favourites" ON public.practice_favourites FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users add their favourites" ON public.practice_favourites;
CREATE POLICY "Users add their favourites" ON public.practice_favourites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users remove their favourites" ON public.practice_favourites;
CREATE POLICY "Users remove their favourites" ON public.practice_favourites FOR DELETE TO authenticated USING (user_id = auth.uid());
GRANT SELECT, INSERT, DELETE ON public.practice_favourites TO authenticated;
