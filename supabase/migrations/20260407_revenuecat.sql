-- Add RevenueCat (Apple IAP / Google Play Billing) fields to subscriptions.
--
-- Background: Apple App Review Guideline 3.1.1 requires iOS apps to use
-- Apple's In-App Purchase for digital content. We route iOS purchases
-- through RevenueCat (which wraps StoreKit), and keep Stripe for
-- Android + Web. The `provider` column tells us which billing system
-- owns the row, so the existing Stripe webhook and the new
-- RevenueCat webhook can coexist without overwriting each other.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT
    NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe', 'revenuecat', 'trial')),
  ADD COLUMN IF NOT EXISTS revenuecat_app_user_id TEXT,
  ADD COLUMN IF NOT EXISTS revenuecat_original_app_user_id TEXT,
  ADD COLUMN IF NOT EXISTS store TEXT
    CHECK (store IN ('app_store', 'play_store', 'stripe', 'promotional', NULL)),
  ADD COLUMN IF NOT EXISTS product_id TEXT,
  ADD COLUMN IF NOT EXISTS environment TEXT
    CHECK (environment IN ('PRODUCTION', 'SANDBOX', NULL));

-- Lookup index for the RevenueCat webhook (matches by app_user_id = supabase user id).
CREATE INDEX IF NOT EXISTS idx_subscriptions_rc_app_user
  ON subscriptions(revenuecat_app_user_id)
  WHERE revenuecat_app_user_id IS NOT NULL;

COMMENT ON COLUMN subscriptions.provider IS
  'Which billing provider owns this row. iOS purchases use revenuecat, Android/web use stripe.';
