import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionV1 = {
  email: string;
  token: string;
  createdAt: string;
  userId?: string; // may be missing for legacy sessions
};

export type Session = Required<Omit<SessionV1, 'userId'>> & { userId: string };

export const SESSION_KEY = 'auth:session:v1';

function generateUserId() {
  // Lightweight unique ID generator without external deps
  const rand = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36);
  return `usr_${time}${rand}`;
}

/**
 * @deprecated Use supabase.auth.getSession()
 */
export async function readSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  let parsed: SessionV1;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed) return null;
  if (!parsed.token) return null;
  if (!parsed.userId) {
    // Backfill userId for legacy sessions
    parsed.userId = generateUserId();
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
  }
  const { email, token, createdAt, userId } = parsed as Session;
  return { email, token, createdAt, userId };
}

/**
 * @deprecated Sessions are now managed by Supabase
 */
export async function writeSession(
  input: Partial<Pick<Session, 'userId'>> &
    Omit<Session, 'createdAt' | 'userId'> & { createdAt?: string },
) {
  const createdAt = input.createdAt || new Date().toISOString();
  const userId = input.userId || generateUserId();
  const session: Session = { ...(input as any), userId, createdAt } as Session;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export const userScopedKey = (baseKey: string, userId?: string | null) => {
  return userId ? `${baseKey}:${userId}` : baseKey;
};

export async function migrateToUserScoped(baseKey: string, userId?: string | null) {
  if (!userId) return;
  const globalVal = await AsyncStorage.getItem(baseKey);
  const scopedKey = userScopedKey(baseKey, userId);
  const scopedVal = await AsyncStorage.getItem(scopedKey);
  if (globalVal && !scopedVal) {
    await AsyncStorage.setItem(scopedKey, globalVal);
    // Do not delete global to avoid data loss in edge cases
  }
}
