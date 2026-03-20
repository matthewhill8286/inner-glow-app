import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useJournal } from '@/hooks/useJournal';
import { JournalEntry } from '@/lib/types';
import { showAlert } from '@/lib/state';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Mood config ── */
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

/* ── AI Pattern Detection ── */
const CRISIS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end it all',
  'no reason to live',
  'self-harm',
  'hurt myself',
];

const NEGATIVE_PATTERNS = [
  'hopeless',
  'worthless',
  "can't go on",
  'exhausted',
  'overwhelmed',
  'panic',
  'terrified',
  'trapped',
];

function detectPatterns(content: string, mood?: string | null) {
  const lower = (content || '').toLowerCase();
  const hasCrisis = CRISIS_KEYWORDS.some((k) => lower.includes(k));
  const hasNegative = NEGATIVE_PATTERNS.some((k) => lower.includes(k));
  const negativeMoods = ['Sad', 'Angry', 'Anxious', 'Overwhelmed', 'Bad', 'Low'];
  const moodIsNegative = mood ? negativeMoods.includes(mood) : false;
  return { hasCrisis, hasNegative: hasNegative || moodIsNegative };
}

/* ── AI Insight generator ── */
function getAiInsights(mood?: string | null, content?: string | null): string[] {
  const insights: string[] = [];
  const lower = (content || '').toLowerCase();

  if (mood === 'Anxious' || lower.includes('anxious') || lower.includes('worried')) {
    insights.push('Consider trying a 4-7-8 breathing exercise to manage anxiety.');
  }
  if (mood === 'Sad' || lower.includes('sad') || lower.includes('lonely')) {
    insights.push('Reaching out to a friend or loved one can help when feeling down.');
  }
  if (mood === 'Angry' || lower.includes('angry') || lower.includes('frustrated')) {
    insights.push('Physical activity like a short walk can help release tension.');
  }
  if (mood === 'Overwhelmed' || lower.includes('overwhelm') || lower.includes('stress')) {
    insights.push('Try breaking tasks into smaller steps to feel more in control.');
  }
  if (mood === 'Calm' || mood === 'Happy' || mood === 'Great' || mood === 'Good') {
    insights.push(
      'Great to see you in a positive headspace! Consider noting what contributed to this feeling.',
    );
  }
  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired')) {
    insights.push(
      'Sleep plays a crucial role in mental health. Try maintaining a consistent bedtime routine.',
    );
  }
  if (lower.includes('work') || lower.includes('job') || lower.includes('career')) {
    insights.push(
      'Setting healthy boundaries at work can improve both productivity and wellbeing.',
    );
  }
  if (insights.length === 0) {
    insights.push('Journaling regularly helps build self-awareness and emotional resilience.');
  }
  return insights.slice(0, 3);
}

/* ── Mood selector for edit mode ── */
const MOODS = ['Calm', 'Okay', 'Anxious', 'Sad', 'Angry', 'Overwhelmed'];

export default function JournalDetail() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    journalEntries: entries,
    upsertJournalEntry,
    deleteJournalEntry,
    isLoading: loading,
  } = useJournal();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<string | null>(null);

  useEffect(() => {
    if (entries && entries.length > 0) {
      const found = entries.find((e) => e.id === id);
      if (found) setEntry(found);
    }
  }, [entries, id]);

  function startEdit() {
    if (!entry) return;
    setEditTitle(entry.title || '');
    setEditContent(entry.content || '');
    setEditMood(entry.mood ?? null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    if (!entry) return;
    await upsertJournalEntry({
      ...entry,
      title: editTitle.trim() || 'Untitled',
      content: editContent.trim(),
      mood: editMood,
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  }

  async function remove() {
    showAlert(t('journalDetail.deleteTitle'), t('journalDetail.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteJournalEntry(String(id));
          router.back();
        },
      },
    ]);
  }

  const patterns = useMemo(
    () =>
      entry
        ? detectPatterns(entry.content || '', entry.mood)
        : { hasCrisis: false, hasNegative: false },
    [entry],
  );

  const aiInsights = useMemo(
    () => (entry ? getAiInsights(entry.mood, entry.content) : []),
    [entry],
  );

  const moodInfo = getMood(entry?.mood);
  const wordCount = entry?.content ? entry.content.trim().split(/\s+/).length : 0;

  /* ── Loading / Not Found ── */
  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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
              {loading ? t('journalDetail.loading') : t('journalDetail.entryNotFound')}
            </Text>
          </View>
        </View>
        {loading && (
          <View style={{ paddingHorizontal: UI.spacing.xl, gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  height: i === 3 ? 200 : 80,
                  borderRadius: UI.radius.xl,
                  backgroundColor: colors.card,
                  ...UI.shadow.sm,
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

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
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
              {editing ? t('journalDetail.editEntry') : t('journalDetail.journalEntry')}
            </Text>
          </View>

          {/* Mood badge in header */}
          {entry.mood && !editing && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: UI.radius.pill,
                backgroundColor: moodInfo.color + '15',
              }}
            >
              <Text style={{ fontSize: 14 }}>{moodInfo.emoji}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: moodInfo.color }}>
                {entry.mood}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 100, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Crisis Alert ── */}
        {patterns.hasCrisis && (
          <View
            style={{
              backgroundColor: '#C45B5B',
              borderRadius: UI.radius.xl,
              padding: 18,
              ...UI.shadow.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <MaterialIcons name="warning" size={24} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', flex: 1 }}>
                {t('journalDetail.crisisTitle')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 20,
                marginBottom: 14,
              }}
            >
              {t('journalDetail.crisisMessage')}
            </Text>
            <Pressable
              onPress={() => Linking.openURL('tel:988')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#fff',
                borderRadius: UI.radius.lg,
                paddingVertical: 14,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <MaterialIcons name="phone" size={20} color="#C45B5B" />
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#C45B5B' }}>
                {t('journalDetail.callForHelp')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Warning Card ── */}
        {!patterns.hasCrisis && patterns.hasNegative && (
          <View
            style={{
              backgroundColor: '#E8985A' + '15',
              borderRadius: UI.radius.xl,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E8985A' + '30',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#E8985A' + '25',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="sentiment-dissatisfied" size={20} color="#E8985A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#E8985A' }}>
                  {t('journalDetail.strugglingTitle')}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                  {t('journalDetail.strugglingMessage')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Date & Meta ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
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
              backgroundColor: '#8B6B47' + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="today" size={22} color="#8B6B47" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{dateStr}</Text>
            <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
              {timeStr} · {wordCount} words
            </Text>
          </View>
        </View>

        {/* ── Meta Chips ── */}
        {(entry.mood || (entry.tags && entry.tags.length > 0)) && !editing && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {entry.mood && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: UI.radius.pill,
                  backgroundColor: moodInfo.color + '12',
                }}
              >
                <Text style={{ fontSize: 14 }}>{moodInfo.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: moodInfo.color }}>
                  {entry.mood}
                </Text>
              </View>
            )}
            {(entry.tags ?? []).map((tag) => (
              <View
                key={tag}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: UI.radius.pill,
                  backgroundColor: '#8B6B47' + '10',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#8B6B47' }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Content (view or edit) ── */}
        {editing ? (
          <>
            {/* Edit Title */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: UI.radius.xl,
                padding: 16,
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
                  marginBottom: 8,
                }}
              >
                {t('journalDetail.titleLabel')}
              </Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder={t('journalDetail.titlePlaceholder')}
                placeholderTextColor={colors.placeholder}
                style={{ fontSize: 18, fontWeight: '700', color: colors.text, paddingVertical: 4 }}
              />
            </View>

            {/* Edit Content */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: UI.radius.xl,
                padding: 16,
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
                  marginBottom: 8,
                }}
              >
                {t('journalDetail.contentLabel')}
              </Text>
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                placeholder={t('journalDetail.contentPlaceholder')}
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
                style={{
                  fontSize: 15,
                  lineHeight: 24,
                  color: colors.text,
                  minHeight: 200,
                  paddingVertical: 4,
                }}
              />
            </View>

            {/* Edit Mood */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: UI.radius.xl,
                padding: 16,
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
                {t('journalDetail.moodLabel')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {MOODS.map((m) => {
                  const mi = getMood(m);
                  const active = editMood === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setEditMood(active ? null : m)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: UI.radius.pill,
                        borderWidth: 1.5,
                        backgroundColor: active ? mi.color + '15' : colors.card,
                        borderColor: active ? mi.color + '40' : colors.border,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      })}
                    >
                      <Text style={{ fontSize: 16 }}>{mi.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: active ? mi.color : colors.mutedText,
                        }}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save / Cancel */}
            <View style={{ gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={saveEdit}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#5B8A5A',
                  borderRadius: UI.radius.xl,
                  paddingVertical: 18,
                  opacity: pressed ? 0.9 : 1,
                  ...UI.shadow.md,
                })}
              >
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
                  {t('journalDetail.saveChanges')}
                </Text>
              </Pressable>

              <Pressable
                onPress={cancelEdit}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <MaterialIcons name="close" size={20} color={colors.text} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  {t('journalDetail.cancel')}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* Title */}
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>
              {entry.title || t('journalDetail.untitledEntry')}
            </Text>

            {/* Content Card */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: UI.radius.xl,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                ...UI.shadow.sm,
              }}
            >
              <Text style={{ fontSize: 15, lineHeight: 26, color: colors.text }}>
                {entry.content || t('journalDetail.noContent')}
              </Text>
            </View>

            {/* ── AI Insights ── */}
            {aiInsights.length > 0 && (
              <View
                style={{
                  backgroundColor: '#7B6DC9' + '08',
                  borderRadius: UI.radius.xl,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#7B6DC9' + '20',
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}
                >
                  <MaterialIcons name="auto-awesome" size={18} color="#7B6DC9" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#7B6DC9' }}>
                    {t('journalDetail.aiInsights')}
                  </Text>
                </View>
                {aiInsights.map((insight, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      marginBottom: i < aiInsights.length - 1 ? 12 : 0,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#7B6DC9' + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#7B6DC9' }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: colors.text }}>
                      {insight}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Action Buttons ── */}
            <View style={{ gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={startEdit}
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
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
                  {t('journalDetail.editEntry')}
                </Text>
              </Pressable>

              <Pressable
                onPress={remove}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.xl,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderColor: '#C45B5B' + '30',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <MaterialIcons name="delete-outline" size={20} color="#C45B5B" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#C45B5B' }}>
                  {t('journalDetail.deleteEntry')}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
