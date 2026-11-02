-- Runs after tests/submission.sql, which created the synthetic users and assert_true.
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SET ROLE authenticated;
INSERT INTO feedback(rating,areas,message) VALUES(4,ARRAY['glow_ai','speed'],'Loving the sleep flow.');
SELECT public.assert_true((SELECT count(*)=1 AND bool_and(user_id=auth.uid()) FROM feedback),'feedback saved for the signed-in person');
DO $$ BEGIN
  BEGIN INSERT INTO feedback(rating) VALUES(6); RAISE EXCEPTION 'rating 6 accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO feedback(rating,areas) VALUES(3,ARRAY['colour']); RAISE EXCEPTION 'unknown area accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO feedback(rating,message) VALUES(3,repeat('x',501)); RAISE EXCEPTION 'long note accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO feedback(user_id,rating) VALUES('00000000-0000-4000-8000-000000000002',3); RAISE EXCEPTION 'feedback for someone else accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO feedback(rating) SELECT 3 FROM generate_series(1,9);
DO $$ BEGIN
  BEGIN INSERT INTO feedback(rating) VALUES(3); RAISE EXCEPTION 'eleventh note accepted';
  EXCEPTION WHEN raise_exception THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
SELECT public.assert_true((SELECT count(*)=0 FROM feedback),'other people cannot read it');
RESET ROLE;
