import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMood } from '@/hooks/useMood';
import { MoodCheckIn } from '@/lib/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Mood config ── */
const MOOD_META: Record<string, { emoji: string; color: string; label: string }> = {
  Great: { emoji: '😄', color: '#5B8A5A', label: 'Great' },
  Good: { emoji: '😊', color: '#7EAD7E', label: 'Good' },
  Okay: { emoji: '😐', color: '#E8985A', label: 'Okay' },
  Low: { emoji: '😔', color: '#C47A5A', label: 'Low' },
  Bad: { emoji: '😢', color: '#C45B5B', label: 'Bad' },
};

function moodScore(m: string) {
  if (m === 'Great') return 5;
  if (m === 'Good') return 4;
  if (m === 'Okay') return 3;
  if (m === 'Low') return 2;
  return 1;
}

type Period = '1D' | '1W' | '1M';

export default function MoodStats() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { moodCheckIns: items, isLoading: loading } = useMood();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState<Period>('1W');

  /* ── Filter items by period ── */
  const filtered = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (period === '1D') {
      cutoff = new Date(now);
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === '1W') {
      cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff = new Date(now);
      cutoff.setMonth(now.getMonth() - 1);
    }
    return items.filter((i) => new Date(i.createdAt) >= cutoff);
  }, [items, period]);

  /* ── Bar chart data ── */
  const barData = useMemo(() => {
    if (period === '1D') {
      // Group by hour
      const hours: { label: string; items: MoodCheckIn[] }[] = [];
      for (let h = 6; h <= 23; h += 3) {
        const label = h <= 12 ? `${h}AM` : `${h - 12}PM`;
        const hourItems = filtered.filter((i) => {
          const hr = new Date(i.createdAt).getHours();
          return hr >= h && hr < h + 3;
        });
        hours.push({ label, items: hourItems });
      }
      return hours.map((h) => ({
        label: h.label,
        avg:
          h.items.length > 0
            ? h.items.reduce((a, x) => a + moodScore(x.mood), 0) / h.items.length
            : null,
        count: h.items.length,
        mood: h.items.length > 0 ? h.items[0].mood : null,
      }));
    } else if (period === '1W') {
      const today = new Date();
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const iso = d.toISOString().split('T')[0];
        const dayItems = filtered.filter((it) => it.createdAt.split('T')[0] === iso);
        return {
          label: i === 6 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
          avg:
            dayItems.length > 0
              ? dayItems.reduce((a, x) => a + moodScore(x.mood), 0) / dayItems.length
              : null,
          count: dayItems.length,
          mood: dayItems.length > 0 ? dayItems[0].mood : null,
        };
      });
    } else {
      // Monthly — group by week
      const today = new Date();
      const weeks: { label: string; items: MoodCheckIn[] }[] = [];
      for (let w = 3; w >= 0; w--) {
        const start = new Date(today);
        start.setDate(today.getDate() - (w + 1) * 7);
        const end = new Date(today);
        end.setDate(today.getDate() - w * 7);
        const weekItems = filtered.filter((i) => {
          const d = new Date(i.createdAt);
          return d >= start && d < end;
        });
        weeks.push({
          label: `W${4 - w}`,
          items: weekItems,
        });
      }
      return weeks.map((w) => ({
        label: w.label,
        avg:
          w.items.length > 0
            ? w.items.reduce((a, x) => a + moodScore(x.mood), 0) / w.items.length
            : null,
        count: w.items.length,
        mood: w.items.length > 0 ? w.items[0].mood : null,
      }));
    }
  }, [filtered, period]);

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    if (filtered.length === 0) return null;
    const avgMood = filtered.reduce((a, x) => a + moodScore(x.mood), 0) / filtered.length;
    const avgEnergy = filtered.reduce((a, x) => a + x.energy, 0) / filtered.length;
    const avgStress = filtered.reduce((a, x) => a + x.stress, 0) / filtered.length;

    // Most common mood
    const counts: Record<string, number> = {};
    filtered.forEach((i) => {
      counts[i.mood] = (counts[i.mood] || 0) + 1;
    });
    let topMood = 'Okay';
    let topCount = 0;
    Object.entries(counts).forEach(([m, c]) => {
      if (c > topCount) {
        topMood = m;
        topCount = c;
      }
    });

    return { avgMood, avgEnergy, avgStress, total: filtered.length, topMood, topCount };
  }, [filtered]);

  const maxBarH = 100;

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
              {t('moodStats.title')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedText }}>{t('moodStats.subtitle')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Period Tabs ── */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {(['1D', '1W', '1M'] as Period[]).map((p) => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: UI.radius.lg,
                  backgroundColor: active ? '#8B6B47' : 'transparent',
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: active ? '#fff' : colors.mutedText,
                  }}
                >
                  {p === '1D'
                    ? t('moodStats.oneDay')
                    : p === '1W'
                      ? t('moodStats.oneWeek')
                      : t('moodStats.oneMonth')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Bar Chart ── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: UI.radius.xxl,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.sm,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
              {t('moodStats.moodChart')}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText }}>
              {filtered.length} {t('moodStats.checkIn', { count: filtered.length })}
            </Text>
          </View>

          {/* Y-axis labels + bars */}
          <View style={{ flexDirection: 'row' }}>
            {/* Y labels */}
            <View
              style={{
                justifyContent: 'space-between',
                height: maxBarH,
                marginRight: 8,
                paddingBottom: 2,
              }}
            >
              <Text style={{ fontSize: 10, color: colors.mutedText }}>5</Text>
              <Text style={{ fontSize: 10, color: colors.mutedText }}>3</Text>
              <Text style={{ fontSize: 10, color: colors.mutedText }}>1</Text>
            </View>

            {/* Bars */}
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
              }}
            >
              {barData.map((bar, idx) => {
                const h = bar.avg != null ? Math.max(8, (bar.avg / 5) * maxBarH) : 6;
                const barColor = bar.mood
                  ? (MOOD_META[bar.mood]?.color ?? '#8B6B47')
                  : colors.border;
                return (
                  <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: period === '1D' ? 16 : 22,
                        height: h,
                        borderRadius: 11,
                        backgroundColor: barColor,
                        opacity: bar.avg != null ? 0.85 : 0.12,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '600',
                        color: colors.mutedText,
                        marginTop: 8,
                      }}
                    >
                      {bar.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Gridlines */}
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 40,
                right: 18,
                top: 56 + i * (maxBarH / 2),
                height: 1,
                backgroundColor: colors.border,
                opacity: 0.3,
              }}
            />
          ))}
        </View>

        {/* ── Summary Cards ── */}
        {summary && (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  ...UI.shadow.sm,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#5B8A5A' }}>
                  {summary.avgMood.toFixed(1)}
                </Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: colors.mutedText, marginTop: 4 }}
                >
                  {t('moodStats.avgMood')}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  ...UI.shadow.sm,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#E8985A' }}>
                  {summary.avgEnergy.toFixed(1)}
                </Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: colors.mutedText, marginTop: 4 }}
                >
                  {t('moodStats.avgEnergy')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  ...UI.shadow.sm,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#7B6DC9' }}>
                  {summary.avgStress.toFixed(1)}
                </Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: colors.mutedText, marginTop: 4 }}
                >
                  {t('moodStats.avgStress')}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  ...UI.shadow.sm,
                }}
              >
                <Text style={{ fontSize: 28 }}>{MOOD_META[summary.topMood]?.emoji ?? '😐'}</Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: colors.mutedText, marginTop: 4 }}
                >
                  {t('moodStats.mostCommon')}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Mood Entries List ── */}
        {filtered.length > 0 && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 }}>
              {t('moodStats.checkIns')} ({filtered.length})
            </Text>
            <View style={{ gap: 8 }}>
              {filtered.slice(0, 10).map((item) => {
                const meta = MOOD_META[item.mood] ?? MOOD_META.Okay;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/(tabs)/mood/${item.id}`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: colors.card,
                      borderRadius: UI.radius.lg,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: meta.color + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                        {meta.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' · '}
                        {new Date(item.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {' · '}Energy {item.energy} · Stress {item.stress}
                      </Text>
                    </View>
                    <View
                      style={{ width: 4, height: 28, borderRadius: 2, backgroundColor: meta.color }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
