import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { toast } from '@/components/Toast';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { Chip } from '@/components/ui/Chip';
import { MoodOrb } from '@/components/mood/MoodOrb';
import { MoodSlider } from '@/components/mood/MoodSlider';
import { useMood } from '@/hooks/useMood';
import { useJournal } from '@/hooks/useJournal';
import { moodStep, type MoodScore } from '@/lib/mood-scale';
import { MOOD_FACTORS } from '@/lib/mood-logged';
import type { MoodFactor } from '@/lib/types';

/**
 * Mood check-in (04 §M2–M4). Step 1 picks the mood on the orb and slider; step 2 adds
 * optional factors and a note, which is also saved to the journal. Saving opens Mood logged.
 */
export default function MoodCheckInScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { addMoodCheckIn } = useMood();
  const { createJournalEntry } = useJournal();

  // Home's mood slider can open this with its chosen mood (1–5); otherwise start at Okay.
  const { mood: moodParam } = useLocalSearchParams<{ mood?: string }>();
  const [score, setScore] = useState<MoodScore>(() => {
    const s = Number(moodParam);
    return (Number.isInteger(s) && s >= 1 && s <= 5 ? s : 3) as MoodScore;
  });
  const [step, setStep] = useState<'mood' | 'details'>('mood');
  const [factors, setFactors] = useState<MoodFactor[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const saving$ = useRef(false);
  const mood = moodStep(score);

  const toggle = (f: MoodFactor) => setFactors((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  async function save() {
    if (saving$.current) return;
    saving$.current = true;
    setSaving(true);
    try {
      const entry = await addMoodCheckIn({ mood: mood.checkIn, factors, note: note.trim() || undefined });
      if (note.trim()) {
        // The note is "saved to your journal too"; a failure here must not lose the check-in.
        createJournalEntry({ title: '', content: note.trim(), mood: mood.checkIn, moodLogId: entry.id }).catch(() =>
          toast.error(t('moodCheckIn2.journalFailed')),
        );
      }
      router.replace({ pathname: '/(tabs)/mood/logged', params: { mood: String(score), factors: factors.join(',') } });
    } catch {
      toast.error(t('moodCheckIn2.saveFailed'));
    } finally {
      saving$.current = false;
      setSaving(false);
    }
  }

  if (step === 'mood') {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 }}>
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 24 }}>
          <IconButton
            icon="arrow/close"
            variant="nav"
            accessibilityLabel={t('moodCheckIn2.close')}
            onPress={() => backTo(undefined, '/(tabs)/mood')}
          />
        </View>
        <Text accessibilityRole="header" style={{ ...Type.titleLg, lineHeight: 36, color: palette.ink, textAlign: 'center', marginTop: 20, paddingHorizontal: 24 }}>
          {t('moodCheckIn2.question')}
        </Text>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MoodOrb score={score} />
          <Text accessibilityLiveRegion="polite" style={{ ...Type.display, fontSize: 32, lineHeight: 45, color: palette.ink, marginTop: -24 }}>
            {t(`moodScale.${mood.key}`)}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 36 }}>
          <MoodSlider
            size="full"
            value={score}
            onChange={setScore}
            startLabel={t('moodScale.tense')}
            endLabel={t('moodScale.great')}
            accessibilityLabel={t('moodCheckIn2.question')}
          />
        </View>
        <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
          <AppButton title={t('moodCheckIn2.continue')} onPress={() => setStep('details')} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton variant="nav" accessibilityLabel={t('moodCheckIn2.back')} onPress={() => setStep('mood')} />
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.selected, borderRadius: 999, paddingVertical: 6, paddingLeft: 10, paddingRight: 14 }}
          >
            <Icon name={mood.face} size={18} />
            <Text style={{ ...Type.label, color: palette.plum }}>{t(`moodScale.${mood.key}`)}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <Text accessibilityRole="header" style={{ ...Type.titleLg, lineHeight: 36, color: palette.ink, marginTop: 26 }}>
          {t('moodCheckIn2.shaping')}
        </Text>
        <Text style={{ ...Type.bodySm, color: palette.textMuted, marginTop: 4 }}>{t('moodCheckIn2.optional')}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          {MOOD_FACTORS.map((f) => (
            <Chip
              key={f.key}
              kind="factor"
              icon={f.icon}
              label={t(`moodCheckIn2.factor.${f.key}`)}
              selected={factors.includes(f.key)}
              onPress={() => toggle(f.key)}
            />
          ))}
        </View>

        <Text style={{ ...Type.label, fontSize: 13, color: palette.ink, marginTop: 28 }}>{t('moodCheckIn2.addNote')}</Text>
        <View style={{ backgroundColor: palette.surface, borderRadius: 24, paddingVertical: 18, paddingHorizontal: 20, marginTop: 10, minHeight: 120 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('moodCheckIn2.notePlaceholder')}
            placeholderTextColor={palette.textSubtle}
            multiline
            maxLength={1000}
            accessibilityLabel={t('moodCheckIn2.addNote')}
            style={{ ...Type.bodyM, lineHeight: 23, color: '#44403B', minHeight: 60, textAlignVertical: 'top', padding: 0 }}
          />
          <Text style={{ ...Type.micro, color: palette.textSubtle, marginTop: 10 }}>{t('moodCheckIn2.savedToJournal')}</Text>
        </View>

        <AppButton
          title={t('moodCheckIn2.save')}
          icon="line/check"
          busy={saving}
          disabled={saving}
          onPress={save}
          style={{ marginTop: 32 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
