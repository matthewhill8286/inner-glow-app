import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { toast } from '@/components/Toast';

import AsyncStorage from '@react-native-async-storage/async-storage';
import SoundPulse from '@/components/SoundPulse';
import { useRecorder, usePlayer, computeVoiceMetrics } from '@/lib/recorder';
import { MoodCheckIn } from '@/lib/types';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@/hooks/useUser';
import { userScopedKey } from '@/lib/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Design tokens (from Figma) ── */
const C = {
  pageBg: '#F7F4F2',
  cardBg: '#FFFFFF',
  brown: '#a07b55',
  brownText: '#96784E',
  brownLight: '#6a5e55',
  inputBg: '#f2ece6',
  tagBg: '#E8DDD9',
  olive: '#828a6a',
  oliveLight: '#e8eddf',
  red: '#C45B5B',
  green: '#5B8A5A',
  orange: '#E8985A',
  orangeLight: '#FFF3E8',
  purple: '#7B6DC9',
};

const TICK_SPACING = 20;

/* ── Progress Bar ── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        marginBottom: 16,
        paddingHorizontal: 4,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i <= current ? C.olive : '#E8DDD9',
          }}
        />
      ))}
    </View>
  );
}

/* ── Unit Toggle (kg / lbs) ── */
function UnitToggle({
  value,
  onChange,
}: {
  value: 'kg' | 'lbs';
  onChange: (v: 'kg' | 'lbs') => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: C.inputBg,
        borderRadius: 25,
        padding: 4,
        width: 200,
        alignSelf: 'center',
        marginBottom: 30,
      }}
    >
      {(['kg', 'lbs'] as const).map((unit) => (
        <Pressable
          key={unit}
          onPress={() => onChange(unit)}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 22,
            backgroundColor: value === unit ? C.olive : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: value === unit ? 'white' : C.brownLight,
              fontWeight: '700',
              fontSize: 15,
            }}
          >
            {unit}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ── Horizontal Ruler (weight / age / stress) ── */
function HorizontalRuler({
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
}: {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  unit?: string;
}) {
  const flatListRef = React.useRef<FlatList>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  const data = useMemo(() => {
    const items: number[] = [];
    for (let i = min; i <= max; i += step) {
      items.push(i);
    }
    return [null, ...items, null];
  }, [min, max, step]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / TICK_SPACING);
    const actualIndex = index + 1;
    if (actualIndex >= 1 && actualIndex < data.length - 1) {
      const selected = data[actualIndex];
      if (selected !== null && selected !== value) {
        onChange(selected);
      }
    }
  };

  React.useEffect(() => {
    if (width > 0 && flatListRef.current) {
      const index = Math.max(0, (value - min) / step);
      flatListRef.current.scrollToOffset({ offset: index * TICK_SPACING, animated: false });
    }
  }, [width, min, max, step, value]);

  return (
    <View
      style={{ alignItems: 'center', width: '100%' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 }}>
        <Text style={{ fontSize: 72, fontWeight: '900', color: C.brownLight }}>{value}</Text>
        {unit ? (
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: C.brownLight,
              opacity: 0.5,
              marginLeft: 4,
            }}
          >
            {unit}
          </Text>
        ) : null}
      </View>

      <View style={{ height: 100, width: '100%', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            left: '50%',
            width: 4,
            height: 60,
            backgroundColor: C.olive,
            borderRadius: 2,
            zIndex: 10,
            marginLeft: -2,
            top: 0,
          }}
        />

        {width > 0 && (
          <FlatList
            ref={flatListRef}
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_SPACING}
            decelerationRate="fast"
            onScroll={(e) => {
              scrollX.setValue(e.nativeEvent.contentOffset.x);
              onScroll(e);
            }}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => i.toString()}
            getItemLayout={(_, index) => {
              const paddingWidth = width / 2 - TICK_SPACING / 2;
              let offset = 0;
              let length = TICK_SPACING;

              if (index === 0) {
                length = paddingWidth;
                offset = 0;
              } else if (index === data.length - 1) {
                length = paddingWidth;
                offset = paddingWidth + (data.length - 2) * TICK_SPACING;
              } else {
                length = TICK_SPACING;
                offset = paddingWidth + (index - 1) * TICK_SPACING;
              }

              return { length, offset, index };
            }}
            initialScrollIndex={0}
            renderItem={({ item }) => {
              if (item === null) {
                return <View style={{ width: width / 2 - TICK_SPACING / 2 }} />;
              }
              const isMajor = item % 5 === 0;
              return (
                <View
                  style={{
                    width: TICK_SPACING,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <View
                    style={{
                      width: isMajor ? 3 : 1,
                      height: isMajor ? 36 : 22,
                      backgroundColor: '#6a5e5530',
                      borderRadius: 2,
                    }}
                  />
                  {isMajor && (
                    <Text
                      style={{
                        position: 'absolute',
                        top: 44,
                        fontSize: 11,
                        color: '#6a5e5555',
                        fontWeight: '600',
                        textAlign: 'center',
                        width: 40,
                      }}
                    >
                      {item}
                    </Text>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

/* ── Radio Option ── */
function RadioOption({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: selected ? C.olive : C.cardBg,
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 20,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: selected ? C.olive : '#E8DDD9',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {icon ? <Text style={{ fontSize: 18, marginRight: 12 }}>{icon}</Text> : null}
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: selected ? 'white' : C.brownLight,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? 'rgba(255,255,255,0.7)' : '#D5CEC7',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View
            style={{
              width: 11,
              height: 11,
              borderRadius: 6,
              backgroundColor: 'white',
            }}
          />
        )}
      </View>
    </Pressable>
  );
}

/* ── Sleep Quality Option ── */
function SleepOption({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: selected ? C.olive : C.cardBg,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 18,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: selected ? C.olive : '#E8DDD9',
        gap: 12,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: selected ? 'rgba(255,255,255,0.2)' : C.inputBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: selected ? 'white' : C.brownLight,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? 'rgba(255,255,255,0.7)' : '#D5CEC7',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: 'white' }} />
        )}
      </View>
    </Pressable>
  );
}

/* ── Stress Dot Selector ── */
function StressDots({
  value,
  onChange,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const labels = ['None', '', '', 'Low', '', 'Moderate', '', 'High', '', '', 'Extreme'];

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 72, fontWeight: '900', color: C.brownLight, marginBottom: 8 }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: C.olive,
          marginBottom: 24,
          opacity: 0.9,
        }}
      >
        {labels[value] || ''}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {Array.from({ length: max + 1 }, (_, i) => {
          const isSelected = i === value;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isSelected ? C.olive : C.inputBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isSelected ? 0 : 1,
                borderColor: '#E8DDD9',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: isSelected ? 'white' : C.brownLight,
                }}
              >
                {i}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Scale label bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 12,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ fontSize: 11, color: C.brownLight, opacity: 0.5 }}>No stress</Text>
        <Text style={{ fontSize: 11, color: C.brownLight, opacity: 0.5 }}>Extreme</Text>
      </View>
    </View>
  );
}

/* ── Medication Tag ── */
function MedTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.orangeLight,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        marginBottom: 8,
        gap: 10,
      }}
    >
      <MaterialIcons name="medication" size={18} color={C.orange} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: C.brownLight }}>{label}</Text>
      <Pressable onPress={onRemove} hitSlop={8}>
        <MaterialIcons name="close" size={18} color={C.brownLight} style={{ opacity: 0.5 }} />
      </Pressable>
    </View>
  );
}

/* ── Mood Chip ── */
function MoodChip({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'column',
        alignItems: 'center',
        flexFlow: 'column',
        backgroundColor: selected ? C.olive : C.cardBg,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: selected ? C.olive : '#E8DDD9',
        gap: 8,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: selected ? 'white' : C.brownLight,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Playback Button ── */
function PlaybackButton({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const { play, pause, isPlaying } = usePlayer(uri);
  return (
    <Pressable
      onPress={() => (isPlaying ? pause() : play())}
      style={{
        marginTop: 16,
        backgroundColor: C.olive,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={20} color="white" />
      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
        {isPlaying ? t('common.pause') : t('common.playRecording')}
      </Text>
    </Pressable>
  );
}

/* ── Types & Steps ── */
type Assessment = {
  goal?: string | null;
  gender?: string | null;
  age?: string | null;
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs' | null;
  mood?: string | null;
  soughtHelpBefore?: string | null;
  physicalDistress?: string | null;
  physicalDistressNotes?: string | null;
  sleepQuality?: number | null;
  takingMeds?: string | null;
  meds?: string | null;
  otherSymptoms?: string | null;
  stressLevel?: number | null;
  soundCheck?: {
    uri: string;
    durationMs: number;
    transcript: string;
    metrics: { words: number; wpm: number; fillerCount: number };
  } | null;
  expressionCheck?: {
    uri: string;
    durationMs: number;
    transcript: string;
    metrics: { words: number; wpm: number; fillerCount: number };
    matchScore: number;
  } | null;
  createdAt: string;
};

const EXPRESSION_PHRASE = 'I am here, taking a moment for myself.';

type StepKey =
  | 'goal'
  | 'gender'
  | 'age'
  | 'weight'
  | 'mood'
  | 'help'
  | 'physical'
  | 'sleep'
  | 'meds'
  | 'medsSpecify'
  | 'symptoms'
  | 'stress'
  | 'sound';

const STEPS: StepKey[] = [
  'goal',
  'gender',
  'age',
  'weight',
  'mood',
  'help',
  'physical',
  'sleep',
  'meds',
  'medsSpecify',
  'symptoms',
  'stress',
  'sound',
];

/* ── Mood presets ── */
const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Angry', emoji: '😤' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Hopeful', emoji: '🌱' },
];

/* ── Sleep quality labels ── */
const SLEEP_OPTIONS = [
  { value: 5, label: 'Excellent', emoji: '🌟' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 3, label: 'Fair', emoji: '😐' },
  { value: 2, label: 'Poor', emoji: '😞' },
  { value: 1, label: 'Very Poor', emoji: '😫' },
];

/* ── Physical distress options ── */
const PHYSICAL_OPTIONS = [
  { label: 'Yes, one or multiple', value: 'Yes' },
  { label: 'No physical pain at all', value: 'No' },
  { label: 'Not sure / prefer not to say', value: 'Not sure' },
];

/* ════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ════════════════════════════════════════════════ */
export default function AssessmentScreen() {
  const { saveAssessment } = useProfile();
  const { data: user } = useUser();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const YESNO = [
    { label: t('common.yes'), value: 'Yes' },
    { label: t('common.no'), value: 'No' },
    { label: t('common.notSure'), value: 'Not sure' },
  ];

  const GENDER = [
    { label: t('common.woman'), value: 'Woman', icon: '👩' },
    { label: t('common.man'), value: 'Man', icon: '👨' },
    { label: t('common.nonBinary'), value: 'Non-binary', icon: '🧑' },
    { label: t('common.preferNotToSay'), value: 'Prefer not to say', icon: '🤐' },
  ];

  const SOUND_PHRASES = useMemo(() => ['I am here, taking a moment for myself.'], []);

  const [a, setA] = useState<Assessment>({
    createdAt: new Date().toISOString(),
    weight: 70,
    weightUnit: 'kg',
  });

  const { startRecording, stopRecording, isRecording } = useRecorder();
  const [recordingFor, setRecordingFor] = useState<null | 'sound' | 'expression'>(null);
  const [draftTranscript, setDraftTranscript] = useState('');
  const [highlightedWordIndex] = useState(-1);
  const [medInput, setMedInput] = useState('');

  const key = STEPS[step];

  // Parse meds string into array for tag display
  const medsArray = useMemo(() => {
    if (!a.meds) return [];
    return a.meds
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
  }, [a.meds]);

  const canContinue = useMemo(() => {
    if (key === 'goal') return Boolean(a.goal?.trim());
    if (key === 'mood') return Boolean(a.mood?.trim());
    if (key === 'medsSpecify') return a.takingMeds !== 'Yes' || Boolean(a.meds?.trim());
    return true;
  }, [key, a]);

  async function next() {
    if (!canContinue) {
      toast.warning(t('common.fillStepToContinue'));
      return;
    }
    if (step === STEPS.length - 1) {
      // Persist to AsyncStorage so the summary page can read it instantly
      const storageKey = userScopedKey('assessment:v1', user?.id);
      await AsyncStorage.setItem(storageKey, JSON.stringify(a));
      // Also persist to Supabase (async, non-blocking for navigation)
      saveAssessment(a).catch((err: any) =>
        console.warn('[Assessment] Supabase save failed:', err),
      );
      router.replace('/(onboarding)/assessment-summary');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setDraftTranscript('');
  }

  function back() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
    setDraftTranscript('');
  }

  async function startRec(kind: 'sound' | 'expression') {
    try {
      setRecordingFor(kind);
      await startRecording();
    } catch (e) {
      setRecordingFor(null);
      toast.error(t('common.allowMicAccess'));
      console.error('Recording start error:', e);
    }
  }

  async function stopRec(target?: 'sound' | 'expression') {
    const kind = target ?? recordingFor;
    if (!isRecording && !kind) return;
    try {
      const { uri, durationMs } = await stopRecording();
      const transcript = draftTranscript.trim() || SOUND_PHRASES[0].replace(',', '');
      const metrics = computeVoiceMetrics(durationMs, transcript);
      if (kind === 'sound') {
        setA((prev) => ({ ...prev, soundCheck: { uri, durationMs, transcript, metrics } }));
      } else {
        const phrase = EXPRESSION_PHRASE.toLowerCase().replaceAll(/[^a-z\s]/g, '');
        const said = transcript.toLowerCase().replaceAll(/[^a-z\s]/g, '');
        const phraseWords = new Set(phrase.split(/\s+/).filter(Boolean));
        const saidWords = new Set(said.split(/\s+/).filter(Boolean));
        let hit = 0;
        phraseWords.forEach((w) => {
          if (saidWords.has(w)) hit += 1;
        });
        const matchScore = phraseWords.size ? Math.round((hit / phraseWords.size) * 100) : 0;
        setA((prev) => ({
          ...prev,
          expressionCheck: { uri, durationMs, transcript, metrics, matchScore },
        }));
      }
      setRecordingFor(null);
      setDraftTranscript('');
    } catch (e) {
      setRecordingFor(null);
      toast.error(t('common.couldNotSaveRecording'));
      console.error('Recording stop error:', e);
    }
  }

  function addMed() {
    const med = medInput.trim();
    if (!med) return;
    const current = medsArray;
    if (!current.includes(med)) {
      setA((p) => ({ ...p, meds: [...current, med].join(', ') }));
    }
    setMedInput('');
  }

  function removeMed(index: number) {
    const updated = medsArray.filter((_, i) => i !== index);
    setA((p) => ({ ...p, meds: updated.length ? updated.join(', ') : null }));
  }

  /* ── Step renderer ── */
  function renderStep() {
    switch (key) {
      case 'goal': {
        const goalOpts = [
          { label: t('assessment.goalOptions.reduceStress'), icon: '🧘' },
          { label: t('assessment.goalOptions.tryAISupport'), icon: '🤖' },
          { label: t('assessment.goalOptions.workThroughExperiences'), icon: '💭' },
          { label: t('assessment.goalOptions.growAndUnderstand'), icon: '🌱' },
          { label: t('assessment.goalOptions.justChecking'), icon: '👋' },
        ];
        return (
          <>
            <Text style={styles.h2}>{t('assessment.goalTitle')}</Text>
            <View style={{ marginTop: 20 }}>
              {goalOpts.map((opt) => (
                <RadioOption
                  key={opt.label}
                  label={opt.label}
                  icon={opt.icon}
                  selected={a.goal === opt.label}
                  onPress={() => setA((p) => ({ ...p, goal: opt.label }))}
                />
              ))}
            </View>
            <TextInput
              value={goalOpts.some((o) => o.label === a.goal) ? '' : (a.goal ?? '')}
              onChangeText={(t) => setA((p) => ({ ...p, goal: t }))}
              placeholder={t('assessment.goalPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.25)"
              style={styles.input}
            />
          </>
        );
      }

      case 'gender':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.genderTitle')}</Text>
            <View style={{ marginTop: 20 }}>
              {GENDER.map((opt) => (
                <RadioOption
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  selected={a.gender === opt.value}
                  onPress={() => setA((p) => ({ ...p, gender: opt.value }))}
                />
              ))}
            </View>
          </>
        );

      case 'age':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.ageTitle')}</Text>
            <View style={{ marginTop: 30 }}>
              <HorizontalRuler
                min={13}
                max={100}
                value={parseInt(a.age || '18', 10)}
                onChange={(v) => setA((p) => ({ ...p, age: String(v) }))}
              />
            </View>
          </>
        );

      case 'weight':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.weightTitle')}</Text>
            <View style={{ marginTop: 24 }}>
              <UnitToggle
                value={a.weightUnit ?? 'kg'}
                onChange={(v) => setA((p) => ({ ...p, weightUnit: v }))}
              />
              <HorizontalRuler
                min={a.weightUnit === 'lbs' ? 80 : 40}
                max={a.weightUnit === 'lbs' ? 400 : 200}
                value={a.weight ?? 70}
                unit={a.weightUnit ?? 'kg'}
                onChange={(v) => setA((p) => ({ ...p, weight: v }))}
              />
            </View>
          </>
        );

      case 'mood':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.moodTitle')}</Text>
            <Text style={styles.sub}>{t('assessment.moodSubtitle')}</Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 20,
                justifyContent: 'center',
              }}
            >
              {MOOD_OPTIONS.map((opt) => (
                <MoodChip
                  key={opt.label}
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={a.mood === opt.label}
                  onPress={() => setA((p) => ({ ...p, mood: opt.label }))}
                />
              ))}
            </View>

            <TextInput
              value={MOOD_OPTIONS.some((o) => o.label === a.mood) ? '' : (a.mood ?? '')}
              onChangeText={(t) => setA((p) => ({ ...p, mood: t }))}
              placeholder={t('assessment.moodPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.25)"
              style={[styles.input, { marginTop: 16 }]}
            />
          </>
        );

      case 'help':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.helpTitle')}</Text>
            <View style={{ marginTop: 20 }}>
              {YESNO.map((opt) => (
                <RadioOption
                  key={opt.value}
                  label={opt.label}
                  selected={a.soughtHelpBefore === opt.value}
                  onPress={() => setA((p) => ({ ...p, soughtHelpBefore: opt.value }))}
                />
              ))}
            </View>
          </>
        );

      case 'physical':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.physicalTitle')}</Text>
            <View style={{ marginTop: 20 }}>
              {PHYSICAL_OPTIONS.map((opt) => (
                <RadioOption
                  key={opt.value}
                  label={opt.label}
                  selected={a.physicalDistress === opt.value}
                  onPress={() => setA((p) => ({ ...p, physicalDistress: opt.value }))}
                />
              ))}
            </View>
            {a.physicalDistress === 'Yes' && (
              <TextInput
                value={a.physicalDistressNotes ?? ''}
                onChangeText={(t) => setA((p) => ({ ...p, physicalDistressNotes: t }))}
                placeholder={t('assessment.physicalPlaceholder')}
                placeholderTextColor="rgba(0,0,0,0.25)"
                multiline
                style={[styles.input, { height: 80, marginTop: 14 }]}
              />
            )}
          </>
        );

      case 'sleep':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.sleepTitle')}</Text>
            <View style={{ marginTop: 20 }}>
              {SLEEP_OPTIONS.map((opt) => (
                <SleepOption
                  key={opt.value}
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={a.sleepQuality === opt.value}
                  onPress={() =>
                    setA((p) => ({ ...p, sleepQuality: opt.value as 1 | 2 | 3 | 4 | 5 }))
                  }
                />
              ))}
            </View>
          </>
        );

      case 'meds':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.medsTitle')}</Text>
            <View style={{ marginTop: 20 }}>
              {YESNO.map((opt) => (
                <RadioOption
                  key={opt.value}
                  label={opt.label}
                  selected={a.takingMeds === opt.value}
                  onPress={() =>
                    setA((p) => ({
                      ...p,
                      takingMeds: opt.value,
                      meds: opt.value === 'Yes' ? (p.meds ?? '') : null,
                    }))
                  }
                />
              ))}
            </View>
          </>
        );

      case 'medsSpecify':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.medsSpecifyTitle')}</Text>
            <Text style={styles.sub}>{t('assessment.medsSpecifySubtitle')}</Text>

            {/* Tag list */}
            {medsArray.length > 0 && (
              <View style={{ marginTop: 16 }}>
                {medsArray.map((med, i) => (
                  <MedTag key={`${med}-${i}`} label={med} onRemove={() => removeMed(i)} />
                ))}
              </View>
            )}

            {/* Input with add button */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                gap: 8,
              }}
            >
              <TextInput
                value={medInput}
                onChangeText={setMedInput}
                placeholder={t('assessment.medsPlaceholder')}
                placeholderTextColor="rgba(0,0,0,0.25)"
                onSubmitEditing={addMed}
                returnKeyType="done"
                style={[styles.input, { flex: 1, marginTop: 0 }]}
              />
              <Pressable
                onPress={addMed}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: C.olive,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="add" size={22} color="white" />
              </Pressable>
            </View>
          </>
        );

      case 'symptoms':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.symptomsTitle')}</Text>
            <Text style={styles.sub}>{t('assessment.symptomsSubtitle')}</Text>
            <TextInput
              value={a.otherSymptoms ?? ''}
              onChangeText={(t) => setA((p) => ({ ...p, otherSymptoms: t }))}
              placeholder={t('assessment.symptomsPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.25)"
              multiline
              style={[styles.input, { height: 120, marginTop: 16, textAlignVertical: 'top' }]}
            />
          </>
        );

      case 'stress':
        return (
          <>
            <Text style={styles.h2}>{t('assessment.stressTitle')}</Text>
            <View style={{ marginTop: 24 }}>
              <StressDots
                value={a.stressLevel ?? 5}
                onChange={(v) => setA((p) => ({ ...p, stressLevel: v as MoodCheckIn['stress'] }))}
              />
            </View>
          </>
        );

      case 'sound':
        return (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={[styles.h2, { marginBottom: 8 }]}>{t('assessment.soundTitle')}</Text>
            <Text style={[styles.sub, { marginBottom: 30 }]}>{t('assessment.soundSubtitle')}</Text>

            <Pressable
              onPress={() =>
                recordingFor === 'sound' || isRecording ? stopRec('sound') : startRec('sound')
              }
            >
              <SoundPulse active={recordingFor === 'sound' || isRecording} />
              {!isRecording && !a.soundCheck && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name="mic" size={32} color="white" />
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: '700',
                      fontSize: 11,
                      marginTop: 4,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {t('common.tapToStart', { defaultValue: 'Tap to start' })}
                  </Text>
                </View>
              )}
              {isRecording && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name="stop" size={32} color="white" />
                </View>
              )}
              {a.soundCheck && !isRecording && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name="check" size={36} color="white" />
                </View>
              )}
            </Pressable>

            {a.soundCheck && !isRecording && <PlaybackButton uri={a.soundCheck.uri} />}

            {/* Phrase display */}
            <View
              style={{
                marginTop: 28,
                padding: 20,
                borderRadius: 20,
                backgroundColor: C.inputBg,
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: C.brownText,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {t('assessment.yourWords')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {SOUND_PHRASES[0].split(/\s+/).map((word, i) => {
                  const isHighlighted = i === highlightedWordIndex;
                  return (
                    <View
                      key={`${word}-${i}`}
                      style={{
                        backgroundColor: isHighlighted ? C.olive : 'transparent',
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '700',
                          color: isHighlighted ? 'white' : C.brownLight,
                        }}
                      >
                        {word}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  }

  /* ── Main render ── */
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.pageBg,
        paddingHorizontal: 20,
        paddingTop: insets.top + 16,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={back}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              borderWidth: 1.5,
              borderColor: 'rgba(150,120,78,0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: C.pageBg,
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={C.brownText} />
          </Pressable>
          <Text style={{ color: C.brownText, fontSize: 17, fontWeight: '700' }}>
            {t('assessment.assessmentTitle')}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: C.tagBg,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: C.brownText, fontSize: 12, fontWeight: '700' }}>
            {t('assessment.stepCount', { current: step + 1, total: STEPS.length })}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <ProgressBar current={step} total={STEPS.length} />

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card */}
        <View
          style={{
            paddingVertical: 24,
            paddingHorizontal: 20,
            backgroundColor: C.cardBg,
            borderRadius: 28,
            minHeight: 380,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {renderStep()}
        </View>

        {/* Continue button */}
        <Pressable
          onPress={next}
          disabled={!canContinue}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 18,
            borderRadius: 30,
            backgroundColor: canContinue ? C.brown : 'rgba(160,123,85,0.4)',
            marginTop: 20,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>
            {step === STEPS.length - 1 ? t('assessment.complete') : t('assessment.next')}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Shared styles ── */
const styles: any = {
  h2: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: C.brownLight,
    lineHeight: 32,
  },
  sub: {
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
    color: C.brownLight,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 16,
    backgroundColor: C.inputBg,
    fontSize: 15,
    fontWeight: '500',
    color: C.brownLight,
  },
};
