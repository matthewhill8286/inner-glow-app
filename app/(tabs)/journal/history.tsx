import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useJournal } from '@/hooks/useJournal';
import { JournalEntry } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Mood helpers ── */
const MOOD_MAP: Record<string, { emoji: string; color: string }> = {
  Calm: { emoji: '\uD83D\uDE0C', color: '#5B8A5A' },
  Okay: { emoji: '\uD83D\uDE42', color: '#E8985A' },
  Good: { emoji: '\uD83D\uDE0A', color: '#5B8A5A' },
  Great: { emoji: '\uD83D\uDE04', color: '#5B8A5A' },
  Happy: { emoji: '\uD83D\uDE01', color: '#8B6B47' },
  Anxious: { emoji: '\uD83D\uDE1F', color: '#7B6DC9' },
  Sad: { emoji: '\uD83D\uDE22', color: '#5A8FB5' },
  Angry: { emoji: '\uD83D\uDE21', color: '#C45B5B' },
  Overwhelmed: { emoji: '\uD83E\uDD2F', color: '#E8985A' },
  Bad: { emoji: '\uD83D\uDE14', color: '#C45B5B' },
  Low: { emoji: '\uD83D\uDE1E', color: '#5A8FB5' },
};

function getMood(mood?: string | null) {
  if (!mood) return { emoji: '\uD83D\uDCDD', color: '#8B6B47' };
  return MOOD_MAP[mood] ?? { emoji: '\uD83D\uDCDD', color: '#8B6B47' };
}

/* ── Generate week dates around a date ── */
function getWeekDates(center: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(center);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function JournalHistory() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { journalEntries, isLoading } = useJournal();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const entries = journalEntries ?? [];

  /* Entries for selected day */
  const dayEntries = useMemo(() => {
    const iso = selectedDate.toISOString().split('T')[0];
    return entries
      .filter((e) => e.createdAt.split('T')[0] === iso)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, selectedDate]);

  /* Entry dates set for dot indicators */
  const entryDatesSet = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => s.add(e.createdAt.split('T')[0]));
    return s;
  }, [entries]);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function shiftWeek(dir: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: UI.spacing.sm,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                ...UI.shadow.sm,
              })}
            >
              <MaterialIcons
                name="arrow-back-ios"
                size={16}
                color={colors.text}
                style={{ marginLeft: 4 }}
              />
            </Pressable>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                My Journals
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                {entries.length} entries total
              </Text>
            </View>
          </View>
          {!isToday && (
            <Pressable
              onPress={() => setSelectedDate(new Date())}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: '#8B6B47',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Today</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Calendar Strip */}
      <View
        style={{
          backgroundColor: colors.card,
          marginHorizontal: UI.spacing.xl,
          borderRadius: UI.radius.xl,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          ...UI.shadow.sm,
        }}
      >
        {/* Month + Nav */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Pressable onPress={() => shiftWeek(-1)} hitSlop={10}>
            <MaterialIcons name="chevron-left" size={22} color={colors.mutedText} />
          </Pressable>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{monthYear}</Text>
          <Pressable onPress={() => shiftWeek(1)} hitSlop={10}>
            <MaterialIcons name="chevron-right" size={22} color={colors.mutedText} />
          </Pressable>
        </View>

        {/* Day Cells */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {weekDates.map((d) => {
            const dateStr = d.toISOString().split('T')[0];
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const hasEntry = entryDatesSet.has(dateStr);
            const isTodayDate = d.toDateString() === new Date().toDateString();

            return (
              <Pressable
                key={dateStr}
                onPress={() => setSelectedDate(new Date(d))}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 8,
                  paddingHorizontal: 6,
                  borderRadius: UI.radius.lg,
                  backgroundColor: isSelected ? '#8B6B47' : 'transparent',
                  minWidth: 42,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: isSelected ? 'rgba(255,255,255,0.8)' : colors.subtleText,
                  }}
                >
                  {DAYS[d.getDay()]}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: isSelected ? '#fff' : isTodayDate ? '#8B6B47' : colors.text,
                  }}
                >
                  {d.getDate()}
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: hasEntry ? (isSelected ? '#fff' : '#5B8A5A') : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Day label */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: UI.spacing.xl,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
          {isToday
            ? 'Today'
            : selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
          <Text style={{ fontWeight: '500', color: colors.mutedText }}>
            {' '}
            {'\u00B7'} {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/journal/new',
              params: { date: selectedDate.toISOString() },
            })
          }
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: '#5B8A5A',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <MaterialIcons name="add" size={14} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>New</Text>
        </Pressable>
      </View>

      {/* Entries List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  height: 90,
                  borderRadius: UI.radius.xl,
                  backgroundColor: colors.card,
                  ...UI.shadow.sm,
                }}
              />
            ))}
          </View>
        ) : dayEntries.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              padding: 36,
              backgroundColor: colors.card,
              borderRadius: UI.radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              ...UI.shadow.sm,
            }}
          >
            <MaterialIcons name="menu-book" size={40} color={colors.mutedText} />
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: colors.mutedText, marginTop: 10 }}
            >
              No entries {isToday ? 'yet today' : 'this day'}
            </Text>
            <Text
              style={{ fontSize: 13, color: colors.subtleText, marginTop: 4, textAlign: 'center' }}
            >
              {isToday
                ? 'Start writing to track your mental health journey.'
                : 'Select a date with entries to review them.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {dayEntries.map((entry) => {
              const moodInfo = getMood(entry.mood);
              const wordCount = entry.content ? entry.content.trim().split(/\s+/).length : 0;
              const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });
              const aiSuggestions = wordCount > 30 ? Math.min(3, Math.floor(wordCount / 40)) : 0;

              return (
                <Pressable
                  key={entry.id}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/journal/[id]', params: { id: entry.id } })
                  }
                  style={({ pressed }) => ({
                    backgroundColor: colors.card,
                    borderRadius: UI.radius.xl,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                    ...UI.shadow.sm,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: moodInfo.color + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{moodInfo.emoji}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 16, fontWeight: '700', color: colors.text }}
                        numberOfLines={1}
                      >
                        {entry.title || 'Untitled Entry'}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: colors.mutedText, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {entry.content}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.subtleText }}>{time}</Text>
                      {aiSuggestions > 0 && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: '#7B6DC9' + '15',
                          }}
                        >
                          <MaterialIcons name="auto-awesome" size={10} color="#7B6DC9" />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#7B6DC9' }}>
                            {aiSuggestions} AI
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {((entry.tags && entry.tags.length > 0) || entry.mood) && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 10,
                        marginLeft: 60,
                      }}
                    >
                      {entry.mood && (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: moodInfo.color + '12',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: moodInfo.color }}>
                            {entry.mood}
                          </Text>
                        </View>
                      )}
                      {(entry.tags ?? []).slice(0, 2).map((tag) => (
                        <View
                          key={tag}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: '#8B6B47' + '10',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B6B47' }}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
