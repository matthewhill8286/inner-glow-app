-- Runs after tests/submission.sql, which created assert_true. These users are new, because earlier files delete theirs.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-0000000000c1') ON CONFLICT DO NOTHING;
INSERT INTO profiles(user_id,name,avatar_path,birthday,checkin_time,notification_prefs)
  VALUES('00000000-0000-4000-8000-0000000000c1','Matthew','00000000-0000-4000-8000-0000000000c1/avatar.jpg',
    '1990-05-14','08:30','{"glow_ai_messages":true,"journal_reminder":true,"weekly_summary":false}');
SELECT public.assert_true((SELECT birthday='1990-05-14' AND checkin_time='08:30' AND notification_prefs->>'weekly_summary'='false'
  FROM profiles WHERE user_id='00000000-0000-4000-8000-0000000000c1'),'profile setup answers saved');
DO $$ BEGIN
  BEGIN UPDATE profiles SET birthday=CURRENT_DATE+1 WHERE user_id='00000000-0000-4000-8000-0000000000c1'; RAISE EXCEPTION 'future birthday accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE profiles SET avatar_path='../other/avatar.jpg' WHERE user_id='00000000-0000-4000-8000-0000000000c1'; RAISE EXCEPTION 'avatar path outside the user folder accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE profiles SET notification_prefs='[]' WHERE user_id='00000000-0000-4000-8000-0000000000c1'; RAISE EXCEPTION 'notification prefs array accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE profiles SET nickname='Matt' WHERE user_id='00000000-0000-4000-8000-0000000000c1';
SELECT public.assert_true((SELECT nickname='Matt' FROM profiles WHERE user_id='00000000-0000-4000-8000-0000000000c1'),'nickname saved');
DO $$ BEGIN
  BEGIN UPDATE profiles SET nickname='   ' WHERE user_id='00000000-0000-4000-8000-0000000000c1'; RAISE EXCEPTION 'blank nickname accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
