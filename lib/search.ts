/**
 * Search (05 §4): one list of practices, journal entries, Glow AI talks and insight screens,
 * searched on the device. Kept pure so it is unit tested.
 */

export type SearchType = 'practice' | 'journal' | 'talk' | 'insight';
/** Drives the row icon and tint (05 §4.2). */
export type SearchKind = 'sleep' | 'breathing' | 'mindfulness' | 'relax' | 'journal' | 'talk' | 'insight';
export type LengthFilter = 'any' | 'short' | 'mid' | 'long';
export type TimeFilter = 'all' | 'week' | 'month';

export type SearchItem = {
  id: string;
  type: SearchType;
  kind: SearchKind;
  title: string;
  /** Extra text that matches but is not shown (journal body, talk messages). */
  body?: string;
  minutes?: number;
  /** Epoch ms, for journal entries and talks. */
  at?: number;
};

export type SearchFilters = { types: SearchType[]; length: LengthFilter; time: TimeFilter };
export const DEFAULT_FILTERS: SearchFilters = { types: [], length: 'any', time: 'all' };

const DAY = 86_400_000;

/** Lower case without accents, so "meditación" matches "meditacion" and Greek final sigma matches σ. */
export function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/ς/g, 'σ');
}

const words = (q: string) => normalize(q).trim().split(/\s+/).filter(Boolean);

/** Relevance of an item for a query; 0 means no match. Every word must appear in the title or body. */
export function score(item: SearchItem, query: string): number {
  const ws = words(query);
  if (!ws.length) return 0;
  const title = normalize(item.title);
  const all = `${title} ${normalize(item.body ?? '')}`;
  if (!ws.every((w) => all.includes(w))) return 0;
  const q = ws.join(' ');
  if (title.startsWith(q)) return 100;
  if (title.split(/\s+/).some((t) => t.startsWith(ws[0]))) return 80;
  if (ws.every((w) => title.includes(w))) return 60;
  return 30;
}

export function passesFilters(item: SearchItem, f: SearchFilters, now: number) {
  if (f.types.length && !f.types.includes(item.type)) return false;
  if (f.length !== 'any') {
    if (item.minutes == null) return false;
    if (f.length === 'short' && item.minutes >= 5) return false;
    if (f.length === 'mid' && (item.minutes < 5 || item.minutes > 15)) return false;
    if (f.length === 'long' && item.minutes <= 15) return false;
  }
  if (f.time !== 'all') {
    if (item.at == null) return false;
    const span = f.time === 'week' ? 7 * DAY : 31 * DAY;
    if (now - item.at > span) return false;
  }
  return true;
}

/** Matches, most relevant first; ties go to the newest, then A to Z. */
export function search(items: SearchItem[], query: string, f: SearchFilters = DEFAULT_FILTERS, now = Date.now()) {
  return items
    .map((item) => ({ item, s: score(item, query) }))
    .filter((r) => r.s > 0 && passesFilters(r.item, f, now))
    .sort((a, b) => b.s - a.s || (b.item.at ?? 0) - (a.item.at ?? 0) || a.item.title.localeCompare(b.item.title))
    .map((r) => r.item);
}

/** Typing suggestions (05 §4.5): titles that match, best first, without repeats. */
export function suggestions(items: SearchItem[], query: string, max = 4) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of search(items, query)) {
    if (item.type === 'journal' || item.type === 'talk') continue;
    const key = normalize(item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item.title);
    if (out.length === max) break;
  }
  return out;
}

/**
 * Where the query's first word sits in `text`, as [start, end) in the original string, so the
 * matched part can be drawn bold (05 §4.2). Null when it does not appear.
 */
export function highlight(text: string, query: string): [number, number] | null {
  const w = words(query)[0];
  if (!w) return null;
  // Normalise character by character so indices map back to the original text.
  let flat = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const n = normalize(text[i]);
    for (let k = 0; k < n.length; k++) {
      flat += n[k];
      map.push(i);
    }
  }
  const at = flat.indexOf(w);
  if (at < 0) return null;
  return [map[at], map[at + w.length - 1] + 1];
}

/** Recent searches: newest first, no repeats (ignoring case), at most `max`. */
export function addRecent(list: string[], query: string, max = 6) {
  const q = query.trim();
  if (!q) return list;
  return [q, ...list.filter((x) => normalize(x) !== normalize(q))].slice(0, max);
}
