import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useJournal } from '@/hooks/useJournal';
import { JournalEntry } from '@/lib/types';
import { JOURNAL_PROMPTS } from '@/data/journalPrompts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Emotions grid ── */
const EMOTIONS: { label: string; emoji: string; color: string }[] = [
  { label: 'Angry', emoji: '\uD83D\uDE21', color: '#C45B5B' },
  { label: 'Sad', emoji: '\uD83D\uDE22', color: '#5A8FB5' },
  { label: 'Anxious', emoji: '\uD83D\uDE1F', color: '#7B6DC9' },
  { label: 'Okay', emoji: '\uD83D\uDE42', color: '#E8985A' },
  { label: 'Calm', emoji: '\uD83D\uDE0C', color: '#5B8A5A' },
  { label: 'Happy', emoji: '\uD83D\uDE04', color: '#8B6B47' },
];

/* ── Disease / tag chips ── */
const TAGS = [
  'Loneliness',
  'Money Issue',
  'Family',
  'Work',
  'Relationships',
  'Health',
  'Self-esteem',
  'Grief',
  'Burnout',
  'Sleep',
];

export default function NewJournalEntry() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { promptId, date } = useLocalSearchParams<{ promptId?: string; date?: string }>();
  const prompt = useMemo(() => JOURNAL_PROMPTS.find((p) => p.id === promptId), [promptId]);

  /* Step: 'pick' = type picker, 'form' = text journal form */
  const [step, setStep] = useState<'pick' | 'form'>(prompt ? 'form' : 'pick');

  const [title, setTitle] = useState(prompt ? prompt.title : '');
  const [body, setBody] = useState(prompt ? prompt.prompt + '\n\n' : '');
  const [mood, setMood] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { createJournalEntry } = useJournal();
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const displayDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function save() {
    const entryInput: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      title: (title || 'Untitled').trim(),
      content: body.trim(),
      mood,
      tags: selectedTags,
    };
    await createJournalEntry(entryInput as any);
    router.replace('/(tabs)/journal');
  }

  const canSave = title.trim().length > 0 || body.trim().length > 0;

  /* ═══════════════════════════════════════════════
     STEP 1 — Type Picker (Voice vs Text)
     ═══════════════════════════════════════════════ */
  if (step === 'pick') {
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
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>New Journal</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.mutedText, marginTop: 4, marginLeft: 46 }}>
            Choose how you'd like to journal
          </Text>
        </View>

        {/* Cards */}
        <View
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal: UI.spacing.xl, gap: 16 }}
        >
          {/* Voice Journal */}
          <Pressable
            onPress={() => router.push('/(tabs)/journal/voice')}
            style={({ pressed }) => ({
              backgroundColor: '#7B6DC9',
              borderRadius: UI.radius.xxl,
              padding: 28,
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.9 : 1,
              ...UI.shadow.md,
            })}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="mic" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Voice Journal</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
              Record your thoughts and we'll transcribe them for you
            </Text>
          </Pressable>

          {/* Text Journal */}
          <Pressable
            onPress={() => setStep('form')}
            style={({ pressed }) => ({
              backgroundColor: '#5B8A5A',
              borderRadius: UI.radius.xxl,
              padding: 28,
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.9 : 1,
              ...UI.shadow.md,
            })}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="edit-note" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Text Journal</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
              Write your thoughts down at your own pace
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ═══════════════════════════════════════════════
     STEP 2 — Text Journal Form
     ═══════════════════════════════════════════════ */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={'padding'}
    >
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
              onPress={() => (prompt ? router.back() : setStep('pick'))}
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
              Add New Journal
            </Text>
          </View>

          {/* Feeling indicator */}
          {mood && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: UI.radius.pill,
                backgroundColor:
                  (EMOTIONS.find((e) => e.label === mood)?.color ?? '#8B6B47') + '15',
              }}
            >
              <Text style={{ fontSize: 14 }}>{EMOTIONS.find((e) => e.label === mood)?.emoji}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: EMOTIONS.find((e) => e.label === mood)?.color ?? colors.text,
                }}
              >
                Feeling {mood}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 100, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Prompt banner */}
        {prompt && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: UI.radius.lg,
              backgroundColor: '#7B6DC9' + '12',
              borderWidth: 1,
              borderColor: '#7B6DC9' + '25',
            }}
          >
            <Text style={{ fontSize: 14 }}>{'\uD83D\uDCA1'}</Text>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: '600',
                color: '#7B6DC9',
                fontStyle: 'italic',
              }}
              numberOfLines={2}
            >
              {prompt.prompt}
            </Text>
          </View>
        )}

        {/* Title */}
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
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your journal a title..."
            placeholderTextColor={colors.placeholder}
            style={{ fontSize: 18, fontWeight: '700', color: colors.text, paddingVertical: 4 }}
          />
        </View>

        {/* Timeline / Date */}
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
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#8B6B47' + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="today" size={20} color="#8B6B47" />
          </View>
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedText,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Timeline
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 }}>
              {displayDate}
            </Text>
          </View>
        </View>

        {/* Content */}
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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedText,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Your Thoughts
            </Text>
            {wordCount > 0 && (
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.subtleText }}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </Text>
            )}
          </View>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Start writing — no judgement, just you..."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
            style={{
              fontSize: 15,
              lineHeight: 24,
              color: colors.text,
              minHeight: 160,
              paddingVertical: 4,
            }}
          />
        </View>

        {/* Emotion Selector */}
        <View>
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
            How are you feeling?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {EMOTIONS.map((e) => {
              const active = mood === e.label;
              return (
                <Pressable
                  key={e.label}
                  onPress={() => setMood(active ? null : e.label)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    paddingVertical: 12,
                    paddingHorizontal: 6,
                    borderRadius: UI.radius.lg,
                    borderWidth: 1.5,
                    width: '30%' as any,
                    flexGrow: 1,
                    backgroundColor: active ? e.color + '15' : colors.card,
                    borderColor: active ? e.color + '40' : colors.border,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 28 }}>{e.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: active ? e.color : colors.mutedText,
                    }}
                  >
                    {e.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Disease / Tag Selector */}
        <View>
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
            What's this about?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: UI.radius.pill,
                    borderWidth: 1.5,
                    backgroundColor: active ? '#8B6B47' + '12' : colors.card,
                    borderColor: active ? '#8B6B47' + '40' : colors.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: active ? '#8B6B47' : colors.mutedText,
                    }}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Journal CTA */}
        <Pressable
          onPress={canSave ? save : undefined}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: canSave ? '#5B8A5A' : colors.card,
            borderRadius: UI.radius.xl,
            paddingVertical: 18,
            marginTop: 8,
            opacity: pressed && canSave ? 0.9 : 1,
            borderWidth: canSave ? 0 : 1,
            borderColor: colors.border,
            ...UI.shadow.md,
          })}
        >
          <MaterialIcons
            name="check-circle"
            size={22}
            color={canSave ? '#fff' : colors.placeholder}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: canSave ? '#fff' : colors.placeholder,
            }}
          >
            Create Journal
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
