-- Rate a reply (11 task 12, `6839:7909`, `6839:7992`): "Was this helpful?" under Glow AI's latest
-- reply. "No" can add one of five reasons and a short note. One rating per reply per person; people
-- can add, change and read only their own.
CREATE TABLE IF NOT EXISTS public.chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_key TEXT NOT NULL CHECK (char_length(conversation_key) <= 200),
  message_id TEXT NOT NULL CHECK (char_length(message_id) <= 100),
  helpful BOOLEAN NOT NULL,
  reason TEXT CHECK (reason IN ('not_accurate', 'didnt_help', 'inappropriate', 'too_long', 'other')),
  note TEXT CHECK (char_length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rate own replies" ON public.chat_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Change own ratings" ON public.chat_feedback
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Read own ratings" ON public.chat_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.chat_feedback TO authenticated;
