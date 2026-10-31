BEGIN;
-- Post likes already have a counter trigger; comment likes need their own.
CREATE OR REPLACE FUNCTION public.sync_community_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    IF OLD.comment_id IS NOT NULL THEN
      UPDATE public.community_comments
      SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE public.community_comments
      SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_community_comment_like_count() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_community_comment_likes_count ON public.community_likes;
CREATE TRIGGER trg_community_comment_likes_count
AFTER INSERT OR DELETE OR UPDATE OF comment_id ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_community_comment_like_count();
-- Reconcile earlier reactions that were persisted without updating the counter.
UPDATE public.community_comments c
SET likes_count = (SELECT count(*)::integer FROM public.community_likes l WHERE l.comment_id = c.id)
WHERE likes_count IS DISTINCT FROM
  (SELECT count(*)::integer FROM public.community_likes l WHERE l.comment_id = c.id);
COMMIT;
