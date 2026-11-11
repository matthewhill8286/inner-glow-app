import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Session expired (`6832:8167`). The email of the last signed-in account is kept while a session
 * exists. If the session then ends without the person signing out, the app shows "Please sign in
 * again" instead of dropping straight to sign-in.
 */
const KEY = 'session:last-email:v1';
let onPurpose = false;

export async function rememberSessionEmail(email: string | null | undefined) {
  if (email) await AsyncStorage.setItem(KEY, email).catch(() => undefined);
}

/** Call before any sign-out the person asked for, so it isn't treated as an expiry. */
export async function signOutOnPurpose() {
  onPurpose = true;
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}

/** The email of a session that ended by itself, or null when there wasn't one. */
export async function expiredSessionEmail(): Promise<string | null> {
  if (onPurpose) {
    onPurpose = false;
    return null;
  }
  return AsyncStorage.getItem(KEY).catch(() => null);
}

export async function forgetExpiredSession() {
  onPurpose = false;
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
