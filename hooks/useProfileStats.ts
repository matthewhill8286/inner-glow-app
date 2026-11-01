import { useMemo } from 'react';
import { useMood } from '@/hooks/useMood';
import { useJournal } from '@/hooks/useJournal';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useFreudScore } from '@/hooks/useFreudScore';
import { activeDays, scoreChange, streak, weekMood, weekMoodBars } from '@/lib/profile-stats';

/** Numbers for Profile (06 P1) and Your streak: one day counts with any check-in, entry or session. */
export function useProfileStats() {
  const { moodCheckIns, isLoading: moodLoading } = useMood();
  const { journalEntries } = useJournal();
  const { mindfulnessHistory } = useMindfulness();
  const { currentScore, scoreHistory } = useFreudScore();

  return useMemo(() => {
    const active = activeDays([
      ...moodCheckIns.map((c) => c.createdAt),
      ...journalEntries.map((e) => e.createdAt),
      ...mindfulnessHistory.map((m) => m.dateISO),
    ]);
    const current = streak(active);
    return {
      loading: moodLoading,
      active,
      streak: current,
      checkIns: moodCheckIns.length,
      mindfulMinutes: Math.round(
        mindfulnessHistory.reduce((sum, m) => sum + (m.seconds ?? 0), 0) / 60,
      ),
      score: Math.round(currentScore.score),
      scoreChange: scoreChange(currentScore.score, scoreHistory),
      moodBars: weekMoodBars(moodCheckIns),
      weekMood: weekMood(moodCheckIns),
    };
  }, [
    moodCheckIns,
    journalEntries,
    mindfulnessHistory,
    currentScore.score,
    scoreHistory,
    moodLoading,
  ]);
}
