-- Settings · Active sessions (08 §2.8). Supabase does not list sessions to clients, so these two
-- functions read auth.sessions for the caller only. The caller's own session comes from the JWT's
-- session_id claim. Revoking a session deletes it, which also removes its refresh tokens; that
-- device's current access token lasts until it expires (an hour at most).
CREATE OR REPLACE FUNCTION public.list_my_sessions()
RETURNS TABLE (id UUID, user_agent TEXT, created_at TIMESTAMPTZ, last_active TIMESTAMPTZ, is_current BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.user_agent, s.created_at,
    GREATEST(s.created_at, s.updated_at, s.refreshed_at AT TIME ZONE 'UTC') AS last_active,
    s.id::text = COALESCE(auth.jwt() ->> 'session_id', '') AS is_current
  FROM auth.sessions s
  WHERE s.user_id = auth.uid() AND (s.not_after IS NULL OR s.not_after > now())
  ORDER BY 5 DESC, 4 DESC;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_my_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_session_id::text = COALESCE(auth.jwt() ->> 'session_id', '') THEN
    RAISE EXCEPTION 'Use log out to end this device''s session' USING ERRCODE = '22023';
  END IF;
  DELETE FROM auth.sessions WHERE id = p_session_id AND user_id = auth.uid();
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.list_my_sessions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_my_session(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_my_session(UUID) TO authenticated;
