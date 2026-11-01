-- Glow AI part two (docs/design-handoff/05 §3.5–3.8).
-- Settings: the reply tone and the memory, journal and voice reply switches on the profile.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_tone TEXT NOT NULL DEFAULT 'gentle' CHECK (ai_tone IN ('gentle', 'direct', 'playful')),
  ADD COLUMN IF NOT EXISTS ai_memory BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ai_journal BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ai_voice_replies BOOLEAN NOT NULL DEFAULT FALSE;

-- Free plan: 10 talks a week, resetting on Monday (UTC). A talk counts once in a week however many
-- messages it has. Rows are written only by claim_glow_ai_chat from the chat function.
CREATE TABLE IF NOT EXISTS public.glow_ai_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  chat_key TEXT NOT NULL CHECK (char_length(chat_key) BETWEEN 1 AND 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start, chat_key)
);
ALTER TABLE public.glow_ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their Glow AI usage" ON public.glow_ai_usage;
CREATE POLICY "Users read their Glow AI usage" ON public.glow_ai_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.glow_ai_usage FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_glow_ai_chat(p_user_id UUID, p_chat_key TEXT, p_limit INT DEFAULT 10)
RETURNS TABLE (allowed BOOLEAN, used INT, chat_limit INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_week DATE := date_trunc('week', now() AT TIME ZONE 'UTC')::date;
  v_used INT;
BEGIN
  -- Serialise claims per user so two first messages cannot both take the last free talk.
  PERFORM pg_advisory_xact_lock(hashtextextended('glow_ai_usage:' || p_user_id::text, 0));
  SELECT count(*) INTO v_used FROM glow_ai_usage WHERE user_id = p_user_id AND week_start = v_week;
  IF EXISTS (SELECT 1 FROM glow_ai_usage WHERE user_id = p_user_id AND week_start = v_week AND chat_key = p_chat_key) THEN
    RETURN QUERY SELECT TRUE, v_used, p_limit;
  ELSIF v_used >= p_limit THEN
    RETURN QUERY SELECT FALSE, v_used, p_limit;
  ELSE
    INSERT INTO glow_ai_usage (user_id, week_start, chat_key) VALUES (p_user_id, v_week, p_chat_key);
    RETURN QUERY SELECT TRUE, v_used + 1, p_limit;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.claim_glow_ai_chat(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_glow_ai_chat(UUID, TEXT, INT) TO service_role;

-- Session summaries (screen 5), written by the chat-summary function. With "Remember our talks" on,
-- the chat function reads the latest ones as memory.
CREATE TABLE IF NOT EXISTS public.glow_ai_summaries (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_key TEXT NOT NULL CHECK (char_length(chat_key) BETWEEN 1 AND 200),
  title TEXT NOT NULL CHECK (char_length(title) <= 80),
  summary TEXT NOT NULL CHECK (char_length(summary) <= 200),
  mood_before TEXT CHECK (mood_before IN ('angry', 'sad', 'neutral', 'happy', 'very-happy')),
  mood_after TEXT CHECK (mood_after IN ('angry', 'sad', 'neutral', 'happy', 'very-happy')),
  -- One-word labels for the mood pills, e.g. "Tense" and "Calmer".
  mood_before_label TEXT CHECK (char_length(mood_before_label) <= 24),
  mood_after_label TEXT CHECK (char_length(mood_after_label) <= 24),
  key_points TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(key_points) <= 5),
  minutes INT NOT NULL DEFAULT 0 CHECK (minutes >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chat_key)
);
ALTER TABLE public.glow_ai_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their Glow AI summaries" ON public.glow_ai_summaries;
CREATE POLICY "Users read their Glow AI summaries" ON public.glow_ai_summaries
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete their Glow AI summaries" ON public.glow_ai_summaries;
CREATE POLICY "Users delete their Glow AI summaries" ON public.glow_ai_summaries
  FOR DELETE TO authenticated USING (user_id = auth.uid());
REVOKE INSERT, UPDATE ON public.glow_ai_summaries FROM anon, authenticated;
