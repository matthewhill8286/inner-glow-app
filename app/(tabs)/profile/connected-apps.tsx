import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { Glow, GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { LegalNote, Toggle } from '@/components/ui/controls';
import { toast } from '@/components/Toast';
import { useHealthSleep } from '@/hooks/useHealthSleep';

/**
 * Connected apps (06 §P7). Only the platform health store ships; the Smart watch,
 * Sleep tracker and Calendar tiles are hidden until they are defined (06 P7 gaps).
 * The sync row under the tile is not in the design: it holds the disconnect toggle
 * and last-sync time the tile has no room for.
 */
export default function ConnectedAppsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const health = useHealthSleep();
  const ios = health.provider === 'apple_health';
  const connected = health.connected;

  const onConnect = async () => {
    const result = await health.connect();
    if (result.status === 'unavailable') toast.info(t(ios ? 'connectedApps.unavailableApple' : 'connectedApps.unavailableAndroid'));
    else if (result.status === 'denied') toast.info(t('connectedApps.denied'));
    else if (result.status === 'error') toast.error(t('connectedApps.syncError'));
    else toast.success(t('connectedApps.imported', { count: result.imported }));
  };

  const onSyncNow = async () => {
    const result = await health.syncNow();
    if (result.status === 'error') toast.error(t('connectedApps.syncError'));
    else toast.success(t('connectedApps.imported', { count: result.imported }));
  };

  const lastSync = health.syncing
    ? t('connectedApps.syncing')
    : health.lastSyncISO
      ? t('connectedApps.lastSync', {
          time: new Date(health.lastSyncISO).toLocaleString(i18n.language, { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
        })
      : t('connectedApps.neverSynced');

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}>
        <IconButton accessibilityLabel={t('connectedApps.back')} onPress={() => backTo(undefined, '/(tabs)/profile')} />
        <Text accessibilityRole="header" style={[Type.titleMd, { color: palette.ink, marginTop: 18, maxWidth: 310 }]}>
          {t('connectedApps.headline')}
        </Text>

        {health.provider ? (
          <View
            style={{
              marginTop: 24,
              width: 160,
              height: 164,
              borderRadius: 24,
              backgroundColor: palette.surface,
              borderWidth: connected ? 1.5 : 0,
              borderColor: palette.plum,
              padding: 16,
              overflow: 'hidden',
            }}
          >
            {connected && <Glow color={palette.mustard} opacity={0.25} width={120} blur={40} style={{ position: 'absolute', left: 60, top: -30 }} />}
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.selected, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="line/health" size={22} />
            </View>
            <Text style={[Type.body, { fontWeight: '600', color: palette.ink, marginTop: 12 }]}>
              {t(ios ? 'connectedApps.appleHealth' : 'connectedApps.healthConnect')}
            </Text>
            <Text style={{ ...Type.caption, fontWeight: '400', color: palette.textMuted, marginTop: 4 }} numberOfLines={1}>
              {t(ios ? 'connectedApps.appleHealthDetail' : 'connectedApps.healthConnectDetail')}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={connected || health.syncing}
              onPress={onConnect}
              style={({ pressed }) => ({
                marginTop: 'auto',
                height: 30,
                width: connected ? 96 : 80,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: connected ? palette.selected : palette.plum,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[Type.caption, { color: connected ? palette.plum : palette.white }]}>
                {t(connected ? 'connectedApps.connected' : 'connectedApps.connect')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[Type.bodySm, { color: palette.textMuted, marginTop: 24 }]}>{t('connectedApps.unavailableOther')}</Text>
        )}

        {health.provider && connected ? (
          <ListGroup style={{ marginTop: 16 }}>
            <ListRow
              icon="line/moon"
              label={t('connectedApps.importSleep')}
              supporting={lastSync}
              trailing={
                <Toggle
                  value={connected}
                  accessibilityLabel={t('connectedApps.importSleep')}
                  onValueChange={(on) => (on ? void onConnect() : void health.disconnect())}
                />
              }
              chevron={false}
            />
            <ListRow icon="arrow/replay" label={t('connectedApps.syncNow')} busy={health.syncing} onPress={onSyncNow} />
          </ListGroup>
        ) : null}

        <LegalNote text={t('connectedApps.legal')} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}
