import React from 'react';
import { Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
export function StatusState({
  title,
  message,
  onRetry,
  busy = false,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  busy?: boolean;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <AppCard accessibilityLiveRegion="polite">
      <Text accessibilityRole="header" style={[Typography.cardHeading, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[Typography.body, { color: colors.mutedText }]}>{message}</Text>
      {onRetry && <AppButton title="Try again" busy={busy} variant="secondary" onPress={onRetry} />}
    </AppCard>
  );
}
