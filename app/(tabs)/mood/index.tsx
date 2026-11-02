import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { MoodOrb } from '@/components/mood/MoodOrb';
import { DayDetailsSheet } from '@/components/mood/DayDetailsSheet';
import { useMood } from '@/hooks/useMood';
import { MOOD_SCALE, moodScoreOf, moodStep } from '@/lib/mood-scale';
import { latestLog, weekDays } from '@/lib/mood-week';
import { weekMood } from '@/lib/profile-stats';
import { screenBottomPadding } from '@/lib/screen-layout';
import type { MoodCheckIn } from '@/lib/types';

const TRACK_H = 80;
/** The week card draws Okay in `#E6E0EA` (09 §3.13); the legend dot is `#DDD3E8`. */
const BAR_COLOR: Record<number, string> = { 3: '#E6E0EA' };
const LEGEND_COLOR: Record<number, string> = { 3: '#DDD3E8' };

/**
 * Mood (04 §M1 with the 09 §3.13 legend and explanation): the mood orb for the latest check-in, its
 * word and time, the Glow AI pill, This week (tap a day for Day details), the legend, the caption and
 * Log my mood. The old timeline, distribution, stats, AI insights and recent list are gone.
 */
export default function MoodHome() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { moodCheckIns } = useMood();
  const [open, setOpen] = useState<MoodCheckIn | null>(null);
  const latest = useMemo(() => latestLog(moodCheckIns), [moodCheckIns]);
  const week = useMemo(() => weekDays(moodCheckIns), [moodCheckIns]);
  const mostly = weekMood(moodCheckIns);
  const letters = t('sleepPeriods.weekdays').split(',');
  const score = latest ? moodScoreOf(latest.mood) : 3;
  const word = latest ? t(`moodScale.${moodStep(score).key}`) : t('moodHome.noneYet');

  const logged = () => {
    if (!latest) return t('moodHome.noneBody');
    const when = new Date(latest.createdAt);
    const time = when.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
    return when.toDateString() === new Date().toDateString()
      ? t('moodHome.loggedToday', { time })
      : t('moodHome.loggedOn', {
          date: when.toLocaleDateString(i18n.language, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
          time,
        });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            accessibilityRole="header"
            style={[Type.titleXl, { fontSize: 30, lineHeight: 42, color: palette.ink }]}
          >
            {t('moodHome.title')}
          </Text>
          <IconButton
            variant="solid"
            icon="line/chart"
            iconSize={20}
            accessibilityLabel={t('moodHome.history')}
            onPress={() => router.push('/(tabs)/mood/history')}
          />
        </View>

        <MoodOrb score={score} variant="home" style={{ alignSelf: 'center', marginTop: -6 }} />
        <Text
          style={[
            Type.titleMd,
            {
              fontSize: 26,
              lineHeight: 36,
              color: palette.ink,
              textAlign: 'center',
              marginTop: -8,
            },
          ]}
        >
          {word}
        </Text>
        <Text
          style={[
            Type.captionM,
            {
              fontFamily: Type.bodyMMedium.fontFamily,
              color: palette.textMuted,
              textAlign: 'center',
              marginTop: 2,
            },
          ]}
        >
          {logged()}
        </Text>
        {latest && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat/new-conversation',
                params: {
                  initialMessage: t('moodHome.talkPrompt', { mood: word.toLocaleLowerCase() }),
                  from: '/(tabs)/mood',
                },
              })
            }
            style={{
              alignSelf: 'center',
              marginTop: 12,
              height: 28,
              borderRadius: 999,
              backgroundColor: palette.white,
              paddingLeft: 12,
              paddingRight: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="line/sparkle" size={14} />
            <Text style={[Type.buttonS, { fontSize: 12, color: palette.plum }]}>
              {t('moodHome.talk')}
            </Text>
          </Pressable>
        )}

        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 24,
            padding: 20,
            paddingTop: 18,
            marginTop: 24,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text
              accessibilityRole="header"
              style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}
            >
              {t('moodHome.thisWeek')}
            </Text>
            {mostly && (
              <Text style={[Type.micro, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}>
                {t('moodHome.mostly', {
                  mood: t(`moodScale.${moodStep(moodScoreOf(mostly)).key}`).toLocaleLowerCase(),
                })}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            {week.map(({ date, log, score: s }, i) => {
              const step = s ? moodStep(s) : null;
              const day = date.toLocaleDateString(i18n.language, { weekday: 'long' });
              return (
                <Pressable
                  key={i}
                  disabled={!log}
                  onPress={() => setOpen(log)}
                  accessibilityRole={log ? 'button' : undefined}
                  accessibilityLabel={
                    step
                      ? t('moodHome.dayLabel', { day, mood: t(`moodScale.${step.key}`) })
                      : t('moodHome.dayEmpty', { day })
                  }
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: 30,
                      height: TRACK_H,
                      borderRadius: 15,
                      backgroundColor: '#F5F1F7',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {step && (
                      <>
                        <View
                          style={{
                            height: 16 * step.score,
                            borderRadius: 15,
                            backgroundColor: BAR_COLOR[step.score] ?? step.color,
                          }}
                        />
                        {/* The face sits 6 below the fill top; Tense's 16 fill is shorter than the face, so it rests 6 above the track bottom. */}
                        <View
                          style={{
                            position: 'absolute',
                            left: 6,
                            bottom: Math.max(6, 16 * step.score - 24),
                          }}
                        >
                          <Icon name={step.face} size={18} color={palette.plum} />
                        </View>
                      </>
                    )}
                  </View>
                  <Text style={[Type.micro, { color: palette.textSubtle }]}>{letters[i]}</Text>
                </Pressable>
              );
            })}
          </View>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {MOOD_SCALE.map((m) => (
              <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: LEGEND_COLOR[m.score] ?? m.color,
                  }}
                />
                <Text style={[Type.micro, { color: palette.textMuted }]}>
                  {t(`moodScale.${m.key}`)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[Type.captionS, { color: palette.textMuted, marginTop: 8 }]}>
            {t('moodHome.legendCaption')}
          </Text>
        </View>

        <AppButton
          title={t('moodHome.log')}
          icon="line/plus"
          iconPosition="left"
          onPress={() => router.push('/(tabs)/mood/check-in')}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
      <DayDetailsSheet log={open} onClose={() => setOpen(null)} />
    </View>
  );
}
