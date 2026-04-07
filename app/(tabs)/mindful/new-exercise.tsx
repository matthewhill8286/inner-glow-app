import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

// ─── Goal options ────────────────────────────
const getGoals = (t: any) => [
  { id: 'focus', label: t('newExercise.goals.focus'), icon: 'psychology', color: '#8B6B47' },
  { id: 'sleep', label: t('newExercise.goals.sleep'), icon: 'bedtime', color: '#5A8FB5' },
  { id: 'better', label: t('newExercise.goals.better'), icon: 'favorite', color: '#C45B5B' },
  { id: 'trauma', label: t('newExercise.goals.trauma'), icon: 'shield', color: '#7B6DC9' },
  { id: 'enjoy', label: t('newExercise.goals.enjoy'), icon: 'emoji-emotions', color: '#E8985A' },
];

// ─── Soundscape options ──────────────────────
const getSoundscapes = (t: any) => [
  { id: 'birds', label: t('newExercise.soundscapes.birds'), icon: 'nature', color: '#5B8A5A' },
  { id: 'zen', label: t('newExercise.soundscapes.zen'), icon: 'spa', color: '#7B6DC9' },
  { id: 'stream', label: t('newExercise.soundscapes.stream'), icon: 'water', color: '#5A8FB5' },
  { id: 'rain', label: t('newExercise.soundscapes.rain'), icon: 'grain', color: '#8B6B47' },
  { id: 'ocean', label: t('newExercise.soundscapes.ocean'), icon: 'waves', color: '#4AAD7A' },
  {
    id: 'silence',
    label: t('newExercise.soundscapes.silence'),
    icon: 'volume-off',
    color: '#E8985A',
  },
];

// ─── Time presets ────────────────────────────
const TIME_PRESETS = [5, 10, 15, 20, 25, 30];

// ─── Sound preview files ────────────────────
const PREVIEW_FILES: Record<string, any> = {
  birds: require('@/assets/sounds/birds.mp3'),
  zen: require('@/assets/sounds/zen.mp3'),
  stream: require('@/assets/sounds/stream.mp3'),
  rain: require('@/assets/sounds/rain.mp3'),
  ocean: require('@/assets/sounds/ocean.mp3'),
};

const PREVIEW_DURATION = 3500; // 3.5 seconds

export default function NewExercise() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [selectedSoundscape, setSelectedSoundscape] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const previewPlayerRef = useRef<AudioPlayer | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (previewPlayerRef.current) {
      try {
        previewPlayerRef.current.pause();
        previewPlayerRef.current.release();
      } catch {}
      previewPlayerRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  const playPreview = useCallback(
    (id: string) => {
      stopPreview();

      const source = PREVIEW_FILES[id];
      if (!source) return; // 'silence' — no preview

      try {
        const player = createAudioPlayer(source);
        player.volume = 0.5;
        player.play();
        previewPlayerRef.current = player;
        setPreviewingId(id);

        previewTimerRef.current = setTimeout(() => {
          stopPreview();
        }, PREVIEW_DURATION);
      } catch (err) {
        console.warn('[preview] Failed to play:', err);
      }
    },
    [stopPreview],
  );

  // Cleanup on unmount or step change
  useEffect(() => {
    return () => stopPreview();
  }, [step, stopPreview]);

  const canProceed =
    (step === 1 && selectedGoal) ||
    (step === 2 && selectedMinutes > 0) ||
    (step === 3 && selectedSoundscape);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      stopPreview();
      // Start session
      router.push({
        pathname: '/(tabs)/mindful/session',
        params: {
          goal: selectedGoal || 'focus',
          minutes: String(selectedMinutes),
          soundscape: selectedSoundscape || 'silence',
        },
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: UI.spacing.xl,
        paddingTop: insets.top + 6,
      }}
    >
      {/* Header */}
      <View style={{ marginTop: 6 } as any}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.7 : 1 })}
            >
              <MaterialIcons
                name={Platform.OS === 'ios' ? 'arrow-back-ios' : 'arrow-back'}
                size={24}
                color={colors.text}
              />
            </Pressable>
            <Text
              style={{
                fontSize: Platform.OS === 'ios' ? 26 : 22,
                fontWeight: Platform.OS === 'ios' ? '900' : '700',
                color: colors.text,
              }}
            >
              {t('newExercise.title')}
            </Text>
          </View>
          <Text style={{ color: colors.mutedText, fontWeight: '600' }}>
            {t('newExercise.stepCounter', { step, total: 3 })}
          </Text>
        </View>
      </View>

      {/* Step progress bar */}
      <View
        style={{
          flexDirection: 'row',
          gap: 6,
          marginTop: 16,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: s <= step ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>

      {/* Step content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
      >
        {step === 1 && (
          <StepGoal colors={colors} selectedGoal={selectedGoal} onSelect={setSelectedGoal} t={t} />
        )}
        {step === 2 && (
          <StepTime
            colors={colors}
            selectedMinutes={selectedMinutes}
            onSelect={setSelectedMinutes}
            t={t}
          />
        )}
        {step === 3 && (
          <StepSoundscape
            colors={colors}
            selectedSoundscape={selectedSoundscape}
            previewingId={previewingId}
            onSelect={(id: string) => {
              setSelectedSoundscape(id);
              playPreview(id);
            }}
            t={t}
          />
        )}
      </ScrollView>

      {/* Bottom button */}
      <View
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 100 : 88,
          left: 0,
          right: 0,
          padding: UI.spacing.xl,
          paddingBottom: UI.spacing.md,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          onPress={handleNext}
          disabled={!canProceed}
          style={({ pressed }) => ({
            backgroundColor: canProceed ? colors.primary : colors.border,
            paddingVertical: 18,
            borderRadius: UI.radius.lg,
            alignItems: 'center',
            opacity: pressed && canProceed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: canProceed ? colors.onPrimary : colors.mutedText,
              fontWeight: '800',
              fontSize: 16,
            }}
          >
            {step === 3 ? t('newExercise.startButton') : t('newExercise.continueButton')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Step 1: Goal Selection ──────────────────
function StepGoal({
  colors,
  selectedGoal,
  onSelect,
  t,
}: {
  colors: any;
  selectedGoal: string | null;
  onSelect: (id: string) => void;
  t: any;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {t('newExercise.goalTitle')}
      </Text>
      <Text
        style={{
          color: colors.mutedText,
          fontSize: 14,
          marginBottom: 20,
        }}
      >
        {t('newExercise.goalSubtitle')}
      </Text>

      <View style={{ gap: 10 }}>
        {getGoals(t).map((goal) => {
          const isSelected = selectedGoal === goal.id;
          return (
            <Pressable
              key={goal.id}
              onPress={() => onSelect(goal.id)}
              style={({ pressed }) => ({
                backgroundColor: isSelected ? goal.color + '15' : colors.card,
                borderRadius: UI.radius.lg,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? goal.color : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: goal.color + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={goal.icon as any} size={24} color={goal.color} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.text,
                }}
              >
                {goal.label}
              </Text>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? goal.color : colors.border,
                  backgroundColor: isSelected ? goal.color : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 2: Time Picker ─────────────────────
function StepTime({
  colors,
  selectedMinutes,
  onSelect,
  t,
}: {
  colors: any;
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  t: any;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {t('newExercise.timeTitle')}
      </Text>
      <Text
        style={{
          color: colors.mutedText,
          fontSize: 14,
          marginBottom: 28,
        }}
      >
        {t('newExercise.timeSubtitle')}
      </Text>

      {/* Large time display with integrated +/- controls */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.md,
          }}
        >
          <Text
            style={{
              fontSize: 52,
              fontWeight: '900',
              color: colors.primary,
              letterSpacing: -1,
            }}
          >
            {selectedMinutes}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedText,
              fontWeight: '600',
              marginTop: 2,
            }}
          >
            {t('newExercise.minutesLabel')}
          </Text>
        </View>
      </View>

      {/* +/- stepper controls */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* -5 button */}
        <Pressable
          onPress={() => onSelect(Math.max(1, selectedMinutes - 5))}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>−5</Text>
        </Pressable>

        {/* -1 button */}
        <Pressable
          onPress={() => onSelect(Math.max(1, selectedMinutes - 1))}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>−1</Text>
        </Pressable>

        {/* +1 button */}
        <Pressable
          onPress={() => onSelect(Math.min(60, selectedMinutes + 1))}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>+1</Text>
        </Pressable>

        {/* +5 button */}
        <Pressable
          onPress={() => onSelect(Math.min(60, selectedMinutes + 5))}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>+5</Text>
        </Pressable>
      </View>

      {/* Preset quick-select buttons */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {TIME_PRESETS.map((mins) => {
          const isSelected = selectedMinutes === mins;
          return (
            <Pressable
              key={mins}
              onPress={() => onSelect(mins)}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: UI.radius.pill,
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontWeight: '700',
                  color: isSelected ? colors.onPrimary : colors.text,
                  fontSize: 14,
                }}
              >
                {mins} min
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 3: Soundscape Selector ─────────────
function StepSoundscape({
  colors,
  selectedSoundscape,
  previewingId,
  onSelect,
  t,
}: {
  colors: any;
  selectedSoundscape: string | null;
  previewingId: string | null;
  onSelect: (id: string) => void;
  t: any;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {t('newExercise.soundscapeTitle')}
      </Text>
      <Text
        style={{
          color: colors.mutedText,
          fontSize: 14,
          marginBottom: 20,
        }}
      >
        {t('newExercise.soundscapeSubtitle')}
      </Text>

      <View style={{ gap: 10 }}>
        {getSoundscapes(t).map((sound) => {
          const isSelected = selectedSoundscape === sound.id;
          const isPreviewing = previewingId === sound.id;
          return (
            <Pressable
              key={sound.id}
              onPress={() => onSelect(sound.id)}
              style={({ pressed }) => ({
                backgroundColor: isSelected ? sound.color + '15' : colors.card,
                borderRadius: UI.radius.lg,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? sound.color : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: sound.color + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={sound.icon as any} size={24} color={sound.color} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.text,
                }}
              >
                {sound.label}
              </Text>

              {/* Waveform / preview indicator */}
              {isSelected && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                    marginRight: 8,
                  }}
                >
                  {isPreviewing ? (
                    <>
                      <MaterialIcons name="volume-up" size={16} color={sound.color} style={{ marginRight: 4 }} />
                      {[10, 18, 8, 22, 14, 20, 6, 16].map((h, i) => (
                        <View
                          key={i}
                          style={{
                            width: 3,
                            height: h,
                            borderRadius: 1.5,
                            backgroundColor: sound.color,
                          }}
                        />
                      ))}
                    </>
                  ) : (
                    [12, 20, 8, 16, 24, 10, 18, 6, 14, 22].map((h, i) => (
                      <View
                        key={i}
                        style={{
                          width: 3,
                          height: h,
                          borderRadius: 1.5,
                          backgroundColor: sound.color + '60',
                        }}
                      />
                    ))
                  )}
                </View>
              )}

              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? sound.color : colors.border,
                  backgroundColor: isSelected ? sound.color : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
