import { Stack, useSegments } from 'expo-router';
import { SessionGate } from '@/components/SessionGate';
export default function OnboardingLayout() {
  const segments = useSegments();
  const page = segments[segments.length - 1];
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  return page === 'welcome' || page === 'splash-loading' ? stack : <SessionGate>{stack}</SessionGate>;
}
