import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | 'mood_logged'
  | 'sleep_logged'
  | 'journal_entry'
  | 'suggestion_completed'
  | 'stress_exercise'
  | 'mindfulness_session'
  | 'score_improved'
  | 'score_declined'
  | 'streak_milestone'
  | 'weekly_summary'
  | 'new_suggestions'
  | 'welcome';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  emoji: string;
  color: string;
  read: boolean;
  createdAt: string; // ISO string
  /** Optional metadata for deep linking */
  meta?: Record<string, string | number>;
}

/* ------------------------------------------------------------------ */
/*  Type metadata — emoji + color per notification type                 */
/* ------------------------------------------------------------------ */

export const NOTIF_TYPE_META: Record<
  NotificationType,
  { emoji: string; color: string; label: string }
> = {
  mood_logged: { emoji: '😊', color: '#5AAF8B', label: 'Mood' },
  sleep_logged: { emoji: '🌙', color: '#7E57C2', label: 'Sleep' },
  journal_entry: { emoji: '📝', color: '#E8985A', label: 'Journal' },
  suggestion_completed: { emoji: '✅', color: '#5AAF8B', label: 'Activity' },
  stress_exercise: { emoji: '🌬️', color: '#42A5F5', label: 'Stress' },
  mindfulness_session: { emoji: '🧘', color: '#5B8A5A', label: 'Mindfulness' },
  score_improved: { emoji: '📈', color: '#5AAF8B', label: 'Score' },
  score_declined: { emoji: '📉', color: '#E8985A', label: 'Score' },
  streak_milestone: { emoji: '🔥', color: '#FF9800', label: 'Streak' },
  weekly_summary: { emoji: '📊', color: '#8B6B47', label: 'Summary' },
  new_suggestions: { emoji: '✨', color: '#7E57C2', label: 'Suggestions' },
  welcome: { emoji: '👋', color: '#5B8A5A', label: 'Welcome' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'app:notifications';

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export { timeAgo };

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface NotificationStore {
  notifications: AppNotification[];
  isLoaded: boolean;

  /** Load persisted notifications from AsyncStorage */
  load: () => Promise<void>;

  /** Add a new notification to the top of the list */
  push: (
    type: NotificationType,
    title: string,
    body: string,
    meta?: Record<string, string | number>,
  ) => void;

  /** Mark a single notification as read */
  markRead: (id: string) => void;

  /** Mark all notifications as read */
  markAllRead: () => void;

  /** Remove a single notification */
  remove: (id: string) => void;

  /** Clear all notifications */
  clearAll: () => void;

  /** Get unread count */
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AppNotification[] = JSON.parse(raw);
        // Keep only last 50 notifications
        set({ notifications: parsed.slice(0, 50), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  push: (type, title, body, meta) => {
    const typeMeta = NOTIF_TYPE_META[type];
    const notification: AppNotification = {
      id: generateId(),
      type,
      title,
      body,
      emoji: typeMeta.emoji,
      color: typeMeta.color,
      read: false,
      createdAt: new Date().toISOString(),
      meta,
    };

    set((state) => {
      const updated = [notification, ...state.notifications].slice(0, 50);
      // Persist asynchronously
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { notifications: updated };
    });
  },

  markRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { notifications: updated };
    });
  },

  markAllRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { notifications: updated };
    });
  },

  remove: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { notifications: updated };
    });
  },

  clearAll: () => {
    set({ notifications: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));

/* ------------------------------------------------------------------ */
/*  Convenience notification generators                                */
/*  Call these from your hooks / screens when actions happen.           */
/* ------------------------------------------------------------------ */

/** Call when user logs a mood check-in */
export function notifyMoodLogged(mood: string) {
  const moodEmojis: Record<string, string> = {
    great: '😄',
    good: '😊',
    okay: '😐',
    low: '😟',
    bad: '😢',
  };
  const emoji = moodEmojis[mood.toLowerCase()] ?? '😊';
  useNotificationStore.getState().push(
    'mood_logged',
    `Mood logged: ${mood} ${emoji}`,
    `Great job checking in! Consistent tracking helps you understand your patterns better.`,
    { mood },
  );
}

/** Call when user logs a sleep entry */
export function notifySleepLogged(durationHours: number, quality: number) {
  const qualityLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const qualityLabel = qualityLabels[quality] ?? 'Unknown';
  const hrs = durationHours.toFixed(1);
  useNotificationStore.getState().push(
    'sleep_logged',
    `Sleep recorded: ${hrs}h`,
    `Quality: ${qualityLabel}. ${
      quality >= 4
        ? 'Well rested! Keep up the good sleep habits.'
        : quality >= 3
          ? 'Decent rest. Small changes can make a big difference.'
          : 'Getting more sleep could really boost your wellbeing.'
    }`,
    { duration: durationHours, quality },
  );
}

/** Call when user creates a journal entry */
export function notifyJournalEntry(entryTitle?: string, totalEntries?: number) {
  const title = entryTitle ? `Journal: "${entryTitle}"` : 'Journal entry saved';
  const countMsg = totalEntries
    ? ` You've written ${totalEntries} entries total.`
    : '';
  useNotificationStore.getState().push(
    'journal_entry',
    title,
    `Writing is a powerful form of self-care.${countMsg} Keep reflecting!`,
    { totalEntries: totalEntries ?? 0 },
  );
}

/** Call when user completes an AI suggestion */
export function notifySuggestionCompleted(
  suggestionTitle: string,
  points: number,
  category: string,
) {
  useNotificationStore.getState().push(
    'suggestion_completed',
    `Activity done: ${suggestionTitle}`,
    `+${points} points earned! Your ${category} score is improving.`,
    { points, category },
  );
}

/** Call when user completes a stress exercise */
export function notifyStressExercise(exerciseTitle: string) {
  useNotificationStore.getState().push(
    'stress_exercise',
    `${exerciseTitle} completed`,
    'Great job managing your stress. Your body and mind will thank you.',
    { exercise: exerciseTitle },
  );
}

/** Call when user completes a mindfulness session */
export function notifyMindfulnessSession(minutes: number) {
  useNotificationStore.getState().push(
    'mindfulness_session',
    `${minutes} minutes of mindfulness`,
    `${
      minutes >= 10
        ? 'Wonderful session! Regular practice builds lasting calm.'
        : 'Every minute counts. Consistency matters more than duration.'
    }`,
    { minutes },
  );
}

/** Call when Freud Score changes significantly */
export function notifyScoreChange(newScore: number, previousScore: number) {
  const diff = newScore - previousScore;
  if (Math.abs(diff) < 3) return; // Don't notify for tiny changes

  if (diff > 0) {
    useNotificationStore.getState().push(
      'score_improved',
      `Freud Score: ${previousScore} → ${newScore}`,
      `Up ${diff} points! Your mental wellbeing is trending in the right direction.`,
      { newScore, previousScore },
    );
  } else {
    useNotificationStore.getState().push(
      'score_declined',
      `Freud Score: ${previousScore} → ${newScore}`,
      `Down ${Math.abs(diff)} points. Remember, fluctuations are normal. Try an AI suggestion to help.`,
      { newScore, previousScore },
    );
  }
}

/** Call when user hits a streak milestone */
export function notifyStreakMilestone(days: number) {
  useNotificationStore.getState().push(
    'streak_milestone',
    `${days}-day streak!`,
    `You've been consistent for ${days} days in a row. That's dedication!`,
    { days },
  );
}

/** Call when new AI suggestions are generated */
export function notifyNewSuggestions(count: number) {
  useNotificationStore.getState().push(
    'new_suggestions',
    `${count} new suggestions ready`,
    'Fresh AI-powered activities tailored to your current mental health state.',
    { count },
  );
}
