import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { Moon, StarField } from '@/components/sleep/NightSky';
import { SleepNoData } from '@/components/sleep/SleepNoData';
import { useSleep } from '@/hooks/useSleep';
import { useSleepDetection } from '@/hooks/useSleepDetection';
import {
  barHeight,
  clockFrom,
  formatClock,
  formatDuration,
  isBestThisMonth,
  isRecent,
  lastNight,
  weekBars,
  windDownClock,
} from '@/lib/sleep-home';

/** Figma frames include a 44pt status bar; hero positions below are measured from under it. */
const FIGMA_STATUS = 44;
const HERO_HEIGHT = 380;

/** Sleep (S1, `6712:4203`): night hero, this week, tonight's schedule and wind down. */
export default function SleepScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sleepEntries: entries, isLoading, schedule } = useSleep();
  useSleepDetection();

  const night = useMemo(() => lastNight(entries), [entries]);
  const best = useMemo(() => (night ? isBestThisMonth(night, entries) : false), [night, entries]);
  const week = useMemo(() => weekBars(entries), [entries]);

  if (!isLoading && !night) return <SleepNoData />;

  const heroHeight = HERO_HEIGHT - FIGMA_STATUS + insets.top;
  const top = (figmaY: number) => figmaY - FIGMA_STATUS + insets.top;
  const dayLetter = (ms: number) => new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(ms);

  const quality = night?.entry.quality ? t(`sleepNight.quality.${night.entry.quality}`) : null;
  const pill = [quality, best ? t('sleepNight.bestThisMonth') : null].filter(Boolean).join(' · ');
  const eyebrowLead =
    night && isRecent(night)
      ? t('sleepNight.lastNight')
      : night
        ? new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).format(night.endMs)
        : '';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar style="light" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.sky, opacity: 0.22, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        {/* ── Night hero ─────────────────────────────── */}
        <View
          style={{
            height: heroHeight,
            backgroundColor: palette.ink,
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            overflow: 'hidden',
          }}
        >
          <GlowField glows={[{ color: palette.lavenderSoft, opacity: 0.35, x: 140, y: 0, width: 240, blur: 70 }]} />
          <StarField width={width} height={heroHeight} style={{ position: 'absolute' }} />
          <Moon style={{ position: 'absolute', left: (226 / 375) * width, top: top(82) }} />

          <IconButton
            variant="nav"
            tone="white"
            accessibilityLabel={t('sleepNight.back')}
            onPress={() => backTo(undefined, '/(tabs)/home')}
            style={{ position: 'absolute', left: 24, top: top(54) }}
          />

          {night && (
            <View style={{ position: 'absolute', left: 24, right: 24, top: top(150) }}>
              <Text style={[Type.eyebrow, { color: 'rgba(255,255,255,0.60)', letterSpacing: 0.66 }]}>
                {`${eyebrowLead} · ${formatClock(night.startMs)} → ${formatClock(night.endMs)}`.toUpperCase()}
              </Text>
              <Text
                accessibilityRole="header"
                style={{ ...Type.display, fontSize: 52, lineHeight: 64, color: palette.white, marginTop: 4 }}
              >
                {formatDuration(night.asleepMinutes)}
              </Text>
              {pill ? (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: palette.mustard,
                    borderRadius: 999,
                    paddingVertical: 5,
                    paddingLeft: 10,
                    paddingRight: 12,
                    marginTop: 6,
                  }}
                >
                  <Icon name="line/star" size={14} color={palette.ink} />
                  <Text style={[Type.caption, { fontWeight: '700', color: palette.ink }]}>{pill}</Text>
                </View>
              ) : null}
            </View>
          )}

          {night && (
            <View style={{ position: 'absolute', left: 24, right: 24, top: top(290), flexDirection: 'row', gap: 8 }}>
              <HeroStat value={formatClock(night.startMs)} label={t('sleepNight.bedtime')} />
              {night.deepMinutes != null ? (
                <HeroStat value={formatDuration(night.deepMinutes)} label={t('sleepNight.deep')} />
              ) : (
                // Without stages there is no Deep figure (06 §6 item 6), so show the wake time.
                <HeroStat value={formatClock(night.endMs)} label={t('sleepNight.wake')} />
              )}
              <HeroStat
                value={night.awakenings != null ? `${night.awakenings}×` : '–'}
                label={t('sleepNight.wokeUp')}
              />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 14 }}>
          {/* ── This week ─────────────────────────────── */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('sleepNight.thisWeek')}
            onPress={() => router.push('/(tabs)/sleep/insights')}
            style={({ pressed }) => ({ backgroundColor: palette.surface, borderRadius: 24, padding: 20, paddingTop: 18, opacity: pressed ? 0.85 : 1 })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={[Type.bodyMSemi, { color: palette.ink }]}>{t('sleepNight.thisWeek')}</Text>
              {week.avgHours != null && (
                <Text style={[Type.caption, { fontWeight: '500', color: palette.lavender }]}>
                  {t('sleepNight.avg', { value: formatDuration(week.avgHours * 60) })}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 }}>
              {week.bars.map((bar) => (
                <View key={bar.dayStartMs} style={{ alignItems: 'center', gap: 6 }}>
                  <WeekBar hours={bar.hours} />
                  <Text style={[Type.micro, { color: palette.textSubtle }]}>{dayLetter(bar.dayStartMs)}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          {/* ── Tonight ───────────────────────────────── */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/sleep/schedule')}
            style={({ pressed }) => ({
              backgroundColor: palette.surface,
              borderRadius: 24,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(142,127,166,0.14)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="line/bell" size={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[Type.bodyMSemi, { color: palette.ink }]}>
                {t('sleepNight.tonight', {
                  bed: clockFrom(schedule.sleepHour, schedule.sleepMin),
                  wake: clockFrom(schedule.wakeHour, schedule.wakeMin),
                })}
              </Text>
              <Text style={[Type.captionS, { color: palette.textSubtle }]}>
                {schedule.bedtimeReminder
                  ? t('sleepNight.windDownAt', { time: windDownClock(schedule.sleepHour, schedule.sleepMin) })
                  : t('sleepNight.windDownOff')}
              </Text>
            </View>
            <Icon name="arrow/chevron-right" size={18} />
          </Pressable>

          {/* Wind down (S3) is not built yet, so this opens sleep mode. */}
          <AppButton
            title={t('sleepNight.startWindDown')}
            icon="line/moon"
            iconPosition="left"
            onPress={() => router.push('/(tabs)/sleep/start')}
            style={{ marginTop: 6 }}
          />
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              router.push({ pathname: '/(tabs)/chat/new-conversation', params: { initialMessage: t('sleepNight.glowPrompt') } })
            }
            hitSlop={8}
            style={{ alignSelf: 'center', paddingVertical: 4 }}
          >
            <Text style={[Type.label, { color: palette.lavender }]}>{t('sleepNight.askGlow')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        paddingVertical: 8,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ ...Type.bodyStrong, color: palette.white }}>{value}</Text>
      <Text style={{ ...Type.micro, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

/** One day in the "This week" chart (06 §4.4): 28x96 track, gradient bar from the bottom. */
function WeekBar({ hours }: { hours: number | null }) {
  const h = hours == null ? 0 : barHeight(hours);
  return (
    <Svg width={28} height={96}>
      <Defs>
        <LinearGradient id="sleepBar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.lavender} />
          <Stop offset="1" stopColor={palette.lavenderSoft} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={28} height={96} rx={14} fill={palette.surfaceLilacSoft} />
      {h > 0 && <Rect x={0} y={96 - h} width={28} height={h} rx={14} fill="url(#sleepBar)" />}
    </Svg>
  );
}
