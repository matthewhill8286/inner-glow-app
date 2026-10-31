import AsyncStorage from '@react-native-async-storage/async-storage';
import { userScopedKey } from '@/lib/storage';
import { showAlert } from '@/lib/state';
import { supabase } from '@/supabase/supabase';

export async function publishCommunityContent(body: Record<string, unknown>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Please sign in first');
  const consentKey = userScopedKey('community:screening-permission:v1', session.user.id);
  if ((await AsyncStorage.getItem(consentKey)) !== 'allowed') {
    const allowed = await new Promise<boolean>((resolve) =>
      showAlert(
        'Allow community content screening?',
        'Your community posts, comments and profile text are sent to OpenAI to screen for harmful content before publishing. Public content is visible to other community members. Do not include private information about other people.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Allow', onPress: () => resolve(true) },
        ],
      ),
    );
    if (!allowed) throw new Error('Community publishing canceled');
    await AsyncStorage.setItem(consentKey, 'allowed');
  }
  const {
    data: { session: current },
  } = await supabase.auth.getSession();
  if (current?.user.id !== session.user.id)
    throw new Error('Your account changed. Please try again.');
  const { data, error } = await supabase.functions.invoke('community-publish', { body });
  if (error) {
    let message = 'Unable to publish right now. Please try again.';
    try {
      const result = await error.context?.json();
      if (result?.error) message = result.error;
    } catch {
      /* use fallback */
    }
    throw new Error(message);
  }
  if (data?.error || !data?.data) throw new Error(data?.error || 'Unable to publish content');
  return data.data;
}
