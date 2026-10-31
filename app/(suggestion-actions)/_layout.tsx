import { SessionGate } from '@/components/SessionGate';
import { Stack } from 'expo-router';

export default function SuggestionActionsLayout() {
  return <SessionGate><Stack screenOptions={{ headerShown: false }} /></SessionGate>;
}
