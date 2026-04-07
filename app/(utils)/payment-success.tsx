import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { subscription, isPending, refresh } = useSubscription();
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
    if (subscription && !isPending && subscription.status === 'active') {
      setChecking(false);
    }
  }, [subscription, isPending]);

  const planLabelKey =
    subscription?.type === 'lifetime'
      ? 'paymentSuccess.lifetime'
      : subscription?.type === 'monthly'
        ? 'paymentSuccess.monthly'
        : subscription?.type === 'trial'
          ? 'paymentSuccess.trial'
          : 'paymentSuccess.premium';

  const planLabel = t(planLabelKey);

  const handleContinue = () => {
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check" size={44} color="#FFF" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {checking ? t('paymentSuccess.processing') : t('paymentSuccess.title')}
        </Text>

        {checking ? (
          <View style={styles.checkingRow}>
            <ActivityIndicator size="small" color="#8B6B47" />
            <Text style={[styles.message, { color: colors.mutedText }]}>
              {t('paymentSuccess.confirming')}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.message, { color: colors.mutedText }]}>
              {t('paymentSuccess.welcome', { plan: planLabel })}
            </Text>

            <View style={[styles.planBadge, { backgroundColor: '#5B8A5A' + '15' }]}>
              <Text style={{ fontSize: 16 }}>✨</Text>
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
            {checking ? t('paymentSuccess.pleaseWait') : t('paymentSuccess.getStarted')}
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
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
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
    fontSize: 15,
    fontWeight: '800',
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
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
});
