import { supabase } from '@/supabase/supabase';
import { extractCitations, type Citation } from '@/lib/citations';

export type PersonaId = 'freud' | 'calm' | 'sleep' | 'mood';

export type ChatAIResponse = {
  text: string;
  citations: Citation[];
};

export async function sendChatToAI(
  issueTitle: string,
  issueTags: string[],
  messages: { role: string; content: string }[],
  persona: PersonaId = 'freud',
): Promise<ChatAIResponse> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { issueTitle, issueTags, messages, persona },
  });

  if (error) throw error;

  const text: string = data.text;

  // Extract relevant medical citations from the response content
  const citations = extractCitations(text);

  return { text, citations };
}

/* ── Persona metadata (shared with UI) ──────────────── */
export interface PersonaMeta {
  id: PersonaId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  speciality: string;
}

export const PERSONAS: PersonaMeta[] = [
  {
    id: 'freud',
    name: 'Dr. Freud AI',
    role: 'Therapist',
    emoji: '🧑‍⚕️',
    color: '#8B6B47',
    speciality: 'CBT & Talk Therapy',
  },
  {
    id: 'calm',
    name: 'Calm Guide',
    role: 'Mindfulness',
    emoji: '🧘',
    color: '#5B8A5A',
    speciality: 'Meditation & Breathing',
  },
  {
    id: 'sleep',
    name: 'Sleep Coach',
    role: 'Sleep Expert',
    emoji: '😴',
    color: '#5A8FB5',
    speciality: 'Sleep Hygiene & Routines',
  },
  {
    id: 'mood',
    name: 'Mood Buddy',
    role: 'Emotional Support',
    emoji: '😊',
    color: '#7B6DC9',
    speciality: 'Mood Tracking & Support',
  },
];

export function getPersona(id?: string): PersonaMeta {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}

/* ── Topic → translation key mapping ──────────────── */

/** Known topic keywords mapped to their i18n key prefix */
const TOPIC_KEY_MAP: Record<string, string> = {
  anxiety: 'topic_anxiety',
  depression: 'topic_depression',
  stress: 'topic_stress',
  sleep: 'topic_sleep',
  relationships: 'topic_relationships',
  relationship: 'topic_relationships',
  'self-esteem': 'topic_selfEsteem',
  'self esteem': 'topic_selfEsteem',
  selfesteem: 'topic_selfEsteem',
  confidence: 'topic_selfEsteem',
  grief: 'topic_grief',
  loss: 'topic_grief',
  bereavement: 'topic_grief',
  anger: 'topic_anger',
  frustration: 'topic_anger',
  mindfulness: 'topic_mindfulness',
  meditation: 'topic_mindfulness',
  motivation: 'topic_motivation',
  procrastination: 'topic_motivation',
  productivity: 'topic_motivation',
};

/**
 * Resolves a topic name (or context tags) to a translation key prefix.
 * Returns undefined if no match found — caller should fall back to persona-based suggestions.
 */
export function getTopicKeyPrefix(
  topicName?: string,
  contextTags?: string[],
): string | undefined {
  // Try exact match on topic name first
  if (topicName) {
    const normalized = topicName.toLowerCase().trim();
    if (TOPIC_KEY_MAP[normalized]) return TOPIC_KEY_MAP[normalized];

    // Try partial match — topic name contains a known keyword
    for (const [keyword, prefix] of Object.entries(TOPIC_KEY_MAP)) {
      if (normalized.includes(keyword)) return prefix;
    }
  }

  // Try matching on context tags
  if (contextTags?.length) {
    for (const tag of contextTags) {
      const normalizedTag = tag.toLowerCase().trim();
      if (TOPIC_KEY_MAP[normalizedTag]) return TOPIC_KEY_MAP[normalizedTag];
    }
  }

  return undefined;
}
