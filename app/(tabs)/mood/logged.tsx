import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { MoodOrb } from '@/components/mood/MoodOrb';
import { useMood } from '@/hooks/useMood';
import { moodStep, type MoodScore } from '@/lib/mood-scale';
import { goodDaysThisWeek, joinNatural, moodTone, MOOD_FACTORS } from '@/lib/mood-logged';

/** Mood logged (04 §M5, `6695:3624`): summary, a nudge to journal, Glow AI, and done. */
export default function MoodLoggedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { moodCheckIns } = useMood();
  const params = useLocalSearchParams<{ mood?: string; factors?: string }>();

  const raw = Number(params.mood);
  const score = (Number.isInteger(raw) && raw >= 1 && raw <= 5 ? raw : 3) as MoodScore;
  const mood = moodStep(score);
  const tone = moodTone(score);
  const factorKeys = (params.factors ?? '').split(',').filter((f) => MOOD_FACTORS.some((m) => m.key === f));
  const factorWords = factorKeys.map((f) => t(`moodCheckIn2.factorLower.${f}`));
  const moodWord = t(`moodScale.${mood.key}`);

  const first = factorWords.length
    ? t('moodLogged.withFactors', { mood: moodWord, factors: joinNatural(factorWords, t('moodLogged.and')) })
    : t('moodLogged.moodOnly', { mood: moodWord });
  const good = goodDaysThisWeek(moodCheckIns);
  const second = tone === 'positive' ? t('moodLogged.goodDays', { count: good }) : t(`moodLogged.line.${tone}`);

  const done = () => router.replace('/(tabs)/home');

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <IconButton icon="arrow/close" variant="nav" accessibilityLabel={t('moodCheckIn2.close')} onPress={done} />
        </View>
        <View style={{ alignItems: 'center', marginTop: -20 }}>
          <MoodOrb score={score} variant="logged" />
          <Text accessibilityRole="header" style={{ ...Type.titleLg, fontSize: 28, lineHeight: 39, color: palette.ink, marginTop: -12 }}>
            {t('moodLogged.title')}
          </Text>
          <Text style={{ ...Type.bodySm, color: palette.textMuted, textAlign: 'center', marginTop: 6 }}>{`${first}\n${second}`}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/journal/new')}
          style={({ pressed }) => ({
            marginTop: 28,
            backgroundColor: palette.surface,
            borderRadius: 24,
            padding: 16,
            paddingVertical: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(142,127,166,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="line/sparkle" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...Type.caption, fontWeight: '500', color: palette.textSubtle }}>{t(`moodLogged.nudgeLabel.${tone}`)}</Text>
            <Text style={{ ...Type.bodyMSemi, color: palette.ink, marginTop: 2 }}>{t(`moodLogged.nudge.${tone}`)}</Text>
          </View>
          <Icon name="arrow/chevron-right" size={18} />
        </Pressable>

        <AppButton
          title={t('moodLogged.talkItThrough')}
          variant="outline"
          icon="line/sparkle"
          iconPosition="left"
          onPress={() =>
            router.push({
              pathname: '/(tabs)/chat/new-conversation',
              params: { initialMessage: t('moodLogged.glowPrompt', { mood: moodWord.toLowerCase() }) },
            })
          }
          style={{ marginTop: 38 }}
        />
        <AppButton title={t('moodLogged.done')} onPress={done} style={{ marginTop: 12 }} />
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace('/(tabs)/mood/history')} style={{ alignSelf: 'center', marginTop: 18 }}>
          <Text style={{ ...Type.label, color: palette.lavender }}>{t('moodLogged.history')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
