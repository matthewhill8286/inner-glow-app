-- Runs after tests/glow-ai.sql. A person sees and revokes only their own sessions, never this one.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-0000000000e1'),('00000000-0000-4000-8000-0000000000e2') ON CONFLICT DO NOTHING;
INSERT INTO auth.sessions(id,user_id,created_at,updated_at,user_agent) VALUES
  ('00000000-0000-4000-8000-00000000e101','00000000-0000-4000-8000-0000000000e1',now()-interval '3 days',now(),'InnerGlow CFNetwork Darwin'),
  ('00000000-0000-4000-8000-00000000e102','00000000-0000-4000-8000-0000000000e1',now()-interval '9 days',now()-interval '2 days','Mozilla/5.0 (iPad)'),
  ('00000000-0000-4000-8000-00000000e103','00000000-0000-4000-8000-0000000000e1',now()-interval '30 days',now()-interval '20 days','old'),
  ('00000000-0000-4000-8000-00000000e201','00000000-0000-4000-8000-0000000000e2',now(),now(),'other person');
UPDATE auth.sessions SET not_after=now()-interval '1 day' WHERE id='00000000-0000-4000-8000-00000000e103';
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000e1',false);
SELECT set_config('request.jwt.claims','{"session_id":"00000000-0000-4000-8000-00000000e101"}',false);
SET ROLE authenticated;
SELECT public.assert_true((SELECT count(*)=2 FROM public.list_my_sessions()),'only my live sessions are listed');
SELECT public.assert_true((SELECT is_current FROM public.list_my_sessions() WHERE id='00000000-0000-4000-8000-00000000e101'),'this session is marked current');
SELECT public.assert_true(NOT public.revoke_my_session('00000000-0000-4000-8000-00000000e201'),'another person''s session cannot be revoked');
DO $$ BEGIN
  BEGIN PERFORM public.revoke_my_session('00000000-0000-4000-8000-00000000e101'); RAISE EXCEPTION 'current session revoked';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT public.assert_true(public.revoke_my_session('00000000-0000-4000-8000-00000000e102'),'my other session is revoked');
RESET ROLE;
SELECT public.assert_true((SELECT count(*)=1 FROM auth.sessions WHERE user_id='00000000-0000-4000-8000-0000000000e2'),'the other person keeps their session');
SELECT public.assert_true(NOT has_function_privilege('anon','public.list_my_sessions()','EXECUTE'),'signed-out callers cannot list sessions');
SELECT set_config('request.jwt.claims','',false);
