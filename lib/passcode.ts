import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * In-app passcode for the app lock (`6832:8264`). Only a salted SHA-256 of the six digits is kept,
 * in the Keychain via SecureStore, per user and per device. Five wrong tries sign the person out.
 */
export const PASSCODE_LENGTH = 6;
export const MAX_ATTEMPTS = 5;

const key = (userId: string) => `passcode_v1_${userId.replace(/[^A-Za-z0-9._-]/g, '')}`;

export function isValidPasscode(code: string): boolean {
  return new RegExp(`^\\d{${PASSCODE_LENGTH}}$`).test(code);
}

async function digest(salt: string, code: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

export async function setPasscode(userId: string, code: string): Promise<void> {
  if (!isValidPasscode(code)) throw new Error('Passcode must be six digits');
  const salt = Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join(
    '',
  );
  await SecureStore.setItemAsync(
    key(userId),
    JSON.stringify({ salt, hash: await digest(salt, code) }),
    {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
}

export async function hasPasscode(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  return !!(await SecureStore.getItemAsync(key(userId)).catch(() => null));
}

export async function verifyPasscode(userId: string, code: string): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(key(userId)).catch(() => null);
  if (!raw || !isValidPasscode(code)) return false;
  try {
    const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
    return (await digest(salt, code)) === hash;
  } catch {
    return false;
  }
}

export async function clearPasscode(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(key(userId)).catch(() => undefined);
}
