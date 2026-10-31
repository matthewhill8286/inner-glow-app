import { Platform, Linking } from 'react-native';
import { supabase } from '@/supabase/supabase';
import { functionError } from '@/lib/function-errors';
export async function openSubscriptionManagement() {
  if (Platform.OS === 'ios') {
    await Linking.openURL('https://apps.apple.com/account/subscriptions');
    return;
  }
  const { data, error } = await supabase.functions.invoke('subscription-management', {
    body: {
      returnUrl:
        Platform.OS === 'web'
          ? new URL('/profile', window.location.origin).href
          : 'https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/support/',
    },
  });
  if (error) throw await functionError(error);
  if (!data?.url) throw new Error('Unable to open subscription settings.');
  if (Platform.OS === 'web') window.location.assign(data.url);
  else await Linking.openURL(data.url);
}
