CREATE OR REPLACE FUNCTION public.delete_innerglow_account(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE item RECORD;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User required'; END IF;
  -- App recordings are local. Do not remove Storage metadata while leaving files behind.
  IF EXISTS(SELECT 1 FROM storage.objects o WHERE to_jsonb(o)->>'owner' = p_user_id::text OR to_jsonb(o)->>'owner_id' = p_user_id::text) THEN
    RAISE EXCEPTION 'Storage files must be removed through the Storage API before account deletion';
  END IF;
  -- Remove other users' reactions/comments on the deleted user's content too.
  DELETE FROM public.community_notifications WHERE recipient_id=p_user_id OR actor_id=p_user_id
    OR post_id IN (SELECT id FROM public.community_posts WHERE user_id=p_user_id);
  DELETE FROM public.community_likes WHERE user_id=p_user_id
    OR post_id IN (SELECT id FROM public.community_posts WHERE user_id=p_user_id)
    OR comment_id IN (SELECT id FROM public.community_comments WHERE user_id=p_user_id OR post_id IN (SELECT id FROM public.community_posts WHERE user_id=p_user_id));
  DELETE FROM public.community_bookmarks WHERE user_id=p_user_id OR post_id IN (SELECT id FROM public.community_posts WHERE user_id=p_user_id);
  DELETE FROM public.community_comments WHERE user_id=p_user_id OR post_id IN (SELECT id FROM public.community_posts WHERE user_id=p_user_id);
  DELETE FROM public.community_followers WHERE follower_id=p_user_id OR following_id=p_user_id;
  DELETE FROM public.community_reports WHERE reporter_id=p_user_id OR reported_user_id=p_user_id
    OR (target_type='post' AND target_id IN (SELECT id FROM public.community_posts WHERE user_id=p_user_id));
  DELETE FROM public.community_blocks WHERE blocker_id=p_user_id OR blocked_id=p_user_id;
  -- Include all current and future app tables keyed by user_id; shared templates remain.
  FOR item IN SELECT c.table_name FROM information_schema.columns c JOIN information_schema.tables t
    ON t.table_schema=c.table_schema AND t.table_name=c.table_name
    WHERE c.table_schema='public' AND c.column_name='user_id' AND t.table_type='BASE TABLE'
    ORDER BY CASE c.table_name WHEN 'community_posts' THEN 0 WHEN 'profiles' THEN 2 ELSE 1 END, c.table_name
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE user_id::text = $1', item.table_name) USING p_user_id::text;
  END LOOP;
  DELETE FROM auth.users WHERE id=p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_innerglow_account(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_innerglow_account(UUID) TO service_role;
