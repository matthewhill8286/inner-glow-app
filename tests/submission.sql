-- All rows below are synthetic and exist only in the disposable test container.
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
INSERT INTO profiles(user_id) SELECT id FROM auth.users;
INSERT INTO community_profiles(user_id) SELECT id FROM auth.users;
GRANT ALL ON public.recovery_codes TO authenticated,service_role;
CREATE FUNCTION public.assert_true(value BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN IF value IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAILED: %',label; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
SET ROLE authenticated;
SELECT public.start_free_trial();
SELECT public.assert_true((SELECT plan='trial' AND status='active' AND trial_end>now() FROM subscriptions),'trial activated on server');
DO $$ BEGIN
  UPDATE subscriptions SET plan='lifetime',status='active' WHERE user_id=auth.uid();
  IF FOUND THEN RAISE EXCEPTION 'client changed a paid plan'; END IF;
END $$;
RESET ROLE;
UPDATE subscriptions SET trial_end=now()-interval '1 day',current_period_end=now()-interval '1 day' WHERE user_id='00000000-0000-4000-8000-000000000001';
SET ROLE authenticated;
SELECT public.start_free_trial();
SELECT public.assert_true((SELECT trial_end<now() FROM subscriptions),'trial cannot be restarted');
RESET ROLE;
SELECT sync_revenuecat_subscription('00000000-0000-4000-8000-000000000001',jsonb_build_object('plan','monthly','status','canceling','product_id','innerglow_premium_monthly','environment','PRODUCTION','current_period_end',now()+interval '20 days'),now());
SELECT public.assert_true((SELECT status='canceling' AND current_period_end>now() FROM subscriptions WHERE user_id='00000000-0000-4000-8000-000000000001'),'canceled subscription retains paid period');
SELECT sync_revenuecat_subscription('00000000-0000-4000-8000-000000000001',jsonb_build_object('plan','monthly','status','expired','product_id','innerglow_premium_monthly','environment','PRODUCTION','current_period_end',now()-interval '1 day'),now()-interval '2 days');
SELECT public.assert_true((SELECT status='canceling' FROM subscriptions WHERE user_id='00000000-0000-4000-8000-000000000001'),'old snapshot cannot expire new access');
SELECT sync_revenuecat_subscription('00000000-0000-4000-8000-000000000001',jsonb_build_object('plan','monthly','status','expired','product_id','innerglow_premium_monthly','environment','SANDBOX','current_period_end',now()-interval '1 day'),now()+interval '1 minute');
SELECT public.assert_true((SELECT status='canceling' AND environment='PRODUCTION' FROM subscriptions WHERE user_id='00000000-0000-4000-8000-000000000001'),'sandbox cannot overwrite production access');
SELECT sync_revenuecat_subscription('00000000-0000-4000-8000-000000000001',NULL,now()+interval '1 minute');
SELECT public.assert_true((SELECT status='expired' FROM subscriptions WHERE user_id='00000000-0000-4000-8000-000000000001'),'transfer away revokes entitlement');
SET ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM public.delete_innerglow_account(auth.uid()); RAISE EXCEPTION 'client invoked privileged deletion RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO community_posts(user_id,category,content) VALUES(auth.uid(),'support','unscreened'); RAISE EXCEPTION 'unscreened content accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
INSERT INTO community_posts(id,user_id,category,content) VALUES('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','support','Public story');
INSERT INTO community_comments(id,post_id,user_id,content) VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Comment');
SET ROLE authenticated;
SELECT public.assert_true((SELECT count(*)=1 FROM community_posts),'public story initially visible');
INSERT INTO community_blocks(blocker_id,blocked_id) VALUES(auth.uid(),'00000000-0000-4000-8000-000000000002');
SELECT public.assert_true((SELECT count(*)=0 FROM community_posts),'blocked author hidden in feed and direct query');
SELECT public.assert_true((SELECT count(*)=0 FROM community_comments),'blocked comments hidden');
DELETE FROM community_blocks WHERE blocker_id=auth.uid();
SELECT public.report_community_content('post','10000000-0000-4000-8000-000000000001','harassment');
SELECT public.assert_true((SELECT count(*)=0 FROM community_posts),'reported post hidden from reporter');
SELECT public.assert_true((SELECT count(*)=1 FROM community_reports),'report queued');
RESET ROLE;
INSERT INTO community_comments(post_id,user_id,content) VALUES('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Another user comment');
INSERT INTO ai_suggestions(id,user_id,title,description,category) VALUES('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Suggestion','Description','support');
INSERT INTO activity_logs(user_id,suggestion_id,category,title) VALUES('00000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','support','Completed suggestion');
SELECT public.delete_innerglow_account('00000000-0000-4000-8000-000000000002');
SELECT public.assert_true((SELECT count(*)=0 FROM auth.users WHERE id='00000000-0000-4000-8000-000000000002'),'account deleted');
SELECT public.assert_true((SELECT count(*)=0 FROM community_posts),'deleted user public stories removed');
SELECT public.assert_true((SELECT count(*)=0 FROM community_comments),'other users comments on deleted stories removed');
SELECT public.assert_true((SELECT count(*)=0 FROM activity_logs),'non-cascading activity logs removed');
SELECT public.assert_true((SELECT count(*)=1 FROM auth.users),'other account preserved');

-- Support requests are private and limited per source.
SELECT public.submit_support_request('person@example.test','A synthetic support request for database tests.','test-source',NULL);
SELECT public.assert_true((SELECT count(*)=1 FROM support_requests),'support request saved');
SET ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM count(*) FROM support_requests; RAISE EXCEPTION 'support inbox exposed to users';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
