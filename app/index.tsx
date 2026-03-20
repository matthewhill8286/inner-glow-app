import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { authTokenVar } from '@/lib/state';
import { supabase } from '@/supabase/supabase';

export default function Index() {
    useEffect(() => {
        (async () => {
            try {
                /* ── 1. First-launch onboarding slides ── */
                const onboardingSeen = await AsyncStorage.getItem('onboarding:seen:v1');
                if (!onboardingSeen) return router.replace('/(onboarding)/splash-loading');

                /* ── 2. Authenticated session? ── */
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session) return router.replace('/(auth)/sign-in');

                // Load token into state
                authTokenVar(session.access_token);

                /* ── 3. MFA gate ── */
                const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
                    return router.replace('/(auth)/two-factor-verify');
                }

                /* ── 4. Check assessment exists (direct DB query, no race condition) ── */
                const { data: assessmentRow } = await supabase
                    .from('assessments')
                    .select('user_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (!assessmentRow) {
                    return router.replace('/(onboarding)/assessment');
                }

                /* ── 5. Check profile has been set up (intention populated = setup complete) ── */
                const { data: profileRow } = await supabase
                    .from('profiles')
                    .select('intention, selected_issues')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (!profileRow || !profileRow.intention) {
                    return router.replace('/(onboarding)/profile-setup');
                }

                /* ── 6. Check selected issues ── */
                if (
                    !profileRow.selected_issues ||
                    (Array.isArray(profileRow.selected_issues) && profileRow.selected_issues.length === 0)
                ) {
                    return router.replace('/(onboarding)/suggested-categories');
                }

                /* ── 7. All gates passed → home ── */
                return router.replace('/(tabs)/home');
            } catch (e) {
                console.error('Routing error:', e);
                router.replace('/(auth)/sign-in');
            }
        })();
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
