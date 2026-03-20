import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MoodCheckIn } from '@/lib/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';

const moodScore: Record<MoodCheckIn['mood'], number> = {
  Great: 5,
  Good: 4,
  Okay: 3,
  Low: 2,
  Bad: 1,
};

const MOOD_COLORS: Record<number, string> = {
  5: '#4AAD7A', // Great - green
  4: '#6BBF8A', // Good - light green
  3: '#E8985A', // Okay - amber
  2: '#C47A5A', // Low - muted orange
  1: '#C45B5B', // Bad - red
};

function dayKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function labelFromKey(k: string) {
  const [y, m, d] = k.split('-').map((x) => Number(x));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short' });
}

function isToday(k: string) {
  return k === dayKey(new Date().toISOString());
}

export default function MoodChart({ items }: Readonly<{ items: MoodCheckIn[] }>) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const data = useMemo(() => {
    const today = new Date();
    const keys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      keys.push(dayKey(d.toISOString()));
    }

    const byDay = new Map<string, MoodCheckIn[]>();
    for (const it of items) {
      const k = dayKey(it.createdAt);
      byDay.set(k, [...(byDay.get(k) ?? []), it]);
    }

    return keys.map((k) => {
      const list = byDay.get(k) ?? [];
      if (!list.length)
        return {
          key: k,
          label: labelFromKey(k),
          moodAvg: null as number | null,
          stressAvg: null as number | null,
          isToday: isToday(k),
        };

      const moodAvg = list.reduce((a, x) => a + moodScore[x.mood], 0) / list.length;
      const stressAvg = list.reduce((a, x) => a + x.stress, 0) / list.length;
      return { key: k, label: labelFromKey(k), moodAvg, stressAvg, isToday: isToday(k) };
    });
  }, [items]);

  const maxBarHeight = 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Last 7 days</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.subtleText }]}>Mood</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={[styles.legendText, { color: colors.subtleText }]}>Stress</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartRow}>
        {data.map((d) => {
          const moodRound = d.moodAvg != null ? Math.round(d.moodAvg) : null;
          const barColor =
            moodRound != null ? MOOD_COLORS[moodRound] || colors.primary : colors.inputBg;
          const barHeight = d.moodAvg == null ? 8 : Math.max(8, (d.moodAvg / 5) * maxBarHeight);
          const stressDotBottom =
            d.stressAvg == null
              ? null
              : Math.max(4, Math.min(maxBarHeight - 4, (d.stressAvg / 10) * maxBarHeight));

          return (
            <View key={d.key} style={styles.barCol}>
              <View style={styles.barArea}>
                {/* Stress dot */}
                {stressDotBottom != null && (
                  <View
                    style={[
                      styles.stressDot,
                      { bottom: stressDotBottom, backgroundColor: colors.info },
                    ]}
                  />
                )}
                {/* Mood bar */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                      opacity: d.moodAvg == null ? 0.15 : 0.85,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: d.isToday ? colors.primary : colors.subtleText,
                    fontWeight: d.isToday ? '800' : '600',
                  },
                ]}
              >
                {d.isToday ? 'Today' : d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBar: {
    width: 12,
    height: 6,
    borderRadius: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barArea: {
    height: 88,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  stressDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  bar: {
    width: 18,
    borderRadius: 9,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 8,
  },
});
