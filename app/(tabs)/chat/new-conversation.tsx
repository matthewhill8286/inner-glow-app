import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTopics } from '@/hooks/useTopics';
import { useChat } from '@/hooks/useChat';
import { getPersona, getTopicKeyPrefix } from '@/lib/chat';
import { buildChatKey, buildNewChatKey } from '@/lib/chatKeys';

/* ── safe back navigation ────────────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

/* ── suggestion categories ───────────────────────── */
const PERSONA_EMOJIS: Record<string, [string, string, string]> = {
  freud: ['💭', '🤲', '🧘'],
  calm:  ['🌿', '🧘', '🌊'],
  sleep: ['🌙', '😴', '🛏️'],
  mood:  ['🎭', '💡', '🌈'],
};

const TOPIC_EMOJIS: Record<string, [string, string, string]> = {
  topic_anxiety:      ['😰', '🧠', '🌬️'],
  topic_depression:   ['💙', '🌱', '☀️'],
  topic_stress:       ['🔥', '⚖️', '🧘'],
  topic_sleep:        ['🌙', '🛏️', '😴'],
  topic_relationships:['💬', '🤝', '❤️'],
  topic_selfEsteem:   ['🪞', '💪', '⭐'],
  topic_grief:        ['🕊️', '💐', '🌅'],
  topic_anger:        ['🌋', '🧊', '🎯'],
  topic_mindfulness:  ['🧘', '🌿', '🔔'],
  topic_motivation:   ['🚀', '🎯', '💡'],
};

const getSuggestionGroups = (t: any, personaId: string = 'freud', topicPrefix?: string) => {
  // If a topic-specific prefix is available, use topic suggestions
  if (topicPrefix) {
    const emojis = TOPIC_EMOJIS[topicPrefix] ?? PERSONA_EMOJIS[personaId] ?? PERSONA_EMOJIS.freud;
    return [
      {
        label: t(`chatNew.${topicPrefix}_feelingLabel`),
        emoji: emojis[0],
        suggestions: [
          t(`chatNew.${topicPrefix}_suggestion_feeling_1`),
          t(`chatNew.${topicPrefix}_suggestion_feeling_2`),
          t(`chatNew.${topicPrefix}_suggestion_feeling_3`),
          t(`chatNew.${topicPrefix}_suggestion_feeling_4`),
        ],
      },
      {
        label: t(`chatNew.${topicPrefix}_needHelpLabel`),
        emoji: emojis[1],
        suggestions: [
          t(`chatNew.${topicPrefix}_suggestion_help_1`),
          t(`chatNew.${topicPrefix}_suggestion_help_2`),
          t(`chatNew.${topicPrefix}_suggestion_help_3`),
          t(`chatNew.${topicPrefix}_suggestion_help_4`),
        ],
      },
      {
        label: t(`chatNew.${topicPrefix}_guideMeLabel`),
        emoji: emojis[2],
        suggestions: [
          t(`chatNew.${topicPrefix}_suggestion_guide_1`),
          t(`chatNew.${topicPrefix}_suggestion_guide_2`),
          t(`chatNew.${topicPrefix}_suggestion_guide_3`),
          t(`chatNew.${topicPrefix}_suggestion_guide_4`),
        ],
      },
    ];
  }

  // Fall back to persona-specific suggestions
  const prefix = personaId === 'freud' ? '' : `${personaId}_`;
  const emojis = PERSONA_EMOJIS[personaId] ?? PERSONA_EMOJIS.freud;

  return [
    {
      label: t(`chatNew.${prefix}feelingLabel`),
      emoji: emojis[0],
      suggestions: [
        t(`chatNew.${prefix}suggestion_feeling_1`),
        t(`chatNew.${prefix}suggestion_feeling_2`),
        t(`chatNew.${prefix}suggestion_feeling_3`),
        t(`chatNew.${prefix}suggestion_feeling_4`),
      ],
    },
    {
      label: t(`chatNew.${prefix}needHelpLabel`),
      emoji: emojis[1],
      suggestions: [
        t(`chatNew.${prefix}suggestion_help_1`),
        t(`chatNew.${prefix}suggestion_help_2`),
        t(`chatNew.${prefix}suggestion_help_3`),
        t(`chatNew.${prefix}suggestion_help_4`),
      ],
    },
    {
      label: t(`chatNew.${prefix}guideMeLabel`),
      emoji: emojis[2],
      suggestions: [
        t(`chatNew.${prefix}suggestion_guide_1`),
        t(`chatNew.${prefix}suggestion_guide_2`),
        t(`chatNew.${prefix}suggestion_guide_3`),
        t(`chatNew.${prefix}suggestion_guide_4`),
      ],
    },
  ];
};

export default function NewConversationScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const {
    from,
    initialMessage,
    persona: personaParam,
    topicName: topicNameParam,
  } = useLocalSearchParams<{
    from?: string;
    initialMessage?: string;
    persona?: string;
    topicName?: string;
  }>();
  const { topics } = useTopics();
  const { isLoading: chatLoading } = useChat();
  const persona = getPersona(personaParam);
  const topicPrefix = topicNameParam ? getTopicKeyPrefix(topicNameParam) : undefined;

  const [inputText, setInputText] = useState(initialMessage || '');
  const inputRef = useRef<TextInput>(null);

  function handleStart(message?: string) {
    const text = (message || inputText).trim();
    if (!text || chatLoading) return;

    router.push({
      pathname: '/(tabs)/chat/[issueKey]',
      params: {
        issueKey: buildNewChatKey(persona.id),
        from: '/(tabs)/chat',
        initialMessage: text,
        persona: persona.id,
      },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {/* ── Header ──────────────────────────────── */}
        <View style={[s.header, { marginTop: insets.top + 14 }]}>
          <Pressable
            onPress={() => goBack(from)}
            style={({ pressed }) => [
              s.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons
              name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
              size={18}
              color={colors.text}
            />
          </Pressable>
          <View style={[s.headerAvatarWrap, { backgroundColor: persona.color + '15' }]}>
            <Text style={{ fontSize: 20 }}>{persona.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>{t('chatNew.title')}</Text>
            <Text style={[s.headerSub, { color: colors.mutedText }]}>
              {persona.name} · {persona.speciality}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── AI Welcome Card ──────────────────── */}
          <View style={[s.welcomeCard, { backgroundColor: persona.color }]}>
            <View style={[s.welcomeCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            <View style={[s.welcomeCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />

            <View style={s.welcomeAvatarWrap}>
              <Text style={{ fontSize: 44 }}>{persona.emoji}</Text>
            </View>
            <Text style={s.welcomeTitle}>{persona.name}</Text>
            <Text style={s.welcomeSub}>{persona.speciality}</Text>
          </View>

          {/* ── Limited Knowledge notice ─────────── */}
          <View
            style={[s.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={s.noticeHeader}>
              <MaterialIcons name="info-outline" size={16} color="#E8985A" />
              <Text style={[s.noticeTitle, { color: colors.text }]}>
                {t('chatNew.limitedKnowledge')}
              </Text>
            </View>
            <Text style={[s.noticeText, { color: colors.mutedText }]}>
              {t('chatNew.limitedKnowledgeMessage')}
            </Text>
          </View>

          {/* ── Suggestions ──────────────────────── */}
          {getSuggestionGroups(t, persona.id, topicPrefix).map((group, gi) => (
            <View key={gi}>
              <View style={s.groupHeader}>
                <Text style={{ fontSize: 16 }}>{group.emoji}</Text>
                <Text style={[s.groupLabel, { color: colors.text }]}>{group.label}</Text>
              </View>
              <View style={s.suggestionsWrap}>
                {group.suggestions.map((sug, si) => (
                  <Pressable
                    key={si}
                    onPress={() => handleStart(sug)}
                    style={({ pressed }) => [
                      s.suggestionBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <Text style={[s.suggestionBtnText, { color: colors.text }]}>{sug}</Text>
                    <MaterialIcons name="arrow-forward-ios" size={12} color={colors.subtleText} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* ── Topic Shortcuts ──────────────────── */}
          {topics.length > 0 && (
            <>
              <View style={s.groupHeader}>
                <Text style={{ fontSize: 16 }}>📋</Text>
                <Text style={[s.groupLabel, { color: colors.text }]}>{t('chatNew.pickTopic')}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.topicChipsRow}
              >
                {topics.map((topic: any) => (
                  <Pressable
                    key={topic.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/chat/[issueKey]',
                        params: {
                          issueKey: buildChatKey(persona.id, topic.id),
                          from: '/(tabs)/chat',
                          persona: persona.id,
                        },
                      })
                    }
                    style={({ pressed }) => [
                      s.topicChip,
                      {
                        backgroundColor: persona.color + '12',
                        borderColor: persona.color + '30',
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <Text style={[s.topicChipText, { color: persona.color }]}>{topic.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </ScrollView>

        {/* ── Input Bar ──────────────────────────── */}
        <View style={[s.inputBar, { borderTopColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.typePlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            style={[
              s.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={() => handleStart()}
            disabled={!inputText.trim() || chatLoading}
            style={({ pressed }) => [
              s.sendBtn,
              {
                backgroundColor: inputText.trim() && !chatLoading ? persona.color : colors.divider,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={inputText.trim() && !chatLoading ? '#FFF' : colors.mutedText}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerSub: { fontSize: 12, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },

  /* welcome card */
  welcomeCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  welcomeCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -30,
  },
  welcomeCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -40,
    left: -20,
  },
  welcomeAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  /* notice card */
  noticeCard: {
    borderRadius: UI.radius.xxl,
    padding: 16,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noticeTitle: { fontSize: 14, fontWeight: '800' },
  noticeText: { fontSize: 13, lineHeight: 20 },

  /* suggestion groups */
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupLabel: { fontSize: 15, fontWeight: '800' },
  suggestionsWrap: { gap: 8, marginTop: 8 },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  suggestionBtnText: { fontSize: 14, fontWeight: '700', flex: 1 },

  /* topic chips */
  topicChipsRow: { gap: 8, marginTop: 8 },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  topicChipText: { fontSize: 13, fontWeight: '700' },

  /* input bar */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
