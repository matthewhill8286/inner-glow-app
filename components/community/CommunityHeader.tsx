import React from 'react';
import { Pressable, View } from 'react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppIcon from '@/components/AppIcon';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function CommunityHeader({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children?: React.ReactNode;
}) {
  return (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      safeArea={false}
      showBack
      onBack={onBack}
      rightElement={<View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>}
    />
  );
}
export function CommunityHeaderAction({
  name,
  label,
  onPress,
}: {
  name: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  onPress: () => void;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: UI.radius.md,
        backgroundColor: colors.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppIcon name={name} size={20} color={colors.text} />
    </Pressable>
  );
}
