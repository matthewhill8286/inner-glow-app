import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [remainingSec, setRemainingSec] = useState(9 * 3600 + 12 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemainingSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const countdownLabel = t('maintenance.countdown', {
    hours: String(hours),
    minutes: minutes.toString().padStart(2, '0'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
          paddingBottom: 60,
        }}
      >
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: theme === 'light' ? '#E0F0E8' : 'rgba(91,138,90,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <MaterialIcons name="construction" size={90} color={colors.mutedText} />
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: '900',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          {t('maintenance.title')}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: colors.mutedText,
            textAlign: 'center',
            lineHeight: 21,
            marginBottom: 20,
          }}
        >
          {t('maintenance.subtitle')}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: UI.radius.pill,
            backgroundColor: theme === 'light' ? '#FFF8E1' : 'rgba(232,152,90,0.15)',
            borderWidth: 1,
            borderColor: theme === 'light' ? '#FFECB3' : 'rgba(232,152,90,0.25)',
          }}
        >
          <Text style={{ fontSize: 14 }}>{'\u23F0'}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#E8985A' }}>
            {countdownLabel}
          </Text>
        </View>
      </View>

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
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{t('errorScreen.takeMeHome')}</Text>
          <MaterialIcons name="home" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
