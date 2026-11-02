-- Send feedback (06 §P12): a 1–5 rating, the areas that could be better, an optional note of up to
-- 500 characters and, if the person allows it, device details. People can add and read their own.
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  areas TEXT[] NOT NULL DEFAULT '{}'
    CHECK (areas <@ ARRAY['glow_ai','practices','sleep','journal','design','speed','broken','other']::TEXT[]),
  message TEXT CHECK (char_length(message) <= 500),
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_user_created ON public.feedback (user_id, created_at DESC);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Send own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Read own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT, INSERT ON public.feedback TO authenticated;

-- At most ten notes a day per person, so the form cannot be used to flood the table.
CREATE OR REPLACE FUNCTION public.feedback_rate_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.feedback
      WHERE user_id = NEW.user_id AND created_at > now() - interval '1 day') >= 10 THEN
    RAISE EXCEPTION 'feedback_rate_limited' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS feedback_rate_limit ON public.feedback;
CREATE TRIGGER feedback_rate_limit BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_rate_limit();
