import en from '@/i18n/locales/en/translation';
import el from '@/i18n/locales/el/translation';

export const PROFILE_GOALS = [
  'goalCalm',
  'goalFocus',
  'goalSleep',
  'goalStress',
  'goalConfidence',
  'goalBalance',
] as const;
export const PROFILE_ROUTINES = ['routineMorning', 'routineEvening', 'routineAnytime'] as const;
type ChoiceKey = (typeof PROFILE_GOALS)[number] | (typeof PROFILE_ROUTINES)[number];
type ChoiceKind = 'goal' | 'routine';
function choiceKey(value: string | null | undefined, kind: ChoiceKind): ChoiceKey | undefined {
  const normalized = value?.trim().toLocaleLowerCase();
  const keys = kind === 'goal' ? PROFILE_GOALS : PROFILE_ROUTINES;
  return keys.find((key) =>
    [en.profileSetup[key], el.profileSetup[key]].some(
      (label) => label.toLocaleLowerCase() === normalized,
    ),
  );
}
/** Persist stable English values; render each predefined value in the selected language. */
export function normalizeProfileChoice(value: string | null | undefined, kind: ChoiceKind) {
  const key = choiceKey(value, kind);
  return key ? en.profileSetup[key] : value;
}
export function profileChoiceLabel(
  value: string | null | undefined,
  kind: ChoiceKind,
  translate: (key: string) => string,
) {
  const key = choiceKey(value, kind);
  return key ? translate('profileSetup.' + key) : value;
}
export function profileChoiceValue(key: ChoiceKey) {
  return en.profileSetup[key];
}
