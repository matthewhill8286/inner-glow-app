import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

export default function ScreenHeader({
  title,
  subtitle,
  rightElement,
  showBack,
  onBack,
}: Readonly<{
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}>) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const canGoBack = router.canGoBack();
  const shouldShowBack = showBack ?? canGoBack;
  const insets = useSafeAreaInsets();

  return (
    <View style={{ marginTop: insets.top + 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {shouldShowBack && (
            <Pressable
              onPress={() => (onBack ? onBack() : router.back())}
              style={({ pressed }) => ({
                padding: 4,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons
                name={Platform.OS === 'ios' ? 'arrow-back-ios' : 'arrow-back'}
                size={24}
                color={colors.text}
              />
            </Pressable>
          )}
          <Text
            style={{
              fontSize: Platform.OS === 'ios' ? 26 : 22,
              fontWeight: Platform.OS === 'ios' ? '900' : '700',
              color: colors.text,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{rightElement}</View>
      </View>
      {subtitle ? <Text style={{ color: colors.mutedText, marginTop: 8 }}>{subtitle}</Text> : null}
    </View>
  );
}
