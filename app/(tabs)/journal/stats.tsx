import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { useJournal } from '@/hooks/useJournal';
import { journalYearStats } from '@/lib/journal-entry';
import { MOOD_SCALE } from '@/lib/mood-scale';
import { backTo } from '@/lib/navigation';
import { activeDays, streak } from '@/lib/profile-stats';

const BAR_H = 100;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View accessible accessibilityLabel={`${value} ${label}`} style={{ flex: 1, gap: 4 }}>
      <Text style={[Type.titleMd, { fontSize: 26, lineHeight: 32, color: palette.ink }]}>
        {value}
      </Text>
      <Text style={[Type.micro, { fontSize: 12, lineHeight: 15, color: palette.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Journal Stats. There is no frame for this screen, so it uses the library shell and cards: this
 * year's entries, the journal streak (the same count as Journal home and Saved) and average length;
 * the moods entries were written in, on the five-step scale; and entries per month.
 */
export default function JournalStats() {
  const { t, i18n } = useTranslation();
  const { journalEntries } = useJournal();
  const year = new Date().getFullYear();
  const stats = useMemo(() => journalYearStats(journalEntries, year), [journalEntries, year]);
  const days = useMemo(
    () => streak(activeDays(journalEntries.map((e) => e.createdAt))).count,
    [journalEntries],
  );
  const maxMonth = Math.max(1, ...stats.monthly);
  const thisMonth = new Date().getMonth();
  const months = Array.from({ length: 12 }, (_, m) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'narrow' }).format(new Date(year, m, 1)),
  );
  const moodParts = [
    ...MOOD_SCALE.map((m) => ({
      key: m.key,
      label: t(`moodScale.${m.key}`),
      color: m.color,
      count: stats.moods[String(m.score) as '1'],
      face: m.face,
    })),
    {
      key: 'none',
      label: t('journalStats.noMood'),
      color: palette.borderLilac,
      count: stats.moods.none,
      face: null,
    },
  ].filter((p) => p.count > 0);

  return (
    <SettingsScreen
      title={t('journalStats.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/journal')}
      glows={[
        { color: palette.mustard, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
        { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
      ]}
      contentStyle={{ gap: 16 }}
    >
      <View
        style={{
          backgroundColor: palette.white,
          borderRadius: 28,
          padding: 20,
          paddingTop: 18,
          gap: 14,
        }}
      >
        <Text style={[Type.microBold, { lineHeight: 15, color: palette.lavender }]}>
          {t('journalStats.thisYear', { year })}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Stat value={String(stats.total)} label={t('journalStats.entries')} />
          <Stat value={String(days)} label={t('journalStats.streak')} />
          <Stat value={String(stats.avgWords)} label={t('journalStats.avgWords')} />
        </View>
      </View>

      <View style={{ backgroundColor: palette.white, borderRadius: 28, padding: 20, gap: 14 }}>
        <Text
          accessibilityRole="header"
          style={[Type.bodyStrong, { letterSpacing: 0, color: palette.ink }]}
        >
          {t('journalStats.moods')}
        </Text>
        {stats.total === 0 ? (
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('journalStats.noneYet')}
          </Text>
        ) : (
          <>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                flexDirection: 'row',
                height: 14,
                borderRadius: 7,
                overflow: 'hidden',
                gap: 2,
              }}
            >
              {moodParts.map((p) => (
                <View key={p.key} style={{ flex: p.count, backgroundColor: p.color }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {moodParts.map((p) => (
                <View
                  key={p.key}
                  accessible
                  accessibilityLabel={`${p.label}, ${p.count}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  {p.face ? (
                    <Icon name={p.face} size={16} color={palette.plum} />
                  ) : (
                    <View
                      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }}
                    />
                  )}
                  <Text
                    style={[Type.captionM, { color: palette.textMuted }]}
                  >{`${p.label} ${p.count}`}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={{ backgroundColor: palette.white, borderRadius: 28, padding: 20, gap: 16 }}>
        <Text
          accessibilityRole="header"
          style={[Type.bodyStrong, { letterSpacing: 0, color: palette.ink }]}
        >
          {t('journalStats.monthly')}
        </Text>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
        >
          {stats.monthly.map((count, m) => (
            <View
              key={m}
              accessible
              accessibilityLabel={`${new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date(year, m, 1))}, ${count}`}
              style={{ alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  width: 16,
                  height: BAR_H,
                  borderRadius: 8,
                  backgroundColor: palette.surfaceLilacSoft,
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}
              >
                {count > 0 && (
                  <View
                    style={{
                      height: Math.max(8, (count / maxMonth) * BAR_H),
                      borderRadius: 8,
                      backgroundColor: m === thisMonth ? palette.plum : palette.lavenderSoft,
                    }}
                  />
                )}
              </View>
              <Text
                style={[Type.micro, { color: m === thisMonth ? palette.plum : palette.textSubtle }]}
              >
                {months[m]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SettingsScreen>
  );
}
