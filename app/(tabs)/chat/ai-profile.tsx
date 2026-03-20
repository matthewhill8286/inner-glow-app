import React from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── safe back navigation ────────────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

/* ── AI team member data ─────────────────────────── */
type AIMember = {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  speciality: string;
  description: string;
  approach: string[];
  goodFor: string[];
  personality: string;
};

const getAIMembers = (t: any): Record<string, AIMember> => ({
  freud: {
    id: 'freud',
    name: t('aiProfile.freuddName'),
    role: t('aiProfile.freudRole'),
    emoji: '🧑‍⚕️',
    color: '#8B6B47',
    speciality: t('aiProfile.freudSpeciality'),
    description: t('aiProfile.freudDescription'),
    approach: [
      t('aiProfile.freudApproach1'),
      t('aiProfile.freudApproach2'),
      t('aiProfile.freudApproach3'),
    ],
    goodFor: [
      t('aiProfile.freudGoodFor1'),
      t('aiProfile.freudGoodFor2'),
      t('aiProfile.freudGoodFor3'),
      t('aiProfile.freudGoodFor4'),
      t('aiProfile.freudGoodFor5'),
    ],
    personality: t('aiProfile.freudPersonality'),
  },
  calm: {
    id: 'calm',
    name: t('aiProfile.calmName'),
    role: t('aiProfile.calmRole'),
    emoji: '🧘',
    color: '#5B8A5A',
    speciality: t('aiProfile.calmSpeciality'),
    description: t('aiProfile.calmDescription'),
    approach: [
      t('aiProfile.calmApproach1'),
      t('aiProfile.calmApproach2'),
      t('aiProfile.calmApproach3'),
    ],
    goodFor: [
      t('aiProfile.calmGoodFor1'),
      t('aiProfile.calmGoodFor2'),
      t('aiProfile.calmGoodFor3'),
      t('aiProfile.calmGoodFor4'),
      t('aiProfile.calmGoodFor5'),
    ],
    personality: t('aiProfile.calmPersonality'),
  },
  sleep: {
    id: 'sleep',
    name: t('aiProfile.sleepName'),
    role: t('aiProfile.sleepRole'),
    emoji: '😴',
    color: '#5A8FB5',
    speciality: t('aiProfile.sleepSpeciality'),
    description: t('aiProfile.sleepDescription'),
    approach: [
      t('aiProfile.sleepApproach1'),
      t('aiProfile.sleepApproach2'),
      t('aiProfile.sleepApproach3'),
    ],
    goodFor: [
      t('aiProfile.sleepGoodFor1'),
      t('aiProfile.sleepGoodFor2'),
      t('aiProfile.sleepGoodFor3'),
      t('aiProfile.sleepGoodFor4'),
      t('aiProfile.sleepGoodFor5'),
    ],
    personality: t('aiProfile.sleepPersonality'),
  },
  mood: {
    id: 'mood',
    name: t('aiProfile.moodName'),
    role: t('aiProfile.moodRole'),
    emoji: '😊',
    color: '#7B6DC9',
    speciality: t('aiProfile.moodSpeciality'),
    description: t('aiProfile.moodDescription'),
    approach: [
      t('aiProfile.moodApproach1'),
      t('aiProfile.moodApproach2'),
      t('aiProfile.moodApproach3'),
    ],
    goodFor: [
      t('aiProfile.moodGoodFor1'),
      t('aiProfile.moodGoodFor2'),
      t('aiProfile.moodGoodFor3'),
      t('aiProfile.moodGoodFor4'),
      t('aiProfile.moodGoodFor5'),
    ],
    personality: t('aiProfile.moodPersonality'),
  },
});

const getFallbackMember = (t: any): AIMember => ({
  id: 'default',
  name: t('aiProfile.fallbackName'),
  role: t('aiProfile.fallbackRole'),
  emoji: '🤖',
  color: '#8B6B47',
  speciality: t('aiProfile.fallbackSpeciality'),
  description: t('aiProfile.fallbackDescription'),
  approach: [t('aiProfile.fallbackApproach1'), t('aiProfile.fallbackApproach2')],
  goodFor: [t('aiProfile.fallbackGoodFor1'), t('aiProfile.fallbackGoodFor2')],
  personality: t('aiProfile.fallbackPersonality'),
});

export default function AIProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { memberId, from } = useLocalSearchParams<{ memberId: string; from?: string }>();

  const member = getAIMembers(t)[memberId || ''] || getFallbackMember(t);

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ────────────────────────────────── */}
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
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('aiProfile.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>{member.role}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Hero Card ──────────────────────────── */}
        <View style={[s.heroCard, { backgroundColor: member.color }]}>
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[s.heroCircle3, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

          <View style={s.heroAvatarWrap}>
            <Text style={{ fontSize: 52 }}>{member.emoji}</Text>
          </View>

          <Text style={s.heroName}>{member.name}</Text>
          <View style={s.heroRolePill}>
            <Text style={s.heroRoleText}>{member.speciality}</Text>
          </View>
        </View>

        {/* ── Personality Card ───────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedText }]}>
            {t('aiProfile.personality')}
          </Text>
          <Text style={[s.cardBody, { color: colors.text }]}>{member.personality}</Text>
        </View>

        {/* ── About Card ─────────────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedText }]}>{t('aiProfile.about')}</Text>
          <Text style={[s.cardBody, { color: colors.text }]}>{member.description}</Text>
        </View>

        {/* ── Approach ───────────────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedText }]}>{t('aiProfile.approach')}</Text>
          <View style={s.pillsWrap}>
            {member.approach.map((a, i) => (
              <View key={i} style={[s.pill, { backgroundColor: member.color + '15' }]}>
                <Text style={[s.pillText, { color: member.color }]}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Good For ───────────────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedText }]}>{t('aiProfile.goodFor')}</Text>
          <View style={s.pillsWrap}>
            {member.goodFor.map((g, i) => (
              <View key={i} style={[s.pill, { backgroundColor: colors.inputBg }]}>
                <MaterialIcons name="check-circle" size={13} color={member.color} />
                <Text style={[s.pillText, { color: colors.text }]}>{g}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Start Chat CTA ─────────────────────── */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/chat/new-conversation' as any,
              params: { aiMember: member.id, from: '/(tabs)/chat/ai-profile' },
            })
          }
          style={({ pressed }) => [
            s.ctaBtn,
            {
              backgroundColor: member.color,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <MaterialIcons name="chat" size={20} color="#FFF" />
          <Text style={s.ctaBtnText}>{t('aiProfile.chatWith', { name: member.name })}</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
        </Pressable>

        {/* ── Disclaimer ─────────────────────────── */}
        <View style={s.disclaimerRow}>
          <MaterialIcons name="info-outline" size={14} color={colors.subtleText} />
          <Text style={[s.disclaimerText, { color: colors.subtleText }]}>
            {t('aiProfile.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  /* hero */
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -50,
    left: -30,
  },
  heroCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 10,
    left: 60,
  },
  heroAvatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroRolePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroRoleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* cards */
  card: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
  },

  /* pills */
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* CTA */
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    ...UI.shadow.sm,
  },
  ctaBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /* disclaimer */
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
