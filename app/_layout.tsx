import { canonicalRoute } from '@/lib/legacy-routes';
import { runOptionalStartup } from '@/lib/startup';
import { isAppRoute } from '@/lib/navigation';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { AlertModal } from '@/components/AlertModal';
import { ToastContainer } from '@/components/Toast';
import { AppLockGate } from '@/components/AppLockGate';

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNotificationStore } from '@/lib/notificationStore';
import { configureNotificationPresentation } from '@/lib/notifications';
import './../i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import * as Linking from 'expo-linking';
import { Platform, View, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import configureRevenueCat, { subscribeToPurchaseUpdates } from '@/lib/revenuecat';
import { flushDiagnostics, installCrashDiagnostics, recordDiagnostic } from '@/lib/diagnostics';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';
import { resetSubscription, refreshSubscription } from '@/hooks/useSubscription';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Urbanist_500Medium } from '@expo-google-fonts/urbanist';
import { loadAccessibilityPrefs } from '@/lib/accessibility-prefs';
import { palette } from '@/constants/theme';

// Native builds embed Urbanist as one weighted family (expo-font plugin in app.json).
// Web has no embedding, so it loads the font under the same family name at runtime.
const WEB_FONTS = Platform.OS === 'web' ? { Urbanist: Urbanist_500Medium } : {};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /* Only refetch on mount if data is stale (respects per-query staleTime) */
      refetchOnMount: true,
    },
  },
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const authIdentity = useRef<string | null | undefined>(undefined);
  useFonts(WEB_FONTS);

  useEffect(() => {
    installCrashDiagnostics();
    void flushDiagnostics();
    void loadAccessibilityPrefs();
    return subscribeToPurchaseUpdates(() => {
      void refreshSubscription();
    });
  }, []);

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
    void runOptionalStartup(
      async () => {
        const url = await Linking.getInitialURL();
        if (url) handleDeepLink({ url });
      },
      () => {
        recordDiagnostic('service_failure', 'SERVICE_UNAVAILABLE');
      },
    );

    // Handle deep link while app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  /* ── Initialize RevenueCat (Apple IAP / Google Play Billing) ── */
  useEffect(() => {
    if (Platform.OS === 'web') return; // RevenueCat is native-only

    // Configure with the current user (if any) on app start
    void runOptionalStartup(
      async () => {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        await configureRevenueCat(session?.user?.id ?? null);
      },
      () => {
        recordDiagnostic('billing_refresh', 'BILLING_UNAVAILABLE');
      },
    );
  }, []);

  /* ── Listen for Supabase auth state changes (PASSWORD_RECOVERY on web) ── */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextIdentity = session?.user.id ?? null;
      const identityChanged =
        authIdentity.current !== undefined && authIdentity.current !== nextIdentity;
      authIdentity.current = nextIdentity;
      if (event === 'PASSWORD_RECOVERY') {
        // Supabase detected a recovery token — navigate to reset password
        router.replace('/(auth)/reset-password');
      }

      // Invalidate cached user on any auth change (sign-in, sign-out, token refresh)
      if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        if (event === 'SIGNED_OUT' || identityChanged) {
          resetSubscription();
          queryClient.clear();
        }
        queryClient.invalidateQueries({ queryKey: ['auth-user'] });
        void refreshSubscription();

        // Keep RevenueCat's appUserID in sync with Supabase auth
        if (Platform.OS !== 'web') {
          void configureRevenueCat(session?.user?.id ?? null).catch((err) =>
            console.warn('[Purchases]', err),
          );
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshSubscription();
        void flushDiagnostics();
      }
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refreshSubscription();
    }, 60000);
    return () => {
      listener.remove();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    configureNotificationPresentation();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      void runOptionalStartup(
        () => recordReminder(notification),
        () => {
          recordDiagnostic('service_failure', 'SERVICE_UNAVAILABLE');
        },
      );
    });

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <View
              style={{
                flex: 1,
                width: '100%',
                ...(Platform.OS === 'web' ? { maxWidth: 560, alignSelf: 'center' as const } : {}),
              }}
            >
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: palette.bg },
                }}
              >
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(utils)" />
                <Stack.Screen name="(legacy)" />
                <Stack.Screen name="(suggestion-actions)" />
              </Stack>
            </View>
            {Platform.OS !== 'web' && <NativeNotificationResponses />}
            {Platform.OS !== 'web' && <AppLockGate />}
            <AlertModal />
            <ToastContainer />
          </QueryClientProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

async function recordReminder(notification: Notifications.Notification) {
  const store = useNotificationStore.getState();
  if (!store.isLoaded) await store.load();
  const content = notification.request.content;
  const route = content.data?.route;
  useNotificationStore
    .getState()
    .push(
      'reminder',
      content.title ?? 'Inner Glow',
      content.body ?? '',
      isAppRoute(route) ? { route } : undefined,
      `system:${notification.request.identifier}:${notification.date}`,
    );
}

function NativeNotificationResponses() {
  const navigationState = useRootNavigationState();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);
  // The hook covers notification taps while running and taps that launch a closed app.
  useEffect(() => {
    if (Platform.OS === 'web' || !navigationState?.key || !lastResponse) return;
    const notification = lastResponse.notification;
    const responseKey = `${notification.request.identifier}:${notification.date}:${lastResponse.actionIdentifier}`;
    if (handledResponse.current === responseKey) return;
    handledResponse.current = responseKey;
    void runOptionalStartup(
      () => recordReminder(notification),
      () => {
        recordDiagnostic('service_failure', 'SERVICE_UNAVAILABLE');
      },
    );
    const target = notification.request.content.data?.route;
    if (isAppRoute(target))
      router.push(canonicalRoute(target as string) as import('expo-router').Href);
    void Notifications.clearLastNotificationResponse();
  }, [navigationState?.key, lastResponse]);

  return null;
}
