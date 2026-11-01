-- Runs after tests/profile-setup.sql. The free plan allows 10 talks a week, and a talk counts once.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-0000000000d1') ON CONFLICT DO NOTHING;
INSERT INTO profiles(user_id,name) VALUES('00000000-0000-4000-8000-0000000000d1','Glow') ON CONFLICT DO NOTHING;
SELECT public.assert_true((SELECT ai_tone='gentle' AND ai_memory AND ai_journal AND NOT ai_voice_replies
  FROM profiles WHERE user_id='00000000-0000-4000-8000-0000000000d1'),'Glow AI settings default to the design');
DO $$ BEGIN
  BEGIN UPDATE profiles SET ai_tone='sarcastic' WHERE user_id='00000000-0000-4000-8000-0000000000d1'; RAISE EXCEPTION 'unknown tone accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

DO $$ DECLARE r RECORD; BEGIN
  FOR i IN 1..10 LOOP
    SELECT * INTO r FROM public.claim_glow_ai_chat('00000000-0000-4000-8000-0000000000d1','talk-'||i);
    IF NOT r.allowed OR r.used <> i THEN RAISE EXCEPTION 'free talk % refused or miscounted', i; END IF;
  END LOOP;
  SELECT * INTO r FROM public.claim_glow_ai_chat('00000000-0000-4000-8000-0000000000d1','talk-3');
  IF NOT r.allowed OR r.used <> 10 THEN RAISE EXCEPTION 'continuing a counted talk was refused or counted again'; END IF;
  SELECT * INTO r FROM public.claim_glow_ai_chat('00000000-0000-4000-8000-0000000000d1','talk-11');
  IF r.allowed THEN RAISE EXCEPTION 'an eleventh free talk was allowed'; END IF;
END $$;
SELECT public.assert_true((SELECT count(*)=10 FROM glow_ai_usage WHERE user_id='00000000-0000-4000-8000-0000000000d1'),'only the ten free talks are stored');
SELECT public.assert_true(NOT has_function_privilege('authenticated','public.claim_glow_ai_chat(uuid,text,integer)','EXECUTE'),'clients cannot claim talks directly');
SELECT public.assert_true(NOT has_table_privilege('authenticated','public.glow_ai_usage','INSERT'),'clients cannot write usage');

INSERT INTO glow_ai_summaries(user_id,chat_key,title,summary,mood_before,mood_after,key_points,minutes)
  VALUES('00000000-0000-4000-8000-0000000000d1','talk-1','Busy inbox','We made a plan','angry','neutral','{"Start small"}',12);
DO $$ BEGIN
  BEGIN UPDATE glow_ai_summaries SET mood_after='elated' WHERE chat_key='talk-1'; RAISE EXCEPTION 'unknown mood accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.assert_true(NOT has_table_privilege('authenticated','public.glow_ai_summaries','INSERT'),'clients cannot write summaries');
