import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useMood } from '@/hooks/useMood';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { showAlert } from '@/lib/state';
import { toast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';

/* ── Mood metadata ── */
const MOOD_META: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
  Great: { emoji: '🤩', color: '#D4A843', bg: '#D4A843', label: 'Overjoyed' },
  Good: { emoji: '😊', color: '#5B8A5A', bg: '#5B8A5A', label: 'Happy' },
  Okay: { emoji: '😐', color: '#E8985A', bg: '#E8985A', label: 'Neutral' },
  Low: { emoji: '😞', color: '#5A8FB5', bg: '#5A8FB5', label: 'Sad' },
  Bad: { emoji: '😭', color: '#7B6DC9', bg: '#7B6DC9', label: 'Depressed' },
};

/* ── Energy labels ── */
function energyLabel(v: number) {
  if (v <= 1) return 'Very Low';
  if (v <= 2) return 'Low';
  if (v <= 3) return 'Moderate';
  if (v <= 4) return 'High';
  return 'Very High';
}

/* ── Stress labels ── */
function stressLabel(v: number) {
  if (v <= 2) return 'Minimal';
  if (v <= 4) return 'Mild';
  if (v <= 6) return 'Moderate';
  if (v <= 8) return 'High';
  return 'Severe';
}

/* ── AI Insight generation ── */
function getInsights(mood: string, energy: number, stress: number, note?: string) {
  const insights: { icon: string; title: string; text: string; color: string }[] = [];

  // Crisis detection
  const crisisWords = ['suicide', 'kill myself', 'end it all', 'want to die', 'self-harm'];
  if (note && crisisWords.some((w) => note.toLowerCase().includes(w))) {
    insights.push({
      icon: 'warning',
      title: 'Crisis Support Available',
      text: "If you're in crisis, please reach out to the 988 Suicide & Crisis Lifeline. Call or text 988.",
      color: '#C45B5B',
    });
  }

  // Mood-based insights
  if (mood === 'Bad' || mood === 'Low') {
    insights.push({
      icon: 'self-improvement',
      title: 'Try a Mindfulness Exercise',
      text: 'When feeling down, even 5 minutes of deep breathing can help shift your emotional state.',
      color: '#7B6DC9',
    });
  }

  if (stress >= 7) {
    insights.push({
      icon: 'spa',
      title: 'High Stress Detected',
      text: 'Your stress level is elevated. Consider progressive muscle relaxation or a short walk.',
      color: '#E8985A',
    });
  }

  if (energy <= 2) {
    insights.push({
      icon: 'battery-alert',
      title: 'Low Energy Pattern',
      text: 'Low energy can affect mood. Try light exercise, hydration, or a brief power nap.',
      color: '#5A8FB5',
    });
  }

  if (mood === 'Great' || mood === 'Good') {
    insights.push({
      icon: 'star',
      title: 'Great Mood!',
      text: "You're feeling positive! Try to note what contributed to this — it can help on harder days.",
      color: '#5B8A5A',
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: 'lightbulb',
      title: 'Self-Awareness',
      text: 'Tracking your mood consistently helps identify patterns and build emotional resilience.',
      color: '#8B6B47',
    });
  }

  return insights;
}

export default function MoodDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { moodCheckIns, deleteMoodCheckIn } = useMood();
  const insets = useSafeAreaInsets();

  const entry = moodCheckIns.find((e) => e.id === id);
  const meta = entry ? (MOOD_META[entry.mood] ?? MOOD_META.Okay) : MOOD_META.Okay;

  const insights = useMemo(() => {
    if (!entry) return [];
    return getInsights(entry.mood, entry.energy, entry.stress, entry.note);
  }, [entry]);

  const handleDelete = () => {
    showAlert(t('moodDetail.deleteTitle'), t('moodDetail.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMoodCheckIn(id as string);
            toast.success(t('toasts.moodDeleted'));
            router.back();
          } catch (err) {
            console.error('Failed to delete mood check-in:', err);
            toast.error(t('toasts.moodDeleteError'));
          }
        },
      },
    ]);
  };

  /* ── Not Found ── */
  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: UI.spacing.xl,
          }}
        >
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
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            {t('moodDetail.entryNotFound')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedText }}>
            This check-in may have been deleted.
          </Text>
        </View>
      </View>
    );
  }

  const date = new Date(entry.createdAt);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Mood Hero Header ── */}
      <View
        style={{
          backgroundColor: meta.bg,
          paddingTop: insets.top + 6,
          paddingBottom: 30,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: UI.spacing.xl,
            marginBottom: 20,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialIcons name="arrow-back-ios" size={16} color="#fff" style={{ marginLeft: 4 }} />
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialIcons name="delete-outline" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Emoji + mood info */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 80 }}>{meta.emoji}</Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 8 }}>
            {meta.label}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 6,
            }}
          >
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: 100,
          paddingTop: 20,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Energy & Stress Stats ── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Energy */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: UI.radius.xxl,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
              ...UI.shadow.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#5B8A5A15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="bolt" size={18} color="#5B8A5A" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {t('moodDetail.energy')}
              </Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#5B8A5A' }}>
              {entry.energy}
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.mutedText }}>/5</Text>
            </Text>
            <Text
              style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText, marginTop: 4 }}
            >
              {energyLabel(entry.energy)}
            </Text>
            {/* Mini bar */}
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#5B8A5A',
                  width: `${(entry.energy / 5) * 100}%` as any,
                }}
              />
            </View>
          </View>

          {/* Stress */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: UI.radius.xxl,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
              ...UI.shadow.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#E8985A15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="local-fire-department" size={18} color="#E8985A" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {t('moodDetail.stress')}
              </Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#E8985A' }}>
              {entry.stress}
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.mutedText }}>/10</Text>
            </Text>
            <Text
              style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText, marginTop: 4 }}
            >
              {stressLabel(entry.stress)}
            </Text>
            {/* Mini bar */}
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#E8985A',
                  width: `${(entry.stress / 10) * 100}%` as any,
                }}
              />
            </View>
          </View>
        </View>

        {/* ── Tags ── */}
        {entry.tags && entry.tags.length > 0 && (
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
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedText,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              {t('moodDetail.tags')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {entry.tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: UI.radius.pill,
                    backgroundColor: meta.color + '15',
                    borderWidth: 1,
                    borderColor: meta.color + '30',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: meta.color }}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Topic Context ── */}
        {entry.topicContext && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.card,
              borderRadius: UI.radius.xxl,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              ...UI.shadow.sm,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: '#8B6B4715',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="topic" size={18} color="#8B6B47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Context
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 }}>
                {entry.topicContext}
              </Text>
            </View>
          </View>
        )}

        {/* ── Note ── */}
        {entry.note && (
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MaterialIcons name="edit-note" size={20} color={colors.mutedText} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Note
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 24,
                color: colors.text,
                fontStyle: 'italic',
              }}
            >
              "{entry.note}"
            </Text>
          </View>
        )}

        {/* ── AI Insights ── */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              marginTop: 4,
            }}
          >
            <MaterialIcons name="auto-awesome" size={18} color="#8B6B47" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>AI Insights</Text>
          </View>
          <View style={{ gap: 10 }}>
            {insights.map((insight, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderLeftWidth: 3,
                  borderLeftColor: insight.color,
                  ...UI.shadow.sm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: insight.color + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name={insight.icon as any} size={18} color={insight.color} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, flex: 1 }}>
                    {insight.title}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.mutedText,
                    marginTop: 10,
                    marginLeft: 46,
                  }}
                >
                  {insight.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Delete Button ── */}
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: UI.radius.xl,
            backgroundColor: '#C45B5B10',
            borderWidth: 1,
            borderColor: '#C45B5B30',
            opacity: pressed ? 0.8 : 1,
            marginTop: 6,
          })}
        >
          <MaterialIcons name="delete-outline" size={18} color="#C45B5B" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#C45B5B' }}>Delete Check-In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
