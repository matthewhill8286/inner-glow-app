import { Platform, Linking } from 'react-native';
import { supabase } from '@/supabase/supabase';
import { functionError } from '@/lib/function-errors';
import { hasNativeStore } from '@/lib/revenuecat';

const ANDROID_PACKAGE = 'com.matthill8286.innerglow';

/** Store subscriptions are managed in the store; Stripe ones in Stripe's billing portal. */
export async function openSubscriptionManagement(stripeCustomer = false) {
  if (Platform.OS === 'ios') {
    await Linking.openURL('https://apps.apple.com/account/subscriptions');
    return;
  }
  if (Platform.OS === 'android' && hasNativeStore() && !stripeCustomer) {
    await Linking.openURL(
      `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`,
    );
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
