import type {
  MoodCheckIn,
  JournalEntry,
  SleepEntry,
  MindfulEntry,
  StressCompletion,
} from './types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FreudLabel =
  | 'Critically Low'
  | 'Very Low'
  | 'Low'
  | 'Below Average'
  | 'Average'
  | 'Above Average'
  | 'Good'
  | 'Very Good'
  | 'Mentally Stable'
  | 'Excellent';

export type FreudBreakdown = {
  mood: number;
  sleep: number;
  stress: number;
  mindfulness: number;
  consistency: number;
  journal: number;
};

export type FreudScoreResult = {
  score: number;
  label: FreudLabel;
  breakdown: FreudBreakdown;
};

export type FreudScoreRecord = {
  id: string;
  score: number;
  label: string;
  breakdown: FreudBreakdown;
  source: string;
  createdAt: string;
};

export type AISuggestion = {
  id: string;
  freudScoreId: string | null;
  templateId: string | null;
  category: 'mindfulness' | 'physical' | 'social' | 'professional';
  title: string;
  description: string | null;
  duration: string | null;
  completed: boolean;
  completedAt: string | null;
  points: number;
  difficulty: string | null;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/*  Label mapping                                                      */
/* ------------------------------------------------------------------ */

export function getFreudLabel(score: number): FreudLabel {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Mentally Stable';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Above Average';
  if (score >= 40) return 'Average';
  if (score >= 30) return 'Below Average';
  if (score >= 20) return 'Low';
  if (score >= 10) return 'Very Low';
  return 'Critically Low';
}

/* ------------------------------------------------------------------ */
/*  Score colour (for UI)                                              */
/* ------------------------------------------------------------------ */

export function getFreudColor(score: number): string {
  if (score >= 80) return '#5AAF8B'; // green
  if (score >= 60) return '#8BC34A'; // light green
  if (score >= 40) return '#FFC107'; // amber
  if (score >= 20) return '#FF9800'; // orange
  return '#F44336'; // red
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Clamp a value to the 0-100 range */
function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/* ------------------------------------------------------------------ */
/*  Core calculation                                                   */
/* ------------------------------------------------------------------ */

export function calculateFreudScore(data: {
  moodCheckIns?: MoodCheckIn[];
  journalEntries?: JournalEntry[];
  sleepEntries?: SleepEntry[];
  mindfulnessHistory?: MindfulEntry[];
  stressHistory?: StressCompletion[];
}): FreudScoreResult {
  const moods = data.moodCheckIns ?? [];
  const journals = data.journalEntries ?? [];
  const sleeps = data.sleepEntries ?? [];
  const mindful = data.mindfulnessHistory ?? [];
  const stress = data.stressHistory ?? [];

  // --- 1. Mood sub-score (0-100) — weighted average of recent mood_scores ---
  let moodScore = 0;
  if (moods.length > 0) {
    const recent = moods.slice(0, 14); // last 14 check-ins
    const moodMap: Record<string, number> = { Great: 100, Good: 80, Okay: 60, Low: 35, Bad: 10 };
    const avg = recent.reduce((sum, m) => sum + (moodMap[m.mood] ?? 50), 0) / recent.length;
    moodScore = clamp(Math.round(avg));
  }

  // --- 2. Sleep sub-score (0-100) — average quality mapped to 0-100 ---
  let sleepScore = 0;
  if (sleeps.length > 0) {
    const recent = sleeps.slice(0, 14);
    const withQuality = recent.filter((s) => s.quality != null && s.quality > 0);
    if (withQuality.length > 0) {
      const avg = withQuality.reduce((sum, s) => sum + (s.quality ?? 3), 0) / withQuality.length;
      // Normalize: quality stored as 1-5 → 20-100, but guard against values > 5
      const normalized = Math.min(avg, 5);
      sleepScore = clamp(Math.round(normalized * 20));
    }
  }

  // --- 3. Stress sub-score (0-100) — inverse of avg stress, boosted by relief activities ---
  let stressScore = 40; // default middle-ground
  if (moods.length > 0) {
    const recent = moods.slice(0, 14);
    const avgStress = recent.reduce((sum, m) => sum + (m.stress ?? 5), 0) / recent.length;
    stressScore = clamp(Math.round(Math.max(0, 100 - avgStress * 10))); // stress 0-10 → 100-0
    // Bonus for stress-relief activities in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recentActivities = stress.filter((s) => s.date >= weekAgo).length;
    stressScore = clamp(stressScore + Math.min(recentActivities * 3, 15));
  }

  // --- 4. Mindfulness sub-score (0-100) — based on sessions per week & duration ---
  let mindfulnessScore = 0;
  if (mindful.length > 0) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thisWeek = mindful.filter((m) => m.dateISO >= weekAgo);
    const sessionCount = Math.min(thisWeek.length, 7); // cap at 7
    const totalMinutes = thisWeek.reduce((sum, m) => sum + m.seconds / 60, 0);
    const frequencyScore = (sessionCount / 5) * 60; // 5 sessions/week = 60 pts
    const durationScore = Math.min(totalMinutes / 50, 1) * 40; // 50 min/week = 40 pts
    mindfulnessScore = clamp(Math.round(frequencyScore + durationScore));
  }

  // --- 5. Consistency sub-score (0-100) — how regularly user engages ---
  // Use a 14-day window and count ALL activity types (mood, journal, sleep, mindfulness, stress)
  const last14 = new Date(Date.now() - 14 * 86400000).toISOString();
  const last7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentMoods = moods.filter((m) => m.createdAt >= last14).length;
  const recentJournals = journals.filter((j) => j.createdAt >= last14).length;
  const recentSleeps = sleeps.filter((s) => s.createdAtISO >= last14).length;
  const recentMindful = mindful.filter((m) => m.dateISO >= last14).length;
  const recentStress = stress.filter((s) => s.date >= last14).length;
  const uniqueActiveDays = new Set([
    ...moods.filter((m) => m.createdAt >= last14).map((m) => m.createdAt.slice(0, 10)),
    ...journals.filter((j) => j.createdAt >= last14).map((j) => j.createdAt.slice(0, 10)),
    ...sleeps.filter((s) => s.createdAtISO >= last14).map((s) => s.createdAtISO.slice(0, 10)),
    ...mindful.filter((m) => m.dateISO >= last14).map((m) => m.dateISO.slice(0, 10)),
    ...stress.filter((s) => s.date >= last14).map((s) => s.date.slice(0, 10)),
  ]).size;
  const totalRecentActivities = recentMoods + recentJournals + recentSleeps + recentMindful + recentStress;
  const consistencyScore = clamp(
    Math.round(
      (uniqueActiveDays / 14) * 60 + // active days out of 14
      Math.min(totalRecentActivities * 3, 30) + // bonus for total activity count
      (moods.length > 0 ? 5 : 0) + // baseline bonus for having any mood data
      (sleeps.length > 0 ? 5 : 0), // baseline bonus for having any sleep data
    ),
  );

  // --- 6. Journal sub-score (0-100) — entries & depth (14-day window) ---
  let journalScore = 0;
  if (journals.length > 0) {
    const recentEntries = journals.filter((j) => j.createdAt >= last14);
    const thisWeek = journals.filter((j) => j.createdAt >= last7);
    // Use whichever window has more entries for a fairer score
    const entries = recentEntries.length > thisWeek.length ? recentEntries : thisWeek;
    const countScore = Math.min(entries.length, 7) * 10; // 7 entries = 70 pts
    const avgLength =
      entries.length > 0
        ? entries.reduce((sum, j) => sum + (j.content?.length ?? 0), 0) / entries.length
        : 0;
    const depthScore = Math.min(avgLength / 200, 1) * 30; // 200+ chars = 30 pts
    journalScore = clamp(Math.round(countScore + depthScore));
    // If user has older journal entries but none recently, give a small base score
    if (journalScore === 0 && journals.length > 0) {
      journalScore = Math.min(journals.length * 2, 15); // up to 15 pts for having any entries
    }
  }

  // --- Weighted total ---
  const weights = {
    mood: 0.25,
    sleep: 0.2,
    stress: 0.2,
    mindfulness: 0.15,
    consistency: 0.1,
    journal: 0.1,
  };

  const total = Math.round(
    moodScore * weights.mood +
      sleepScore * weights.sleep +
      stressScore * weights.stress +
      mindfulnessScore * weights.mindfulness +
      consistencyScore * weights.consistency +
      journalScore * weights.journal,
  );
  const score = Math.max(0, Math.min(100, total));

  return {
    score,
    label: getFreudLabel(score),
    breakdown: {
      mood: moodScore,
      sleep: sleepScore,
      stress: stressScore,
      mindfulness: mindfulnessScore,
      consistency: consistencyScore,
      journal: journalScore,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Initial score from assessment (onboarding)                         */
/* ------------------------------------------------------------------ */

const MOOD_SCORE_MAP: Record<string, number> = {
  Happy: 90,
  Calm: 82,
  Hopeful: 78,
  Neutral: 55,
  Tired: 42,
  Anxious: 30,
  Sad: 22,
  Angry: 18,
};

/**
 * Derive an initial Freud Score from the onboarding assessment answers.
 * Called once right after the user completes the assessment, before any
 * tracking data exists.
 */
export function calculateInitialFreudScore(assessment: {
  mood?: string | null;
  sleepQuality?: number | null;
  stressLevel?: number | null;
  soundCheck?: { metrics?: { wpm?: number } } | null;
  goal?: string | null;
}): FreudScoreResult {
  // Mood: map the selected mood label to a 0-100 score
  const moodScore = clamp(MOOD_SCORE_MAP[assessment.mood ?? ''] ?? 50);

  // Sleep: quality is 1-5, map to 0-100  (1→20, 2→40, 3→60, 4→80, 5→100)
  const sleepScore = assessment.sleepQuality != null
    ? clamp(assessment.sleepQuality * 20)
    : 0;

  // Stress: stressLevel is 0-10 (0=none, 10=extreme), invert to 0-100
  const stressScore = assessment.stressLevel != null
    ? clamp(100 - assessment.stressLevel * 10)
    : 40;

  // Mindfulness: no sessions yet
  const mindfulnessScore = 0;

  // Consistency: baseline for completing the full assessment
  const consistencyScore = 40;

  // Journal: seed from voice check word-count, or baseline from completing assessment
  let journalScore = 0;
  if (assessment.soundCheck?.metrics?.wpm) {
    // Voice check gives a proxy for verbal expression; scale wpm 80-160 → 30-70
    const wpm = assessment.soundCheck.metrics.wpm;
    journalScore = clamp(Math.round(((wpm - 60) / 120) * 60 + 20));
  } else if (assessment.goal) {
    // Even without voice, having a goal shows engagement
    journalScore = 25;
  }

  const weights = {
    mood: 0.25,
    sleep: 0.2,
    stress: 0.2,
    mindfulness: 0.15,
    consistency: 0.1,
    journal: 0.1,
  };

  const total = Math.round(
    moodScore * weights.mood +
    sleepScore * weights.sleep +
    stressScore * weights.stress +
    mindfulnessScore * weights.mindfulness +
    consistencyScore * weights.consistency +
    journalScore * weights.journal,
  );
  const score = clamp(total);

  return {
    score,
    label: getFreudLabel(score),
    breakdown: {
      mood: moodScore,
      sleep: sleepScore,
      stress: stressScore,
      mindfulness: mindfulnessScore,
      consistency: consistencyScore,
      journal: journalScore,
    },
  };
}
