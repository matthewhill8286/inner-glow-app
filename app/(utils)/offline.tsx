import React, { useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function NoInternetScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const handleRefresh = useCallback(() => {
    // In production this would check connectivity
    router.back();
  }, []);

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
        <Pressable
          onPress={() => router.back()}
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
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
          paddingBottom: 60,
        }}
      >
        {/* Illustration */}
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: theme === 'light' ? '#E8E0F0' : 'rgba(123,109,201,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <MaterialIcons name="wifi-off" size={90} color={colors.mutedText} />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: '900',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          No Internet!
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedText,
            textAlign: 'center',
            lineHeight: 21,
            marginBottom: 20,
          }}
        >
          It seems you don't have active internet.
        </Text>

        {/* Status Badge */}
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: UI.radius.pill,
            backgroundColor: theme === 'light' ? '#E8F5E9' : 'rgba(91,138,90,0.15)',
            borderWidth: 1,
            borderColor: theme === 'light' ? '#C8E6C9' : 'rgba(91,138,90,0.25)',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <MaterialIcons name="refresh" size={16} color="#5B8A5A" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#5B8A5A' }}>
            Refresh or Try Again
          </Text>
        </Pressable>
      </View>

      {/* Take Me Home Button */}
      <View
        style={{ paddingHorizontal: UI.spacing.xl, paddingBottom: Platform.OS === 'ios' ? 44 : 28 }}
      >
        <Pressable
          onPress={() => router.push('/(tabs)/home')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: '#8B6B47',
            borderRadius: UI.radius.xl,
            paddingVertical: 16,
            opacity: pressed ? 0.9 : 1,
            ...UI.shadow.md,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Take Me Home</Text>
          <MaterialIcons name="home" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
