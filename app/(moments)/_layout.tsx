import { Stack } from 'expo-router';
import { SessionGate } from '@/components/SessionGate';

/** Notification moments (03 §3.2): full-screen, account-only, no tab bar. */
export default function MomentsLayout() {
  return (
    <SessionGate>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionGate>
  );
}
