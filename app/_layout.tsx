import { Stack, router } from 'expo-router';
import { AlertModal } from '@/components/AlertModal';
import { ToastContainer } from '@/components/Toast';

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import './../i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /* Only refetch on mount if data is stale (respects per-query staleTime) */
      refetchOnMount: true,
    },
  },
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);

  /* ── Handle Supabase deep-link URLs (password reset, email confirm, etc.) ── */
  useEffect(() => {
    // On native, Supabase can't auto-detect the URL token, so we parse it
    // from the deep link and pass it to Supabase via setSession.
    if (Platform.OS === 'web') return; // web handles via detectSessionInUrl

    function handleDeepLink(event: { url: string }) {
      const url = event.url;
      if (!url) return;

      // Supabase appends tokens as a URL fragment: #access_token=...&type=recovery
      const fragment = url.split('#')[1];
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (accessToken && refreshToken) {
        // Set the session from the deep link tokens
        supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            .then(() => {
              if (type === 'recovery') {
                router.replace('/(auth)/reset-password');
              }
            })
            .catch((err) => {
              console.error('[DeepLink] Failed to set session:', err);
            });
      }
    }

    // Handle deep link if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle deep link while app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  /* ── Listen for Supabase auth state changes (PASSWORD_RECOVERY on web) ── */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Supabase detected a recovery token — navigate to reset password
        router.replace('/(auth)/reset-password');
      }

      // Invalidate cached user on any auth change (sign-in, sign-out, token refresh)
      if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => await registerForPushNotificationsAsync())();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
    });
  }, []);

  return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(utils)" />
            <Stack.Screen name="(suggestion-actions)" />
          </Stack>
          <AlertModal />
          <ToastContainer />
        </QueryClientProvider>
      </SafeAreaProvider>
  );
}
