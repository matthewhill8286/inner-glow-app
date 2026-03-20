import { supabase } from '@/supabase/supabase';

export type PersonaId = 'freud' | 'calm' | 'sleep' | 'mood';

export async function sendChatToAI(
  issueTitle: string,
  issueTags: string[],
  messages: { role: string; content: string }[],
  persona: PersonaId = 'freud',
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { issueTitle, issueTags, messages, persona },
  });

  if (error) throw error;
  return data.text;
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
