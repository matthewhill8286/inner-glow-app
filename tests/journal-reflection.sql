-- Runs after tests/practices.sql. Reflections come only from the service role and clear when the entry changes.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-0000000000e1'),('00000000-0000-4000-8000-0000000000e2') ON CONFLICT DO NOTHING;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000e1',false);
SET ROLE authenticated;
INSERT INTO journal_entries(id,user_id,body,title,reflection) VALUES('00000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000e1','A long day','Day','I wrote this myself');
SELECT public.assert_true((SELECT reflection IS NULL FROM journal_entries WHERE id='00000000-0000-4000-8000-0000000000a1'),'a person cannot write a reflection when saving');
RESET ROLE;

SET ROLE service_role;
UPDATE journal_entries SET reflection='It sounds like a full day.',reflection_practice_id='box-breathing',reflection_at=now() WHERE id='00000000-0000-4000-8000-0000000000a1';
RESET ROLE;
SELECT public.assert_true((SELECT reflection='It sounds like a full day.' FROM journal_entries WHERE id='00000000-0000-4000-8000-0000000000a1'),'the function can store a reflection');

SET ROLE authenticated;
UPDATE journal_entries SET reflection='Changed by hand',tags=ARRAY['Work'] WHERE id='00000000-0000-4000-8000-0000000000a1';
SELECT public.assert_true((SELECT reflection='It sounds like a full day.' AND tags=ARRAY['Work'] FROM journal_entries WHERE id='00000000-0000-4000-8000-0000000000a1'),'a person cannot change the reflection but can change tags');
UPDATE journal_entries SET body='A long day, then a calm evening' WHERE id='00000000-0000-4000-8000-0000000000a1';
SELECT public.assert_true((SELECT reflection IS NULL AND reflection_practice_id IS NULL FROM journal_entries WHERE id='00000000-0000-4000-8000-0000000000a1'),'editing the entry clears its reflection');
DO $$ BEGIN
  BEGIN
    INSERT INTO journal_entries(user_id,body) VALUES('00000000-0000-4000-8000-0000000000e2','Not mine');
    RAISE EXCEPTION 'an entry was written for someone else';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
