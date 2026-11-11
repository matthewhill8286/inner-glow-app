import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { PurchasesOffering } from 'react-native-purchases';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { LegalLinks } from '@/components/LegalLinks';
import { Paywall } from '@/components/paywall/Paywall';
import { toast } from '@/components/Toast';
import {
  ConfirmingPurchase,
  PurchaseResultSheet,
  type PurchaseResult,
} from '@/components/paywall/PurchaseSheets';
import { applyPurchaseInfo, useSubscription } from '@/hooks/useSubscription';
import { openSubscriptionManagement } from '@/lib/billing-management';
import { functionError } from '@/lib/function-errors';
import { backTo } from '@/lib/navigation';
import {
  paywallCopy,
  paywallVariant,
  periodDays,
  savingPercent,
  type PaywallPlan,
} from '@/lib/paywall';
import { productMatchesPlan } from '@/lib/purchase-products';
import configureRevenueCat, {
  getDefaultOffering,
  hasPremiumEntitlement,
  isYearlyTrialEligible,
  purchasePlan,
  restorePurchases,
  PLAN_TO_PACKAGE,
  hasNativeStore,
} from '@/lib/revenuecat';
import { alreadyOwnsPlan } from '@/lib/subscription-state';
import { supabase } from '@/supabase/supabase';

// Web and Android sell through Stripe at these prices; iOS shows the App Store's own prices.
const STRIPE_PRICES = { yearly: '€59.99', yearlyPerMonth: '€4.99', monthly: '€9.99', saving: 50 };
const DEFAULT_TRIAL_DAYS = 7;

/**
 * Paywall (01 §2.7, 08 §2.4–2.5). The free week is the App Store intro offer on the yearly plan,
 * so Apple decides who can still take it; Stripe gives it to accounts that never paid. `variant`
 * picks the title, subtitle and CTA: Home, a locked practice, or "Your plan is ready" after the
 * assessment, which continues to profile setup when closed or after buying.
 */
export default function TrialUpgrade() {
  const { t } = useTranslation();
  const { plan: planParam, variant: variantParam } = useLocalSearchParams<{
    plan?: string;
    variant?: string;
  }>();
  const variant = paywallVariant(variantParam);
  const {
    refresh: refreshSubscription,
    subscription,
    hasFullAccess,
    isLoading: accessLoading,
  } = useSubscription();
  const [selected, setSelected] = useState<PaywallPlan>(
    planParam === 'monthly' ? 'monthly' : 'yearly',
  );
  const [loading, setLoading] = useState<PaywallPlan | 'restore' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [failedPlan, setFailedPlan] = useState<PaywallPlan | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringLoading, setOfferingLoading] = useState(hasNativeStore());
  const [appleTrialEligible, setAppleTrialEligible] = useState(false);
  // Apple guideline 3.1.1 and Google Play's payments policy: buy through the store when it is set up.
  const useNativeIAP = hasNativeStore();

  const trialEligible = useNativeIAP
    ? appleTrialEligible
    : !subscription || subscription.type === 'trial';
  // Yearly and monthly sit in one subscription; choosing the other plan is a change, not a second purchase.
  const currentRenewingPlan =
    hasFullAccess && (subscription?.type === 'yearly' || subscription?.type === 'monthly')
      ? subscription.type
      : null;

  useEffect(() => {
    if (useNativeIAP) void loadOffering();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Someone who already has Pro skips "Your plan is ready" and goes on with setup.
  useEffect(() => {
    if (variant === 'plan' && hasFullAccess) router.replace('/(onboarding)/profile-setup');
  }, [variant, hasFullAccess]);

  async function loadOffering() {
    setOfferingLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await configureRevenueCat(session?.user?.id);
      setOffering(await getDefaultOffering());
      setAppleTrialEligible(await isYearlyTrialEligible());
    } catch {
      setOffering(null);
    } finally {
      setOfferingLoading(false);
    }
  }

  const packageFor = (plan: PaywallPlan) =>
    offering?.availablePackages.find(
      (pkg) => pkg.identifier === PLAN_TO_PACKAGE[plan] && productMatchesPlan(plan, pkg.product),
    );
  const yearlyProduct = packageFor('yearly')?.product;
  const monthlyProduct = packageFor('monthly')?.product;
  const unavailable = t('paywall.unavailablePrice');
  const prices = useNativeIAP
    ? {
        yearly: yearlyProduct?.priceString ?? unavailable,
        yearlyPerMonth: yearlyProduct?.pricePerMonthString ?? unavailable,
        monthly: monthlyProduct?.priceString ?? unavailable,
        saving: savingPercent(yearlyProduct?.price, monthlyProduct?.price),
      }
    : STRIPE_PRICES;
  const days = periodDays(yearlyProduct?.introPrice?.period) ?? DEFAULT_TRIAL_DAYS;

  const copy = paywallCopy({
    variant,
    eligible: trialEligible,
    plan: selected,
    days,
    yearly: prices.yearly,
    monthly: prices.monthly,
  });
  const owns = alreadyOwnsPlan(subscription, selected);
  const ctaLabel = owns
    ? subscription?.type === 'lifetime'
      ? t('paywall.lifetimeActive')
      : t('paywall.manage')
    : offeringLoading
      ? t('paywall.loading')
      : currentRenewingPlan
        ? t(selected === 'yearly' ? 'paywall.switchToYearly' : 'paywall.switchToMonthly')
        : t(copy.cta.key, copy.cta.params);

  function leave() {
    if (variant === 'plan') router.replace('/(onboarding)/profile-setup');
    else backTo(undefined, '/(tabs)/home');
  }

  async function openManagement() {
    try {
      await openSubscriptionManagement();
    } catch {
      toast.error(t('paywall.manageError'));
    }
  }

  /* iOS buys through Apple (RevenueCat); Android and web use Stripe Checkout. */
  async function buy(plan: PaywallPlan) {
    if (accessLoading) return;
    if (owns) {
      if (subscription?.type === 'lifetime') toast.info(t('paywall.lifetimeActive'));
      else await openManagement();
      return;
    }
    // Stripe can't hold two subscriptions here, so a plan change goes through the billing portal.
    // On iOS, buying the other plan in the same group is Apple's own upgrade or crossgrade.
    if (!useNativeIAP && currentRenewingPlan && currentRenewingPlan !== plan) {
      await openManagement();
      return;
    }
    setLoading(plan);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error(t('paywall.signInFirst'));

      if (useNativeIAP) {
        await configureRevenueCat(session.user.id);
        setConfirming(true);
        let info;
        try {
          info = await purchasePlan(plan);
        } catch {
          setConfirming(false);
          setFailedPlan(plan);
          setResult('failed');
          return;
        }
        setConfirming(false);
        if (!info) return; // The user closed the Apple sheet.
        if (!hasPremiumEntitlement(info)) {
          toast.error(t('paywall.notUnlocked'));
          return;
        }
        if (!(await applyPurchaseInfo(info, session.user.id)))
          throw new Error(t('paywall.accountChanged'));
        await refreshSubscription();
        if (variant === 'plan') router.replace('/(onboarding)/profile-setup');
        else router.push('/(utils)/payment-success');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan,
          userId: session.user.id,
          successUrl: Linking.createURL('/payment-success'),
          cancelUrl: Linking.createURL('/payment-failure'),
        },
      });
      if (error) throw await functionError(error);
      if (!data?.url) throw new Error(t('paywall.checkoutError'));
      await WebBrowser.openBrowserAsync(data.url);
    } catch (err) {
      toast.error((err as Error)?.message || t('paywall.checkoutError'));
    } finally {
      setConfirming(false);
      setLoading(null);
    }
  }

  /* Restore purchases (required by Apple guideline 3.1.1). */
  async function restore() {
    if (!useNativeIAP || loading) return;
    setLoading('restore');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error(t('paywall.signInFirst'));
      await configureRevenueCat(session.user.id);
      const info = await restorePurchases();
      if (!info || !hasPremiumEntitlement(info)) {
        setResult('nothingFound');
        return;
      }
      if (!(await applyPurchaseInfo(info, session.user.id)))
        throw new Error(t('paywall.accountChanged'));
      await refreshSubscription();
      setResult('restored');
    } catch (err) {
      toast.error((err as Error)?.message || t('paywall.restoreError'));
    } finally {
      setLoading(null);
    }
  }

  const missing = useNativeIAP && !offeringLoading && !packageFor(selected);

  return (
    <>
      <Paywall
        title={t(copy.title.key, copy.title.params)}
        subtitle={t(copy.subtitle.key, copy.subtitle.params)}
        features={[
          t('paywall.features.chats'),
          t('paywall.features.practices'),
          t('paywall.features.insights'),
        ]}
        plans={{
          yearly: {
            name: t('paywall.yearly'),
            sub: t(copy.yearlySub.key, copy.yearlySub.params),
            price: t('paywall.perMonth', { price: prices.yearlyPerMonth }),
            badge: prices.saving ? t('paywall.save', { percent: prices.saving }) : null,
          },
          monthly: {
            name: t('paywall.monthly'),
            sub: t(copy.monthlySub.key, copy.monthlySub.params),
            price: t('paywall.perMonth', { price: prices.monthly }),
          },
        }}
        selected={selected}
        onSelect={setSelected}
        cta={{
          label: ctaLabel,
          onPress: () => void buy(selected),
          busy: loading === selected || offeringLoading || accessLoading,
          disabled:
            !!loading ||
            accessLoading ||
            (owns && subscription?.type === 'lifetime') ||
            (!owns && missing),
        }}
        finePrint={t('paywall.finePrint')}
        restoreLabel={useNativeIAP ? t('paywall.restore') : undefined}
        onRestore={useNativeIAP ? () => void restore() : undefined}
        onClose={leave}
        closeLabel={t('common.close')}
        notice={
          missing ? (
            <Text
              style={[
                Type.captionM,
                { color: palette.textMuted, textAlign: 'center', marginBottom: 12 },
              ]}
            >
              {t('paywall.unavailable')}{' '}
              <Text
                accessibilityRole="button"
                onPress={() => void loadOffering()}
                style={{ color: palette.plum, fontWeight: '600' }}
              >
                {t('paywall.retry')}
              </Text>
            </Text>
          ) : null
        }
        footer={
          <View>
            <LegalLinks color={palette.textSubtle} />
          </View>
        }
      />
      <ConfirmingPurchase visible={confirming} />
      <PurchaseResultSheet
        result={result}
        onClose={() => setResult(null)}
        onPrimary={() => {
          const shown = result;
          setResult(null);
          if (shown === 'failed' && failedPlan) void buy(failedPlan);
          if (shown === 'restored') {
            if (variant === 'plan') router.replace('/(onboarding)/profile-setup');
            else router.replace('/(utils)/payment-success');
          }
        }}
        onSecondary={() => {
          const shown = result;
          setResult(null);
          if (shown === 'nothingFound')
            router.push({ pathname: '/(utils)/support-message', params: { kind: 'message' } });
        }}
      />
    </>
  );
}
