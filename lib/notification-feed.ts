import type { IconName } from '@/components/icons/iconData';

/**
 * Notifications feed, "Your day, in light" (03 §3.1). Kept pure so it is unit tested: how each
 * notification type looks and where it opens, the Today / Yesterday / Earlier groups, and the
 * journal mini-grid on the highlight card.
 */

type FeedItem = { id: string; type: string; createdAt: string };

export type FeedLook = {
  icon: IconName;
  /** Timeline node colour, one of the five glow colours. */
  node: string;
  /** Where tapping the card goes. */
  route: string;
  /** i18n key under `notificationFeed.actions.` for the action pill, if the card has one. */
  action?: string;
};

const LILAC = '#D8B4D8';
const LAVENDER = '#8E7FA6';
const SKY = '#7FC6F1';
const MUSTARD = '#E2CC40';
const ROSE = '#FFB3BE';

export const FEED_LOOK: Record<string, FeedLook> = {
  reminder: { icon: 'line/bell', node: LAVENDER, route: '/(tabs)/home' },
  mood_logged: { icon: 'line/heart', node: ROSE, route: '/(tabs)/mood' },
  sleep_logged: { icon: 'line/moon', node: SKY, route: '/(tabs)/sleep' },
  journal_entry: { icon: 'line/journal', node: MUSTARD, route: '/(tabs)/journal' },
  suggestion_completed: { icon: 'line/check', node: LAVENDER, route: '/(tabs)/freud-score/ai-suggestions' },
  stress_exercise: { icon: 'line/leaf', node: ROSE, route: '/(tabs)/mindful' },
  mindfulness_session: { icon: 'line/check', node: LAVENDER, route: '/(tabs)/mindful/history' },
  score_improved: { icon: 'line/sparkle', node: MUSTARD, route: '/(tabs)/freud-score' },
  score_declined: { icon: 'line/chart', node: ROSE, route: '/(tabs)/freud-score/insights', action: 'plan' },
  streak_milestone: { icon: 'line/flame', node: MUSTARD, route: '/(tabs)/profile/streak' },
  weekly_summary: { icon: 'line/chart', node: SKY, route: '/(tabs)/freud-score/insights' },
  new_suggestions: { icon: 'line/sparkle', node: LILAC, route: '/(tabs)/freud-score/ai-suggestions', action: 'plan' },
  welcome: { icon: 'line/sparkle', node: LILAC, route: '/(tabs)/home' },
};
const FALLBACK: FeedLook = { icon: 'line/bell', node: LAVENDER, route: '/(tabs)/home' };

export const feedLook = (type: string) => FEED_LOOK[type] ?? FALLBACK;

/**
 * Where a card opens. A reminder that came from a push carries its own route in `meta.route`;
 * only in-app routes are followed.
 */
export function feedRoute(item: { type: string; meta?: Record<string, string | number> }) {
  const own = item.meta?.route;
  if (typeof own === 'string' && own.startsWith('/(')) return own;
  return feedLook(item.type).route;
}

export type FeedGroup = 'today' | 'yesterday' | 'earlier';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Newest first, in Today, Yesterday and Earlier; empty groups are left out. */
export function groupFeed<T extends FeedItem>(items: T[], now = new Date()) {
  const today = startOfDay(now);
  const yesterday = today - 86_400_000;
  const groups: Record<FeedGroup, T[]> = { today: [], yesterday: [], earlier: [] };
  for (const item of [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))) {
    const at = Date.parse(item.createdAt);
    if (!Number.isFinite(at)) continue;
    groups[at >= today ? 'today' : at >= yesterday ? 'yesterday' : 'earlier'].push(item);
  }
  return (['today', 'yesterday', 'earlier'] as FeedGroup[])
    .filter((g) => groups[g].length)
    .map((g) => ({ group: g, items: groups[g] }));
}

/**
 * Journal mini-grid (03 §4.6 feed card): 6 columns × 5 rows, one dot per day of the month up to
 * today, written days filled. Returns which days of this month have an entry and how many have passed.
 */
export function journalMonth(entries: { createdAt: string }[], now = new Date()) {
  const written = new Set<number>();
  for (const e of entries) {
    const d = new Date(e.createdAt);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) written.add(d.getDate());
  }
  return { written, days: now.getDate() };
}

/** Grid position of day `d` (1-based) on the feed card: 6 per row, pitch 20 × 18, centres from (26, 26). */
export const gridDot = (d: number) => ({ x: 26 + 20 * ((d - 1) % 6), y: 26 + 18 * Math.floor((d - 1) / 6) });
