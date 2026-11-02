import type { IconName } from '@/components/icons/iconData';

/**
 * Practice catalogue (07 §3). Titles, tags and descriptions are translated under
 * `practices.items.<id>`; this file holds what the code needs: kind, pattern and options.
 * Relax practices are listed here so search and All practices can show them; until their video
 * screens are rebuilt they open the existing body and mind video lists.
 */
export type PracticeCategory = 'breathing' | 'relax-body' | 'relax-mind' | 'mindfulness' | 'sleep';
export type PracticeKind = 'breathing' | 'video' | 'audio' | 'sleep';

/** Seconds per phase. `doubleInhale` splits the inhale into two short breaths (Sigh reset). */
export type BreathPattern = {
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter: number;
  doubleInhale?: boolean;
};

export type Practice = {
  id: string;
  category: PracticeCategory;
  kind: PracticeKind;
  /** Minutes shown on list rows ("4 min · Focus"). */
  listMinutes: number;
  patternLabel?: string;
  pattern?: BreathPattern;
  durations?: number[];
  defaultDuration?: number;
  options: {
    pace?: boolean;
    sound?: SoundKey;
    haptics?: boolean;
    voice?: boolean;
    fadeOut?: boolean;
  };
  /**
   * Relax videos (07 §3.2–3.3). The design's INNER GLOW channel videos do not exist yet, so each
   * practice uses the closest working YouTube video as a stand-in, with that video's length. Relax
   * practices without a working video are left out of the lists until real videos exist.
   */
  video?: { youtubeId: string; seconds: number };
};

/** Bundled loops in `lib/soundscape.ts`, plus silence. */
export type SoundKey = 'zen' | 'rain' | 'ocean' | 'stream' | 'birds' | 'silence';

/** The sounds each category offers in the Choose a sound sheet (10 §3.4), from the bundled loops only. */
export const SOUND_CHOICES: Record<
  'breathing' | 'mindfulness' | 'sleep',
  { key: SoundKey; icon: IconName }[]
> = {
  breathing: [
    { key: 'zen', icon: 'line/music' },
    { key: 'rain', icon: 'line/music' },
    { key: 'silence', icon: 'line/mic-off' },
  ],
  mindfulness: [
    { key: 'birds', icon: 'line/leaf' },
    { key: 'stream', icon: 'line/music' },
    { key: 'zen', icon: 'line/music' },
    { key: 'silence', icon: 'line/mic-off' },
  ],
  sleep: [
    { key: 'rain', icon: 'line/music' },
    { key: 'ocean', icon: 'line/music' },
    { key: 'stream', icon: 'line/leaf' },
    { key: 'silence', icon: 'line/mic-off' },
  ],
};

const BREATH_DURATIONS = [1, 3, 5, 10];

const CATALOGUE: Practice[] = [
  {
    id: 'box-breathing',
    category: 'breathing',
    kind: 'breathing',
    listMinutes: 4,
    patternLabel: '4 · 4 · 4 · 4',
    pattern: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
    durations: BREATH_DURATIONS,
    defaultDuration: 3,
    options: { pace: true, sound: 'zen', haptics: true },
  },
  {
    id: 'four-seven-eight',
    category: 'breathing',
    kind: 'breathing',
    listMinutes: 5,
    patternLabel: '4 · 7 · 8',
    pattern: { inhale: 4, hold: 7, exhale: 8, holdAfter: 0 },
    durations: BREATH_DURATIONS,
    defaultDuration: 5,
    options: { pace: true, sound: 'zen', haptics: true },
  },
  {
    id: 'coherent',
    category: 'breathing',
    kind: 'breathing',
    listMinutes: 6,
    patternLabel: '5.5 · 5.5',
    pattern: { inhale: 5.5, hold: 0, exhale: 5.5, holdAfter: 0 },
    durations: BREATH_DURATIONS,
    defaultDuration: 5,
    options: { pace: true, sound: 'zen', haptics: true },
  },
  {
    id: 'sigh-reset',
    category: 'breathing',
    kind: 'breathing',
    listMinutes: 1,
    patternLabel: 'In · in · out',
    pattern: { inhale: 3, hold: 0, exhale: 6, holdAfter: 0, doubleInhale: true },
    durations: BREATH_DURATIONS,
    defaultDuration: 1,
    options: { pace: true, sound: 'zen', haptics: true },
  },

  {
    id: 'shoulder-release',
    category: 'relax-body',
    kind: 'video',
    listMinutes: 20,
    options: {},
    video: { youtubeId: 'sTANio_2E0Q', seconds: 1200 },
  },
  { id: 'neck-tension-reset', category: 'relax-body', kind: 'video', listMinutes: 4, options: {} },
  {
    id: 'full-body-relax',
    category: 'relax-body',
    kind: 'video',
    listMinutes: 15,
    options: {},
    video: { youtubeId: 'g_tea8ZNk5A', seconds: 900 },
  },
  {
    id: 'quiet-thoughts',
    category: 'relax-mind',
    kind: 'video',
    listMinutes: 10,
    options: {},
    video: { youtubeId: 'ZToicYcHIOU', seconds: 600 },
  },
  {
    id: 'anxiety-reset',
    category: 'relax-mind',
    kind: 'video',
    listMinutes: 10,
    options: {},
    video: { youtubeId: 'O-6f5wQXSu8', seconds: 600 },
  },
  { id: 'grounding-practice', category: 'relax-mind', kind: 'video', listMinutes: 5, options: {} },

  {
    id: 'grounding',
    category: 'mindfulness',
    kind: 'audio',
    listMinutes: 25,
    durations: [5, 10, 25],
    defaultDuration: 25,
    options: { sound: 'birds', voice: true },
  },
  {
    id: 'mindful-focus',
    category: 'mindfulness',
    kind: 'audio',
    listMinutes: 7,
    durations: [5, 10, 25],
    defaultDuration: 5,
    options: { sound: 'birds', voice: true },
  },
  {
    id: 'soothing-melodies',
    category: 'mindfulness',
    kind: 'audio',
    listMinutes: 9,
    durations: [5, 10, 25],
    defaultDuration: 10,
    options: { sound: 'zen', voice: true },
  },
  {
    id: 'sound-therapy',
    category: 'mindfulness',
    kind: 'audio',
    listMinutes: 10,
    durations: [5, 10, 25],
    defaultDuration: 10,
    options: { sound: 'stream', voice: true },
  },
  {
    id: 'deep-focus',
    category: 'mindfulness',
    kind: 'audio',
    listMinutes: 10,
    durations: [5, 10, 25],
    defaultDuration: 10,
    options: { sound: 'stream', voice: true },
  },

  {
    id: 'sleep-sounds',
    category: 'sleep',
    kind: 'sleep',
    listMinutes: 20,
    durations: [10, 20, 45],
    defaultDuration: 20,
    options: { sound: 'rain', fadeOut: true, voice: false },
  },
  {
    id: 'quiet-mind',
    category: 'sleep',
    kind: 'sleep',
    listMinutes: 10,
    durations: [10, 20, 45],
    defaultDuration: 10,
    options: { sound: 'rain', fadeOut: true, voice: false },
  },
  {
    id: 'bedtime-breathing',
    category: 'sleep',
    kind: 'sleep',
    listMinutes: 6,
    patternLabel: '4 · 6',
    pattern: { inhale: 4, hold: 0, exhale: 6, holdAfter: 0 },
    durations: [10, 20, 45],
    defaultDuration: 10,
    options: { sound: 'rain', fadeOut: true, voice: false },
  },
  {
    id: 'deep-sleep',
    category: 'sleep',
    kind: 'sleep',
    listMinutes: 25,
    durations: [10, 20, 45],
    defaultDuration: 45,
    options: { sound: 'ocean', fadeOut: true, voice: false },
  },
];

/** Practices people can open: everything except Relax videos still waiting for a video. */
export const PRACTICES = CATALOGUE.filter((p) => p.kind !== 'video' || !!p.video);

export function practiceById(id: string | undefined): Practice | undefined {
  return PRACTICES.find((p) => p.id === id);
}

/** Row icon and bubble tint per category (07 §2.2). */
export const CATEGORY_LOOK: Record<
  PracticeCategory,
  { icon: IconName; tint: string; thumb: string }
> = {
  breathing: { icon: 'line/leaf', tint: 'rgba(127,198,241,0.35)', thumb: '#E6F2FB' },
  'relax-body': { icon: 'line/activity', tint: 'rgba(226,204,64,0.35)', thumb: '#FAF3D6' },
  'relax-mind': { icon: 'line/chat', tint: 'rgba(226,204,64,0.35)', thumb: '#FAF3D6' },
  mindfulness: { icon: 'line/meditate', tint: 'rgba(107,82,121,0.18)', thumb: '#EFE8F4' },
  sleep: { icon: 'line/moon', tint: 'rgba(216,180,216,0.35)', thumb: '#FDEDF0' },
};
