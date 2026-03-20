import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useJournal } from '@/hooks/useJournal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Ring progress component ── */
function StatRing({
  value,
  total,
  color,
  label,
  size = 120,
}: Readonly<{
  value: number;
  total: number;
  color: string;
  label: string;
  size?: number;
}>) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const pct = total > 0 ? value / total : 0;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  // We'll approximate with a bordered view
  const circumference = 2 * Math.PI * r;
  const filled = circumference * pct;

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Colored arc overlay (top portion) */}
        <View
          style={{
            position: 'absolute',
            top: -strokeWidth,
            left: -strokeWidth,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: pct > 0.25 ? color : 'transparent',
            borderBottomColor: pct > 0.5 ? color : 'transparent',
            borderLeftColor: pct > 0.75 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>{value}</Text>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color,
          marginTop: 10,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function JournalStats() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { journalEntries, isLoading } = useJournal();
  const insets = useSafeAreaInsets();

  const year = new Date().getFullYear();

  const stats = useMemo(() => {
    const entries = (journalEntries ?? []).filter(
      (e) => new Date(e.createdAt).getFullYear() === year,
    );
    const total = entries.length;
    const positive = entries.filter(
      (e) => e.mood && ['Calm', 'Okay', 'Great', 'Good', 'Happy'].includes(e.mood),
    ).length;
    const negative = entries.filter(
      (e) => e.mood && ['Anxious', 'Sad', 'Angry', 'Overwhelmed', 'Bad', 'Low'].includes(e.mood),
    ).length;
    const untagged = total - positive - negative;

    // Monthly breakdown
    const monthly = Array.from({ length: 12 }, (_, m) => {
      const count = entries.filter((e) => new Date(e.createdAt).getMonth() === m).length;
      return count;
    });

    const avgWords =
      total > 0
        ? Math.round(
            entries.reduce((sum, e) => sum + (e.content?.split(/\s+/).length ?? 0), 0) / total,
          )
        : 0;

    const streak = computeStreak(entries.map((e) => e.createdAt));

    return { total, positive, negative, untagged, monthly, avgWords, streak };
  }, [journalEntries, year]);

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const maxMonthly = Math.max(...stats.monthly, 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: UI.spacing.md,
        }}
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
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
            {t('journalStats.title')}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.mutedText, marginTop: 4, marginLeft: 46 }}>
          Your journal trend for Feb {year}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Circular Stats ── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingHorizontal: UI.spacing.xl,
            paddingVertical: 28,
          }}
        >
          <StatRing
            value={stats.positive}
            total={stats.total || 1}
            color="#5B8A5A"
            label={t('journalStats.positive')}
          />
          <StatRing
            value={stats.negative}
            total={stats.total || 1}
            color="#C45B5B"
            label={t('journalStats.negative')}
          />
          <StatRing
            value={stats.untagged}
            total={stats.total || 1}
            color="#E8985A"
            label={t('journalStats.noMood')}
          />
        </View>

        {/* ── Monthly Bar Chart ── */}
        <View
          style={{
            marginHorizontal: UI.spacing.xl,
            marginTop: 8,
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.sm,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 20 }}>
            {t('journalStats.monthlyOverview')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 120,
            }}
          >
            {stats.monthly.map((count, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 18,
                    borderRadius: 9,
                    height: Math.max(4, (count / maxMonthly) * 100),
                    backgroundColor:
                      count > 0
                        ? i === new Date().getMonth()
                          ? '#8B6B47'
                          : '#5B8A5A'
                        : theme === 'light'
                          ? 'rgba(0,0,0,0.06)'
                          : 'rgba(255,255,255,0.08)',
                  }}
                />
                <Text style={{ fontSize: 9, color: colors.subtleText, marginTop: 6 }}>
                  {MONTHS[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Quick Stats ── */}
        <View style={{ paddingHorizontal: UI.spacing.xl, marginTop: 20, gap: 10 }}>
          {[
            {
              icon: 'edit-note',
              label: t('journalStats.totalJournals'),
              value: `${stats.total}`,
              color: '#8B6B47',
            },
            {
              icon: 'text-fields',
              label: t('journalStats.avgWordCount'),
              value: `${stats.avgWords}`,
              color: '#7B6DC9',
            },
            {
              icon: 'local-fire-department',
              label: t('journalStats.currentStreak'),
              value: `${stats.streak} days`,
              color: '#E8985A',
            },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: colors.card,
                borderRadius: UI.radius.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                ...UI.shadow.sm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: item.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={item.icon as any} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.mutedText }}>{item.label}</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const dayKeys = [...new Set(sorted.map((d) => new Date(d).toDateString()))];
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dayKeys.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (new Date(dayKeys[i]).toDateString() === expected.toDateString()) {
      streak++;
    } else break;
  }
  return streak;
}
