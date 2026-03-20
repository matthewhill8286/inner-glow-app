import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── safe back navigation ────────────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

/* ── goal options ────────────────────────────────── */
const getGoals = (t: any) => [
  { id: 'anxiety', emoji: '😰', label: t('customize.goalAnxiety'), selected: true },
  { id: 'sleep', emoji: '😴', label: t('customize.goalSleep'), selected: false },
  { id: 'stress', emoji: '😤', label: t('customize.goalStress'), selected: true },
  { id: 'mood', emoji: '😊', label: t('customize.goalMood'), selected: false },
  { id: 'focus', emoji: '🎯', label: t('customize.goalFocus'), selected: false },
  { id: 'confidence', emoji: '💪', label: t('customize.goalConfidence'), selected: true },
  { id: 'relationships', emoji: '💞', label: t('customize.goalRelationships'), selected: false },
  { id: 'mindfulness', emoji: '🧘', label: t('customize.goalMindfulness'), selected: false },
];

/* ── AI personality themes ───────────────────────── */
const getThemes = (t: any) => [
  { id: 'warm', emoji: '☀️', label: t('customize.themeWarm'), color: '#E8985A' },
  { id: 'professional', emoji: '🎓', label: t('customize.themeProfessional'), color: '#5A8FB5' },
  { id: 'gentle', emoji: '🌿', label: t('customize.themeGentle'), color: '#5B8A5A' },
  { id: 'direct', emoji: '⚡', label: t('customize.themeDirect'), color: '#7B6DC9' },
];

/* ── session frequency ───────────────────────────── */
const getFrequencies = (t: any) => [
  { id: 'daily', label: t('customize.freqDaily'), sub: t('customize.freqDailySub') },
  { id: 'weekdays', label: t('customize.freqWeekdays'), sub: t('customize.freqWeekdaysSub') },
  { id: 'weekly', label: t('customize.freqWeekly'), sub: t('customize.freqWeeklySub') },
  { id: 'flexible', label: t('customize.freqFlexible'), sub: t('customize.freqFlexibleSub') },
];

export default function CustomizeScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { from } = useLocalSearchParams<{ from?: string }>();
  const insets = useSafeAreaInsets();

  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    getGoals(t)
      .filter((g) => g.selected)
      .map((g) => g.id),
  );
  const [selectedTheme, setSelectedTheme] = useState('warm');
  const [selectedFrequency, setSelectedFrequency] = useState('flexible');

  function toggleGoal(id: string) {
    setSelectedGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function handleSave() {
    /* In a real app, persist to Supabase */
    goBack(from);
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Header ────────────────────────────────── */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top,
          },
        ]}
      >
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
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('customize.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>{t('customize.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Hero Card ──────────────────────────── */}
        <View style={[s.heroCard, { backgroundColor: '#8B6B47' }]}>
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={s.heroEmojiWrap}>
            <Text style={{ fontSize: 42 }}>⚙️</Text>
          </View>
          <Text style={s.heroTitle}>{t('customize.heroTitle')}</Text>
          <Text style={s.heroSub}>{t('customize.heroSubtitle')}</Text>
        </View>

        {/* ── Goals Section ──────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>
          {t('customize.goalsSection')}
        </Text>
        <View style={s.goalsGrid}>
          {getGoals(t).map((goal) => {
            const active = selectedGoals.includes(goal.id);
            return (
              <Pressable
                key={goal.id}
                onPress={() => toggleGoal(goal.id)}
                style={({ pressed }) => [
                  s.goalChip,
                  {
                    backgroundColor: active ? '#8B6B4712' : colors.card,
                    borderColor: active ? '#8B6B47' : colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{goal.emoji}</Text>
                <Text style={[s.goalText, { color: active ? '#8B6B47' : colors.text }]}>
                  {goal.label}
                </Text>
                {active && <MaterialIcons name="check-circle" size={16} color="#8B6B47" />}
              </Pressable>
            );
          })}
        </View>

        {/* ── AI Theme Section ───────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>
          {t('customize.personalitySection')}
        </Text>
        <View style={{ gap: 10 }}>
          {getThemes(t).map((theme) => {
            const active = selectedTheme === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => setSelectedTheme(theme.id)}
                style={({ pressed }) => [
                  s.themeCard,
                  {
                    backgroundColor: active ? theme.color + '10' : colors.card,
                    borderColor: active ? theme.color : colors.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={[s.themeEmojiWrap, { backgroundColor: theme.color + '15' }]}>
                  <Text style={{ fontSize: 22 }}>{theme.emoji}</Text>
                </View>
                <Text style={[s.themeLabel, { color: active ? theme.color : colors.text }]}>
                  {theme.label}
                </Text>
                {active && (
                  <MaterialIcons
                    name="radio-button-checked"
                    size={20}
                    color={theme.color}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
                {!active && (
                  <MaterialIcons
                    name="radio-button-unchecked"
                    size={20}
                    color={colors.subtleText}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Session Frequency ──────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>
          {t('customize.frequencySection')}
        </Text>
        <View style={s.freqRow}>
          {getFrequencies(t).map((f) => {
            const active = selectedFrequency === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelectedFrequency(f.id)}
                style={({ pressed }) => [
                  s.freqCard,
                  {
                    backgroundColor: active ? '#5B8A5A10' : colors.card,
                    borderColor: active ? '#5B8A5A' : colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Text style={[s.freqLabel, { color: active ? '#5B8A5A' : colors.text }]}>
                  {f.label}
                </Text>
                <Text style={[s.freqSub, { color: colors.mutedText }]}>{f.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Save Button ────────────────────────── */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            s.saveBtn,
            {
              backgroundColor: '#8B6B47',
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <MaterialIcons name="save" size={20} color="#FFF" />
          <Text style={s.saveBtnText}>{t('customize.savePreferences')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -30,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -40,
    left: -20,
  },
  heroEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  /* section label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },

  /* goals grid */
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: UI.radius.lg,
    borderWidth: 1.5,
  },
  goalText: { fontSize: 13, fontWeight: '700' },

  /* theme cards */
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.xxl,
    borderWidth: 1.5,
  },
  themeEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: { fontSize: 15, fontWeight: '800' },

  /* frequency */
  freqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  freqCard: {
    flexGrow: 1,
    flexBasis: '46%',
    padding: 14,
    borderRadius: UI.radius.xxl,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  freqLabel: { fontSize: 15, fontWeight: '800' },
  freqSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  /* save */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    marginTop: 8,
    ...UI.shadow.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
