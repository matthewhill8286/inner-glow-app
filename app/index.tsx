import { withStartupDeadline } from '@/lib/startup';
import { recordDiagnostic } from '@/lib/diagnostics';
import { entryRouteForProfile } from '@/lib/navigation';
import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { authTokenVar } from '@/lib/state';
import { supabase } from '@/supabase/supabase';

export default function Index() {
  useEffect(() => {
    let active = true;
    const navigate = (path: Parameters<typeof router.replace>[0]) => {
      if (active) router.replace(path);
    };
    void (async () => {
      try {
        /* ── 1. Authenticated session? ── */
        const {
          data: { session },
          error: sessionError,
        } = await withStartupDeadline(supabase.auth.getSession());
        if (sessionError) throw sessionError;

        if (!session) {
          /* ── 2. First-launch onboarding slides (only for unauthenticated users) ── */
          const onboardingSeen = await withStartupDeadline(
            AsyncStorage.getItem('onboarding:seen:v1'),
          );
          if (!onboardingSeen) return navigate('/(onboarding)/splash-loading');

          return navigate('/(auth)/sign-in');
        }

        // Load token into state
        authTokenVar(session.access_token);

        /* ── 3. MFA gate ── */
        const { data: aal, error: aalError } = await withStartupDeadline(
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        );
        if (aalError) throw aalError;
        if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
          return navigate('/(auth)/two-factor-verify');
        }

        /* ── 4. Check assessment exists (direct DB query, no race condition) ── */
        const { data: assessmentRow, error: assessmentError } = await withStartupDeadline(
          supabase
            .from('assessments')
            .select('user_id')
            .eq('user_id', session.user.id)
            .maybeSingle(),
        );

        if (assessmentError) throw assessmentError;
        /* ── 5. Check profile has been set up (intention populated = setup complete) ── */
        const { data: profileRow, error: profileError } = await withStartupDeadline(
          supabase
            .from('profiles')
            .select('intention, selected_issues')
            .eq('user_id', session.user.id)
            .maybeSingle(),
        );

        if (profileError) throw profileError;
        return navigate(entryRouteForProfile(!!assessmentRow, profileRow));
      } catch {
        recordDiagnostic('service_failure', 'SERVICE_UNAVAILABLE');
        navigate('/(utils)/offline');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#6f6660',
      }}
    >
      <ActivityIndicator color="white" />
    </View>
  );
}
