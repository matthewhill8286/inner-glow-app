import { getPersona, type PersonaMeta } from './chat';

/**
 * Chat key format: "personaId:topicId"
 *
 * Every conversation is uniquely identified by a composite key that encodes
 * both the AI persona and the topic. This module is the single source of truth
 * for building and parsing those keys so no screen has to do string-splitting
 * on its own.
 */

/* ── Build ──────────────────────────────────────────── */

/** Create a composite chat key. */
export function buildChatKey(personaId: string, topicId: string = 'general'): string {
  return `${personaId}:${topicId}`;
}

/**
 * Create a chat key that is guaranteed to be unique (includes a short timestamp suffix).
 * Use this when starting a brand-new conversation that shouldn't reuse an existing one
 * (e.g. quick-start chips where each tap should open a fresh chat).
 */
export function buildNewChatKey(personaId: string, topicId: string = 'general'): string {
  const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return `${personaId}:${topicId}:${uid}`;
}

/* ── Parse ──────────────────────────────────────────── */

export interface ParsedChatKey {
  /** Raw composite key stored in the DB */
  raw: string;
  personaId: string;
  topicId: string;
  persona: PersonaMeta;
}

/**
 * Split a composite key back into its parts + resolve persona metadata.
 * Handles both "persona:topic" and "persona:topic:uid" formats.
 */
export function parseChatKey(key: string): ParsedChatKey {
  const parts = key.split(':');
  const personaId = parts[0] || 'freud';
  const topicId = parts[1] || 'general';
  // parts[2] is the optional uid — we don't need it for display/logic

  return {
    raw: key,
    personaId,
    topicId,
    persona: getPersona(personaId),
  };
}

/* ── Query helpers ──────────────────────────────────── */

/**
 * Count total messages across every persona for a given topic.
 * Useful for the hub screen's badge counts.
 */
export function countMessagesForTopic(
  history: Record<string, unknown[]>,
  topicId: string,
): number {
  let total = 0;
  for (const [key, msgs] of Object.entries(history)) {
    const parsed = parseChatKey(key);
    if (parsed.topicId === topicId) {
      total += msgs.length;
    }
  }
  return total;
}
