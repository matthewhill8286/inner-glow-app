import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { Glow, GlowField } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCalendarBusy } from '@/hooks/useCalendarBusy';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { LegalNote } from '@/components/ui/controls';
import { toast } from '@/components/Toast';
import { useHealthSleep } from '@/hooks/useHealthSleep';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

/**
 * Connected apps (06 §P7, `6839:8758`): Apple Health (or Health Connect) and Calendar. Tapping
 * Connected opens the Disconnect sheet. Smart watch data comes through Apple Health, and the sleep
 * tracker tile isn't built: those need their own integrations.
 * The sync row under the tile is not in the design: it holds the disconnect toggle
 * and last-sync time the tile has no room for.
 */
export default function ConnectedAppsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const health = useHealthSleep();
  const ios = health.provider === 'apple_health';
  const connected = health.connected;
  const calendar = useCalendarBusy();
  const [sheet, setSheet] = useState<'health' | 'calendar' | null>(null);

  const onConnect = async () => {
    const result = await health.connect();
    if (result.status === 'dismissed') return;
    if (result.status === 'unavailable')
      toast.info(t(ios ? 'connectedApps.unavailableApple' : 'connectedApps.unavailableAndroid'));
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
          time: new Date(health.lastSyncISO).toLocaleString(i18n.language, {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
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
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <IconButton
          accessibilityLabel={t('connectedApps.back')}
          onPress={() => backTo(undefined, '/(tabs)/profile')}
        />
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { color: palette.ink, marginTop: 18, maxWidth: 310 }]}
        >
          {t('connectedApps.headline')}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
          {health.provider ? (
            <SourceCard
              icon="line/health"
              title={t(ios ? 'connectedApps.appleHealth' : 'connectedApps.healthConnect')}
              detail={t(
                ios ? 'connectedApps.appleHealthDetail' : 'connectedApps.healthConnectDetail',
              )}
              connected={connected}
              busy={health.syncing}
              onConnect={() => void onConnect()}
              onDisconnect={() => setSheet('health')}
            />
          ) : null}
          {calendar.available ? (
            <SourceCard
              icon="line/calendar"
              title={t('connectedApps.calendar')}
              detail={t('connectedApps.calendarDetail')}
              connected={calendar.connected}
              onConnect={() =>
                void calendar
                  .connect()
                  .then((r) => r === 'denied' && toast.info(t('connectedApps.calendarDenied')))
              }
              onDisconnect={() => setSheet('calendar')}
            />
          ) : null}
        </View>
        {!health.provider ? (
          <Text style={[Type.bodySm, { color: palette.textMuted, marginTop: 16 }]}>
            {t('connectedApps.unavailableOther')}
          </Text>
        ) : null}

        {health.provider && connected ? (
          <ListGroup style={{ marginTop: 16 }}>
            <ListRow
              icon="line/moon"
              label={t('connectedApps.importSleep')}
              supportingText={lastSync}
              trailing="toggle"
              toggled={connected}
              onToggle={(on) => (on ? void onConnect() : void health.disconnect())}
            />
            <ListRow
              icon="arrow/replay"
              label={t('connectedApps.syncNow')}
              supportingText={health.syncing ? t('connectedApps.syncing') : undefined}
              onPress={health.syncing ? undefined : onSyncNow}
            />
          </ListGroup>
        ) : null}

        <LegalNote text={t('connectedApps.legal')} style={{ marginTop: 24 }} />
      </ScrollView>
      <BottomSheet visible={!!sheet} onClose={() => setSheet(null)} gap={12}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: palette.dangerSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
          <Icon
            name={sheet === 'calendar' ? 'line/calendar' : 'line/health'}
            size={22}
            color={palette.danger}
          />
        </View>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleSm,
            { fontSize: 22, lineHeight: 28, color: palette.ink, textAlign: 'center' },
          ]}
        >
          {t('connectedApps.disconnectTitle', {
            name:
              sheet === 'calendar'
                ? t('connectedApps.calendar')
                : t(ios ? 'connectedApps.appleHealth' : 'connectedApps.healthConnect'),
          })}
        </Text>
        <Text
          style={[
            Type.captionM,
            { fontSize: 14, lineHeight: 19, color: palette.textMuted, textAlign: 'center' },
          ]}
        >
          {t(
            sheet === 'calendar'
              ? 'connectedApps.disconnectCalendarBody'
              : 'connectedApps.disconnectHealthBody',
          )}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 4, marginTop: 8 }}>
          <AppButton
            title={t('connectedApps.disconnect')}
            variant="danger"
            onPress={() => {
              const which = sheet;
              setSheet(null);
              if (which === 'calendar') void calendar.disconnect();
              else void health.disconnect();
            }}
          />
          <AppButton title={t('common.cancel')} variant="text" onPress={() => setSheet(null)} />
        </View>
      </BottomSheet>
    </View>
  );
}

/** A connection tile (`6839:8758`): icon, name, what it reads, and Connect or Connected. */
function SourceCard({
  icon,
  title,
  detail,
  connected,
  busy,
  onConnect,
  onDisconnect,
}: {
  icon: IconName;
  title: string;
  detail: string;
  connected: boolean;
  busy?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View
      style={{
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
      {connected && (
        <Glow
          color={palette.mustard}
          opacity={0.25}
          width={120}
          blur={40}
          style={{ position: 'absolute', left: 60, top: -30 }}
        />
      )}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.selected,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={22} />
      </View>
      <Text style={[Type.body, { fontWeight: '600', color: palette.ink, marginTop: 12 }]}>
        {title}
      </Text>
      <Text
        style={{ ...Type.caption, fontWeight: '400', color: palette.textMuted, marginTop: 4 }}
        numberOfLines={1}
      >
        {detail}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={connected ? t('connectedApps.disconnectHint') : undefined}
        disabled={busy}
        onPress={connected ? onDisconnect : onConnect}
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
  );
}
