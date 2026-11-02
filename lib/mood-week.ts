/**
 * Mood home "This week" (04 §M1, 09 §3.13): Monday to Sunday, one bar per day. A day with several
 * check-ins shows the latest one, which is also the log the Day details sheet opens (04 §M6 leaves
 * the rule open; the latest matches what the person saw last).
 */
export type WeekLog = {
  id: string;
  createdAt: string;
  mood: 'Great' | 'Good' | 'Okay' | 'Low' | 'Bad';
};

const SCORE: Record<WeekLog['mood'], number> = { Bad: 1, Low: 2, Okay: 3, Good: 4, Great: 5 };

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekDays<T extends WeekLog>(
  logs: T[],
  now = new Date(),
): { date: Date; log: T | null; score: number | null }[] {
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  );
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const log =
      logs
        .filter((l) => sameDay(new Date(l.createdAt), date))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;
    return { date, log, score: log ? SCORE[log.mood] : null };
  });
}

/** The latest check-in overall, for the orb and the "logged" line. */
export function latestLog<T extends WeekLog>(logs: T[]): T | null {
  return [...logs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;
}
