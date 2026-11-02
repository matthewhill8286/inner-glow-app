import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppField } from '@/components/ui/AppField';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { OptionPills, PracticeRow, usePracticeText } from '@/components/practices/PracticeParts';
import { PRACTICES, type PracticeCategory } from '@/data/practices';
import { backTo } from '@/lib/navigation';
import { openPractice } from '@/lib/practice-routes';

type Filter = 'all' | 'breathing' | 'relax' | 'mindfulness' | 'sleep';
const SECTIONS: PracticeCategory[] = [
  'breathing',
  'relax-body',
  'relax-mind',
  'mindfulness',
  'sleep',
];

/**
 * All practices (07 §2.2): search by title, tag or description, category pills ("Relax" covers body
 * and mind), and sections with practice rows.
 */
export default function AllPractices() {
  const { t } = useTranslation();
  const text = usePracticeText();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const q = query.trim().toLocaleLowerCase();

  const sections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        items: PRACTICES.filter((p) => {
          if (p.category !== section) return false;
          if (
            filter !== 'all' &&
            !(filter === 'relax' ? p.category.startsWith('relax') : p.category === filter)
          )
            return false;
          if (!q) return true;
          const x = text(p);
          return [x.title, x.tag, x.description].some((s) => s.toLocaleLowerCase().includes(q));
        }),
      })).filter((s) => s.items.length),
    [filter, q, text],
  );

  return (
    <SettingsScreen
      title={t('practices.all.mindful')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mindful')}
      contentStyle={{ gap: 20 }}
    >
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}
        >
          {t('practices.all.title')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted }]}>{t('practices.all.body')}</Text>
      </View>
      <AppField
        variant="search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('practices.all.search')}
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -24 }}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <OptionPills
          label={t('practices.all.title')}
          value={filter}
          onChange={setFilter}
          options={(['all', 'breathing', 'relax', 'mindfulness', 'sleep'] as Filter[]).map((f) => ({
            value: f,
            label: t(`practices.all.filters.${f}`),
          }))}
        />
      </ScrollView>
      {sections.length === 0 ? (
        <Text style={[Type.captionM, { color: palette.textMuted }]}>
          {t('practices.all.none', { query })}
        </Text>
      ) : (
        sections.map(({ section, items }) => (
          <View key={section} style={{ gap: 8 }}>
            <Text
              accessibilityRole="header"
              style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.textSubtle }]}
            >
              {t(`practices.all.sections.${section}`)}
            </Text>
            {items.map((p) => (
              <PracticeRow key={p.id} practice={p} onPress={() => openPractice(p)} />
            ))}
          </View>
        ))
      )}
    </SettingsScreen>
  );
}
