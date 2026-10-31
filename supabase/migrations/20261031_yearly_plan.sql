-- The paywall now sells Yearly (7-day free intro offer) and Monthly.
-- Lifetime stays valid for people who bought it before.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('trial', 'yearly', 'monthly', 'lifetime'));
