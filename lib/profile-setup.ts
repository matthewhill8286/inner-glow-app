import { suggestWithReasons } from './suggestCategories';

/**
 * Profile setup (docs/design-handoff/02 §4–5, 10 §3.3): the steps, the check-in time presets,
 * the birthday field, the biometric wording and the topics saved when setup finishes.
 */

export type ProfileStep = 'profile' | 'checkin' | 'notifications' | 'privacy';

/** P4 only appears on phones with biometrics enrolled. */
export function profileSteps(hasBiometrics: boolean): ProfileStep[] {
  return ['profile', 'checkin', 'notifications', ...(hasBiometrics ? (['privacy'] as const) : [])];
}

/* ── P2 check-in time ─────────────────────────────────────────────────────────────── */

export type CheckinSlot = 'morning' | 'afternoon' | 'evening';
export const CHECKIN_PRESETS: Record<CheckinSlot, string> = { morning: '08:30', afternoon: '14:00', evening: '21:00' };
export const DEFAULT_CHECKIN_TIME = CHECKIN_PRESETS.evening;

/** The preset a time matches exactly, so its chip shows selected; a custom time selects none. */
export function presetForTime(time: string): CheckinSlot | null {
  return (Object.keys(CHECKIN_PRESETS) as CheckinSlot[]).find((slot) => CHECKIN_PRESETS[slot] === time) ?? null;
}

/** The caption under the time: "every morning" before 12:00, "every afternoon" before 17:00, then evening. */
export function slotForTime(time: string): CheckinSlot {
  const hour = Number(time.split(':')[0]);
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

export function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/* ── P1 birthday ──────────────────────────────────────────────────────────────────── */

/** Masks typed digits as "DD / MM / YYYY" (the order Figma shows for the UK and Cyprus). */
export function maskBirthday(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join(' / ');
}

/** "14 / 05 / 1990" → "1990-05-14"; null when incomplete, impossible, in the future or before 1900. */
export function parseBirthday(masked: string, today = new Date()): string | null {
  const digits = masked.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (year < 1900 || date.getTime() > todayUtc) return null;
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

/** "1990-05-14" → "14 / 05 / 1990", for showing a saved birthday in the field. */
export function birthdayToInput(iso: string | null | undefined): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]} / ${m[2]} / ${m[1]}` : '';
}

export function ageOn(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

/* ── P4 biometrics ────────────────────────────────────────────────────────────────── */

/** expo-local-authentication's AuthenticationType values. */
const FINGERPRINT = 1;
const FACIAL_RECOGNITION = 2;

export type BiometricKind = 'faceId' | 'touchId' | 'fingerprintOrFace' | 'fingerprint' | 'face';

/** iOS names the feature (Face ID, Touch ID); Android uses the plain words from 99 §0. */
export function biometricKind(types: number[], os: 'ios' | 'android' | string): BiometricKind {
  const face = types.includes(FACIAL_RECOGNITION);
  const finger = types.includes(FINGERPRINT);
  if (os === 'ios') return face ? 'faceId' : 'touchId';
  if (face && finger) return 'fingerprintOrFace';
  return face ? 'face' : 'fingerprint';
}

/* ── P3 notifications ─────────────────────────────────────────────────────────────── */

export const NOTIFICATION_CHOICES = ['glow_ai_messages', 'journal_reminder', 'weekly_summary'] as const;
export type NotificationChoice = (typeof NOTIFICATION_CHOICES)[number];
export const DEFAULT_NOTIFICATION_PREFS: Record<NotificationChoice, boolean> = {
  glow_ai_messages: true,
  journal_reminder: true,
  weekly_summary: false,
};

/* ── Finishing setup ──────────────────────────────────────────────────────────────── */

/**
 * The three topics the old "suggested categories" screen pre-selected, worked out from the
 * assessment so Home and suggestions keep their focus without that screen.
 */
const MOOD_HINTS: Record<string, string> = { Tense: 'anxious', Low: 'down' };

export function suggestedIssues(assessment: { mood?: string | null; stressBand?: number | null; sleepQuality?: number | null } | null): string[] {
  if (!assessment) return [];
  return suggestWithReasons({
    // The suggestions match the older mood words, so the 1–5 scale's low ends are given theirs.
    mood: MOOD_HINTS[assessment.mood ?? ''] ?? assessment.mood,
    // The suggestions read stress on the 0–10 scale.
    stress: assessment.stressBand != null ? assessment.stressBand * 2 : undefined,
    sleep: assessment.sleepQuality ?? undefined,
  })
    .slice(0, 3)
    .map((s) => s.key);
}
