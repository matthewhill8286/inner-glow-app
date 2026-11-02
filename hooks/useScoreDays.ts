import { useMemo } from 'react';
import { useFreudScore } from './useFreudScore';
import { useMood } from './useMood';
import { useSleep } from './useSleep';
import { useMindfulness } from './useMindfulness';
import { useJournal } from './useJournal';
import { dailyScores, dayKey, type DayScore } from '@/lib/glow-score';
import { nightHours } from '@/lib/sleep-periods';
import type { MoodCheckIn } from '@/lib/types';

/** What happened on a scored day: the last check-in, practice minutes, sleep and the factor keys for Insights. */
export type ScoreDay = DayScore & {
  checkIn: MoodCheckIn | null;
  practiceMinutes: number;
  breathingMinutes: number;
  sleepHours: number | null;
  factors: Set<string>;
};

/** Mood factors that count as one Insights factor ("Time with people"). */
const FACTOR_ALIAS: Record<string, string> = { friends: 'people', family: 'people' };

/**
 * Saved Glow scores, one per day, joined with that day's check-in, practices, sleep and journal so
 * the history cards and the Insights factors (03 §2.3–2.4) read from one place.
 */
export function useScoreDays() {
  const { scoreHistory, isLoadingHistory } = useFreudScore({ lazy: true, withHistory: true });
  const { moodCheckIns, isLoading: moodLoading } = useMood();
  const { sleepEntries } = useSleep();
  const { mindfulnessHistory } = useMindfulness();
  const { journalEntries } = useJournal();

  const days = useMemo<ScoreDay[]>(() => {
    const checkIns = new Map<string, MoodCheckIn>();
    for (const c of [...moodCheckIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
      checkIns.set(dayKey(new Date(c.createdAt)), c);
    const practice = new Map<string, { all: number; breathing: number }>();
    for (const m of mindfulnessHistory) {
      const key = dayKey(new Date(m.dateISO));
      const p = practice.get(key) ?? { all: 0, breathing: 0 };
      p.all += m.seconds / 60;
      if (m.category === 'breathing') p.breathing += m.seconds / 60;
      practice.set(key, p);
    }
    const sleep = new Map<string, number>();
    for (const n of sleepEntries) {
      const key = dayKey(new Date(n.endISO));
      sleep.set(key, (sleep.get(key) ?? 0) + nightHours(n));
    }
    const journaled = new Set(journalEntries.map((j) => dayKey(new Date(j.createdAt))));

    return dailyScores(scoreHistory).map((d) => {
      const checkIn = checkIns.get(d.key) ?? null;
      const p = practice.get(d.key);
      const hours = sleep.get(d.key) ?? null;
      const factors = new Set<string>();
      if (p?.breathing) factors.add('breathing');
      if (p && p.all - p.breathing > 0) factors.add('practice');
      if (hours !== null && hours >= 7) factors.add('sleep7');
      if (hours !== null && hours < 6) factors.add('shortSleep');
      if (journaled.has(d.key)) factors.add('journal');
      for (const f of checkIn?.factors ?? []) if (f !== 'sleep') factors.add(FACTOR_ALIAS[f] ?? f);
      return {
        ...d,
        checkIn,
        practiceMinutes: Math.round(p?.all ?? 0),
        breathingMinutes: Math.round(p?.breathing ?? 0),
        sleepHours: hours,
        factors,
      };
    });
  }, [scoreHistory, moodCheckIns, sleepEntries, mindfulnessHistory, journalEntries]);

  return { days, moodCheckIns, isLoading: isLoadingHistory || moodLoading };
}
