import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { CATEGORY_LOOK, practiceById, type PracticeCategory } from '@/data/practices';
import { useMindfulness } from '@/hooks/useMindfulness';
import { backTo } from '@/lib/navigation';
import { CATEGORY_COLOR, practiceWeek } from '@/lib/practices';
import { activeDays, streak } from '@/lib/profile-stats';
import type { MindfulEntry } from '@/lib/types';

const BAR_H = 70;
const EARLIER_LIMIT = 30;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View accessible accessibilityLabel={`${value} ${label}`} style={{ flex: 1, gap: 4 }}>
      <Text style={[Type.titleMd, { fontSize: 26, lineHeight: 32, color: palette.plumDeep }]}>
        {value}
      </Text>
      <Text style={[Type.micro, { fontSize: 12, color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

/**
 * Your sessions (07 §2.3): this week's mindful time, sessions and day streak, a bar per day coloured
 * by its longest practice, then this week's sessions and earlier ones. The design's mood-after face
 * needs a mood question at the end of a session, which is not designed, so rows show "Ended early"
 * where that applies instead.
 */
export default function PracticeHistory() {
  const { t, i18n } = useTranslation();
  const { mindfulnessHistory } = useMindfulness();
  const week = useMemo(() => practiceWeek(mindfulnessHistory), [mindfulnessHistory]);
  const dayStreak = useMemo(
    () => streak(activeDays(mindfulnessHistory.map((m) => m.dateISO))).count,
    [mindfulnessHistory],
  );
  const letters = t('sleepPeriods.weekdays').split(',');
  const max = Math.max(1, ...week.days.map((d) => d.minutes));
  const monday = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7)).getTime();
  }, []);
  const thisWeek = mindfulnessHistory.filter((m) => Date.parse(m.dateISO) >= monday);
  const earlier = mindfulnessHistory
    .filter((m) => Date.parse(m.dateISO) < monday)
    .slice(0, EARLIER_LIMIT);
  const time =
    week.minutes >= 60
      ? t('practices.history.hours', {
          value: (week.minutes / 60).toFixed(2).replace(/\.?0+$/, ''),
        })
      : t('practices.history.minutesShort', { value: week.minutes });

  const dayName = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t('practices.history.today');
    if (d.toDateString() === y.toDateString()) return t('practices.history.yesterday');
    return d.toLocaleDateString(
      i18n.language,
      Date.parse(iso) >= monday ? { weekday: 'short' } : { day: 'numeric', month: 'short' },
    );
  };

  const row = (m: MindfulEntry) => {
    const practice = practiceById(m.practiceId ?? undefined);
    const category = (practice?.category ?? m.category ?? 'mindfulness') as PracticeCategory;
    const look = CATEGORY_LOOK[category] ?? CATEGORY_LOOK.mindfulness;
    const title = practice
      ? t(`practices.items.${practice.id}.title`)
      : (m.note ?? t('practices.all.mindful'));
    const meta = t('practices.history.meta', {
      day: dayName(m.dateISO),
      time: new Date(m.dateISO).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      minutes: Math.max(1, Math.round(m.seconds / 60)),
    });
    return (
      <View
        key={m.id}
        accessible
        accessibilityLabel={`${title}, ${meta}${m.completed === false ? `, ${t('practices.history.partial')}` : ''}`}
        style={{
          minHeight: 72,
          borderRadius: 24,
          backgroundColor: palette.white,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: look.tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={look.icon} size={22} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={[Type.bodyMSemi, { lineHeight: 21, color: palette.plumDeep }]}
          >
            {title}
          </Text>
          <Text style={[Type.captionS, { color: palette.textMuted }]}>{meta}</Text>
        </View>
        {m.completed === false && (
          <Text style={[Type.micro, { color: palette.textSubtle }]}>
            {t('practices.history.partial')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SettingsScreen
      title={t('practices.all.mindful')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mindful')}
      glows={[
        { color: palette.sky, opacity: 0.2, x: 180, y: 30, width: 240, blur: 90 },
        { color: palette.mustard, opacity: 0.25, x: -50, y: 0, width: 260, blur: 90 },
      ]}
      contentStyle={{ gap: 16 }}
    >
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}
        >
          {t('practices.history.title')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted }]}>
          {t('practices.history.body')}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: palette.white,
          borderRadius: 28,
          padding: 20,
          paddingTop: 18,
          gap: 18,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <Stat value={time} label={t('practices.history.mindfulTime')} />
          <Stat value={String(week.count)} label={t('practices.history.sessions')} />
          <Stat value={String(dayStreak)} label={t('practices.history.streak')} />
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}
        >
          {week.days.map((d, i) => (
            <View
              key={i}
              accessible
              accessibilityLabel={t('practices.history.dayLabel', {
                day: letters[i],
                minutes: d.minutes,
              })}
              style={{ alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  width: 26,
                  height: BAR_H,
                  borderRadius: 13,
                  backgroundColor: '#F5F5F4',
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}
              >
                {d.minutes > 0 && (
                  <View
                    style={{
                      height: Math.max(8, (d.minutes / max) * BAR_H),
                      borderRadius: 13,
                      backgroundColor: CATEGORY_COLOR[d.category ?? ''] ?? palette.plum,
                    }}
                  />
                )}
              </View>
              <Text style={[Type.micro, { color: palette.textSubtle }]}>{letters[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {mindfulnessHistory.length === 0 ? (
        <Text style={[Type.captionM, { color: palette.textMuted }]}>
          {t('practices.history.none')}
        </Text>
      ) : (
        <>
          {thisWeek.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text
                accessibilityRole="header"
                style={[
                  Type.microBold,
                  { fontSize: 12, lineHeight: 16, color: palette.textSubtle },
                ]}
              >
                {t('practices.history.thisWeek')}
              </Text>
              {thisWeek.map(row)}
            </View>
          )}
          {earlier.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text
                accessibilityRole="header"
                style={[
                  Type.microBold,
                  { fontSize: 12, lineHeight: 16, color: palette.textSubtle },
                ]}
              >
                {t('practices.history.earlier')}
              </Text>
              {earlier.map(row)}
            </View>
          )}
        </>
      )}
    </SettingsScreen>
  );
}
