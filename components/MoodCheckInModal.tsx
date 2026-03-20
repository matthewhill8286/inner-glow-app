import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ------------------------------------------------------------------ */
/*  Mood scale                                                         */
/* ------------------------------------------------------------------ */

const MOODS = [
  { key: 'awful', emoji: '😞', color: '#EF4444' },
  { key: 'low', emoji: '😕', color: '#F97316' },
  { key: 'neutral', emoji: '😐', color: '#EAB308' },
  { key: 'good', emoji: '🙂', color: '#22C55E' },
  { key: 'great', emoji: '😊', color: '#5AAF8B' },
] as const;

export type MoodValue = (typeof MOODS)[number]['key'];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type MoodCheckInModalProps = {
  visible: boolean;
  accentColor: string;
  activityTitle: string;
  onComplete: (moods: { moodBefore: MoodValue; moodAfter: MoodValue }) => void;
  onSkip: () => void;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MoodCheckInModal({
  visible,
  accentColor,
  activityTitle,
  onComplete,
  onSkip,
}: MoodCheckInModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'before' | 'after'>('before');
  const [moodBefore, setMoodBefore] = useState<MoodValue | null>(null);

  const handleSelect = (mood: MoodValue) => {
    if (step === 'before') {
      setMoodBefore(mood);
      setStep('after');
    } else {
      // Step "after" — we have both values
      onComplete({ moodBefore: moodBefore!, moodAfter: mood });
      // Reset for next use
      setStep('before');
      setMoodBefore(null);
    }
  };

  const handleSkip = () => {
    onSkip();
    setStep('before');
    setMoodBefore(null);
  };

  const title =
    step === 'before'
      ? t('moodCheckIn.howBefore')
      : t('moodCheckIn.howAfter');

  const subtitle =
    step === 'before'
      ? t('moodCheckIn.beforeSubtitle')
      : t('moodCheckIn.afterSubtitle');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: accentColor }]} />
            <View
              style={[
                styles.stepDot,
                { backgroundColor: step === 'after' ? accentColor : accentColor + '30' },
              ]}
            />
          </View>

          {/* Activity name */}
          <Text style={[styles.activityName, { color: accentColor }]} numberOfLines={2}>
            {activityTitle}
          </Text>

          {/* Question */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Mood picker */}
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => handleSelect(m.key)}
                style={({ pressed }) => [
                  styles.moodBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.moodCircle, { backgroundColor: m.color + '15' }]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                </View>
                <Text style={[styles.moodLabel, { color: m.color }]}>
                  {t(`moodCheckIn.moods.${m.key}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Skip button */}
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.skipText}>{t('moodCheckIn.skip')}</Text>
            <MaterialIcons name="arrow-forward" size={14} color="#888" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  moodBtn: {
    alignItems: 'center',
    gap: 6,
  },
  moodCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 26,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  skipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
});
