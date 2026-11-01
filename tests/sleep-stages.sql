-- Runs after tests/submission.sql, which created the two synthetic users and assert_true.
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SET ROLE authenticated;
INSERT INTO sleep(id,user_id,start_iso,end_iso,duration,source)
  VALUES('00000000-0000-4000-8000-0000000000a1',auth.uid(),'2026-10-30T21:30Z','2026-10-31T05:30Z',8,'health');
SELECT public.assert_true((SELECT source='health' AND factors='{}' FROM sleep WHERE id='00000000-0000-4000-8000-0000000000a1'),'source and empty factors stored');
INSERT INTO sleep(user_id,start_iso,end_iso,duration) VALUES(auth.uid(),'2026-10-29T22:00Z','2026-10-30T06:00Z',8);
SELECT public.assert_true((SELECT count(*)=1 FROM sleep WHERE source='manual'),'manual is the default source');
DO $$ BEGIN
  BEGIN INSERT INTO sleep(user_id,source) VALUES(auth.uid(),'fitbit'); RAISE EXCEPTION 'unknown source accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO sleep(user_id,factors) VALUES(auth.uid(),ARRAY['coffee']); RAISE EXCEPTION 'unknown factor accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
INSERT INTO sleep_stages(sleep_id,user_id,stage,start_at,end_at) VALUES
  ('00000000-0000-4000-8000-0000000000a1',auth.uid(),'light','2026-10-30T21:30Z','2026-10-30T23:00Z'),
  ('00000000-0000-4000-8000-0000000000a1',auth.uid(),'deep','2026-10-30T23:00Z','2026-10-31T00:00Z');
SELECT public.assert_true((SELECT count(*)=2 FROM sleep_stages),'owner adds stages to own night');
DO $$ BEGIN
  BEGIN INSERT INTO sleep_stages(sleep_id,user_id,stage,start_at,end_at)
    VALUES('00000000-0000-4000-8000-0000000000a1',auth.uid(),'nap','2026-10-31T01:00Z','2026-10-31T02:00Z');
    RAISE EXCEPTION 'unknown stage accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
SELECT public.assert_true((SELECT count(*)=0 FROM sleep_stages),'other user cannot read stages');
DO $$ BEGIN
  BEGIN INSERT INTO sleep_stages(sleep_id,user_id,stage,start_at,end_at)
    VALUES('00000000-0000-4000-8000-0000000000a1',auth.uid(),'rem','2026-10-31T01:00Z','2026-10-31T02:00Z');
    RAISE EXCEPTION 'stage attached to another user''s night';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

DELETE FROM sleep WHERE id='00000000-0000-4000-8000-0000000000a1';
SELECT public.assert_true((SELECT count(*)=0 FROM sleep_stages),'stages are removed with their night');
