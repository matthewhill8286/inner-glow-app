import React, { useState } from 'react';
import { Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription, applyPurchaseInfo } from '@/hooks/useSubscription';
import configureRevenueCat, { restorePurchases } from '@/lib/revenuecat';
import { supabase } from '@/supabase/supabase';
import { openSubscriptionManagement } from '@/lib/billing-management';
import { recordDiagnostic } from '@/lib/diagnostics';
import { AppCard } from './ui/AppCard';
import { AppButton } from './ui/AppButton';
export function PremiumAccessCard() {
  const { subscription, hasFullAccess, isLoading, error, refresh, isLifetime, isCanceling } =
    useSubscription();
  const isRenewing = subscription?.type === 'yearly' || subscription?.type === 'monthly';
  const colors = Colors[useColorScheme() ?? 'light'];
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null);
  async function restore() {
    setBusy(true);
    setMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw Error('Please sign in first.');
      await configureRevenueCat(session.user.id);
      const info = await restorePurchases();
      if (info) {
        if (!(await applyPurchaseInfo(info, session.user.id))) throw Error('Account changed');
        setMessage(
          info.entitlements.active.premium
            ? 'Purchases restored.'
            : 'No active Apple purchases were found.',
        );
      }
      await refresh();
    } catch {
      const ref = recordDiagnostic('billing_restore', 'BILLING_UNAVAILABLE');
      setMessage(`Unable to restore purchases. Please try again. Reference: ${ref}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppCard>
      <Text accessibilityRole="header" style={[Typography.cardHeading, { color: colors.text }]}>
        {isLoading && !subscription
          ? 'Checking your access…'
          : hasFullAccess
            ? isLifetime
              ? 'Lifetime Premium'
              : subscription?.type === 'trial'
                ? 'Your free trial'
                : subscription?.type === 'yearly'
                  ? 'Yearly Premium'
                  : 'Monthly Premium'
            : 'Inner Glow Premium'}
      </Text>
      <Text style={[Typography.body, { color: colors.mutedText }]}>
        {isLoading && !subscription
          ? 'Checking your purchase and account access…'
          : hasFullAccess
            ? isLifetime
              ? 'All premium features are available.'
              : `${isCanceling ? 'Access until' : subscription?.type === 'trial' ? 'Trial ends' : 'Renews'} ${subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'after Apple verification'}`
            : 'Explore the plans or restore an existing purchase.'}
      </Text>
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={[Typography.caption, { color: colors.mutedText }]}
        >
          {error}
        </Text>
      )}
      {!isLifetime && (
        <AppButton
          title={hasFullAccess && isRenewing ? 'Manage Subscription' : 'View Premium plans'}
          disabled={isLoading}
          onPress={() => {
            if (hasFullAccess && isRenewing) {
              void openSubscriptionManagement().catch(() =>
                setMessage('Unable to open subscription settings. Please try again.'),
              );
            } else router.push('/(utils)/trial-upgrade');
          }}
        />
      )}
      {hasFullAccess && isRenewing && (
        <AppButton
          title={subscription?.type === 'monthly' ? 'Change to yearly' : 'Change to monthly'}
          variant="secondary"
          disabled={isLoading}
          onPress={() => {
            // Upgrades happen in the app; Apple and Stripe apply a downgrade at the end of the paid year.
            if (subscription?.type === 'monthly')
              router.push({ pathname: '/(utils)/trial-upgrade', params: { plan: 'yearly' } });
            else
              void openSubscriptionManagement().catch(() =>
                setMessage('Unable to open subscription settings. Please try again.'),
              );
          }}
        />
      )}
      {Platform.OS === 'ios' && (
        <AppButton
          title="Restore Purchases"
          variant="secondary"
          busy={busy}
          disabled={isLoading}
          onPress={restore}
        />
      )}
      <AppButton
        title="Refresh access"
        variant="secondary"
        busy={isLoading}
        disabled={busy}
        onPress={() => {
          void refresh();
        }}
      />
      {message && (
        <Text
          accessibilityLiveRegion="polite"
          style={[Typography.caption, { color: colors.mutedText }]}
        >
          {message}
        </Text>
      )}
    </AppCard>
  );
}
