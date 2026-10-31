import { withStartupDeadline } from '@/lib/startup';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/supabase/supabase';

type GateState = 'loading' | 'ready' | 'sign-in' | 'mfa' | 'offline';
/** Protects direct links as well as normal navigation into account-only screens. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>('loading');
  const identity = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    let version = 0;
    async function check() {
      const current = ++version;
      try {
        const {
          data: { session },
          error,
        } = await withStartupDeadline(supabase.auth.getSession());
        if (error) throw error;
        if (active && current === version) identity.current = session?.user.id ?? null;
        let next: GateState = 'sign-in';
        if (session) {
          const { data, error: mfaError } = await withStartupDeadline(
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          );
          if (mfaError) throw mfaError;
          next = data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2' ? 'mfa' : 'ready';
        }
        if (active && current === version) setState(next);
      } catch {
        if (active && current === version) setState('offline');
      }
    }
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextIdentity = session?.user.id ?? null;
      // A token refresh for the same account must not unmount and reset feature stacks.
      if (identity.current !== undefined && identity.current !== nextIdentity) setState('loading');
      identity.current = nextIdentity;
      // Read auth after the callback so Supabase's auth lock has been released.
      setTimeout(() => {
        if (active) void check();
      }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  if (state === 'sign-in') return <Redirect href="/(auth)/sign-in" />;
  if (state === 'mfa') return <Redirect href="/(auth)/two-factor-verify" />;
  if (state === 'offline') return <Redirect href="/(utils)/offline" />;
  if (state === 'loading')
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FAF9F5',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#526651" />
      </View>
    );
  return <>{children}</>;
}
