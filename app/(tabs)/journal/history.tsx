import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { EntryCard } from '@/components/journal/EntryCard';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { useJournal } from '@/hooks/useJournal';
import { backTo } from '@/lib/navigation';
import { dayKey } from '@/lib/profile-stats';

/** Monday to Sunday of the week that holds `d`. */
function weekOf(d: Date): Date[] {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from(
    { length: 7 },
    (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
}

/**
 * My Journals. There is no frame for this screen, so it uses the library shell: a week strip that
 * marks the days with entries, then the chosen day's entries as Journal home cards, and "New entry"
 * for that day. Days are matched in local time.
 */
export default function JournalHistory() {
  const { t, i18n } = useTranslation();
  const { journalEntries, isLoading } = useJournal();
  const [selected, setSelected] = useState(() => new Date());
  const week = useMemo(() => weekOf(selected), [selected]);
  const today = dayKey(new Date());
  const selectedKey = dayKey(selected);

  const withEntries = useMemo(
    () => new Set(journalEntries.map((e) => dayKey(new Date(e.createdAt)))),
    [journalEntries],
  );
  const dayEntries = useMemo(
    () => journalEntries.filter((e) => dayKey(new Date(e.createdAt)) === selectedKey),
    [journalEntries, selectedKey],
  );

  const shift = (days: number) =>
    setSelected((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
  const monthYear = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
  }).format(selected);
  const dayLabel =
    selectedKey === today
      ? t('journalHistory.today')
      : new Intl.DateTimeFormat(i18n.language, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(selected);
  const isFuture = selectedKey > today;

  return (
    <SettingsScreen
      title={t('journalHistory.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/journal')}
      glows={[
        { color: palette.mustard, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
        { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
      ]}
      contentStyle={{ gap: 16 }}
    >
      <View style={{ backgroundColor: palette.white, borderRadius: 24, padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('journalHistory.previousWeek')}
            hitSlop={10}
            onPress={() => shift(-7)}
            style={{ padding: 4 }}
          >
            <Icon name="arrow/chevron-left" size={20} color={palette.plum} />
          </Pressable>
          <Text
            accessibilityRole="header"
            style={[Type.bodyMSemi, { flex: 1, textAlign: 'center', color: palette.ink }]}
          >
            {monthYear}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('journalHistory.nextWeek')}
            hitSlop={10}
            onPress={() => shift(7)}
            style={{ padding: 4 }}
          >
            <Icon name="arrow/chevron-right" size={20} color={palette.plum} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {week.map((d) => {
            const key = dayKey(d);
            const isSelected = key === selectedKey;
            const isToday = key === today;
            const has = withEntries.has(key);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(d)}${has ? `, ${t('journalHistory.hasEntries')}` : ''}`}
                onPress={() => setSelected(d)}
                style={{ alignItems: 'center', gap: 6, width: 40 }}
              >
                <Text style={[Type.micro, { color: palette.textSubtle }]}>
                  {new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(d)}
                </Text>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? palette.plum : 'transparent',
                    borderWidth: isToday && !isSelected ? 1.5 : 0,
                    borderColor: palette.plum,
                  }}
                >
                  <Text style={[Type.label, { color: isSelected ? palette.white : palette.ink }]}>
                    {d.getDate()}
                  </Text>
                </View>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: has ? palette.mustard : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <Text
          style={[
            Type.bodyStrong,
            { lineHeight: 22, letterSpacing: 0, color: palette.ink, flex: 1 },
          ]}
        >
          {dayLabel}
        </Text>
        {selectedKey !== today && (
          <Text
            accessibilityRole="button"
            onPress={() => setSelected(new Date())}
            style={[Type.label, { color: palette.lavender }]}
          >
            {t('journalHistory.backToToday')}
          </Text>
        )}
      </View>

      {dayEntries.length > 0 ? (
        <View style={{ gap: 10 }}>
          {dayEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} lang={i18n.language} />
          ))}
        </View>
      ) : (
        !isLoading && (
          <View
            style={{
              backgroundColor: palette.white,
              borderRadius: 24,
              padding: 20,
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={[Type.bodyMSemi, { color: palette.ink, textAlign: 'center' }]}>
              {selectedKey === today
                ? t('journalHistory.noEntriesYetToday')
                : t('journalHistory.noEntriesThisDay')}
            </Text>
            <Text
              style={[
                Type.captionM,
                { lineHeight: 19, color: palette.textMuted, textAlign: 'center' },
              ]}
            >
              {selectedKey === today
                ? t('journalHistory.startWritingJourney')
                : t('journalHistory.selectDateEntries')}
            </Text>
          </View>
        )
      )}

      {!isFuture && (
        <AppButton
          title={t('journalHistory.newEntry')}
          variant="secondary"
          icon="line/plus"
          iconPosition="left"
          onPress={() =>
            router.push({
              pathname: '/(tabs)/journal/new',
              params: selectedKey === today ? {} : { date: selected.toISOString() },
            })
          }
        />
      )}
    </SettingsScreen>
  );
}
