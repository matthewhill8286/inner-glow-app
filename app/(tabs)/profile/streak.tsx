import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import StreakAura from '@/assets/svg/illustrations/profile/streak-aura.svg';
import { useProfileStats } from '@/hooks/useProfileStats';
import { monthDays, STREAK_MILESTONES, type StreakDayState } from '@/lib/profile-stats';
import { backTo } from '@/lib/navigation';

const DOT = 32;
const FILL: Record<StreakDayState, { bg: string; border?: string; width?: number }> = {
  streak: { bg: palette.mustard },
  active: { bg: `${palette.mustard}8C` },
  today: { bg: 'transparent', border: palette.plum, width: 1.5 },
  none: { bg: 'transparent', border: palette.borderStrong, width: 1 },
};

/**
 * Profile · Your streak (`6801:6342`): the contour art, "N days of showing up", this month's days
 * (mustard in the current streak, light mustard on other days you showed up, an outline for today)
 * and the 3, 7, 14 and 30 day milestones, faded until reached.
 */
export default function Streak() {
  const { t, i18n } = useTranslation();
  const stats = useProfileStats();
  const today = new Date();
  const days = monthDays(stats.active, stats.streak.days, today);
  const month = today.toLocaleDateString(i18n.language, { month: 'long' });
  const count = stats.streak.count;

  return (
    <SettingsScreen
      title={t('me.streak.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile')}
      glows={[
        { color: palette.mustard, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
      ]}
      contentStyle={{ gap: 24 }}
    >
      <View style={{ alignItems: 'center', height: 170 }} pointerEvents="none">
        <Glow
          color={palette.mustard}
          opacity={0.35}
          width={136}
          blur={40}
          style={{ position: 'absolute', top: 17 }}
        />
        <View style={{ position: 'absolute', top: -23 }}>
          <StreakAura width={216} height={216} />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleMd,
            { fontSize: 28, lineHeight: 36, color: palette.ink, textAlign: 'center' },
          ]}
        >
          {count > 0 ? t('me.streak.heading', { count }) : t('me.streak.headingNone')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>
          {t('me.streak.body')}
        </Text>
      </View>

      <View style={{ backgroundColor: palette.white, borderRadius: 24, padding: 16, gap: 12 }}>
        <Text style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}>
          {month}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {days.map(({ day, state }) => {
            const date = new Date(today.getFullYear(), today.getMonth(), day).toLocaleDateString(
              i18n.language,
              { day: 'numeric', month: 'long' },
            );
            const key =
              state === 'streak'
                ? 'dayStreak'
                : state === 'active'
                  ? 'dayActive'
                  : state === 'today'
                    ? 'dayToday'
                    : 'dayNone';
            const fill = FILL[state];
            return (
              <View
                key={day}
                accessible
                accessibilityLabel={t(`me.streak.${key}`, { date })}
                style={{
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  backgroundColor: fill.bg,
                  borderColor: fill.border,
                  borderWidth: fill.width ?? 0,
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <Text
          accessibilityRole="header"
          style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}
        >
          {t('me.streak.milestones')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {STREAK_MILESTONES.map((m) => {
            const reached = count >= m;
            const label = t(`me.streak.milestone${m}`);
            return (
              <View
                key={m}
                accessible
                accessibilityLabel={`${m}, ${label}, ${t(reached ? 'me.streak.reached' : 'me.streak.notReached')}`}
                style={{
                  flex: 1,
                  height: 67,
                  borderRadius: 24,
                  backgroundColor: palette.white,
                  opacity: reached ? 1 : 0.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Text
                  style={[
                    Type.body,
                    {
                      fontSize: 22,
                      lineHeight: 26,
                      color: reached ? palette.plum : palette.textSubtle,
                    },
                  ]}
                >
                  {m}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    Type.micro,
                    {
                      color: reached ? palette.textMuted : palette.textSubtle,
                      paddingHorizontal: 4,
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SettingsScreen>
  );
}
