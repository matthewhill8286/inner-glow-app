import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { LegalNote } from '@/components/ui/controls';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { applyPurchaseInfo, useSubscription } from '@/hooks/useSubscription';
import { useGlowAiUsage } from '@/hooks/useGlowAi';
import { openSubscriptionManagement } from '@/lib/billing-management';
import { recordDiagnostic } from '@/lib/diagnostics';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';
import configureRevenueCat, {
  getDefaultOffering,
  PLAN_TO_PACKAGE,
  restorePurchases,
} from '@/lib/revenuecat';
import { supabase } from '@/supabase/supabase';

const BENEFITS = ['benefit1', 'benefit2', 'benefit3', 'benefit4'] as const;

/** App Store prices on iOS: the yearly plan per month, and each plan's own price. Null elsewhere. */
function useStorePrices() {
  const [prices, setPrices] = useState<{
    yearlyPerMonth?: string;
    yearly?: string;
    monthly?: string;
  }>({});
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let live = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await configureRevenueCat(session?.user?.id);
      const packages = (await getDefaultOffering())?.availablePackages ?? [];
      const yearly = packages.find((p) => p.identifier === PLAN_TO_PACKAGE.yearly)?.product;
      const monthly = packages.find((p) => p.identifier === PLAN_TO_PACKAGE.monthly)?.product;
      if (live)
        setPrices({
          yearlyPerMonth: yearly?.pricePerMonthString ?? undefined,
          yearly: yearly?.priceString,
          monthly: monthly?.priceString,
        });
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return prices;
}

/**
 * My plan (06 P9 `6722:4679`, Pro state 08 §2.6 `6787:5503`). Free: this week's Glow AI chats,
 * the Pro card and Restore / Manage. Pro: the plan card with renewal, the benefits, and Manage,
 * Change plan and Restore. Prices come from the App Store; the store name follows how they pay.
 */
export default function MyPlan() {
  const { t, i18n } = useTranslation();
  const { subscription, hasFullAccess, isCanceling, isLifetime, isTrialActive, refresh } =
    useSubscription();
  const usage = useGlowAiUsage();
  const prices = useStorePrices();
  const [restoring, setRestoring] = useState(false);
  const store =
    subscription?.stripeCustomerId || Platform.OS !== 'ios'
      ? t('me.plan.web')
      : t('me.plan.appStore');
  const date = subscription?.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  async function restore() {
    setRestoring(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw Error('Please sign in first.');
      await configureRevenueCat(session.user.id);
      const info = await restorePurchases();
      if (info) {
        if (!(await applyPurchaseInfo(info, session.user.id))) throw Error('Account changed');
        toast.success(
          t(info.entitlements.active.premium ? 'me.plan.restored' : 'me.plan.nothingToRestore'),
        );
      }
      await refresh();
    } catch {
      recordDiagnostic('billing_restore', 'BILLING_UNAVAILABLE');
      toast.error(t('me.plan.restoreError'));
    } finally {
      setRestoring(false);
    }
  }
  const manage = () =>
    void openSubscriptionManagement().catch(() => toast.error(t('me.plan.manageError')));
  const changePlan = () => {
    if (subscription?.type === 'monthly')
      router.push({ pathname: '/(utils)/trial-upgrade', params: { plan: 'yearly' } });
    else
      showAlert(t('me.plan.toMonthlyTitle'), t('me.plan.toMonthlyBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('me.plan.continue'), onPress: manage },
      ]);
  };

  const actions = (
    <ListGroup>
      {(hasFullAccess ? !isLifetime : true) && (
        <ListRow label={t('me.plan.manage')} value={store} onPress={manage} />
      )}
      {hasFullAccess && !isLifetime && !isCanceling && !isTrialActive && (
        <ListRow
          label={t(subscription?.type === 'monthly' ? 'me.plan.toYearly' : 'me.plan.toMonthly')}
          onPress={changePlan}
        />
      )}
      {Platform.OS === 'ios' && (
        <ListRow
          label={restoring ? `${t('me.plan.restore')}…` : t('me.plan.restore')}
          onPress={restoring ? undefined : () => void restore()}
        />
      )}
    </ListGroup>
  );

  if (hasFullAccess) {
    const planName = isLifetime
      ? t('me.plan.lifetime')
      : isTrialActive
        ? t('me.plan.trialPlan')
        : t(subscription?.type === 'monthly' ? 'me.plan.monthly' : 'me.plan.yearly');
    const price = subscription?.type === 'monthly' ? prices.monthly : prices.yearly;
    const renewal = isLifetime
      ? t('me.plan.lifetimeBody')
      : !date
        ? null
        : isTrialActive
          ? t('me.plan.trialEnds', { date })
          : isCanceling
            ? t('me.plan.until', { date })
            : price
              ? t('me.plan.renewsPrice', { date, price })
              : t('me.plan.renews', { date });
    return (
      <SettingsScreen
        title={t('me.plan.title')}
        backLabel={t('common.back')}
        onBack={() => backTo(undefined, '/(tabs)/profile')}
        contentStyle={{ gap: 24 }}
      >
        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: palette.plum,
            padding: 20,
            gap: 14,
            overflow: 'hidden',
          }}
        >
          <Glow
            color={palette.mustard}
            opacity={0.3}
            width={200}
            blur={60}
            style={{ position: 'absolute', left: 170, top: -70 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                backgroundColor: palette.plum,
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}
            >
              <Text style={[Type.buttonS, { fontSize: 12, lineHeight: 14, color: palette.white }]}>
                {t('me.plan.proTag')}
              </Text>
            </View>
            <Text
              style={[
                Type.bodySm,
                { fontFamily: Type.bodyMMedium.fontFamily, color: palette.textMuted },
              ]}
            >
              {planName}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[Type.titleMd, { fontSize: 22, lineHeight: 30, color: palette.ink }]}
          >
            {t('me.plan.proHeading')}
          </Text>
          {renewal && <Text style={[Type.bodySm, { color: palette.textMuted }]}>{renewal}</Text>}
          <View style={{ gap: 10 }}>
            {BENEFITS.map((b) => (
              <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="line/check" size={16} color={palette.plum} />
                <Text style={[Type.bodySm, { color: palette.plumDeep, flex: 1 }]}>
                  {t(`me.plan.${b}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {actions}
        {!isLifetime && <LegalNote text={t('me.plan.legalPro', { store })} />}
      </SettingsScreen>
    );
  }

  const used = usage.used ?? 0;
  return (
    <SettingsScreen
      title={t('me.plan.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.mustard, opacity: 0.2, x: 200, y: 40, width: 220, blur: 90 },
      ]}
      contentStyle={{ gap: 12 }}
    >
      <View
        style={{
          backgroundColor: palette.white,
          borderRadius: 28,
          padding: 20,
          overflow: 'hidden',
        }}
      >
        <Glow
          color={palette.lavenderSoft}
          opacity={0.3}
          width={180}
          blur={50}
          style={{ position: 'absolute', left: 190, top: -50 }}
        />
        <Text style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}>
          {t('me.plan.current')}
        </Text>
        <Text
          style={[Type.titleMd, { fontSize: 26, lineHeight: 34, color: palette.ink, marginTop: 4 }]}
        >
          {t('me.plan.free')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('me.plan.chatsWeek')}
          </Text>
          <Text style={[Type.buttonS, { fontSize: 13, color: palette.plum }]}>
            {t('me.plan.chatsUsed', { used, limit: usage.limit })}
          </Text>
        </View>
        <Svg
          height={6}
          width="100%"
          style={{ marginTop: 10 }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: usage.limit, now: used }}
        >
          <Defs>
            <LinearGradient id="chatUse" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={palette.mustard} />
              <Stop offset="1" stopColor={palette.lavender} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height={6} rx={3} fill={palette.surfaceLilac} />
          <Rect
            width={`${Math.min(100, (used / usage.limit) * 100)}%`}
            height={6}
            rx={3}
            fill="url(#chatUse)"
          />
        </Svg>
        <Text style={[Type.captionS, { color: palette.textSubtle, marginTop: 10 }]}>
          {t('me.plan.resets')}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: palette.white,
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: palette.plum,
          padding: 20,
          gap: 14,
          overflow: 'hidden',
        }}
      >
        <Glow
          color={palette.mustard}
          opacity={0.3}
          width={200}
          blur={60}
          style={{ position: 'absolute', left: 180, top: -60 }}
        />
        <Glow
          color={palette.rose}
          opacity={0.22}
          width={120}
          blur={40}
          style={{ position: 'absolute', left: 230, top: 10 }}
        />
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: palette.plum,
            borderRadius: 12,
            paddingVertical: 4,
            paddingHorizontal: 12,
          }}
        >
          <Text style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.white }]}>
            {t('me.plan.proTag')}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 22, lineHeight: 30, color: palette.ink }]}
        >
          {t('me.plan.proTitle')}
        </Text>
        <View style={{ gap: 12 }}>
          {BENEFITS.map((b) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: palette.selected,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="line/check" size={14} color={palette.plum} />
              </View>
              <Text style={[Type.bodySm, { color: palette.plumDeep, flex: 1 }]}>
                {t(`me.plan.${b}`)}
              </Text>
            </View>
          ))}
        </View>
        {prices.yearlyPerMonth && (
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('me.plan.fromPrice', { price: prices.yearlyPerMonth })}
          </Text>
        )}
        <AppButton
          title={t('me.plan.seePro')}
          size="s"
          onPress={() => router.push('/(utils)/trial-upgrade')}
        />
      </View>
      {actions}
      <LegalNote text={t('me.plan.legalFree', { store })} />
    </SettingsScreen>
  );
}
