CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK(length(email)<=254),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 20 AND 5000),
  source_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX support_requests_source_recent ON public.support_requests(source_hash,created_at);
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_requests FROM anon,authenticated;
GRANT ALL ON public.support_requests TO service_role;
CREATE OR REPLACE FUNCTION public.submit_support_request(p_email TEXT,p_message TEXT,p_source_hash TEXT,p_user_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_source_hash, 1));
  IF (SELECT count(*) FROM public.support_requests WHERE source_hash=p_source_hash AND created_at>now()-interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Too many support requests. Please retry later.';
  END IF;
  INSERT INTO public.support_requests(email,message,source_hash,user_id) VALUES(p_email,p_message,p_source_hash,p_user_id) RETURNING id INTO request_id;
  RETURN request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_support_request(TEXT,TEXT,TEXT,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_support_request(TEXT,TEXT,TEXT,UUID) TO service_role;
