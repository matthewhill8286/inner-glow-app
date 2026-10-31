import { Stack, useSegments } from 'expo-router';
import { SessionGate } from '@/components/SessionGate';
const PRIVATE_SCREENS = new Set(['ai-privacy', 'blocked-users', 'delete-account', 'trial-upgrade', 'payment-success']);
export default function UtilsLayout() {
  const segments = useSegments();
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  return PRIVATE_SCREENS.has(segments[segments.length - 1]) ? <SessionGate>{stack}</SessionGate> : stack;
}
