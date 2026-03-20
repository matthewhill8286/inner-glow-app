import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PostSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const params = useLocalSearchParams<{ category: string; content: string; from?: string }>();

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      <View style={s.centerContent}>
        {/* illustration area */}
        <View style={[s.heroCard, { backgroundColor: '#5B8A5A' }]}>
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={s.heroEmojiWrap}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
          </View>
        </View>

        {/* success message */}
        <Text style={[s.title, { color: colors.text }]}>{t('communityPostSuccess.title')}</Text>
        <Text style={[s.subtitle, { color: colors.mutedText }]}>
          {t('communityPostSuccess.subtitle')}
        </Text>

        {/* see my post button */}
        <Pressable
          onPress={() => router.replace((params.from || '/(tabs)/community') as any)}
          style={({ pressed }) => [s.seePostBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <Text style={s.seePostText}>{t('communityPostSuccess.seePostButton')}</Text>
        </Pressable>

        {/* bottom nav dots */}
        <View style={s.navDots}>
          <View style={[s.dot, { backgroundColor: '#8B6B47' }]} />
          <View style={[s.dot, { backgroundColor: colors.border }]} />
          <View style={[s.dot, { backgroundColor: colors.border }]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },

  heroCard: {
    width: '100%',
    height: 200,
    borderRadius: UI.radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -50,
    left: -30,
  },
  heroEmojiWrap: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },

  seePostBtn: {
    backgroundColor: '#8B6B47',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: UI.radius.lg,
    marginTop: 28,
    ...UI.shadow.sm,
  },
  seePostText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  navDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 32,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
