import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The "Before we begin" agreement (01 §2.5). It is stored on the device until the user has an
 * account; writing it to the backend after sign-up is a separate task (t180).
 */
export const CONSENT_VERSION = '2026-10';
const KEY = 'consent:v1';

export type LocalConsent = { version: string; acceptedAt: string };

export function consentRecord(now = new Date()): LocalConsent {
  return { version: CONSENT_VERSION, acceptedAt: now.toISOString() };
}

export async function saveLocalConsent() {
  await AsyncStorage.setItem(KEY, JSON.stringify(consentRecord()));
}

export async function loadLocalConsent(): Promise<LocalConsent | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalConsent) : null;
  } catch {
    return null;
  }
}
