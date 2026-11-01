-- The redesigned assessment (docs/design-handoff/02, 10 §3.1–3.2).
-- mood_score uses the five-step mood scale of mood_logs (1 Tense … 5 Great).
-- stress_band is the five stress lights (1 Calm … 5 Intense); stress_level (0–10) stays for older rows.
-- medications holds the picked medicines as [{ "name", "class"?, "generic"?, "custom" }]; meds stays readable.
-- reflection_text is the 250-character "Write what's on your mind" step.
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS stress_band SMALLINT CHECK (stress_band BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS medications JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(medications) = 'array'),
  ADD COLUMN IF NOT EXISTS reflection_text TEXT CHECK (char_length(reflection_text) <= 250);
