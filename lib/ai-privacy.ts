import { functionError } from '@/lib/function-errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase/supabase';
import { userScopedKey } from '@/lib/storage';
import { showAlert } from '@/lib/state';

const pending = new Map<string, Promise<boolean>>();
const keyFor = (id: string) => userScopedKey('ai:permission:v1', id);
export async function aiPermission(userId: string) {
  return AsyncStorage.getItem(keyFor(userId));
}
export async function setAIPermission(userId: string, allowed: boolean) {
  await AsyncStorage.setItem(keyFor(userId), allowed ? 'allowed' : 'declined');
}

export async function requestAIPermission(userId: string, force = false): Promise<boolean> {
  const saved = await aiPermission(userId);
  if (!force && saved) return saved === 'allowed';
  if (pending.has(userId)) return pending.get(userId)!;
  const task = new Promise<boolean>((resolve) => {
    showAlert(
      'Allow AI data processing?',
      'AI features send the relevant chat messages, mood or sleep entries, wellness context, or voice recording you select through Supabase to OpenAI. This information may contain personal health details. AI companions provide general wellness support and are not medical professionals. You can decline and continue using the other tools, or withdraw permission in Profile → AI Data Permission.',
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => {
            void setAIPermission(userId, false).then(
              () => resolve(false),
              () => resolve(false),
            );
          },
        },
        {
          text: 'Allow',
          onPress: () => {
            void setAIPermission(userId, true).then(
              () => resolve(true),
              () => resolve(false),
            );
          },
        },
      ],
    );
  });
  pending.set(userId, task);
  try {
    return await task;
  } finally {
    pending.delete(userId);
  }
}

export async function invokeAI(name: string, options: { body: Record<string, unknown> }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Please sign in first');
  if (!(await requestAIPermission(session.user.id)))
    throw new Error('AI data permission is disabled. You can enable it in Profile.');
  const {
    data: { session: current },
  } = await supabase.auth.getSession();
  if (current?.user.id !== session.user.id)
    throw new Error('Your account changed. Please try again.');
  const result = await supabase.functions.invoke(name, options);
  if (result.error) throw await functionError(result.error);
  return result;
}
