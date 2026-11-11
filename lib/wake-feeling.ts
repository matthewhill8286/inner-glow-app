import * as Notifications from 'expo-notifications';

/**
 * "How did you wake up?" (`6852:8397`): the wake-up alarm carries Heavy, Okay and Bright buttons.
 * Each opens the mood check-in with that mood picked, so the person can save it in one more tap.
 */
export const WAKE_CATEGORY = 'wake_feeling';
export const WAKE_ACTIONS = { wake_heavy: 2, wake_okay: 3, wake_bright: 4 } as const;
export type WakeAction = keyof typeof WAKE_ACTIONS;

export function wakeMoodScore(actionIdentifier: string): number | null {
  return actionIdentifier in WAKE_ACTIONS ? WAKE_ACTIONS[actionIdentifier as WakeAction] : null;
}

export async function registerWakeCategory(labels: {
  heavy: string;
  okay: string;
  bright: string;
}) {
  await Notifications.setNotificationCategoryAsync(WAKE_CATEGORY, [
    {
      identifier: 'wake_heavy',
      buttonTitle: labels.heavy,
      options: { opensAppToForeground: true },
    },
    { identifier: 'wake_okay', buttonTitle: labels.okay, options: { opensAppToForeground: true } },
    {
      identifier: 'wake_bright',
      buttonTitle: labels.bright,
      options: { opensAppToForeground: true },
    },
  ]).catch(() => undefined);
}
