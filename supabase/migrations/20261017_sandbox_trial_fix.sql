CREATE OR REPLACE FUNCTION public.sync_revenuecat_subscription(p_user_id UUID, p_state JSONB, p_synced_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE previous public.subscriptions;
BEGIN
  -- Serialize snapshots for this user, including first-time purchases.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  SELECT * INTO previous FROM public.subscriptions WHERE user_id = p_user_id FOR UPDATE;
  IF previous.revenuecat_synced_at > p_synced_at THEN RETURN; END IF;
  IF p_state IS NULL OR p_state = 'null'::jsonb THEN
    IF previous.provider = 'revenuecat' THEN
      UPDATE public.subscriptions SET status = 'expired', current_period_end = now(),
        revenuecat_synced_at = p_synced_at, updated_at = now() WHERE user_id = p_user_id;
      UPDATE public.profiles SET subscription_type = 'expired', subscription_expiry = now() WHERE user_id = p_user_id;
    END IF;
    RETURN;
  END IF;
  -- Test transactions must never overwrite real paid access.
  IF p_state->>'environment' = 'SANDBOX' AND
     (previous.environment = 'PRODUCTION' OR
      (previous.provider = 'stripe' AND previous.plan <> 'trial' AND previous.status IN ('active', 'canceling'))) THEN RETURN; END IF;
  IF p_state->>'status' = 'expired' AND previous.provider <> 'revenuecat' THEN RETURN; END IF;
  -- Preserve permanent access if a monthly product is still running alongside it.
  IF previous.plan = 'lifetime' AND previous.status = 'active' AND p_state->>'plan' <> 'lifetime' THEN RETURN; END IF;
  INSERT INTO public.subscriptions(user_id, plan, status, provider, revenuecat_app_user_id, store,
      product_id, environment, current_period_end, revenuecat_synced_at)
    VALUES(p_user_id, p_state->>'plan', p_state->>'status', 'revenuecat', p_user_id::text, 'app_store',
      p_state->>'product_id', p_state->>'environment', (p_state->>'current_period_end')::timestamptz, p_synced_at)
    ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, status = excluded.status,
      provider = excluded.provider, revenuecat_app_user_id = excluded.revenuecat_app_user_id,
      store = excluded.store, product_id = excluded.product_id, environment = excluded.environment,
      current_period_end = excluded.current_period_end, revenuecat_synced_at = excluded.revenuecat_synced_at,
      updated_at = now();
  UPDATE public.profiles SET subscription_type = CASE WHEN p_state->>'status' = 'expired' THEN 'expired' ELSE p_state->>'plan' END,
    subscription_expiry = (p_state->>'current_period_end')::timestamptz WHERE user_id = p_user_id;
END;
$$;
