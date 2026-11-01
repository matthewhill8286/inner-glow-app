import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { useAccessibilityPrefs } from '@/lib/accessibility-prefs';
import { backTo } from '@/lib/navigation';

/**
 * Settings · Accessibility (08 §2.7, `6795:6236`). Reduce motion stops the orb's breathing, Softer
 * glows dims every glow, and Haptic cues taps at each breathing phase. The design's "Larger text"
 * row is replaced by a note: text already follows the phone's size, and React Native has no app-wide
 * switch to cap it, so the row could not do what it says.
 */
export default function Accessibility() {
  const { t } = useTranslation();
  const prefs = useAccessibilityPrefs();

  return (
    <SettingsScreen
      title={t('me.a11y.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      contentStyle={{ gap: 24 }}
    >
      <Text
        accessibilityRole="header"
        style={[Type.titleMd, { fontSize: 26, lineHeight: 34, color: palette.ink }]}
      >
        {t('me.a11y.heading')}
      </Text>
      <SettingsSection label={t('me.a11y.motion')}>
        <ListGroup>
          <ListRow
            label={t('me.a11y.reduceMotion')}
            supportingText={t('me.a11y.reduceMotionBody')}
            trailing="toggle"
            toggled={prefs.reduceMotion}
            onToggle={(v) => prefs.set({ reduceMotion: v })}
          />
          <ListRow
            label={t('me.a11y.softerGlows')}
            supportingText={t('me.a11y.softerGlowsBody')}
            trailing="toggle"
            toggled={prefs.softerGlows}
            onToggle={(v) => prefs.set({ softerGlows: v })}
          />
        </ListGroup>
      </SettingsSection>
      <SettingsSection label={t('me.a11y.sound')}>
        <ListGroup>
          <ListRow
            label={t('me.a11y.haptics')}
            supportingText={t('me.a11y.hapticsBody')}
            trailing="toggle"
            toggled={prefs.haptics}
            onToggle={(v) => prefs.set({ haptics: v })}
          />
        </ListGroup>
        <Text style={[Type.captionS, { color: palette.lavender, marginTop: 4 }]}>
          {t('me.a11y.textNote')}
        </Text>
      </SettingsSection>
    </SettingsScreen>
  );
}
