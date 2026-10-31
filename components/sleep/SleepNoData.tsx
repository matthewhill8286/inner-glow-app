import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { useHealthSleep } from '@/hooks/useHealthSleep';

/** Sleep · No data yet (09 §3.8): shown on the Sleep screen while the user has no entries. */
export function SleepNoData() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const health = useHealthSleep();
  const ios = health.provider === 'apple_health';
  const android = health.provider === 'health_connect';

  const onConnect = async () => {
    const result = await health.connect();
    if (result.status === 'error') toast.error(t('connectedApps.syncError'));
    // Apple Health never reports a refused read, so an empty import is the only sign of it.
    else if (result.imported === 0) toast.info(t('connectedApps.denied'));
  };

  const body = ios ? 'sleepEmpty.emptyBodyApple' : android ? 'sleepEmpty.emptyBodyAndroid' : 'sleepEmpty.emptyBodyOther';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.sky, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 26, paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}>
        <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.ink }]}>
          {t('sleepEmpty.title')}
        </Text>
        <EmptyState glowColor={palette.sky} title={t('sleepEmpty.emptyTitle')} body={t(body)} style={{ marginTop: 14 }} />
        <ListGroup style={{ marginTop: 24 }}>
          {health.provider && health.available ? (
            <ListRow
              icon="line/health"
              label={t(ios ? 'sleepEmpty.connectApple' : 'sleepEmpty.connectAndroid')}
              supporting={health.syncing ? t('sleepEmpty.importing') : t('sleepEmpty.connectDetail')}
              busy={health.syncing}
              onPress={onConnect}
            />
          ) : null}
          <ListRow
            icon="line/moon"
            label={t('sleepEmpty.logManually')}
            supporting={t('sleepEmpty.logManuallyDetail')}
            onPress={() => router.push('/(tabs)/sleep/log')}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}
