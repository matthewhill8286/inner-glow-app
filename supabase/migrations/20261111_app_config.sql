-- Update required (11 task 29, `6832:8215`): the lowest native build each platform still supports.
-- Everyone, signed in or not, can read it; only the service role changes it. 0 blocks nothing.
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app config" ON public.app_config FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.app_config TO anon, authenticated;
INSERT INTO public.app_config (key, value) VALUES
  ('min_ios_build', '0'::jsonb),
  ('min_android_build', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;
