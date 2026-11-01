-- The redesigned profile setup (docs/design-handoff/02 §4–5, 10 §3.3).
-- avatar_path is the object path in the private `avatars` bucket (see 20261101_avatars_bucket.sql).
-- birthday replaces the free-text age as the source of truth; the assessment keeps `age` for older rows.
-- checkin_time is the daily check-in reminder (P2); notification_prefs holds the P3 choices,
-- e.g. {"glow_ai_messages": true, "journal_reminder": true, "weekly_summary": false}.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path TEXT CHECK (avatar_path IS NULL OR avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$'),
  ADD COLUMN IF NOT EXISTS birthday DATE CHECK (birthday IS NULL OR birthday BETWEEN DATE '1900-01-01' AND CURRENT_DATE),
  ADD COLUMN IF NOT EXISTS checkin_time TIME,
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(notification_prefs) = 'object');
