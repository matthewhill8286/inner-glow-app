-- Personal information (06 P3): "What should we call you?". Greetings use it before the first name.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT CHECK (nickname IS NULL OR char_length(btrim(nickname)) BETWEEN 1 AND 40);
