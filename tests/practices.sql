-- Runs after tests/active-sessions.sql. Favourites belong to their owner; goals and sessions keep to their ranges.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-0000000000f1'),('00000000-0000-4000-8000-0000000000f2') ON CONFLICT DO NOTHING;
INSERT INTO profiles(user_id,name) VALUES('00000000-0000-4000-8000-0000000000f1','Calm') ON CONFLICT DO NOTHING;
SELECT public.assert_true((SELECT mindful_goal_minutes=10 FROM profiles WHERE user_id='00000000-0000-4000-8000-0000000000f1'),'the daily goal defaults to 10 minutes');
DO $$ BEGIN
  BEGIN UPDATE profiles SET mindful_goal_minutes=90 WHERE user_id='00000000-0000-4000-8000-0000000000f1'; RAISE EXCEPTION 'a 90 minute goal was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO mindfulness(user_id,seconds,category) VALUES('00000000-0000-4000-8000-0000000000f1',60,'yoga'); RAISE EXCEPTION 'unknown category accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
INSERT INTO mindfulness(user_id,seconds,practice_id,category,completed,planned_seconds,options)
  VALUES('00000000-0000-4000-8000-0000000000f1',90,'box-breathing','breathing',false,180,'{"pace":"slow"}');
SELECT public.assert_true((SELECT NOT completed AND planned_seconds=180 FROM mindfulness WHERE practice_id='box-breathing'),'a partial session is stored');

SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000f1',false);
SET ROLE authenticated;
INSERT INTO practice_favourites(user_id,practice_id) VALUES('00000000-0000-4000-8000-0000000000f1','box-breathing');
DO $$ BEGIN
  BEGIN INSERT INTO practice_favourites(user_id,practice_id) VALUES('00000000-0000-4000-8000-0000000000f2','coherent'); RAISE EXCEPTION 'a favourite was added for someone else';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.assert_true((SELECT count(*)=1 FROM practice_favourites),'only my favourites are visible');
DELETE FROM practice_favourites WHERE practice_id='box-breathing';
SELECT public.assert_true((SELECT count(*)=0 FROM practice_favourites),'a favourite can be removed');
RESET ROLE;
