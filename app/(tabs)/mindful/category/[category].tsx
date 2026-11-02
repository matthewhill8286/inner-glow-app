import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { PracticeRow } from '@/components/practices/PracticeParts';
import { PRACTICES, practiceById } from '@/data/practices';
import { backTo } from '@/lib/navigation';
import { openPractice } from '@/lib/practice-routes';

type Category = 'breathing' | 'mindfulness' | 'sleep';
const GLOW: Record<Category, string> = {
  breathing: palette.sky,
  mindfulness: palette.lavender,
  sleep: palette.lavenderSoft,
};

/**
 * A category's practices: Breathing · Choose a technique (07 §2.5) with the 4-7-8 tip, and the same
 * layout for Mindfulness and Sleep.
 */
export default function CategoryPractices() {
  const { t } = useTranslation();
  const { category: raw } = useLocalSearchParams<{ category: string }>();
  const category: Category = raw === 'mindfulness' || raw === 'sleep' ? raw : 'breathing';
  const items = PRACTICES.filter((p) => p.category === category);
  const calm = practiceById('four-seven-eight')!;

  return (
    <SettingsScreen
      title={t('practices.all.mindful')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mindful')}
      glows={[
        { color: GLOW[category], opacity: 0.3, x: 150, y: 40, width: 270, blur: 90 },
        { color: palette.mustard, opacity: 0.2, x: -60, y: 20, width: 220, blur: 90 },
      ]}
      contentStyle={{ gap: 10 }}
    >
      <View style={{ gap: 8, marginBottom: 14 }}>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}
        >
          {t(`practices.categories.${category}.heading`)}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted }]}>
          {t(`practices.categories.${category}.body`)}
        </Text>
      </View>
      {items.map((p) => (
        <PracticeRow key={p.id} practice={p} onPress={() => openPractice(p)} />
      ))}
      {category === 'breathing' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => openPractice(calm)}
          style={{
            marginTop: 14,
            borderRadius: 24,
            backgroundColor: 'rgba(127,198,241,0.18)',
            padding: 18,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Icon name="line/sparkle" size={20} />
          <Text style={[Type.captionM, { flex: 1, color: palette.textMuted }]}>
            {t('practices.tip')}
          </Text>
        </Pressable>
      )}
    </SettingsScreen>
  );
}
