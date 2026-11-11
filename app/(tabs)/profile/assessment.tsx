import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { LegalNote } from '@/components/ui/controls';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { useProfile } from '@/hooks/useProfile';
import { backTo } from '@/lib/navigation';
import { screenBottomPadding } from '@/lib/screen-layout';
import { readAssessmentAnswer } from '@/lib/assessment-answers';
import { takingMedsList } from '@/lib/assessment-flow';
import { moodStep } from '@/lib/mood-scale';

const GOAL_KEYS = [
  'reduceStress',
  'tryAISupport',
  'workThroughExperiences',
  'growAndUnderstand',
  'justChecking',
] as const;

type Row = Record<string, unknown>;

/** The saved answer for each row, in the person's language. */
function answerValues(row: Row | null, t: (key: string, opts?: Record<string, unknown>) => string) {
  const none = '—';
  if (!row) return { support: none, felt: none, sleep: none, stress: none, help: none, meds: none };
  const en = i18n.getFixedT('en');
  const goalValues = GOAL_KEYS.map((k) => en(`assessment.goalOptions.${k}`));
  const goals = readAssessmentAnswer(row.goal as string | null, goalValues).selected.map((v) =>
    t(`assessment.goalOptions.${GOAL_KEYS[goalValues.indexOf(v)]}`),
  );
  const moodScore = Number(row.mood_score);
  const sleep = Number(row.sleep_quality);
  const band = Number(row.stress_band);
  const meds = takingMedsList(row.taking_meds as string | null);
  return {
    support: goals.length ? goals.join(', ') : none,
    felt: moodScore >= 1 && moodScore <= 5 ? t(`moodScale.${moodStep(moodScore as 1).key}`) : none,
    sleep: sleep >= 1 && sleep <= 5 ? t(`assessmentFlow.sleep.levels.${sleep}`) : none,
    stress: band >= 1 && band <= 5 ? t('yourAssessment.stressValue', { band }) : none,
    help:
      row.sought_help_before === 'Yes'
        ? t('yourAssessment.helpYes')
        : row.sought_help_before === 'No'
          ? t('yourAssessment.helpNo')
          : none,
    meds: meds.length ? meds.map((m) => t(`assessmentFlow.meds.options.${m}`)).join(', ') : none,
  };
}

/**
 * Your assessment (`6832:9366`): the saved answers, when they were last updated, the privacy note
 * and Retake assessment, which asks first (`6832:9496`). A retake replaces these answers and
 * refreshes suggestions; mood, sleep and Glow score history are kept.
 */
export default function YourAssessment() {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const insets = useSafeAreaInsets();
  const { assessment } = useProfile();
  const [confirm, setConfirm] = useState(false);
  const row = (assessment ?? null) as Row | null;
  const v = answerValues(row, t);
  const updated = (row?.updated_at ?? row?.created_at) as string | undefined;
  const open = () => setConfirm(true);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom) + 80,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/profile')}
          title={t('yourAssessment.title')}
        />
        <Text
          style={[
            Type.body,
            { fontWeight: '400', lineHeight: 21, color: palette.plumDeep, marginTop: 16 },
          ]}
        >
          {t('yourAssessment.intro')}
        </Text>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, marginTop: 20, marginBottom: 8 },
          ]}
        >
          {t('yourAssessment.answers')}
        </Text>
        <ListGroup>
          <ListRow
            icon="line/heart"
            label={t('yourAssessment.support')}
            value={v.support}
            onPress={open}
          />
          <ListRow
            icon="line/sparkle"
            label={t('yourAssessment.felt')}
            value={v.felt}
            onPress={open}
          />
          <ListRow
            icon="line/moon"
            label={t('yourAssessment.sleep')}
            value={v.sleep}
            onPress={open}
          />
          <ListRow
            icon="line/activity"
            label={t('yourAssessment.stress')}
            value={v.stress}
            onPress={open}
          />
          <ListRow
            icon="line/users"
            label={t('yourAssessment.help')}
            value={v.help}
            onPress={open}
          />
          <ListRow
            icon="line/plus"
            label={t('yourAssessment.meds')}
            value={v.meds}
            onPress={open}
          />
        </ListGroup>
        {updated ? (
          <Text style={[Type.captionM, { color: palette.textMuted, marginTop: 14 }]}>
            {t('yourAssessment.updated', {
              date: new Date(updated).toLocaleDateString(language, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            })}
          </Text>
        ) : null}
        <LegalNote text={t('yourAssessment.note')} style={{ marginTop: 20 }} />
      </ScrollView>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: screenBottomPadding(insets.bottom) - 4 }}>
        <AppButton title={t('yourAssessment.retake')} onPress={open} />
      </View>
      <BottomSheet visible={confirm} onClose={() => setConfirm(false)} gap={12}>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleSm,
            { fontSize: 20, lineHeight: 28, color: palette.ink, textAlign: 'center', marginTop: 8 },
          ]}
        >
          {t('yourAssessment.confirmTitle')}
        </Text>
        <Text style={[Type.captionM, { color: palette.textMuted, textAlign: 'center' }]}>
          {t('yourAssessment.confirmBody')}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 4, marginTop: 8 }}>
          <AppButton
            title={t('yourAssessment.start')}
            onPress={() => {
              setConfirm(false);
              router.push({ pathname: '/(onboarding)/assessment', params: { retake: '1' } });
            }}
          />
          <AppButton title={t('common.cancel')} variant="text" onPress={() => setConfirm(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}
