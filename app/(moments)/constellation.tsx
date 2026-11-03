import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Eyebrow, MomentShell, closeMoment } from '@/components/moments/MomentShell';
import { toast } from '@/components/Toast';
import { useJournal } from '@/hooks/useJournal';
import { constellationPoint, nextAt, toBeatLastMonth } from '@/lib/moments';
import { scheduleNotification } from '@/lib/notifications';

const REMIND_HOUR = 21;

/**
 * Journal constellation (03 §3.4): this month's days as stars, written days lit and joined in date
 * order, today ringed, then how close the month is to beating the last one, Write tonight's entry
 * and Remind me at 21:00.
 */
export default function JournalMoment() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { journalEntries } = useJournal();
  const now = useMemo(() => new Date(), []);

  const { written, days, lastMonth } = useMemo(() => {
    const set = new Set<number>();
    let prev = 0;
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastDays = new Set<number>();
    for (const e of journalEntries) {
      const d = new Date(e.createdAt);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) set.add(d.getDate());
      const at = d.getTime();
      if (at >= lastStart && at < thisStart) lastDays.add(d.getDate());
    }
    prev = lastDays.size;
    return { written: set, days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), lastMonth: prev };
  }, [journalEntries, now]);

  const today = now.getDate();
  const writtenToday = written.has(today);
  const more = toBeatLastMonth(written.size, lastMonth);
  const sx = width / 375;
  const rows = Math.ceil(days / 6);
  const svgH = 48 * (rows - 1) + 40;
  const at = (d: number) => {
    const p = constellationPoint(d);
    return { x: p.x * sx, y: p.y - 236 + 20 };
  };
  const line = [...written].sort((a, b) => a - b).map((d) => at(d));

  const remind = async () => {
    try {
      await scheduleNotification(t('moments.journal.remindTitle'), t('moments.journal.remindBody'), { route: '/(moments)/constellation' }, {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextAt(REMIND_HOUR, 0, new Date()),
      });
      toast.success(t('moments.journal.reminded'));
      closeMoment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('moments.error'));
    }
  };

  const body = writtenToday
    ? t('moments.journal.bodyDone')
    : more > 0 && lastMonth > 0
      ? t('moments.journal.bodyBeat', { count: more })
      : t('moments.journal.bodyTonight');

  return (
    <MomentShell
      glows={[
        { color: palette.sky, opacity: 0.25, x: -40, y: 120, width: 300, blur: 90 },
        { color: palette.mustard, opacity: 0.25, x: 170, y: 260, width: 240, blur: 90 },
      ]}
      cta={writtenToday ? { label: t('moments.journal.open'), onPress: () => router.replace('/(tabs)/journal') } : { label: t('moments.journal.cta'), onPress: () => router.replace('/(tabs)/journal/new') }}
      link={writtenToday ? undefined : { label: t('moments.journal.remind', { time: `${REMIND_HOUR}:00` }), onPress: () => void remind() }}
    >
      <Eyebrow text={now.toLocaleDateString(i18n.language, { month: 'long' })} />
      <Text accessibilityRole="header" style={[Type.display, { fontWeight: '400', color: palette.plumDeep, marginTop: 4 }]}>
        {t('moments.journal.count', { written: written.size, days })}
      </Text>

      <View style={{ marginHorizontal: -24, marginTop: 24 }} accessibilityElementsHidden>
        <Svg width={width} height={svgH}>
          {line.length > 1 && <Polyline points={line.map((p) => `${p.x},${p.y}`).join(' ')} stroke={palette.mustard} strokeOpacity={0.55} strokeWidth={1.5} fill="none" />}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1;
            const p = at(d);
            if (written.has(d))
              return (
                <React.Fragment key={d}>
                  <Circle cx={p.x} cy={p.y} r={14} fill={palette.mustard} fillOpacity={0.3} />
                  <Circle cx={p.x} cy={p.y} r={6} fill={palette.mustard} />
                </React.Fragment>
              );
            if (d === today) return <Circle key={d} cx={p.x} cy={p.y} r={5} stroke={palette.plum} strokeWidth={2} fill="none" />;
            return <Circle key={d} cx={p.x} cy={p.y} r={5} stroke="#D6CCC0" strokeWidth={1.5} fill="none" />;
          })}
        </Svg>
      </View>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
        {[
          { key: 'written', dot: { backgroundColor: palette.mustard } },
          { key: 'today', dot: { borderWidth: 1.5, borderColor: palette.plum } },
          { key: 'open', dot: { borderWidth: 1.5, borderColor: '#D6CCC0' } },
        ].map((l) => (
          <View key={l.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[{ width: 10, height: 10, borderRadius: 5 }, l.dot]} />
            <Text style={[Type.caption, { fontWeight: '500', color: palette.textMuted }]}>{t(`moments.journal.legend.${l.key}`)}</Text>
          </View>
        ))}
      </View>

      <Text style={[Type.titleMd, { lineHeight: 26, color: palette.plumDeep, marginTop: 28 }]}>
        {t(written.size >= days - 3 ? 'moments.journal.titleAlmost' : 'moments.journal.title')}
      </Text>
      <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, marginTop: 8 }]}>{body}</Text>
    </MomentShell>
  );
}
