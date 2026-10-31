import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/supabase/supabase';
import { safeDiagnostic, type DiagnosticEvent, type DiagnosticCode } from './diagnostic-events';
const KEY = 'diagnostics:safe:v1';
let queue: ReturnType<typeof safeDiagnostic>[] = [];
let writing = Promise.resolve();
let flushing = false;
export function recordDiagnostic(
  event: DiagnosticEvent,
  code: DiagnosticCode = 'UNEXPECTED',
): string {
  const reference = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  const item = safeDiagnostic({
    event,
    code,
    reference,
    platform: Platform.OS,
    release: `${Constants.expoConfig?.version ?? '0'} (${Constants.nativeBuildVersion ?? '0'})`,
  });
  queue = [...queue, item].slice(-20);
  writing = writing
    .catch(() => {})
    .then(() => AsyncStorage.setItem(KEY, JSON.stringify(queue)))
    .catch(() => {});
  void writing.then(flushDiagnostics);
  return reference;
}
export async function flushDiagnostics() {
  if (flushing) return;
  flushing = true;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    if (!queue.length) {
      const raw = await AsyncStorage.getItem(KEY);
      try {
        queue = (JSON.parse(raw || '[]') as unknown[])
          .map(safeDiagnostic)
          .filter(Boolean)
          .slice(-20);
      } catch {
        queue = [];
      }
    }
    const batch = queue.slice();
    for (const item of batch) {
      if (!item) continue;
      const { error } = await supabase.functions.invoke('client-diagnostics', { body: item });
      if (error) break;
      queue = queue.filter((row) => row?.reference !== item.reference);
    }
    writing = writing
      .catch(() => {})
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(queue)))
      .catch(() => {});
    await writing;
  } catch {
    /* Diagnostics must never interrupt the app or recursively report themselves. */
  } finally {
    flushing = false;
  }
}
let installed = false;
export function installCrashDiagnostics() {
  if (installed) return;
  installed = true;
  const errors = (
    globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', () => {
      recordDiagnostic('app_crash');
    });
    window.addEventListener('unhandledrejection', () => {
      recordDiagnostic('app_crash');
    });
  }
  if (!errors) return;
  const previous = errors.getGlobalHandler();
  errors.setGlobalHandler((error, isFatal) => {
    recordDiagnostic('app_crash');
    previous(error, isFatal);
  });
}
