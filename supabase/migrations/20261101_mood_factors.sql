-- The redesigned check-in asks for mood, factors and an optional note (04 §M2–M4).
-- Energy and stress are no longer collected, so new rows leave them empty.
ALTER TABLE public.mood_logs
  ALTER COLUMN energy_score DROP NOT NULL,
  ALTER COLUMN stress_score DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS factors TEXT[] NOT NULL DEFAULT '{}'
    CHECK (factors <@ ARRAY['work','sleep','friends','family','exercise','health','weather','money','alone_time']::TEXT[]);
