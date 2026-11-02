/**
 * Helpers for the journal entry screen and its options sheet (04 J5, 10 §3.11).
 * Kept free of imports so the tests can load it on its own.
 */

/**
 * Journal moods are free words from the older write screen, the five check-in labels, or a
 * stored mood score. Map them onto the five-step scale so the entry can show the mood face;
 * words that fit no step return null and the entry shows the time alone.
 */
const MOOD_WORDS: Record<string, 1 | 2 | 3 | 4 | 5> = {
  bad: 1,
  tense: 1,
  angry: 1,
  overwhelmed: 1,
  low: 2,
  sad: 2,
  anxious: 2,
  okay: 3,
  calm: 4,
  good: 4,
  peaceful: 4,
  hopeful: 4,
  grateful: 4,
  great: 5,
  happy: 5,
  excited: 5,
  proud: 5,
  loved: 5,
};

export function journalMoodScore(mood?: string | null): 1 | 2 | 3 | 4 | 5 | null {
  const word = (mood ?? '').trim().toLowerCase();
  if (!word) return null;
  if (/^[1-5]$/.test(word)) return Number(word) as 1 | 2 | 3 | 4 | 5;
  return MOOD_WORDS[word] ?? null;
}

/**
 * Change date keeps the entry's time of day and moves it to the picked day. A day in the future
 * is not allowed, and today keeps the time only when that time has already passed.
 */
export function movedDate(createdAt: string, picked: Date, now = new Date()): string {
  const from = new Date(createdAt);
  const next = new Date(
    picked.getFullYear(),
    picked.getMonth(),
    picked.getDate(),
    from.getHours(),
    from.getMinutes(),
    from.getSeconds(),
  );
  return (next.getTime() > now.getTime() ? now : next).toISOString();
}

/** The plain-text export shared through the system share sheet. */
export function entryExportText(
  entry: { title?: string | null; content?: string | null; tags?: string[] | null },
  labels: { untitled: string; meta: string; tags: string },
): string {
  const lines = [
    (entry.title || '').trim() || labels.untitled,
    labels.meta,
    '',
    (entry.content || '').trim(),
  ];
  const tags = (entry.tags ?? []).filter(Boolean);
  if (tags.length) lines.push('', `${labels.tags}: ${tags.join(', ')}`);
  return lines.join('\n').trim();
}

/** Keyword check for language that needs the crisis sheet (the same list the old screen used). */
const CRISIS_WORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end it all',
  'no reason to live',
  'self-harm',
  'hurt myself',
  'want to die',
];

export function needsCrisisSupport(content?: string | null): boolean {
  const lower = (content ?? '').toLowerCase();
  return CRISIS_WORDS.some((w) => lower.includes(w));
}

/** Saved (04 J6): "That's 22 of 30 days in October" counts days with an entry so far this month. */
export function monthProgress(
  isoDates: string[],
  now = new Date(),
): { logged: number; days: number } {
  const days = new Set<number>();
  for (const iso of isoDates) {
    const d = new Date(iso);
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getTime() <= now.getTime()
    )
      days.add(d.getDate());
  }
  return { logged: days.size, days: now.getDate() };
}

/** "Fri, 30 Oct" in the app language, the date title on the journal screens (04 J2, J5). */
export function journalDate(iso: string, lang: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(lang, { weekday: 'short' });
  const day = d.toLocaleDateString(lang, { day: 'numeric' });
  const month = d.toLocaleDateString(lang, { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

export type MonthDot = { day: number; state: 'logged' | 'missed' | 'today' };

/**
 * Journal home's month card (04 J1): one dot per day so far this month, logged, missed or today
 * (today is "open" until an entry is written). The dots sit in two rows, 15 a row (16 for a
 * 31-day month), in date order.
 */
export function monthDots(
  isoDates: string[],
  now = new Date(),
): { dots: MonthDot[]; logged: number; todayLogged: boolean; perRow: number } {
  const logged = new Set<number>();
  for (const iso of isoDates) {
    const d = new Date(iso);
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() <= now.getDate()
    )
      logged.add(d.getDate());
  }
  const dots: MonthDot[] = [];
  for (let day = 1; day <= now.getDate(); day++)
    dots.push({
      day,
      state: logged.has(day) ? 'logged' : day === now.getDate() ? 'today' : 'missed',
    });
  const monthLength = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    dots,
    logged: logged.size,
    todayLogged: logged.has(now.getDate()),
    perRow: Math.max(15, Math.ceil(monthLength / 2)),
  };
}

/** Journal Stats: this year's entries per month, the average words, and how many sit on each mood step. */
export function journalYearStats(
  entries: { createdAt: string; content?: string | null; mood?: string | null }[],
  year = new Date().getFullYear(),
): {
  total: number;
  monthly: number[];
  avgWords: number;
  moods: Record<'1' | '2' | '3' | '4' | '5' | 'none', number>;
} {
  const monthly = Array.from({ length: 12 }, () => 0);
  const moods = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, none: 0 };
  let words = 0;
  let total = 0;
  for (const e of entries) {
    const d = new Date(e.createdAt);
    if (d.getFullYear() !== year) continue;
    total++;
    monthly[d.getMonth()]++;
    words += (e.content ?? '').trim().split(/\s+/).filter(Boolean).length;
    const score = journalMoodScore(e.mood);
    moods[score ? (String(score) as '1') : 'none']++;
  }
  return { total, monthly, avgWords: total ? Math.round(words / total) : 0, moods };
}
