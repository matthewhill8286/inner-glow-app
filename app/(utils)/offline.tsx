import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { NavBar } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';

/** What runs on the device: breathing, grounding and the sleep sounds bundled with the app. */
const WORKS: { key: string; icon: IconName; href: Href }[] = [
  { key: 'breathing', icon: 'line/leaf', href: '/(tabs)/mindful' },
  { key: 'grounding', icon: 'line/meditate', href: '/(tabs)/stress/grounding' },
  { key: 'sounds', icon: 'line/music', href: '/(tabs)/sleep' },
];
/** What saves to or loads from the server today. */
const NEEDS: { key: string; icon: IconName }[] = [
  { key: 'journal', icon: 'line/journal' },
  { key: 'glowAi', icon: 'line/chat' },
  { key: 'insights', icon: 'line/chart' },
  { key: 'videos', icon: 'line/play' },
];

/**
 * Offline (`6839:8590`): the "You're offline" card, what works offline, what needs a connection,
 * and Try to reconnect, which restarts from the entry route. The lists follow what the app can
 * really do offline: journal and mood saving still need a connection.
 */
export default function OfflineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.sky, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.3, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={() => router.replace('/')}
          title={t('offlineMode.nav')}
        />
        <View
          style={{
            marginTop: 16,
            borderRadius: 24,
            backgroundColor: palette.white,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: palette.selected,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="line/globe" size={18} color={palette.plum} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[Type.bodyMSemi, { color: palette.ink }]}>{t('offlineMode.title')}</Text>
            <Text style={[Type.captionM, { color: palette.textMuted }]}>
              {t('offlineMode.body')}
            </Text>
          </View>
        </View>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, marginTop: 20, marginBottom: 8 },
          ]}
        >
          {t('offlineMode.works')}
        </Text>
        <ListGroup>
          {WORKS.map((row) => (
            <ListRow
              key={row.key}
              icon={row.icon}
              label={t(`offlineMode.rows.${row.key}.label`)}
              supportingText={t(`offlineMode.rows.${row.key}.body`)}
              onPress={() => router.push(row.href)}
            />
          ))}
        </ListGroup>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, marginTop: 20, marginBottom: 8 },
          ]}
        >
          {t('offlineMode.needs')}
        </Text>
        <View style={{ opacity: 0.55 }}>
          <ListGroup>
            {NEEDS.map((row) => (
              <ListRow
                key={row.key}
                icon={row.icon}
                label={t(`offlineMode.rows.${row.key}.label`)}
                supportingText={t(`offlineMode.rows.${row.key}.body`)}
                trailing="value"
                value={t('offlineMode.offline')}
              />
            ))}
          </ListGroup>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24 }}>
        <AppButton
          title={t('offlineMode.reconnect')}
          variant="outline"
          onPress={() => router.replace('/')}
        />
      </View>
    </View>
  );
}
