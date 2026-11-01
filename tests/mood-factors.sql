-- Runs after tests/submission.sql, which created the synthetic users and assert_true.
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SET ROLE authenticated;
INSERT INTO mood_logs(id,user_id,mood_score,factors)
  VALUES('00000000-0000-4000-8000-0000000000b1',auth.uid(),4,ARRAY['sleep','friends','exercise']);
SELECT public.assert_true((SELECT energy_score IS NULL AND stress_score IS NULL AND factors=ARRAY['sleep','friends','exercise']
  FROM mood_logs WHERE id='00000000-0000-4000-8000-0000000000b1'),'mood saved without energy or stress, with factors');
INSERT INTO mood_logs(user_id,mood_score,energy_score,stress_score) VALUES(auth.uid(),3,3,5);
SELECT public.assert_true((SELECT factors='{}' FROM mood_logs WHERE mood_score=3),'older check-ins keep working and get no factors');
DO $$ BEGIN
  BEGIN INSERT INTO mood_logs(user_id,mood_score,factors) VALUES(auth.uid(),4,ARRAY['coffee']); RAISE EXCEPTION 'unknown factor accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
-- The note is also saved as a journal entry linked to the check-in.
INSERT INTO journal_entries(user_id,body,mood,mood_log_id)
  VALUES(auth.uid(),'Long walk, slept well.','Good','00000000-0000-4000-8000-0000000000b1');
SELECT public.assert_true((SELECT count(*)=1 FROM journal_entries WHERE mood_log_id='00000000-0000-4000-8000-0000000000b1'),'note linked to its check-in');
RESET ROLE;
