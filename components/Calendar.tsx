import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── mood → color mapping ──────────────────────── */
const MOOD_COLORS: Record<string, string> = {
  Great: '#5B8A5A',
  Good: '#7EAD7E',
  Okay: '#E8985A',
  Low: '#C47B5A',
  Bad: '#C45B5B',
};

export interface CalendarMark {
  date: string; // YYYY-MM-DD
  mood?: string; // optional mood for color coding
}

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates?: string[]; // simple ISO strings (backward compatible)
  markedEntries?: CalendarMark[]; // richer marks with mood
}

export default function Calendar({
  selectedDate,
  onSelectDate,
  markedDates = [],
  markedEntries = [],
}: CalendarProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  /* ── build month grid ───────────────────────── */
  const monthData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [selectedDate]);

  const monthName = selectedDate.toLocaleString('default', { month: 'long' });
  const year = selectedDate.getFullYear();

  const changeMonth = (offset: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + offset);
    onSelectDate(d);
  };

  /* ── mark lookup (merge both prop formats) ──── */
  const markMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    markedDates.forEach((d) => {
      map[d] = undefined;
    });
    markedEntries.forEach((e) => {
      map[e.date] = e.mood;
    });
    return map;
  }, [markedDates, markedEntries]);

  /* ── date helpers ────────────────────────────── */
  const isSelected = (d: Date) =>
    d.getDate() === selectedDate.getDate() &&
    d.getMonth() === selectedDate.getMonth() &&
    d.getFullYear() === selectedDate.getFullYear();

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getDate() === t.getDate() &&
      d.getMonth() === t.getMonth() &&
      d.getFullYear() === t.getFullYear()
    );
  };

  const getMarkInfo = (d: Date): { marked: boolean; mood?: string } => {
    try {
      const iso = d.toISOString().split('T')[0];
      if (iso in markMap) return { marked: true, mood: markMap[iso] };
    } catch {}
    return { marked: false };
  };

  /* ── count marks this month ─────────────────── */
  const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const monthMarkCount = Object.keys(markMap).filter((d) => d.startsWith(monthStr)).length;

  return (
    <View style={[s.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* month nav */}
      <View style={s.navRow}>
        <Pressable
          onPress={() => changeMonth(-1)}
          style={({ pressed }) => [
            s.navBtn,
            { backgroundColor: colors.inputBg, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MaterialIcons name="chevron-left" size={22} color={colors.text} />
        </Pressable>

        <View style={s.monthCenter}>
          <Text style={[s.monthTitle, { color: colors.text }]}>
            {monthName} {year}
          </Text>
          {monthMarkCount > 0 && (
            <Text style={[s.monthSub, { color: colors.mutedText }]}>
              {monthMarkCount} check-in{monthMarkCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => changeMonth(1)}
          style={({ pressed }) => [
            s.navBtn,
            { backgroundColor: colors.inputBg, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MaterialIcons name="chevron-right" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* weekday header */}
      <View style={s.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <View key={i} style={s.weekCell}>
            <Text style={[s.weekText, { color: colors.mutedText }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* divider */}
      <View style={[s.divider, { backgroundColor: colors.divider }]} />

      {/* day grid */}
      <View style={s.grid}>
        {monthData.map((date, i) => {
          if (!date) return <View key={`e-${i}`} style={s.dayCell} />;

          const selected = isSelected(date);
          const today = isToday(date);
          const { marked, mood } = getMarkInfo(date);
          const dotColor = mood ? MOOD_COLORS[mood] || colors.primary : colors.primary;

          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => onSelectDate(date)}
              style={({ pressed }) => [s.dayCell, { opacity: pressed ? 0.6 : 1 }]}
            >
              <View
                style={[
                  s.dayInner,
                  selected && [s.daySelected, { backgroundColor: '#8B6B47' }],
                  !selected && today && [s.dayToday, { borderColor: '#8B6B47' }],
                  !selected && marked && !today && { backgroundColor: dotColor + '12' },
                ]}
              >
                <Text
                  style={[
                    s.dayText,
                    { color: selected ? '#FFF' : colors.text },
                    today && !selected && { fontWeight: '800', color: '#8B6B47' },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>

              {/* mood dot indicator */}
              {marked && (
                <View
                  style={[
                    s.dot,
                    {
                      backgroundColor: selected ? '#FFF' : dotColor,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },

  /* nav */
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: { alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '900' },
  monthSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  /* week header */
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekCell: { flex: 1, alignItems: 'center' },
  weekText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  divider: { height: 1, marginBottom: 6 },

  /* grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    ...UI.shadow.sm,
  },
  dayToday: {
    borderWidth: 2,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* dot */
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});
