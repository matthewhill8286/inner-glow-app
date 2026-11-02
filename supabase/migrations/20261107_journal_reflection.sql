-- Glow AI reflections on journal entries (04 J5). The journal-reflection function writes them with the
-- service role; people cannot write their own, and editing an entry's text clears its reflection so a
-- stale one is never shown. audio_url holds the recording's path in the private journal-audio bucket.
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS reflection TEXT CHECK (char_length(reflection) <= 600),
  ADD COLUMN IF NOT EXISTS reflection_practice_id TEXT CHECK (char_length(reflection_practice_id) <= 60),
  ADD COLUMN IF NOT EXISTS reflection_at TIMESTAMPTZ;

-- The hosted table already has this policy; it is created here for databases built from migrations.
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'journal_entries' AND policyname = 'journal_entries_self') THEN
    CREATE POLICY journal_entries_self ON public.journal_entries FOR ALL
      USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.journal_reflection_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE privileged BOOLEAN := current_user IN ('service_role', 'postgres', 'supabase_admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT privileged THEN
      NEW.reflection := NULL; NEW.reflection_practice_id := NULL; NEW.reflection_at := NULL;
    END IF;
  ELSIF NEW.body IS DISTINCT FROM OLD.body OR NEW.title IS DISTINCT FROM OLD.title THEN
    NEW.reflection := NULL; NEW.reflection_practice_id := NULL; NEW.reflection_at := NULL;
  ELSIF NOT privileged THEN
    NEW.reflection := OLD.reflection; NEW.reflection_practice_id := OLD.reflection_practice_id; NEW.reflection_at := OLD.reflection_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS journal_reflection_guard ON public.journal_entries;
CREATE TRIGGER journal_reflection_guard BEFORE INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.journal_reflection_guard();
