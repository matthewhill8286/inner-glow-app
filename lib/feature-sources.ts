import { MEDICAL_SOURCES, type Citation } from '@/lib/citations';

/**
 * Sources behind each feature (App Review guideline 1.4.1). Scores, insights, suggestions and the
 * assessment draw on general public guidance; each topic lists the pages it is based on.
 */
export const SOURCE_TOPICS = [
  'score',
  'assessment',
  'mood',
  'sleep',
  'stress',
  'practices',
  'journal',
  'ai',
] as const;
export type SourceTopic = (typeof SOURCE_TOPICS)[number];

const TOPIC_KEYS: Record<SourceTopic, string[]> = {
  score: ['mood', 'stress', 'sleep', 'exercise_mental_health'],
  assessment: ['anxiety', 'depression', 'professional_help'],
  mood: ['mood', 'emotional_regulation', 'social'],
  sleep: ['sleep', 'sleep_hygiene', 'insomnia', 'circadian'],
  stress: ['stress', 'cortisol', 'breathing'],
  practices: ['mindfulness', 'meditation', 'breathing'],
  journal: ['journaling', 'gratitude', 'cbt'],
  ai: ['cbt', 'therapy', 'professional_help'],
};

/** The citations for one topic, without repeated pages. */
export function sourcesFor(topic: SourceTopic): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const key of TOPIC_KEYS[topic]) {
    for (const c of MEDICAL_SOURCES[key] ?? []) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      out.push(c);
    }
  }
  return out;
}

export function isSourceTopic(value: unknown): value is SourceTopic {
  return typeof value === 'string' && (SOURCE_TOPICS as readonly string[]).includes(value);
}
