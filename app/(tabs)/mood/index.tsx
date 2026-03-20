import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMood } from '@/hooks/useMood';
import { useMoodInsights, MoodInsight } from '@/hooks/useMoodInsights';
import { MoodCheckIn } from '@/lib/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SkeletonRect } from '@/components/Skeleton';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── Mood config ── */
const MOOD_META: Record<string, { emoji: string; face: string; color: string; bg: string }> = {
  Great: { emoji: '😊', face: '😄', color: '#5B8A5A', bg: '#E8F5E3' },
  Good: { emoji: '🙂', face: '😊', color: '#7EAD7E', bg: '#EDF7ED' },
  Okay: { emoji: '😐', face: '😐', color: '#E8985A', bg: '#FFF3E8' },
  Low: { emoji: '😔', face: '😞', color: '#C47A5A', bg: '#FBEEE6' },
  Bad: { emoji: '😢', face: '😢', color: '#C45B5B', bg: '#FBEBEB' },
};

const MOOD_ORDER: MoodCheckIn['mood'][] = ['Great', 'Good', 'Okay', 'Low', 'Bad'];

function moodScore(m: string) {
  if (m === 'Great') return 5;
  if (m === 'Good') return 4;
  if (m === 'Okay') return 3;
  if (m === 'Low') return 2;
  return 1;
}

export default function MoodIndex() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { moodCheckIns: items, isLoading: loading } = useMood();
  const { insights, isLoading: insightsLoading } = useMoodInsights();
  const insets = useSafeAreaInsets();

  /* ── Bounce animation on hero emoji ── */
  const bounce = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  /* ── Latest mood ── */
  const latest = items.length > 0 ? items[0] : null;
  const latestMeta = latest ? (MOOD_META[latest.mood] ?? MOOD_META.Okay) : MOOD_META.Okay;

  /* ── 7-day timeline data ── */
  const timelineData = useMemo(() => {
    const today = new Date();
    const days: {
      key: string;
      label: string;
      score: number | null;
      mood: string | null;
      isToday: boolean;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const dayItems = items.filter((it) => it.createdAt.split('T')[0] === iso);
      const avg =
        dayItems.length > 0
          ? dayItems.reduce((a, x) => a + moodScore(x.mood), 0) / dayItems.length
          : null;
      const topMood = dayItems.length > 0 ? dayItems[0].mood : null;
      days.push({
        key: iso,
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        score: avg,
        mood: topMood,
        isToday: i === 0,
      });
    }
    return days;
  }, [items]);

  /* ── Mood distribution for donut-like display ── */
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    MOOD_ORDER.forEach((m) => {
      counts[m] = 0;
    });
    items.forEach((it) => {
      counts[it.mood] = (counts[it.mood] || 0) + 1;
    });
    const total = items.length || 1;
    return MOOD_ORDER.map((m) => ({
      mood: m,
      count: counts[m],
      pct: Math.round((counts[m] / total) * 100),
      ...MOOD_META[m],
    }));
  }, [items]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    if (items.length < 2) return null;
    const last14 = items.slice(0, 14);
    const avgMood = last14.reduce((a, x) => a + moodScore(x.mood), 0) / last14.length;
    const avgEnergy = last14.reduce((a, x) => a + x.energy, 0) / last14.length;
    const avgStress = last14.reduce((a, x) => a + x.stress, 0) / last14.length;
    const uniqueDays = new Set(items.map((i) => i.createdAt.split('T')[0])).size;
    return { avgMood, avgEnergy, avgStress, total: items.length, days: uniqueDays };
  }, [items]);

  const maxBarH = 70;

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
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={18}
                color={colors.text}
              />
            </Pressable>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text }}>Mood</Text>
              <Text style={{ fontSize: 14, color: colors.mutedText, marginTop: 2 }}>
                Track how you're feeling
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/mood/history')}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                ...UI.shadow.sm,
              })}
            >
              <MaterialIcons name="history" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/mood/stats')}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                ...UI.shadow.sm,
              })}
            >
              <MaterialIcons name="bar-chart" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ gap: 14, paddingTop: 10 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  height: i === 1 ? 220 : 140,
                  borderRadius: UI.radius.xxl,
                  backgroundColor: colors.card,
                  ...UI.shadow.sm,
                }}
              />
            ))}
          </View>
        ) : (
          <>
            {/* ── Hero Mood Card ── */}
            <View
              style={{
                backgroundColor: theme === 'dark' ? latestMeta.color + '15' : latestMeta.bg,
                borderRadius: UI.radius.xxl,
                padding: 28,
                alignItems: 'center',
                ...UI.shadow.md,
              }}
            >
              <Animated.Text
                style={{
                  fontSize: 72,
                  transform: [{ scale: bounce }],
                }}
              >
                {latest ? latestMeta.face : '😊'}
              </Animated.Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '900',
                  color: latestMeta.color,
                  marginTop: 12,
                }}
              >
                {latest ? latest.mood : 'No Check-in Yet'}
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedText, marginTop: 4 }}>
                {latest
                  ? `Last check-in ${new Date(latest.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                  : 'How are you feeling today?'}
              </Text>

              {/* Quick check-in CTA */}
              <Pressable
                onPress={() => router.push('/(tabs)/mood/check-in')}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: latestMeta.color,
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: UI.radius.pill,
                  marginTop: 20,
                  opacity: pressed ? 0.9 : 1,
                  ...UI.shadow.md,
                })}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Set Mood</Text>
              </Pressable>
            </View>

            {/* ── 7-Day Mood Timeline ── */}
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
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  Mood Timeline
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText }}>
                  Last 7 days
                </Text>
              </View>

              {/* Timeline bars */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                {timelineData.map((day) => {
                  const barH = day.score != null ? Math.max(10, (day.score / 5) * maxBarH) : 8;
                  const barColor = day.mood
                    ? (MOOD_META[day.mood]?.color ?? '#8B6B47')
                    : colors.border;
                  return (
                    <View key={day.key} style={{ alignItems: 'center', flex: 1 }}>
                      {/* Emoji on top if has data */}
                      {day.mood && (
                        <Text style={{ fontSize: 14, marginBottom: 4 }}>
                          {MOOD_META[day.mood]?.emoji ?? '😐'}
                        </Text>
                      )}
                      <View
                        style={{
                          width: 22,
                          height: barH,
                          borderRadius: 11,
                          backgroundColor: barColor,
                          opacity: day.score != null ? 0.85 : 0.15,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: day.isToday ? '800' : '600',
                          color: day.isToday ? '#8B6B47' : colors.mutedText,
                          marginTop: 6,
                        }}
                      >
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Dotted connection line */}
              <View
                style={{
                  position: 'absolute',
                  left: 40,
                  right: 40,
                  top: '50%',
                  height: 1,
                  borderStyle: 'dashed',
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}
              />
            </View>

            {/* ── Mood Distribution ── */}
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
              <Text
                style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 }}
              >
                Mood Distribution
              </Text>
              <View style={{ gap: 10 }}>
                {distribution.map((d) => (
                  <View
                    key={d.mood}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <Text style={{ fontSize: 20 }}>{d.emoji}</Text>
                    <Text
                      style={{ width: 48, fontSize: 13, fontWeight: '700', color: colors.text }}
                    >
                      {d.mood}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.inputBg,
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.max(d.pct, 2)}%` as any,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: d.color,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        width: 36,
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.mutedText,
                        textAlign: 'right',
                      }}
                    >
                      {d.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Quick Stats ── */}
            {stats && (
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
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    Quick Stats
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(tabs)/mood/stats')}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B6B47' }}>
                      See all
                    </Text>
                    <MaterialIcons name="chevron-right" size={16} color="#8B6B47" />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    {
                      label: 'Avg Mood',
                      value: stats.avgMood.toFixed(1),
                      suffix: '/5',
                      color: '#5B8A5A',
                      icon: 'mood' as const,
                    },
                    {
                      label: 'Energy',
                      value: stats.avgEnergy.toFixed(1),
                      suffix: '/5',
                      color: '#E8985A',
                      icon: 'bolt' as const,
                    },
                    {
                      label: 'Stress',
                      value: stats.avgStress.toFixed(1),
                      suffix: '/10',
                      color: '#7B6DC9',
                      icon: 'whatshot' as const,
                    },
                  ].map((stat) => (
                    <View
                      key={stat.label}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 14,
                        borderRadius: UI.radius.lg,
                        backgroundColor: stat.color + '10',
                      }}
                    >
                      <MaterialIcons name={stat.icon} size={20} color={stat.color} />
                      <Text
                        style={{ fontSize: 20, fontWeight: '900', color: stat.color, marginTop: 6 }}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: colors.mutedText,
                          marginTop: 2,
                        }}
                      >
                        {stat.label} {stat.suffix}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── AI Insights Preview ── */}
            {insightsLoading ? (
              <SkeletonRect height={140} borderRadius={UI.radius.xxl} />
            ) : insights.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xxl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: 'hidden',
                  ...UI.shadow.sm,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 18,
                    paddingTop: 18,
                    paddingBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="auto-awesome" size={18} color="#8B6B47" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                      AI Insights
                    </Text>
                    <View
                      style={{
                        backgroundColor: '#8B6B47',
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                        {insights.length}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => router.push('/(tabs)/mood/history?tab=suggestions')}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B6B47' }}>
                      See all
                    </Text>
                    <MaterialIcons name="chevron-right" size={16} color="#8B6B47" />
                  </Pressable>
                </View>

                {/* Preview of first 2 insights */}
                <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 8 }}>
                  {insights.slice(0, 2).map((insight) => (
                    <Pressable
                      key={insight.id}
                      onPress={() => router.push('/(tabs)/mood/history?tab=suggestions')}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        backgroundColor: insight.color + '10',
                        borderRadius: UI.radius.lg,
                        padding: 14,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: insight.color + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons
                          name={(insight.icon as any) || 'lightbulb'}
                          size={18}
                          color={insight.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 14, fontWeight: '700', color: colors.text }}
                          numberOfLines={1}
                        >
                          {insight.title}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {insight.description}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={colors.mutedText} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ── Recent Check-ins ── */}
            {items.length > 0 && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    Recent Check-ins
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(tabs)/mood/history')}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B6B47' }}>
                      View all
                    </Text>
                    <MaterialIcons name="chevron-right" size={16} color="#8B6B47" />
                  </Pressable>
                </View>
                <View style={{ gap: 10 }}>
                  {items.slice(0, 3).map((item) => {
                    const meta = MOOD_META[item.mood] ?? MOOD_META.Okay;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => router.push(`/(tabs)/mood/${item.id}`)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 14,
                          backgroundColor: colors.card,
                          borderRadius: UI.radius.xl,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: colors.border,
                          opacity: pressed ? 0.8 : 1,
                          ...UI.shadow.sm,
                        })}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: meta.color + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                            {item.mood}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' · '}
                            {new Date(item.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 6,
                          }}
                        >
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: UI.radius.sm,
                              backgroundColor: '#5B8A5A15',
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#5B8A5A' }}>
                              ⚡{item.energy}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: UI.radius.sm,
                              backgroundColor: '#C45B5B15',
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#C45B5B' }}>
                              🔥{item.stress}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            width: 4,
                            height: 36,
                            borderRadius: 2,
                            backgroundColor: meta.color,
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
