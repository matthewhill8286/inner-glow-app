import { Stack, useSegments } from 'expo-router';
import { SessionGate } from '@/components/SessionGate';
const PRIVATE_SCREENS = new Set(['ai-privacy', 'blocked-users', 'delete-account', 'trial-upgrade', 'payment-success', 'feedback', 'feedback-sent']);
export default function UtilsLayout() {
  const segments = useSegments();
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  // The gate stays mounted and only enforces on private screens: swapping it in and out remounted
  // the stack, so a link from an open utility screen to a private one showed the wrong screen.
  return <SessionGate enforce={PRIVATE_SCREENS.has(segments[segments.length - 1])}>{stack}</SessionGate>;
}
