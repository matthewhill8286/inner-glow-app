export interface BreathingExercise {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  inhale: number;
  hold?: number;
  exhale: number;
  holdAfterExhale?: number;
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: '478',
    title: '4-7-8 Breathing',
    subtitle: 'Relaxation and sleep aid.',
    description:
      'Inhale for 4s, Hold for 7s, Exhale for 8s. Try 3–5 cycles. If you feel lightheaded, stop and breathe normally.',
    inhale: 4,
    hold: 7,
    exhale: 8,
  },
  {
    id: 'box',
    title: 'Box Breathing',
    subtitle: 'Reset your stress response.',
    description:
      'Inhale for 4s, Hold for 4s, Exhale for 4s, Hold for 4s. Repeat for several minutes.',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 4,
  },
  {
    id: 'equal',
    title: 'Equal Breathing',
    subtitle: 'Balance and focus.',
    description: 'Inhale for 4s, Exhale for 4s. This simple technique helps center your mind.',
    inhale: 4,
    exhale: 4,
  },
  {
    id: '444',
    title: '4-4-4 Breathing',
    subtitle: 'Quick calm.',
    description: 'Inhale for 4s, Hold for 4s, Exhale for 4s.',
    inhale: 4,
    hold: 4,
    exhale: 4,
  },
];
