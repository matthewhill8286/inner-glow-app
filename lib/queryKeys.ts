/**
 * Centralised query-key factory.
 *
 * Every query / mutation in the app should reference keys from here so that
 * invalidation, optimistic updates and cache reads are always consistent.
 *
 * Pattern:
 *   queryKeys.mood.list(userId)   → ['moodCheckIns', userId]
 *   queryKeys.mood.all            → ['moodCheckIns']          (for broad invalidation)
 */

export const queryKeys = {
  mood: {
    all: ['moodCheckIns'] as const,
    list: (userId?: string) => ['moodCheckIns', userId] as const,
  },
  sleep: {
    all: ['sleepEntries'] as const,
    list: (userId?: string) => ['sleepEntries', userId] as const,
  },
  journal: {
    all: ['journalEntries'] as const,
    list: (userId?: string) => ['journalEntries', userId] as const,
  },
  stress: {
    allKit: ['stressKit'] as const,
    kit: (userId?: string) => ['stressKit', userId] as const,
    allHistory: ['stressHistory'] as const,
    history: (userId?: string) => ['stressHistory', userId] as const,
  },
  mindfulness: {
    all: ['mindfulnessHistory'] as const,
    list: (userId?: string) => ['mindfulnessHistory', userId] as const,
  },
  freudScore: {
    all: ['freudScores'] as const,
    list: (userId?: string) => ['freudScores', userId] as const,
    todayBest: (userId?: string) => ['freudScoreTodayBest', userId] as const,
  },
  suggestions: {
    all: ['aiSuggestions'] as const,
    list: (userId?: string) => ['aiSuggestions', userId] as const,
  },
  activityStats: {
    all: ['activityStats'] as const,
    list: (userId?: string) => ['activityStats', userId] as const,
  },
  chat: {
    all: ['chatHistories'] as const,
    list: (userId?: string) => ['chatHistories', userId] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: (userId?: string) => ['profile', userId] as const,
  },
  assessment: {
    all: ['assessment'] as const,
    detail: (userId?: string) => ['assessment', userId] as const,
  },
  community: {
    feed: ['communityFeed'] as const,
    post: (postId?: string) => ['communityPost', postId] as const,
    notifs: ['communityNotifs'] as const,
    myProfile: ['myProfile'] as const,
    profile: (userId?: string) => ['communityProfile', userId] as const,
  },
} as const;

/** Shared stale-time presets (ms) */
export const STALE = {
  /** Data that rarely changes (profile, assessment) */
  long: 5 * 60 * 1000, // 5 min
  /** Data that updates moderately (scores, suggestions) */
  medium: 60 * 1000, // 1 min
  /** Data that updates often (mood, sleep, journal logs) */
  short: 30 * 1000, // 30 s
} as const;
