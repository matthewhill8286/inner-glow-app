import { finishTo } from '@/lib/navigation';
import { Typography } from '@/constants/typography';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import MaterialIcons from '@/components/AppIcon';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { subscription, isPending, hasFullAccess, refresh } = useSubscription();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      await refresh();
      attempts++;
      if (attempts >= maxAttempts) {
        setChecking(false);
      }
    };

    poll();

    const interval = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setChecking(false);
        return;
      }
      await poll();
    }, 2000);

    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (subscription && !isPending && hasFullAccess) {
      setChecking(false);
    }
  }, [subscription, isPending, hasFullAccess]);

  const planLabelKey =
    subscription?.type === 'lifetime'
      ? 'paymentSuccess.lifetime'
      : subscription?.type === 'yearly'
        ? 'paymentSuccess.yearly'
        : subscription?.type === 'monthly'
          ? 'paymentSuccess.monthly'
          : subscription?.type === 'trial'
            ? 'paymentSuccess.trial'
            : 'paymentSuccess.premium';

  const planLabel = t(planLabelKey);

  const handleContinue = () => {
    finishTo('/(tabs)/home');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.iconCircle}>
          <MaterialIcons
            name={hasFullAccess ? 'check' : 'hourglass-empty'}
            size={44}
            color="#FFF"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {checking
            ? t('paymentSuccess.processing')
            : hasFullAccess
              ? t('paymentSuccess.title')
              : 'Payment not confirmed yet'}
        </Text>

        {checking ? (
          <View style={styles.checkingRow}>
            <ActivityIndicator size="small" color="#8B6B47" />
            <Text style={[styles.message, { color: colors.mutedText }]}>
              {t('paymentSuccess.confirming')}
            </Text>
          </View>
        ) : !hasFullAccess ? (
          <Text style={[styles.message, { color: colors.mutedText }]}>
            We have not confirmed premium access yet. Check your purchase status or use Restore
            Purchases on the premium screen.
          </Text>
        ) : (
          <>
            <Text style={[styles.message, { color: colors.mutedText }]}>
              {t('paymentSuccess.welcome', { plan: planLabel })}
            </Text>

            <View style={[styles.planBadge, { backgroundColor: '#5B8A5A' + '15' }]}>
              <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 16 }}>
                ✨
              </WellnessIconText>
              <Text style={[styles.planBadgeText, { color: '#5B8A5A' }]}>
                {t('paymentSuccess.planActive', { plan: planLabel })}
              </Text>
            </View>
          </>
        )}

        <Pressable
          onPress={handleContinue}
          disabled={checking}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: checking ? '#CCC' : '#5B8A5A',
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {checking
              ? t('paymentSuccess.pleaseWait')
              : hasFullAccess
                ? t('paymentSuccess.getStarted')
                : 'Return to app'}
          </Text>
          {!checking && <MaterialIcons name="arrow-forward" size={18} color="#FFF" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    ...UI.shadow.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5B8A5A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...UI.shadow.sm,
  },
  title: { ...Typography.heading, fontSize: 24, textAlign: 'center', marginBottom: 12 },
  message: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  checkingRow: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  planBadgeText: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    fontWeight: Typography.weight.medium,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    ...UI.shadow.sm,
  },
  buttonText: {
    fontFamily: Typography.family.body,
    color: 'white',
    fontWeight: Typography.weight.semibold,
    fontSize: 16,
  },
});
