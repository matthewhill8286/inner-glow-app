import type { IconName } from '@/components/icons/iconData';
import type { ChatMessage } from './types';

/**
 * Glow AI talk lists (05 §3.1 home rows, 09 §3.1 history). Talks have no stored title, summary or
 * topic icon yet (09 §6), so these are derived from the messages and the conversation key.
 */

/** Monday 00:00 of the week containing `now`, in local time. */
export function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

/** Free plan talks a week (05 §3.6). The chat function has the same number. */
export const FREE_TALKS_PER_WEEK = 10;

/** The free quota's week: Monday in UTC as "YYYY-MM-DD", matching `claim_glow_ai_chat`. */
export function usageWeekStart(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Closest emergency number for the device region: 911 in North America, 999 in the UK, else 112. */
export function emergencyNumber(region: string | null | undefined): string {
  const r = (region ?? '').toUpperCase();
  if (['US', 'CA', 'PR', 'MX'].includes(r)) return '911';
  if (['GB', 'IE', 'HK', 'MY'].includes(r)) return '999';
  if (r === 'AU') return '000';
  if (r === 'NZ') return '111';
  return '112';
}

/** The hour three hours from now, rounded up, as "HH:00": the session summary's check-in offer. */
export function checkInAgainTime(now = new Date()): { hour: number; label: string } {
  const hour = (now.getHours() + 3 + (now.getMinutes() > 0 ? 1 : 0)) % 24;
  return { hour, label: `${String(hour).padStart(2, '0')}:00` };
}

/** "This week" (Monday start) or "Earlier". */
export function talkGroup(updatedAt: number, now = new Date()): 'thisWeek' | 'earlier' {
  return updatedAt >= startOfWeek(now).getTime() ? 'thisWeek' : 'earlier';
}

/** "Today", the short weekday within this week ("Tue"), or "12 Oct" before that. */
export function talkDate(
  updatedAt: number,
  locale: string,
  todayLabel: string,
  now = new Date(),
): string {
  if (!updatedAt) return '';
  const d = new Date(updatedAt);
  if (d.toDateString() === now.toDateString()) return todayLabel;
  if (talkGroup(updatedAt, now) === 'thisWeek')
    return d.toLocaleDateString(locale, { weekday: 'short' });
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/**
 * Topic icon (09 §3.1 proposal): sleep → moon, relationships → heart, low mood → leaf,
 * the very first talk → sparkle, anything else → chat.
 */
export function talkIcon(
  talk: { personaId?: string; topicId?: string; topicName?: string },
  isFirst: boolean,
): IconName {
  if (isFirst) return 'line/sparkle';
  const text =
    `${talk.personaId ?? ''} ${talk.topicId ?? ''} ${talk.topicName ?? ''}`.toLowerCase();
  if (/sleep|insomnia|night/.test(text)) return 'line/moon';
  if (/relation|partner|family|friend|love|lonel/.test(text)) return 'line/heart';
  if (/depress|low|mood|sad|grief/.test(text)) return 'line/leaf';
  return 'line/chat';
}

const clean = (s: string) =>
  s
    .replace(/[*_#>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** The talk's title: the opening user message, cut to a short line. */
export function talkTitle(messages: ChatMessage[], fallback: string, max = 40): string {
  const opening = messages.find((m) => m.role === 'user' && m.content.trim());
  const text = opening ? clean(opening.content) : fallback;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** A one-line summary: the first sentence of Glow AI's latest reply, or the last message. */
export function talkSummary(messages: ChatMessage[], max = 60): string {
  const reply = [...messages].reverse().find((m) => m.role === 'assistant' && m.content.trim());
  const source = reply ?? messages.at(-1);
  if (!source) return '';
  const text = clean(source.content);
  const sentence = text.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() || text;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}
