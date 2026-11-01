import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from '@/components/Toast';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { useProfile } from '@/hooks/useProfile';
import { useFreudScore } from '@/hooks/useFreudScore';
import { calculateInitialFreudScore } from '@/lib/freudScore';
import { useUser } from '@/hooks/useUser';
import { userScopedKey } from '@/lib/storage';
import { backTo } from '@/lib/navigation';
import { getAssessmentSteps, stepGlow, TAKING_MEDS, type AssessmentStep } from '@/lib/assessment-flow';
import { normaliseDraft, type AssessmentAnswers } from '@/lib/assessment-draft';
import { medicationsText, type MedicationClassKey } from '@/lib/medications';
import { writeAssessmentAnswer } from '@/lib/assessment-answers';
import { MOOD_SCALE, moodStep, type MoodScore } from '@/lib/mood-scale';
import type { GlowSpec } from '@/components/glow/Glow';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { LegalNote } from '@/components/ui/controls';
import { MoodOrb } from '@/components/mood/MoodOrb';
import { MoodSlider } from '@/components/mood/MoodSlider';
import { AssessmentShell } from '@/components/assessment/AssessmentShell';
import { DistressCard, GenderCard, OptionRow, PairOption } from '@/components/assessment/choices';
import { AgeWheel, WeightPicker } from '@/components/assessment/pickers';
import { SleepMoons, StressLights } from '@/components/assessment/scenes';
import { ConcernsInput, ReflectionField } from '@/components/assessment/inputs';
import { MedicationSearch } from '@/components/assessment/MedicationSearch';
import { VoiceCheckIn } from '@/components/assessment/VoiceCheckIn';
import AgeAura from '@/assets/svg/illustrations/assessment/age-aura.svg';
import ThoughtsToCalm from '@/assets/svg/illustrations/assessment/thoughts-to-calm.svg';

/**
 * Onboarding assessment (docs/design-handoff/02, re-extracted from Figma section `4002:14604`,
 * and 10 §3.1–3.2 for the medication search). One screen walks through the steps of
 * `getAssessmentSteps`, keeps a per-user draft, and saves everything at the end.
 */

const DRAFT_KEY = 'assessment:draft:v1';
const GOAL_KEYS = ['reduceStress', 'tryAISupport', 'workThroughExperiences', 'growAndUnderstand', 'justChecking'] as const;
const CONCERN_KEYS = ['depressed', 'angry', 'anxious', 'lonely', 'numb', 'withdrawn'] as const;
const DEFAULT_AGE = 25;
const SHELL_DY = 44; // Figma frames assume a 44pt status bar

/** The design positions full-frame art against a 44pt status bar; shift it to the real inset. */
function useFrameOffset() {
  const insets = useSafeAreaInsets();
  return insets.top - SHELL_DY;
}

function freshAnswers(): AssessmentAnswers {
  return { createdAt: new Date().toISOString(), weight: 70, weightUnit: 'kg', moodScore: 3, mood: 'Okay', medications: [] };
}

export default function AssessmentScreen() {
  const { saveAssessment, isSavingAssessment } = useProfile();
  const { saveScore } = useFreudScore({ lazy: true });
  const { data: user } = useUser();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const dy = useFrameOffset();
  const sx = width / 375;

  const [a, setA] = useState<AssessmentAnswers>(freshAnswers);
  const [step, setStep] = useState(0);
  const [draftOwner, setDraftOwner] = useState<string | null>(null);
  const draftWrites = useRef(Promise.resolve());
  const finishing = useRef(false);

  const set = (patch: Partial<AssessmentAnswers>) => setA((prev) => ({ ...prev, ...patch }));
  const en = (key: string) => t(key, { lng: 'en' });

  // Load this user's draft, from this screen or the previous one.
  useEffect(() => {
    let active = true;
    setDraftOwner(null);
    if (!user?.id) return;
    const owner = user.id;
    setA(freshAnswers());
    setStep(0);
    void AsyncStorage.getItem(userScopedKey(DRAFT_KEY, owner))
      .then((raw) => {
        if (!active) return;
        try {
          const draft = raw ? normaliseDraft(JSON.parse(raw)) : null;
          if (draft) {
            setA({ ...freshAnswers(), ...Object.fromEntries(Object.entries(draft.answers).filter(([, v]) => v != null)) } as AssessmentAnswers);
            const visible = getAssessmentSteps(draft.answers.takingMeds);
            setStep(Math.max(0, draft.step ? visible.indexOf(draft.step) : 0));
          }
        } catch {
          /* A malformed local draft must not block onboarding. */
        }
        setDraftOwner(owner);
      })
      .catch(() => {
        if (active) setDraftOwner(owner);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Save the draft after every change.
  useEffect(() => {
    if (!draftOwner || draftOwner !== user?.id || finishing.current) return;
    const value = JSON.stringify({ answers: a, step: getAssessmentSteps(a.takingMeds)[step] });
    draftWrites.current = draftWrites.current.then(() => AsyncStorage.setItem(userScopedKey(DRAFT_KEY, draftOwner), value)).catch(() => {});
  }, [a, step, draftOwner, user?.id]);

  const steps = useMemo(() => getAssessmentSteps(a.takingMeds), [a.takingMeds]);
  const key: AssessmentStep = steps[Math.min(step, steps.length - 1)];

  const canContinue = (() => {
    switch (key) {
      case 'goal':
        return !!a.goal;
      case 'gender':
        return a.gender === 'Man' || a.gender === 'Woman';
      case 'help':
        return !!a.soughtHelpBefore;
      case 'physical':
        return !!a.physicalDistress;
      case 'sleep':
        return !!a.sleepQuality;
      case 'meds':
        return !!a.takingMeds;
      case 'medsSpecify':
        return (a.medications?.length ?? 0) > 0;
      case 'stress':
        return !!a.stressBand;
      default:
        return true;
    }
  })();

  async function finish() {
    finishing.current = true;
    const medications = a.medications ?? [];
    const payload = {
      ...a,
      medications: (steps.includes('medsSpecify') ? medications : []) as unknown,
      meds: steps.includes('medsSpecify') ? medicationsText(medications) : null,
      reflectionText: a.reflectionText?.trim() || null,
    };
    try {
      await saveAssessment(payload);
      await AsyncStorage.setItem(userScopedKey('assessment:v1', user?.id), JSON.stringify(payload));
      await draftWrites.current;
      await AsyncStorage.removeItem(userScopedKey(DRAFT_KEY, user?.id));
      // The starting Glow score that profile setup shows on "You're all set". A failure here must not
      // block onboarding; the score is recalculated from check-ins later.
      await saveScore({ result: calculateInitialFreudScore(payload), generateSuggestions: true }).catch((err) =>
        console.warn('[Assessment] Failed to save the starting score:', err),
      );
      router.replace('/(onboarding)/profile-setup');
    } catch {
      finishing.current = false;
      toast.error(t('assessmentFlow.saveFailed'));
    }
  }

  function next() {
    if (step >= steps.length - 1) {
      void finish();
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    if (step === 0) {
      backTo(undefined, '/(tabs)/home');
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  const continueButton = (
    <AppButton title={t('assessmentFlow.continue')} onPress={next} disabled={!canContinue} busy={isSavingAssessment && step === steps.length - 1} />
  );
  const rampGlow: GlowSpec = { color: stepGlow(step), opacity: step === 0 ? 0.28 : key === 'write' ? 0.18 : 0.14, x: 37, y: -20, width: 300, blur: 90 };

  const shell = {
    navTitle: t('assessmentFlow.title'),
    backLabel: t('common.back'),
    onBack: back,
    stepLabel: t('assessmentFlow.stepTag', { current: step + 1, total: steps.length }),
    glows: [rampGlow],
    actions: continueButton,
  };

  switch (key) {
    case 'goal':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.goal.title')}>
          <View style={{ gap: 12 }} accessibilityRole="radiogroup">
            {GOAL_KEYS.map((k) => {
              const value = en(`assessment.goalOptions.${k}`);
              return <OptionRow key={k} label={t(`assessment.goalOptions.${k}`)} selected={a.goal === value} onPress={() => set({ goal: value })} />;
            })}
          </View>
          <LegalNote text={t('assessmentFlow.goal.note')} style={{ marginTop: 16, marginHorizontal: 8 }} />
        </AssessmentShell>
      );

    case 'gender':
      return (
        <AssessmentShell
          {...shell}
          title={t('assessmentFlow.gender.title')}
          titleGap={40}
          actions={
            <>
              <AppButton
                variant="secondary"
                title={t('assessmentFlow.gender.skip')}
                onPress={() => {
                  set({ gender: 'Prefer not to say' });
                  next();
                }}
              />
              {continueButton}
            </>
          }
        >
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            <GenderCard kind="male" label={t('assessmentFlow.gender.male')} selected={a.gender === 'Man'} onPress={() => set({ gender: 'Man' })} />
            <GenderCard kind="female" label={t('assessmentFlow.gender.female')} selected={a.gender === 'Woman'} onPress={() => set({ gender: 'Woman' })} />
          </View>
        </AssessmentShell>
      );

    case 'age': {
      const age = Number(a.age) || DEFAULT_AGE;
      return (
        <AssessmentShell
          {...shell}
          title={t('assessmentFlow.age.title')}
          scroll={false}
          background={
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
              <Glow color={palette.mustard} opacity={0.28} width={260} blur={50} style={{ position: 'absolute', left: 57.5 * sx, top: 306 + dy }} />
              <Glow color={palette.lavenderSoft} opacity={0.25} width={170} blur={40} style={{ position: 'absolute', left: 152.5 * sx, top: 371 + dy }} />
              <AgeAura width={264.8} height={247.1} style={{ position: 'absolute', left: 184.8 * sx - 132.4, top: 318.3 + dy }} />
            </View>
          }
        >
          <AgeWheel value={age} onChange={(v) => set({ age: String(v) })} accessibilityLabel={t('assessmentFlow.age.a11y')} />
        </AssessmentShell>
      );
    }

    case 'weight':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.weight.title')}>
          <WeightPicker
            value={a.weight ?? 70}
            unit={a.weightUnit ?? 'kg'}
            onChange={(weight, weightUnit) => set({ weight, weightUnit })}
            labels={{ kg: t('assessmentFlow.weight.kg'), lbs: t('assessmentFlow.weight.lbs'), a11y: t('assessmentFlow.weight.a11y') }}
          />
        </AssessmentShell>
      );

    case 'mood': {
      const score = (a.moodScore ?? 3) as MoodScore;
      return (
        <AssessmentShell
          {...shell}
          title={t('assessmentFlow.mood.title')}
          titleWidth={290}
          titleGap={270}
          scroll={false}
          background={<MoodOrb score={score} style={{ position: 'absolute', left: (width - 320) / 2, top: 370 - 160 + dy }} />}
        >
          <Text style={[Type.titleXl, { letterSpacing: 0, color: palette.ink, textAlign: 'center' }]} accessibilityLiveRegion="polite">
            {t(`moodScale.${moodStep(score).key}`)}
          </Text>
          <MoodSlider
            size="full"
            value={score}
            onChange={(s) => set({ moodScore: s, mood: en(`moodScale.${moodStep(s).key}`) })}
            startLabel={t(`moodScale.${MOOD_SCALE[0].key}`)}
            endLabel={t(`moodScale.${MOOD_SCALE[4].key}`)}
            accessibilityLabel={t('assessmentFlow.mood.a11y')}
            style={{ marginTop: 26, marginHorizontal: 20 }}
          />
        </AssessmentShell>
      );
    }

    case 'help':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.help.title')}>
          <View style={{ width: 286, height: 286, alignSelf: 'center' }} pointerEvents="none">
            <Glow color={palette.mustard} opacity={0.28} width={240} blur={50} style={{ position: 'absolute', left: 23, top: 23 }} />
            <Glow color={palette.lavenderSoft} opacity={0.25} width={160} blur={40} style={{ position: 'absolute', left: 113, top: 83 }} />
            <ThoughtsToCalm width={286} height={286} style={{ position: 'absolute' }} />
            <Glow color={palette.gold} opacity={1} width={22} blur={6} style={{ position: 'absolute', left: 142, top: 150 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 48 }} accessibilityRole="radiogroup">
            <PairOption label={t('assessmentFlow.help.yes')} selected={a.soughtHelpBefore === 'Yes'} onPress={() => set({ soughtHelpBefore: 'Yes' })} />
            <PairOption label={t('assessmentFlow.help.no')} selected={a.soughtHelpBefore === 'No'} onPress={() => set({ soughtHelpBefore: 'No' })} />
          </View>
        </AssessmentShell>
      );

    case 'physical':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.physical.title')}>
          <View style={{ gap: 12 }} accessibilityRole="radiogroup">
            <DistressCard
              icon="line/activity"
              title={t('assessmentFlow.physical.yesTitle')}
              body={t('assessmentFlow.physical.yesBody')}
              selected={a.physicalDistress === 'Yes'}
              onPress={() => set({ physicalDistress: 'Yes' })}
            />
            <DistressCard
              icon="line/check"
              title={t('assessmentFlow.physical.noTitle')}
              body={t('assessmentFlow.physical.noBody')}
              selected={a.physicalDistress === 'No'}
              onPress={() => set({ physicalDistress: 'No' })}
            />
          </View>
        </AssessmentShell>
      );

    case 'sleep':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.sleep.title')} titleWidth={340} titleGap={110}>
          <SleepMoons
            value={a.sleepQuality}
            onChange={(sleepQuality) => set({ sleepQuality })}
            labels={[1, 2, 3, 4, 5].map((n) => t(`assessmentFlow.sleep.levels.${n}`))}
            caption={a.sleepQuality ? t(`assessmentFlow.sleep.captions.${a.sleepQuality}`) : null}
          />
        </AssessmentShell>
      );

    case 'meds':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.meds.title')} titleGap={40}>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {TAKING_MEDS.map((k) => (
              <OptionRow key={k} weight="medium" label={t(`assessmentFlow.meds.options.${k}`)} selected={a.takingMeds === k} onPress={() => set({ takingMeds: k })} />
            ))}
          </View>
          <LegalNote text={t('assessmentFlow.meds.note')} style={{ marginTop: 16, marginHorizontal: 24 }} />
        </AssessmentShell>
      );

    case 'medsSpecify':
      return (
        <AssessmentShell
          {...shell}
          title={t('assessmentFlow.medsSearch.title')}
          titleGap={24}
          glows={[
            { color: palette.rose, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
            { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
          ]}
          compactActions
          actions={
            <>
              {continueButton}
              <AppButton
                variant="ghost"
                size="s"
                title={t('assessmentFlow.skipQuestion')}
                style={{ alignSelf: 'center' }}
                onPress={() => {
                  set({ medications: [] });
                  next();
                }}
              />
            </>
          }
          contentStyle={{ paddingHorizontal: 8 }}
        >
          <MedicationSearch
            value={a.medications ?? []}
            onChange={(medications) => set({ medications })}
            labels={{
              placeholder: t('assessmentFlow.medsSearch.placeholder'),
              results: (count) => t('assessmentFlow.medsSearch.results', { count }),
              selected: t('assessmentFlow.medsSearch.selected'),
              remove: (name) => t('assessmentFlow.medsSearch.remove', { name }),
              noMatchTitle: (query) => t('assessmentFlow.medsSearch.noMatchTitle', { query }),
              noMatchBody: t('assessmentFlow.medsSearch.noMatchBody'),
              addManually: (query) => t('assessmentFlow.medsSearch.addManually', { query }),
              classLabel: (k: MedicationClassKey) => t(`assessmentFlow.medsSearch.classes.${k}`),
              note: t('assessmentFlow.meds.note'),
            }}
          />
        </AssessmentShell>
      );

    case 'symptoms': {
      const suggestions = CONCERN_KEYS.map((k) => t(`assessmentFlow.symptoms.suggestions.${k}`));
      const values = (a.otherSymptoms ?? '').split('\n').map((v) => v.trim()).filter(Boolean);
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.symptoms.title')} titleGap={32}>
          <ConcernsInput
            values={values}
            onChange={(list) => set({ otherSymptoms: list.length ? writeAssessmentAnswer(list) : null })}
            suggestions={suggestions}
            labels={{
              placeholder: t('assessmentFlow.symptoms.placeholder'),
              mostCommon: t('assessmentFlow.symptoms.mostCommon'),
              add: (name) => t('assessmentFlow.symptoms.add', { name }),
              remove: (name) => t('assessmentFlow.symptoms.remove', { name }),
            }}
          />
        </AssessmentShell>
      );
    }

    case 'stress':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.stress.title')} titleWidth={340} titleGap={85}>
          <StressLights
            value={a.stressBand}
            onChange={(stressBand) => set({ stressBand })}
            labels={[1, 2, 3, 4, 5].map((n) => t(`assessmentFlow.stress.levels.${n}`))}
            caption={a.stressBand ? t(`assessmentFlow.stress.captions.${a.stressBand}`) : null}
          />
          <LegalNote text={t('assessmentFlow.stress.note')} style={{ marginTop: 24, marginHorizontal: 8 }} />
        </AssessmentShell>
      );

    case 'sound':
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.voice.title')} titleGap={12}>
          <Text style={[Type.bodyLg, { lineHeight: 19, color: palette.textMuted, textAlign: 'center' }]}>{t('assessmentFlow.voice.subtitle')}</Text>
          <View style={{ marginTop: 32 }}>
            <VoiceCheckIn
              phrase={t('assessmentFlow.voice.phrase')}
              value={a.soundCheck}
              onRecorded={(soundCheck) => set({ soundCheck })}
              labels={{
                idle: t('assessmentFlow.voice.idle'),
                recording: t('assessmentFlow.voice.recording'),
                recorded: t('assessmentFlow.voice.recorded'),
                start: t('assessmentFlow.voice.start'),
                stop: t('assessmentFlow.voice.stop'),
                play: t('assessmentFlow.voice.play'),
                pause: t('assessmentFlow.voice.pause'),
                micDenied: t('common.allowMicAccess'),
                saveFailed: t('common.couldNotSaveRecording'),
              }}
            />
          </View>
        </AssessmentShell>
      );

    case 'write':
    default:
      return (
        <AssessmentShell {...shell} title={t('assessmentFlow.write.title')} titleWidth={308} titleGap={12}>
          <Text style={[Type.bodyLg, { lineHeight: 19, color: palette.textMuted, textAlign: 'center', width: 308, alignSelf: 'center' }]}>
            {t('assessmentFlow.write.subtitle')}
          </Text>
          <View style={{ marginTop: 48 }}>
            <ReflectionField
              value={a.reflectionText ?? ''}
              onChange={(reflectionText) => set({ reflectionText })}
              onUseVoice={() => toast.info(t('assessmentFlow.write.dictationHint'))}
              labels={{ placeholder: t('assessmentFlow.write.placeholder'), a11y: t('assessmentFlow.write.a11y'), useVoice: t('assessmentFlow.write.useVoice') }}
            />
          </View>
        </AssessmentShell>
      );
  }
}
