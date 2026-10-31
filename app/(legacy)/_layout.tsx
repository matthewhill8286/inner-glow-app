import { Stack } from 'expo-router';

/** Compatibility URLs replace this stack with their canonical feature screen. */
export default function LegacyLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
