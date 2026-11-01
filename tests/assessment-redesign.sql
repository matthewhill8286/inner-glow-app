-- Runs after tests/submission.sql, which created assert_true. These users are new, because earlier files delete theirs.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-0000000000a1'),('00000000-0000-4000-8000-0000000000a2') ON CONFLICT DO NOTHING;
INSERT INTO assessments(user_id,mood,mood_score,stress_band,taking_meds,medications,reflection_text)
  VALUES('00000000-0000-4000-8000-0000000000a1','Good',4,4,'prescription',
    '[{"name":"Sertraline","class":"Antidepressant","custom":false},{"name":"Xyzolam","custom":true}]','A lot on my mind.')
  ON CONFLICT (user_id) DO UPDATE SET mood_score=EXCLUDED.mood_score,stress_band=EXCLUDED.stress_band,
    taking_meds=EXCLUDED.taking_meds,medications=EXCLUDED.medications,reflection_text=EXCLUDED.reflection_text;
SELECT public.assert_true((SELECT mood_score=4 AND stress_band=4 AND jsonb_array_length(medications)=2
  FROM assessments WHERE user_id='00000000-0000-4000-8000-0000000000a1'),'new assessment answers saved');
INSERT INTO assessments(user_id,stress_level) VALUES('00000000-0000-4000-8000-0000000000a2',6)
  ON CONFLICT (user_id) DO UPDATE SET stress_level=6;
SELECT public.assert_true((SELECT medications='[]'::jsonb AND stress_band IS NULL
  FROM assessments WHERE user_id='00000000-0000-4000-8000-0000000000a2'),'older assessments keep working');
DO $$ BEGIN
  BEGIN UPDATE assessments SET stress_band=6 WHERE user_id='00000000-0000-4000-8000-0000000000a1'; RAISE EXCEPTION 'stress band 6 accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE assessments SET mood_score=0 WHERE user_id='00000000-0000-4000-8000-0000000000a1'; RAISE EXCEPTION 'mood score 0 accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE assessments SET reflection_text=repeat('a',251) WHERE user_id='00000000-0000-4000-8000-0000000000a1'; RAISE EXCEPTION 'long reflection accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE assessments SET medications='{"name":"x"}' WHERE user_id='00000000-0000-4000-8000-0000000000a1'; RAISE EXCEPTION 'medication object accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
