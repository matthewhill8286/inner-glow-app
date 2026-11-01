import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * Settings · Accessibility (08 §2.7). Device preferences, kept in AsyncStorage rather than the
 * profile, because a phone's motion and text settings belong to that phone.
 * - reduceMotion: defaults to the system setting until the person changes it here. Stops the orb's
 *   breathing loop.
 * - softerGlows: multiplies every glow's opacity by SOFT_GLOW.
 * - haptics: light taps at each phase change in the breathing player.
 */
export type AccessibilityPrefs = { reduceMotion: boolean; softerGlows: boolean; haptics: boolean };

const KEY = 'accessibility:v1';
export const SOFT_GLOW = 0.6;
export const DEFAULT_PREFS: AccessibilityPrefs = {
  reduceMotion: false,
  softerGlows: false,
  haptics: true,
};

type Store = AccessibilityPrefs & {
  loaded: boolean;
  set: (patch: Partial<AccessibilityPrefs>) => void;
};

export const useAccessibilityPrefs = create<Store>((set, get) => ({
  ...DEFAULT_PREFS,
  loaded: false,
  set: (patch) => {
    set(patch);
    const { reduceMotion, softerGlows, haptics } = { ...get(), ...patch };
    AsyncStorage.setItem(KEY, JSON.stringify({ reduceMotion, softerGlows, haptics })).catch(
      () => {},
    );
  },
}));

/** Loads the saved choices once at start-up; reduce motion falls back to the system setting. */
export async function loadAccessibilityPrefs() {
  let saved: Partial<AccessibilityPrefs> = {};
  try {
    saved = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
  } catch {
    saved = {};
  }
  const systemReduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
  useAccessibilityPrefs.setState({
    ...DEFAULT_PREFS,
    reduceMotion: systemReduceMotion,
    ...saved,
    loaded: true,
  });
}

/** Glow opacity after "Softer glows". */
export function useGlowOpacity() {
  const softer = useAccessibilityPrefs((s) => s.softerGlows);
  return (opacity: number) => (softer ? opacity * SOFT_GLOW : opacity);
}
