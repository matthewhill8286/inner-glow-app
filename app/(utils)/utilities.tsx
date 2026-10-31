import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import React from 'react';
import { View, Text, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@/components/AppIcon';

const SCREENS: { title: string; subtitle: string; path: string; icon: string; iconBg: string }[] = [
  {
    title: 'Not Found',
    subtitle: '404 – page not found error',
    path: '/(utils)/error',
    icon: 'person-search',
    iconBg: '#E8985A',
  },
  {
    title: 'No Internet',
    subtitle: 'Offline connectivity state',
    path: '/(utils)/offline',
    icon: 'wifi-off',
    iconBg: '#7B6DC9',
  },
  {
    title: 'Internal Error',
    subtitle: '500 – server error state',
    path: '/(utils)/internal-error',
    icon: 'warning',
    iconBg: '#E8985A',
  },
  {
    title: 'Maintenance',
    subtitle: 'Scheduled maintenance countdown',
    path: '/(utils)/maintenance',
    icon: 'construction',
    iconBg: '#5B8A5A',
  },
  {
    title: 'Not Allowed',
    subtitle: 'Permission denied state',
    path: '/(utils)/not-allowed',
    icon: 'block',
    iconBg: '#C45B5B',
  },
  {
    title: 'Empty State',
    subtitle: 'Nothing here yet placeholder',
    path: '/(utils)/empty',
    icon: 'inbox',
    iconBg: '#5A8FB5',
  },
];

export default function UtilitiesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: UI.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => backTo(undefined, '/(tabs)/home')}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              ...UI.shadow.sm,
            })}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={18}
              color={colors.text}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
          <Text style={{ ...Typography.heading, color: colors.text }}>Error & Other Utilities</Text>
        </View>
        <Text
          style={{
            fontFamily: Typography.family.body,
            fontSize: 14,
            color: colors.mutedText,
            marginTop: 8,
            marginLeft: 50,
          }}
        >
          Preview error states and utility screens.
        </Text>
      </View>

      {/* Screen List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: UI.spacing.xl,
          paddingTop: 8,
          paddingBottom: 100,
          gap: 10,
        }}
      >
        {SCREENS.map((screen) => (
          <Pressable
            key={screen.path}
            onPress={() => router.push(screen.path as any)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              gap: 14,
              backgroundColor: colors.card,
              borderRadius: UI.radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
              ...UI.shadow.sm,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: screen.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name={screen.icon as any} size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  fontSize: 16,
                  fontWeight: Typography.weight.semibold,
                  color: colors.text,
                }}
              >
                {screen.title}
              </Text>
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  fontSize: 13,
                  color: colors.mutedText,
                  marginTop: 2,
                }}
              >
                {screen.subtitle}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.mutedText} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
