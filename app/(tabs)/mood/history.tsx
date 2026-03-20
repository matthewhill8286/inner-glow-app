import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMood } from '@/hooks/useMood';
import { useMoodInsights, MoodInsight } from '@/hooks/useMoodInsights';
import { MoodCheckIn } from '@/lib/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Mood config ── */
const MOOD_META: Record<string, { emoji: string; color: string; label: string }> = {
  Great: { emoji: '😄', color: '#5B8A5A', label: 'Overjoyed' },
  Good: { emoji: '😊', color: '#7EAD7E', label: 'Happy' },
  Okay: { emoji: '😐', color: '#E8985A', label: 'Neutral' },
  Low: { emoji: '😔', color: '#C47A5A', label: 'Sad' },
  Bad: { emoji: '😢', color: '#C45B5B', label: 'Depressed' },
};

const MOOD_KEYS: MoodCheckIn['mood'][] = ['Great', 'Good', 'Okay', 'Low', 'Bad'];

/* ── Category badge config ── */
const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  pattern: { icon: 'insights', label: 'Pattern' },
  suggestion: { icon: 'lightbulb', label: 'Suggestion' },
  affirmation: { icon: 'favorite', label: 'Affirmation' },
  warning: { icon: 'warning-amber', label: 'Heads Up' },
};

type Tab = 'history' | 'suggestions';

export default function MoodHistory() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { moodCheckIns: items, isLoading: loading } = useMood();
  const insets = useSafeAreaInsets();
  const {
    insights,
    summary,
    isLoading: insightsLoading,
    isFetching: insightsFetching,
    isError: insightsError,
    refetch: refetchInsights,
    hasData: hasInsightsData,
  } = useMoodInsights();

  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(initialTab === 'suggestions' ? 'suggestions' : 'history');
  const [filterMood, setFilterMood] = useState<MoodCheckIn['mood'] | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  const visibleInsights = insights.filter((i) => !dismissedInsights.includes(i.id));

  /* ── Filtered items ── */
  const filtered = useMemo(() => {
    if (!filterMood) return items;
    return items.filter((i) => i.mood === filterMood);
  }, [items, filterMood]);

  /* ── Group by date ── */
  const grouped = useMemo(() => {
    const map = new Map<string, MoodCheckIn[]>();
    filtered.forEach((item) => {
      const dateKey = new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(item);
    });
    return Array.from(map.entries());
  }, [filtered]);

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
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 }}>
            My Mood
          </Text>
          {tab === 'history' && (
            <Pressable
              onPress={() => setShowFilter(true)}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: filterMood ? '#8B6B47' + '15' : colors.card,
                borderWidth: 1,
                borderColor: filterMood ? '#8B6B47' + '40' : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                ...UI.shadow.sm,
              })}
            >
              <MaterialIcons name="tune" size={20} color={filterMood ? '#8B6B47' : colors.text} />
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: 0,
            marginTop: 16,
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {(['history', 'suggestions'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
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
                  {t === 'history' ? 'History' : 'AI Suggestions'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'history' ? (
          <>
            {/* Active filter chip */}
            {filterMood && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, color: colors.mutedText }}>Filtered by:</Text>
                <Pressable
                  onPress={() => setFilterMood(null)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: UI.radius.pill,
                    backgroundColor: (MOOD_META[filterMood]?.color ?? '#8B6B47') + '15',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{MOOD_META[filterMood]?.emoji}</Text>
                  <Text
                    style={{ fontSize: 13, fontWeight: '700', color: MOOD_META[filterMood]?.color }}
                  >
                    {MOOD_META[filterMood]?.label}
                  </Text>
                  <MaterialIcons name="close" size={14} color={MOOD_META[filterMood]?.color} />
                </Pressable>
                <Text style={{ fontSize: 12, color: colors.mutedText }}>
                  ({filtered.length} entries)
                </Text>
              </View>
            )}

            {/* Grouped entries */}
            {grouped.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xxl,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  gap: 10,
                  ...UI.shadow.sm,
                }}
              >
                <Text style={{ fontSize: 36 }}>🌙</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  No mood entries yet
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedText, textAlign: 'center' }}>
                  Start tracking your mood to see your history here.
                </Text>
              </View>
            ) : (
              grouped.map(([dateLabel, dayItems]) => (
                <View key={dateLabel}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.mutedText,
                      marginBottom: 10,
                    }}
                  >
                    {dateLabel}
                  </Text>
                  <View style={{ gap: 8 }}>
                    {dayItems.map((item) => {
                      const meta = MOOD_META[item.mood] ?? MOOD_META.Okay;
                      const timeStr = new Date(item.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      });
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
                              width: 50,
                              height: 50,
                              borderRadius: 16,
                              backgroundColor: meta.color + '15',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 26 }}>{meta.emoji}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                              {meta.label}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 3 }}>
                              {timeStr} · Energy {item.energy}/5 · Stress {item.stress}/10
                            </Text>
                            {item.note && (
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: 12,
                                  color: colors.mutedText,
                                  marginTop: 4,
                                  fontStyle: 'italic',
                                }}
                              >
                                "{item.note}"
                              </Text>
                            )}
                          </View>
                          <View
                            style={{
                              width: 4,
                              height: 40,
                              borderRadius: 2,
                              backgroundColor: meta.color,
                            }}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          /* ── AI Insights Tab ── */
          <View style={{ gap: 14 }}>
            {/* Header card */}
            <View
              style={{
                backgroundColor: '#8B6B47' + '08',
                borderRadius: UI.radius.xxl,
                padding: 18,
                borderWidth: 1,
                borderColor: '#8B6B47' + '20',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="auto-awesome" size={20} color="#8B6B47" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#8B6B47' }}>
                  {t('moodInsights.title')}
                </Text>
                {insightsFetching && !insightsLoading && (
                  <ActivityIndicator size="small" color="#8B6B47" style={{ marginLeft: 'auto' }} />
                )}
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedText, marginTop: 8, lineHeight: 20 }}>
                {summary || t('moodInsights.subtitle')}
              </Text>
            </View>

            {/* Loading state */}
            {insightsLoading && (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xxl,
                  padding: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  gap: 14,
                  ...UI.shadow.sm,
                }}
              >
                <ActivityIndicator size="large" color="#8B6B47" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  {t('moodInsights.analyzing')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: 'center' }}>
                  {t('moodInsights.analyzingSubtitle')}
                </Text>
              </View>
            )}

            {/* Error state */}
            {insightsError && !insightsLoading && (
              <View
                style={{
                  backgroundColor: '#C45B5B' + '08',
                  borderRadius: UI.radius.xxl,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: '#C45B5B' + '20',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <MaterialIcons name="error-outline" size={36} color="#C45B5B" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  {t('moodInsights.errorTitle')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: 'center' }}>
                  {t('moodInsights.errorSubtitle')}
                </Text>
                <Pressable
                  onPress={() => refetchInsights()}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#8B6B47',
                    borderRadius: UI.radius.lg,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <MaterialIcons name="refresh" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
                    {t('moodInsights.retry')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* No data state */}
            {!insightsLoading && !insightsError && !hasInsightsData && (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xxl,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  gap: 10,
                  ...UI.shadow.sm,
                }}
              >
                <Text style={{ fontSize: 36 }}>🔮</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  {t('moodInsights.noDataTitle')}
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedText, textAlign: 'center' }}>
                  {t('moodInsights.noDataSubtitle')}
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/mood/check-in')}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#8B6B47',
                    borderRadius: UI.radius.lg,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    marginTop: 6,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <MaterialIcons name="add" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
                    {t('moodInsights.checkInNow')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Insight cards */}
            {!insightsLoading &&
              visibleInsights.map((insight: MoodInsight) => {
                const catMeta = CATEGORY_META[insight.category] ?? CATEGORY_META.suggestion;
                return (
                  <View
                    key={insight.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: UI.radius.xxl,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...UI.shadow.sm,
                    }}
                  >
                    {/* Category badge */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: insight.color + '12',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: UI.radius.pill,
                        alignSelf: 'flex-start',
                        marginBottom: 14,
                      }}
                    >
                      <MaterialIcons
                        name={catMeta.icon as any}
                        size={13}
                        color={insight.color}
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: insight.color }}>
                        {catMeta.label}
                      </Text>
                    </View>

                    {/* Icon + title */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 16,
                          backgroundColor: insight.color + '15',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons
                          name={insight.icon as any}
                          size={24}
                          color={insight.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                          {insight.title}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 22,
                        color: colors.mutedText,
                        marginTop: 14,
                      }}
                    >
                      {insight.description}
                    </Text>

                    {/* Action + dismiss row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      <Pressable
                        onPress={() =>
                          setDismissedInsights((prev) => [...prev, insight.id])
                        }
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          backgroundColor: insight.color + '12',
                          borderRadius: UI.radius.lg,
                          paddingVertical: 13,
                          paddingHorizontal: 18,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <MaterialIcons name="check" size={16} color={insight.color} />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: insight.color }}>
                          {t('moodInsights.gotIt')}
                        </Text>
                      </Pressable>

                      {insight.actionLabel && (
                        <Pressable
                          onPress={() => {
                            const label = (insight.actionLabel || '').toLowerCase();
                            const desc = (insight.description || '').toLowerCase();

                            // Navigate to root-level action screens so "back" returns here
                            if (label.includes('journal') || label.includes('writing') || label.includes('write') || desc.includes('journal')) {
                              router.push('/(suggestion-actions)/journal');
                            } else if (label.includes('sleep') || label.includes('bedtime') || label.includes('rest') || desc.includes('sleep')) {
                              router.push('/(suggestion-actions)/sleep');
                            } else if (label.includes('breath') || label.includes('meditat') || label.includes('mindful') || label.includes('relax') || desc.includes('breathing')) {
                              router.push('/(suggestion-actions)/mindful');
                            } else if (label.includes('stress') || label.includes('boundar') || label.includes('calm') || desc.includes('stress')) {
                              router.push('/(suggestion-actions)/stress');
                            } else if (label.includes('mood') || label.includes('check-in') || label.includes('check in') || label.includes('track')) {
                              router.push('/(suggestion-actions)/check-in');
                            } else if (label.includes('chat') || label.includes('talk') || label.includes('therap')) {
                              router.push('/(suggestion-actions)/chat');
                            } else if (insight.category === 'suggestion') {
                              router.push('/(suggestion-actions)/mindful');
                            } else if (insight.category === 'warning') {
                              router.push('/(suggestion-actions)/stress');
                            } else {
                              router.push('/(suggestion-actions)/check-in');
                            }
                          }}
                          style={({ pressed }) => ({
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: insight.color,
                            borderRadius: UI.radius.lg,
                            paddingVertical: 13,
                            paddingHorizontal: 16,
                            opacity: pressed ? 0.9 : 1,
                          })}
                        >
                          <MaterialIcons name="arrow-forward" size={16} color="#fff" />
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
                            {insight.actionLabel}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}

            {/* Refresh button */}
            {!insightsLoading && hasInsightsData && visibleInsights.length === 0 && (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xxl,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  gap: 10,
                  ...UI.shadow.sm,
                }}
              >
                <MaterialIcons name="check-circle" size={40} color="#5B8A5A" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  {t('moodInsights.allReviewed')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: 'center' }}>
                  {t('moodInsights.allReviewedSubtitle')}
                </Text>
                <Pressable
                  onPress={() => {
                    setDismissedInsights([]);
                    refetchInsights();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#8B6B47',
                    borderRadius: UI.radius.lg,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    marginTop: 6,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <MaterialIcons name="refresh" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
                    {t('moodInsights.generateNew')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Refresh at bottom when insights visible */}
            {!insightsLoading && visibleInsights.length > 0 && (
              <Pressable
                onPress={() => {
                  setDismissedInsights([]);
                  refetchInsights();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <MaterialIcons name="refresh" size={18} color="#8B6B47" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#8B6B47' }}>
                  {t('moodInsights.refreshInsights')}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        onPress={() => router.push('/(tabs)/mood/check-in')}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: insets.bottom + 100,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#8B6B47',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.9 : 1,
          ...UI.shadow.lg,
        })}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>

      {/* ── Filter Modal ── */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowFilter(false)} />
          <View
            style={{
              backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: insets.bottom + 24,
              ...UI.shadow.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>
                Filter Mood
              </Text>
              <Pressable onPress={() => setShowFilter(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Mood Type Filter */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedText,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Select Mood Type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {MOOD_KEYS.map((m) => {
                const meta = MOOD_META[m];
                const active = filterMood === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setFilterMood(active ? null : m)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: UI.radius.pill,
                      borderWidth: 1.5,
                      backgroundColor: active ? meta.color + '15' : 'transparent',
                      borderColor: active ? meta.color + '40' : colors.border,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                  >
                    <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: active ? meta.color : colors.text,
                      }}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Apply Button */}
            <Pressable
              onPress={() => setShowFilter(false)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#8B6B47',
                borderRadius: UI.radius.xl,
                paddingVertical: 18,
                opacity: pressed ? 0.9 : 1,
                ...UI.shadow.md,
              })}
            >
              <MaterialIcons name="filter-list" size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
                Filter Mood ({filtered.length})
              </Text>
            </Pressable>

            {/* Clear filter */}
            {filterMood && (
              <Pressable
                onPress={() => {
                  setFilterMood(null);
                  setShowFilter(false);
                }}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  marginTop: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#C45B5B' }}>
                  Clear Filter
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
