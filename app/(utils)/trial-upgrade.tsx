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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Plan definitions ──────────────────────────────── */
const PLANS = {
  monthly: { price: '€10', period: '/mo', badge: 'Most Popular' },
  lifetime: { price: '€72', period: 'one-time', badge: 'Best Value' },
} as const;

/* ── Features list ─────────────────────────────────── */
const FEATURES = [
  { emoji: '🧠', text: 'AI-powered Freud Score insights' },
  { emoji: '📊', text: 'Detailed mood & sleep analytics' },
  { emoji: '🎯', text: 'Personalized activity suggestions' },
  { emoji: '📝', text: 'Unlimited journal entries' },
  { emoji: '🧘', text: 'Guided stress & mindfulness tools' },
  { emoji: '💬', text: 'Unlimited Dr. Freud AI sessions' },
];

export default function TrialUpgrade() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [isNewUser, setIsNewUser] = useState(true);
  const [loading, setLoading] = useState<string | null>(null); // null | 'trial' | 'monthly' | 'lifetime'
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const assessment = await AsyncStorage.getItem(
        userScopedKey('assessment:v1', session?.user?.id),
      );
      if (assessment) setIsNewUser(false);
    })();
  }, []);

  /* ── Start 7-day trial ────────────────────────────── */
  async function selectTrial() {
    setLoading('trial');
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Save locally
      await AsyncStorage.setItem(
        'auth:subscription:v1',
        JSON.stringify({ type: 'trial', expiryDate: expiryDate.toISOString() }),
      );

      // Record trial in Supabase (non-blocking)
      if (session?.user?.id) {
        Promise.resolve(
          supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: session.user.id,
                plan: 'trial',
                status: 'active',
                trial_end: expiryDate.toISOString(),
                current_period_end: expiryDate.toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            ),
        ).catch((err: any) => console.warn('Failed to record trial:', err));
      }

      router.push('/(utils)/payment-success');
    } catch (e) {
      toast.error('Failed to start trial');
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  /* ── Create Stripe Checkout via Supabase Edge Function ── */
  async function buyPlan(plan: 'monthly' | 'lifetime') {
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

      const successUrl = Linking.createURL('/(utils)/payment-success');
      const cancelUrl = Linking.createURL('/(utils)/payment-failure');

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan,
          userId: session.user.id,
          successUrl,
          cancelUrl,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      // Save intent locally (will be confirmed by webhook)
      const expiryDate = plan === 'monthly'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await AsyncStorage.setItem(
        'auth:subscription:v1',
        JSON.stringify({ type: plan, expiryDate, pending: true }),
      );

      setLoading(null);

      // Open Stripe Checkout in browser
      await WebBrowser.openBrowserAsync(data.url);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 8 },
      ]}
    >
      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color="#8B6B47" />
            <Text style={styles.overlayText}>
              {loading === 'trial' ? 'Starting trial...' : 'Connecting to Stripe...'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        {!isNewUser && (
          <Pressable
            onPress={() => router.back()}
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
            <Text style={{ fontSize: 18 }}>✨</Text>
            <Text style={[styles.heroBadgeText, { color: '#8B6B47' }]}>Premium</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {t('auth.premiumTitle')}
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedText }]}>
            {t('auth.premiumSubtitle')}
          </Text>
        </View>

        {/* ── Features ── */}
        <View
          style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}
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
              <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
              <MaterialIcons name="check-circle" size={18} color="#5AAF8B" />
            </View>
          ))}
        </View>

        {/* ── Free trial card ── */}
        <Pressable
          onPress={selectTrial}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.trialCard,
            {
              backgroundColor: '#5B8A5A',
              opacity: isLoading ? 0.7 : pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={styles.trialContent}>
            <View>
              <Text style={styles.trialTitle}>{t('auth.start7DayTrial')}</Text>
              <Text style={styles.trialSub}>{t('auth.sevenDayTrialDesc')}</Text>
            </View>
            <View style={styles.trialArrow}>
              <MaterialIcons name="arrow-forward" size={20} color="#5B8A5A" />
            </View>
          </View>
        </Pressable>

        {/* ── Plan selector ── */}
        <View style={styles.planSelector}>
          {(['monthly', 'lifetime'] as const).map((plan) => (
            <Pressable
              key={plan}
              onPress={() => setSelectedPlan(plan)}
              style={[
                styles.planTab,
                {
                  backgroundColor:
                    selectedPlan === plan ? '#8B6B47' : colors.card,
                  borderColor: selectedPlan === plan ? '#8B6B47' : colors.border,
                },
              ]}
            >
              {PLANS[plan].badge && selectedPlan === plan && (
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
                {plan === 'monthly' ? t('auth.monthlyPlan') : t('auth.lifetimePlan')}
              </Text>
              <Text
                style={[
                  styles.planTabPrice,
                  { color: selectedPlan === plan ? '#FFF' : colors.mutedText },
                ]}
              >
                {PLANS[plan].price}
                <Text style={{ fontSize: 13, fontWeight: '500' }}> {PLANS[plan].period}</Text>
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Buy button ── */}
        <Pressable
          onPress={() => buyPlan(selectedPlan)}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.buyBtn,
            {
              backgroundColor: '#8B6B47',
              opacity: isLoading ? 0.7 : pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <MaterialIcons name="credit-card" size={20} color="#FFF" />
          <Text style={styles.buyBtnText}>{t('auth.payWithCard')}</Text>
        </Pressable>

        {/* ── Secure payment badge ── */}
        <View style={styles.secureRow}>
          <MaterialIcons name="lock" size={14} color={colors.mutedText} />
          <Text style={[styles.secureText, { color: colors.mutedText }]}>
            Secured by Stripe. Cancel anytime.
          </Text>
        </View>

        {/* ── Terms ── */}
        <Text style={[styles.terms, { color: colors.mutedText }]}>
          {t('auth.termsAndPrivacy')}
        </Text>
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
    fontSize: 15,
    fontWeight: '700',
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
  heroBadgeText: { fontSize: 14, fontWeight: '800' },
  heroTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  heroSub: {
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
  featureText: { flex: 1, fontSize: 14, fontWeight: '600' },

  /* Trial card */
  trialCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...UI.shadow.md,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trialTitle: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  trialSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  trialArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  planBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  planTabTitle: { fontSize: 15, fontWeight: '800' },
  planTabPrice: { fontSize: 22, fontWeight: '900', marginTop: 2 },

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
  buyBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  /* Secure row */
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  secureText: { fontSize: 12, fontWeight: '600' },

  /* Terms */
  terms: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
