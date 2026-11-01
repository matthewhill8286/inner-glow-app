import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { userScopedKey } from './storage';
import { biometricKind, type BiometricKind } from './profile-setup';

/**
 * App lock (P4 "Keep your space private"). The choice is per user and per device, so it lives in
 * AsyncStorage rather than the profile: a lock turned on one phone must not lock another.
 */
const KEY = 'app-lock:v1';

/** Coming back within this long (app switcher, a quick reply) does not ask again. */
export const LOCK_AFTER_MS = 30_000;

export function shouldLock(backgroundedAt: number | null, now: number): boolean {
  return backgroundedAt != null && now - backgroundedAt >= LOCK_AFTER_MS;
}

export async function biometricSupport(): Promise<{ available: boolean; kind: BiometricKind | null }> {
  if (Platform.OS === 'web') return { available: false, kind: null };
  try {
    const [hardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return hardware && enrolled ? { available: true, kind: biometricKind(types, Platform.OS) } : { available: false, kind: null };
  } catch {
    return { available: false, kind: null };
  }
}

export async function isAppLockEnabled(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await AsyncStorage.getItem(userScopedKey(KEY, userId))) === 'on';
  } catch {
    return false;
  }
}

export async function setAppLockEnabled(userId: string, enabled: boolean): Promise<void> {
  const key = userScopedKey(KEY, userId);
  if (enabled) await AsyncStorage.setItem(key, 'on');
  else await AsyncStorage.removeItem(key);
}

/** Shows the system prompt; the device passcode is allowed as a fallback, as on iOS. */
export async function authenticate(promptMessage: string, cancelLabel: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel, disableDeviceFallback: false });
    return result.success;
  } catch {
    return false;
  }
}
