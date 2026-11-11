/**
 * Share cards (`6845:8140`, `6845:8203`). Only the numbers on the card are shared: no journal text,
 * chats or mood details.
 */
export type ShareTab = 'week' | 'streak' | 'score';
export const SHARE_TABS: ShareTab[] = ['week', 'streak', 'score'];

const WEEK = 7 * 86_400_000;

export type WeekCounts = { checkIns: number; practices: number; journal: number };

export function weekCounts(
  checkIns: { createdAt: string }[],
  practices: { dateISO: string }[],
  journal: { createdAt: string }[],
  now = Date.now(),
): WeekCounts {
  const inWeek = (iso: string) => {
    const t = Date.parse(iso);
    return Number.isFinite(t) && t <= now && now - t < WEEK;
  };
  return {
    checkIns: checkIns.filter((c) => inWeek(c.createdAt)).length,
    practices: practices.filter((p) => inWeek(p.dateISO)).length,
    journal: journal.filter((j) => inWeek(j.createdAt)).length,
  };
}

/** The card's headline: a gentle line chosen from the week's average mood (1–5), never the mood itself. */
export function weekHeadline(moodScores: number[]): 'steady' | 'growing' | 'gentle' {
  if (!moodScores.length) return 'gentle';
  const avg = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
  if (avg >= 4) return 'steady';
  if (avg >= 3) return 'growing';
  return 'gentle';
}

export function isShareTab(value: unknown): value is ShareTab {
  return typeof value === 'string' && (SHARE_TABS as string[]).includes(value);
}
