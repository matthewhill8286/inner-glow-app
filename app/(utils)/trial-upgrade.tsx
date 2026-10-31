import { alreadyOwnsPlan } from '@/lib/subscription-state';
import { openSubscriptionManagement } from '@/lib/billing-management';
import { AppButton } from '@/components/ui/AppButton';
import { PremiumAccessCard } from '@/components/PremiumAccessCard';
import { applyPurchaseInfo } from '@/hooks/useSubscription';
import { Typography } from '@/constants/typography';
import { functionError } from '@/lib/function-errors';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import {
  productMatchesPlan,
  PURCHASABLE_PLANS,
  type PurchasablePlan,
} from '@/lib/purchase-products';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from '@/components/Toast';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { userScopedKey } from '@/lib/storage';
import { supabase } from '@/supabase/supabase';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import configureRevenueCat, {
  getDefaultOffering,
  hasPremiumEntitlement,
  isYearlyTrialEligible,
  purchasePlan,
  restorePurchases,
  PLAN_TO_PACKAGE,
} from '@/lib/revenuecat';
import type { PurchasesOffering } from 'react-native-purchases';
import { useSubscription } from '@/hooks/useSubscription';
import { LegalLinks } from '@/components/LegalLinks';

/* ── Plan definitions (paywall `6600:2039`) ─────────── */
// Web and Android prices; iOS shows the localized App Store price instead.
const PLANS = {
  yearly: { price: '€59.99', period: '/year', badge: '7 days free' },
  monthly: { price: '€9.99', period: '/mo', badge: null },
} as const;
const TRIAL_DAYS = 7;

/* ── Features list ─────────────────────────────────── */
const FEATURES = [
  { emoji: '💬', text: 'AI conversations with all four guides' },
  { emoji: '📊', text: 'AI analysis of your mood and sleep patterns' },
  { emoji: '🎯', text: 'Personalised activity suggestions' },
  { emoji: '🎙️', text: 'Voice transcription for journal entries' },
];

export default function TrialUpgrade() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const {
    refresh: refreshSubscription,
    subscription,
    hasFullAccess,
    isLoading: accessLoading,
  } = useSubscription();

  const [isNewUser, setIsNewUser] = useState(true);
  const [loading, setLoading] = useState<string | null>(null); // null | 'yearly' | 'monthly' | 'restore'
  const [selectedPlan, setSelectedPlan] = useState<PurchasablePlan>('yearly');
  // Stripe adds the trial server-side for accounts that never paid; Apple decides on iOS.
  const [trialEligible, setTrialEligible] = useState(Platform.OS !== 'ios');

  // RevenueCat: localized prices fetched from the App Store / Play Store
  const [iapOffering, setIapOffering] = useState<PurchasesOffering | null>(null);
  const [offeringLoading, setOfferingLoading] = useState(Platform.OS === 'ios');
  const useNativeIAP = Platform.OS === 'ios'; // Apple guideline 3.1.1

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const assessment = await AsyncStorage.getItem(
        userScopedKey('assessment:v1', session?.user?.id),
      );
      if (assessment) setIsNewUser(false);

      if (Platform.OS === 'ios') await loadOffering();
    })().catch(() => setOfferingLoading(false));
  }, []);

  async function loadOffering() {
    setOfferingLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await configureRevenueCat(session?.user?.id);
      setIapOffering(await getDefaultOffering());
      setTrialEligible(await isYearlyTrialEligible());
    } catch {
      setIapOffering(null);
    } finally {
      setOfferingLoading(false);
    }
  }

  function packageFor(plan: PurchasablePlan) {
    return iapOffering?.availablePackages.find(
      (pkg) => pkg.identifier === PLAN_TO_PACKAGE[plan] && productMatchesPlan(plan, pkg.product),
    );
  }

  function priceFor(plan: PurchasablePlan): string {
    return useNativeIAP
      ? (packageFor(plan)?.product.priceString ?? 'Unavailable')
      : PLANS[plan].price;
  }

  /* ── Buy a plan ─────────────────────────────────────
   * iOS  → RevenueCat / Apple In-App Purchase (Guideline 3.1.1)
   * Android / Web → Stripe Checkout via Supabase Edge Function
   */
  async function buyPlan(plan: PurchasablePlan) {
    if (accessLoading) return;
    if (alreadyOwnsPlan(subscription, plan)) {
      if (subscription?.type === 'lifetime') toast.info('Lifetime Premium is already active.');
      else {
        try {
          await openSubscriptionManagement();
        } catch {
          toast.error('Unable to open subscription settings. Please try again.');
        }
      }
      return;
    }
    setLoading(plan);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        toast.error('Please sign in first');
        setLoading(null);
        return;
      }

      // ── iOS: Apple In-App Purchase via RevenueCat ──────────────────────
      if (useNativeIAP) {
        await configureRevenueCat(session.user.id);
        const customerInfo = await purchasePlan(plan);

        // null → user cancelled the Apple sheet, just bail quietly
        if (!customerInfo) {
          setLoading(null);
          return;
        }

        if (hasPremiumEntitlement(customerInfo)) {
          if (!(await applyPurchaseInfo(customerInfo, session.user.id)))
            throw new Error('Your account changed. Please restore purchases after signing in.');
          await refreshSubscription();
          router.push('/(utils)/payment-success');
        } else {
          toast.error('Purchase did not unlock premium. Please try Restore.');
        }

        setLoading(null);
        return;
      }

      // ── Android / Web: Stripe Checkout (existing flow) ─────────────────
      const successUrl = Linking.createURL('/payment-success');
      const cancelUrl = Linking.createURL('/payment-failure');

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan,
          userId: session.user.id,
          successUrl,
          cancelUrl,
        },
      });

      if (error) throw await functionError(error);
      if (!data?.url) throw new Error('No checkout URL returned');

      setLoading(null);
      await WebBrowser.openBrowserAsync(data.url);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err?.message || 'Payment failed. Please try again.');
      setLoading(null);
    }
  }

  /* ── Restore Purchases (REQUIRED by Apple Guideline 3.1.1) ── */
  async function handleRestore() {
    if (!useNativeIAP) return;
    setLoading('restore');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Please sign in first');
      await configureRevenueCat(session.user.id);
      const info = await restorePurchases();
      if (info && hasPremiumEntitlement(info)) {
        if (!(await applyPurchaseInfo(info, session.user.id)))
          throw new Error('Your account changed. Please restore purchases after signing in.');
        await refreshSubscription();
        toast.success('Purchases restored');
        router.replace('/(utils)/payment-success');
      } else {
        toast.error('No previous purchases found for this Apple ID.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Restore failed');
    } finally {
      setLoading(null);
    }
  }

  function termsFor(plan: PurchasablePlan): string {
    const name = plan === 'yearly' ? 'Yearly Premium' : 'Monthly Premium';
    const period = plan === 'yearly' ? 'year' : 'month';
    const start =
      plan === 'yearly' && trialEligible
        ? `${name}: ${TRIAL_DAYS} days free, then ${priceFor(plan)} per ${period}. You are charged when the trial ends unless you cancel at least 24 hours before.`
        : `${name}: ${priceFor(plan)} per ${period}. Payment is charged at confirmation.`;
    return useNativeIAP
      ? `${start} Renews automatically unless canceled at least 24 hours before the current period ends. Manage or cancel in Apple Settings.`
      : `${start} Billed through Stripe. Renews until canceled.`;
  }

  const isLoading = loading !== null;
  const alreadyOwnsSelectedPlan = alreadyOwnsPlan(subscription, selectedPlan);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}
    >
      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color="#8B6B47" />
            <Text style={styles.overlayText}>
              {loading === 'restore'
                ? 'Restoring purchases…'
                : useNativeIAP
                  ? 'Connecting to Apple…'
                  : 'Opening checkout…'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        {(!isNewUser || Platform.OS === 'web') && (
          <Pressable
            onPress={() => backTo(undefined, '/(tabs)/profile')}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons
              name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
              size={18}
              color={colors.text}
            />
          </Pressable>
        )}

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: '#8B6B47' + '15' }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 18 }}>
              ✨
            </WellnessIconText>
            <Text style={[styles.heroBadgeText, { color: '#8B6B47' }]}>Premium</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{t('auth.premiumTitle')}</Text>
          <Text style={[styles.heroSub, { color: colors.mutedText }]}>
            {t('auth.premiumSubtitle')}
          </Text>
        </View>

        {/* ── Features ── */}
        <View
          style={[
            styles.featuresCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={[
                styles.featureRow,
                i < FEATURES.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 18 }}>
                {f.emoji}
              </WellnessIconText>
              <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
              <MaterialIcons name="check-circle" size={18} color="#5AAF8B" />
            </View>
          ))}
        </View>

        <Text style={[styles.terms, { color: colors.mutedText }]}>
          Mood and sleep tracking, text journaling, breathing, grounding, alarms and reminders stay
          free.
        </Text>

        {/* ── Plan selector ── */}
        <View style={styles.planSelector}>
          {PURCHASABLE_PLANS.map((plan) => (
            <Pressable
              key={plan}
              onPress={() => setSelectedPlan(plan)}
              style={[
                styles.planTab,
                {
                  backgroundColor: selectedPlan === plan ? '#8B6B47' : colors.card,
                  borderColor: selectedPlan === plan ? '#8B6B47' : colors.border,
                },
              ]}
            >
              {PLANS[plan].badge && trialEligible && selectedPlan === plan && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{PLANS[plan].badge}</Text>
                </View>
              )}
              <Text
                style={[
                  styles.planTabTitle,
                  { color: selectedPlan === plan ? '#FFF' : colors.text },
                ]}
              >
                {plan === 'yearly' ? t('auth.yearlyPlan') : t('auth.monthlyPlan')}
              </Text>
              <Text
                style={[
                  styles.planTabPrice,
                  { color: selectedPlan === plan ? '#FFF' : colors.mutedText },
                ]}
              >
                {priceFor(plan)}
                <Text
                  style={{
                    fontFamily: Typography.family.body,
                    fontSize: 13,
                    fontWeight: Typography.weight.medium,
                    color: selectedPlan === plan ? '#FFFFFF' : colors.mutedText,
                  }}
                >
                  {' '}
                  {PLANS[plan].period}
                </Text>
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Buy button ── */}
        <AppButton
          title={
            alreadyOwnsSelectedPlan
              ? subscription?.type === 'lifetime'
                ? 'Lifetime Premium active'
                : 'Manage Subscription'
              : offeringLoading
                ? 'Loading prices…'
                : selectedPlan === 'yearly' && trialEligible
                  ? 'Start my free week'
                  : useNativeIAP
                    ? 'Subscribe with Apple'
                    : t('auth.payWithCard')
          }
          busy={isLoading || offeringLoading || accessLoading}
          disabled={
            accessLoading ||
            (alreadyOwnsSelectedPlan && subscription?.type === 'lifetime') ||
            (!alreadyOwnsSelectedPlan && useNativeIAP && !packageFor(selectedPlan))
          }
          onPress={() => buyPlan(selectedPlan)}
          style={{ marginTop: 16 }}
        />

        {hasFullAccess && <PremiumAccessCard />}
        {/* ── Restore Purchases (required by Apple Guideline 3.1.1) ── */}
        {useNativeIAP && (
          <Pressable
            onPress={handleRestore}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.restoreBtn,
              { opacity: isLoading ? 0.5 : pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.restoreBtnText, { color: colors.mutedText }]}>
              {loading === 'restore' ? 'Restoring…' : 'Restore Purchases'}
            </Text>
          </Pressable>
        )}

        {/* ── Secure payment badge ── */}
        <View style={styles.secureRow}>
          <MaterialIcons name="lock" size={14} color={colors.mutedText} />
          <Text style={[styles.secureText, { color: colors.mutedText }]}>
            {useNativeIAP
              ? 'Billed through your Apple Account. Cancel in Settings.'
              : 'Secured by Stripe. Cancel anytime.'}
          </Text>
        </View>

        {useNativeIAP && !offeringLoading && !packageFor(selectedPlan) && (
          <View>
            <Text style={[styles.terms, { color: colors.mutedText }]}>
              Purchases are temporarily unavailable. Please retry.
            </Text>
            <Pressable onPress={loadOffering} style={styles.restoreBtn}>
              <Text style={{ color: colors.text }}>Retry loading prices</Text>
            </Pressable>
          </View>
        )}
        <Text style={[styles.terms, { color: colors.mutedText }]}>{termsFor(selectedPlan)}</Text>
        {useNativeIAP && (
          <Pressable
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
            style={styles.restoreBtn}
          >
            <Text style={{ color: colors.text }}>Manage Apple subscriptions</Text>
          </Pressable>
        )}
        <LegalLinks color={colors.mutedText} />
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60 },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    ...UI.shadow.md,
  },
  overlayText: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
    color: '#8B6B47',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },

  /* Hero */
  heroSection: { alignItems: 'center', marginBottom: 24 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.medium,
  },
  heroTitle: { ...Typography.heading, fontSize: 32, textAlign: 'center' },
  heroSub: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  /* Features */
  featuresCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    ...UI.shadow.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  featureText: {
    fontFamily: Typography.family.body,
    flex: 1,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },

  /* Plan selector */
  planSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planTab: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  planBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  planBadgeText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 10,
    fontWeight: Typography.weight.medium,
  },
  planTabTitle: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    fontWeight: Typography.weight.medium,
  },
  planTabPrice: {
    fontFamily: Typography.family.body,
    fontSize: 22,
    fontWeight: Typography.weight.bold,
    marginTop: 2,
  },

  /* Buy button */
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    ...UI.shadow.sm,
  },
  buyBtnText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 17,
    fontWeight: Typography.weight.semibold,
  },

  /* Restore button */
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  restoreBtnText: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    textDecorationLine: 'underline',
  },

  /* Secure row */
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  secureText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },

  /* Terms */
  terms: {
    fontFamily: Typography.family.body,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
