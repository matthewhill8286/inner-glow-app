import { useTranslation } from 'react-i18next';
import { parentRouteForPath, isPrimaryTabPath } from '@/lib/route-parents';
import { Type, Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconButton } from '@/components/ui/IconButton';
import { router, usePathname, type Href } from 'expo-router';

export default function ScreenHeader({
  title,
  subtitle,
  rightElement,
  showBack,
  onBack,
  safeArea = true,
}: Readonly<{
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  safeArea?: boolean;
}>) {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const pathname = usePathname();
  const canGoBack = router.canGoBack();
  const shouldShowBack = showBack ?? (!isPrimaryTabPath(pathname) || canGoBack);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ marginTop: (safeArea ? insets.top : 0) + 10, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          {shouldShowBack && (
            <IconButton
              accessibilityLabel={t('common.back')}
              onPress={() => (onBack ? onBack() : backTo(undefined, parentRouteForPath(pathname) as Href))}
            />
          )}
          <Text
            style={{
              ...Type.titleSm,
              color: colors.heading,
              flexShrink: 1,
            }}
            accessibilityRole="header"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{rightElement}</View>
      </View>
      {subtitle ? (
        <Text style={{ ...Typography.body, color: colors.mutedText, marginTop: 8 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
