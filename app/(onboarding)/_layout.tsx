import { Stack, useSegments } from 'expo-router';
import { SessionGate } from '@/components/SessionGate';
export default function OnboardingLayout() {
  const segments = useSegments();
  const page = segments[segments.length - 1];
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  // The pre-sign-up flow (splash, welcome, consent, steps) runs without a session.
  const open = ['welcome', 'splash-loading', 'consent', 'steps'].includes(page);
  return open ? stack : <SessionGate>{stack}</SessionGate>;
}
