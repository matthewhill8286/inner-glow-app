CREATE TABLE public.community_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id), CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own blocks" ON public.community_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "Create own blocks" ON public.community_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Remove own blocks" ON public.community_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE TABLE public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('harassment','harmful','spam','other')),
  content_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX community_reports_pending ON public.community_reports(status, created_at);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own reports" ON public.community_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE OR REPLACE FUNCTION public.community_user_is_blocked(target UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = target) OR (blocked_id = auth.uid() AND blocker_id = target));
$$;
REVOKE ALL ON FUNCTION public.community_user_is_blocked(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_user_is_blocked(UUID) TO authenticated;

CREATE POLICY "Visible unblocked posts" ON public.community_posts AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((NOT is_hidden OR user_id = auth.uid()) AND NOT public.community_user_is_blocked(user_id)
    AND NOT EXISTS(SELECT 1 FROM public.community_reports WHERE reporter_id=auth.uid() AND target_type='post' AND target_id=community_posts.id));
CREATE POLICY "Visible unblocked comments" ON public.community_comments AS RESTRICTIVE FOR SELECT TO authenticated
  USING (NOT public.community_user_is_blocked(user_id)
    AND EXISTS(SELECT 1 FROM public.community_posts WHERE id=community_comments.post_id)
    AND NOT EXISTS(SELECT 1 FROM public.community_reports WHERE reporter_id=auth.uid() AND target_type='comment' AND target_id=community_comments.id));
CREATE POLICY "Visible unblocked profiles" ON public.community_profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (NOT public.community_user_is_blocked(user_id));
-- Inserts and edits must pass server-side screening. Service role bypasses RLS.
CREATE POLICY "Screen new posts" ON public.community_posts AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY "Screen post edits" ON public.community_posts AS RESTRICTIVE FOR UPDATE TO authenticated USING(false);
CREATE POLICY "Screen new comments" ON public.community_comments AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY "Screen comment edits" ON public.community_comments AS RESTRICTIVE FOR UPDATE TO authenticated USING(false);
CREATE POLICY "Screen profile edits" ON public.community_profiles AS RESTRICTIVE FOR UPDATE TO authenticated USING(false);

CREATE OR REPLACE FUNCTION public.report_community_content(p_target_type TEXT, p_target_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE author_id UUID; body TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_target_type = 'post' THEN
    SELECT user_id,content INTO author_id,body FROM public.community_posts WHERE id=p_target_id AND NOT is_hidden;
  ELSIF p_target_type = 'comment' THEN
    SELECT c.user_id,c.content INTO author_id,body FROM public.community_comments c JOIN public.community_posts p ON p.id=c.post_id WHERE c.id=p_target_id AND NOT p.is_hidden;
  ELSE RAISE EXCEPTION 'Invalid report target'; END IF;
  IF author_id IS NULL OR author_id=auth.uid() OR public.community_user_is_blocked(author_id) THEN RAISE EXCEPTION 'Content unavailable'; END IF;
  INSERT INTO public.community_reports(reporter_id,reported_user_id,target_type,target_id,reason,content_snapshot)
    VALUES(auth.uid(),author_id,p_target_type,p_target_id,p_reason,body) ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.report_community_content(TEXT, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_community_content(TEXT, UUID, TEXT) TO authenticated;

-- Recovery codes must be managed only by backend functions.
DROP POLICY IF EXISTS "Service role can manage recovery codes" ON public.recovery_codes;
CREATE POLICY "Service role can manage recovery codes" ON public.recovery_codes FOR ALL TO service_role USING(true) WITH CHECK(true);

GRANT SELECT, INSERT, DELETE ON public.community_blocks TO authenticated;
GRANT SELECT ON public.community_reports TO authenticated;
GRANT ALL ON public.community_blocks, public.community_reports TO service_role;
REVOKE ALL ON public.community_posts, public.community_comments, public.community_profiles,
  public.community_likes, public.community_bookmarks, public.community_followers, public.community_notifications FROM anon;
CREATE POLICY "Screen new community profiles" ON public.community_profiles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY "Hide blocked notifications" ON public.community_notifications AS RESTRICTIVE FOR SELECT TO authenticated
  USING (actor_id IS NULL OR NOT public.community_user_is_blocked(actor_id));
CREATE POLICY "Prevent following blocked users" ON public.community_followers AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK(NOT public.community_user_is_blocked(following_id));
CREATE POLICY "React only to visible content" ON public.community_likes AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK((post_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.community_posts WHERE id=community_likes.post_id))
    OR (comment_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.community_comments WHERE id=community_likes.comment_id)));
CREATE POLICY "Bookmark only visible posts" ON public.community_bookmarks AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK(EXISTS(SELECT 1 FROM public.community_posts WHERE id=community_bookmarks.post_id));
