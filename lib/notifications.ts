import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inQuietHours, triggerPlan, type ReminderSchedule } from './reminder-schedule';

const BEDTIME_NOTIF_IDS_KEY = 'bedtime-notification-ids';
const WAKEUP_NOTIF_IDS_KEY = 'wakeup-notification-ids';
const BEDTIME_REMINDER_MINUTES = 30; // remind 30 min before bedtime
const SNOOZE_INTERVAL_MINUTES = 5; // minutes between snooze alarms

export function configureNotificationPresentation() {
  if (Platform.OS === 'web') return;
  void loadDeliveryPrefs();
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      // Quiet hours (06 P4) hold back banners and sound while the app is open; scheduled reminders in
      // that window are not scheduled at all.
      const prefs = deliveryCache;
      const now = new Date();
      const quiet =
        prefs.quietHours.enabled &&
        inQuietHours(now.getHours(), now.getMinutes(), prefs.quietHours.from, prefs.quietHours.to);
      return {
        shouldShowBanner: !quiet,
        shouldShowList: true,
        shouldPlaySound: prefs.sound && !quiet,
        shouldSetBadge: false,
      };
    },
  });
}

export async function notificationPermission() {
  if (Platform.OS === 'web') return false;
  const permission = await Notifications.getPermissionsAsync();
  return (
    permission.granted ||
    permission.status === 'granted' ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Inner Glow reminders',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: deliveryCache.vibration,
      vibrationPattern: deliveryCache.vibration ? [0, 250, 150, 250] : [0],
    });
  }
  if (await notificationPermission()) return true;
  const permission = await Notifications.requestPermissionsAsync();
  return (
    permission.granted ||
    permission.status === 'granted' ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function requireNotificationPermission() {
  if (!(await registerForPushNotificationsAsync()))
    throw new Error(
      'Notifications are disabled. Enable Inner Glow notifications in your phone Settings.',
    );
}

export async function scheduleNotification(
  title: string,
  body: string,
  data: any = {},
  trigger: Notifications.NotificationTriggerInput = null,
) {
  if (Platform.OS === 'web') return null;
  await requireNotificationPermission();
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: deliveryCache.sound ? 'default' : false,
    },
    trigger,
  });
}

/* ── Bedtime reminder notifications ───────────────────────────── */

const DAY_MAP: Record<string, number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

/**
 * Cancel all previously scheduled bedtime reminders.
 */
export async function cancelBedtimeReminders() {
  if (Platform.OS === 'web') return;
  try {
    const raw = await AsyncStorage.getItem(BEDTIME_NOTIF_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await AsyncStorage.removeItem(BEDTIME_NOTIF_IDS_KEY);
  } catch (err) {
    console.warn('[Bedtime] Failed to cancel reminders:', err);
  }
}

/**
 * Schedule repeating bedtime reminder notifications.
 *
 * Schedules one weekly notification per selected day, firing
 * 30 minutes before the chosen bedtime.
 */
export async function scheduleBedtimeReminders(opts: {
  sleepHour: number;
  sleepMin: number;
  selectedDays: string[];
}) {
  if (Platform.OS === 'web') return [];
  const { sleepHour, sleepMin, selectedDays } = opts;
  if (selectedDays.length) await requireNotificationPermission();

  const previousIds: string[] = JSON.parse(
    (await AsyncStorage.getItem(BEDTIME_NOTIF_IDS_KEY)) || '[]',
  );
  if (selectedDays.length === 0) {
    await cancelBedtimeReminders();
    return [];
  }

  // Calculate the reminder time (30 min before bedtime)
  let reminderHour = sleepHour;
  let reminderMin = sleepMin - BEDTIME_REMINDER_MINUTES;
  if (reminderMin < 0) {
    reminderMin += 60;
    reminderHour = (reminderHour - 1 + 24) % 24;
  }

  const ids: string[] = [];

  for (const day of selectedDays) {
    const originalWeekday = DAY_MAP[day];
    const weekday =
      sleepHour === 0 && sleepMin < BEDTIME_REMINDER_MINUTES
        ? ((originalWeekday + 5) % 7) + 1
        : originalWeekday;
    if (!weekday) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bedtime in 30 minutes',
          body: "Time to start winding down. A good night's sleep makes all the difference.",
          data: { type: 'bedtime_reminder', route: '/(tabs)/sleep' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: reminderHour,
          minute: reminderMin,
        },
      });
      ids.push(id);
    } catch (err) {
      for (const id of ids) await Notifications.cancelScheduledNotificationAsync(id);
      throw err;
    }
  }

  // Persist IDs so we can cancel them later
  try {
    for (const id of previousIds) await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.setItem(BEDTIME_NOTIF_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    for (const id of ids) await Notifications.cancelScheduledNotificationAsync(id);
    throw error;
  }

  if (ids.length !== selectedDays.filter((day) => DAY_MAP[day]).length)
    throw new Error('Some bedtime reminders could not be scheduled. Please try again.');
  return ids;
}

/* ── Wake-up alarm notifications ─────────────────────────────── */

/**
 * Cancel all previously scheduled wake-up alarms.
 */
export async function cancelWakeUpAlarms() {
  if (Platform.OS === 'web') return;
  try {
    const raw = await AsyncStorage.getItem(WAKEUP_NOTIF_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await AsyncStorage.removeItem(WAKEUP_NOTIF_IDS_KEY);
  } catch (err) {
    console.warn('[WakeUp] Failed to cancel alarms:', err);
  }
}

/**
 * Schedule repeating wake-up alarm notifications with snooze support.
 *
 * Schedules one weekly notification per selected day at the chosen
 * wake-up time, plus additional snooze notifications at 5-minute
 * intervals after the initial alarm.
 */
export async function scheduleWakeUpAlarms(opts: {
  wakeHour: number;
  wakeMin: number;
  selectedDays: string[];
  snoozeCount: number;
}) {
  if (Platform.OS === 'web') return [];
  const { wakeHour, wakeMin, selectedDays, snoozeCount } = opts;
  if (selectedDays.length) await requireNotificationPermission();

  // Always clear previous alarms first
  await cancelWakeUpAlarms();

  if (selectedDays.length === 0) return;

  const ids: string[] = [];

  for (const day of selectedDays) {
    const weekday = DAY_MAP[day];
    if (!weekday) continue;

    // Main wake-up alarm
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to wake up!',
          body: 'Good morning! Rise and shine — your day is waiting.',
          data: { type: 'wakeup_alarm', route: '/(tabs)/sleep' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: wakeHour,
          minute: wakeMin,
        },
      });
      ids.push(id);
    } catch (err) {
      console.warn(`[WakeUp] Failed to schedule main alarm for ${day}:`, err);
    }

    // Snooze alarms (5-minute intervals after the main alarm)
    for (let s = 1; s <= snoozeCount; s++) {
      const dayOffset = Math.floor((wakeHour * 60 + wakeMin + s * SNOOZE_INTERVAL_MINUTES) / 1440);
      let snoozeMin = wakeMin + s * SNOOZE_INTERVAL_MINUTES;
      let snoozeHour = wakeHour;
      if (snoozeMin >= 60) {
        snoozeHour = (snoozeHour + Math.floor(snoozeMin / 60)) % 24;
        snoozeMin = snoozeMin % 60;
      }

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Snooze ${s} of ${snoozeCount}`,
            body:
              s === snoozeCount
                ? 'Last snooze! Time to get up.'
                : "Still time for a stretch — but don't fall back asleep!",
            data: { type: 'wakeup_snooze', snoozeNumber: s, route: '/(tabs)/sleep' },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: ((weekday - 1 + dayOffset) % 7) + 1,
            hour: snoozeHour,
            minute: snoozeMin,
          },
        });
        ids.push(id);
      } catch (err) {
        console.warn(`[WakeUp] Failed to schedule snooze ${s} for ${day}:`, err);
      }
    }
  }

  // Persist IDs so we can cancel them later
  await AsyncStorage.setItem(WAKEUP_NOTIF_IDS_KEY, JSON.stringify(ids));

  if (ids.length !== selectedDays.filter((day) => DAY_MAP[day]).length * (snoozeCount + 1))
    throw new Error('Some wake-up reminders could not be scheduled. Please try again.');
  return ids;
}

/* ── Reminders and delivery (06 P4, 08 §2.9) ─────────────────────────── */

const PREFERENCES_KEY = 'notification-preferences:v1';
const DELIVERY_KEY = 'notification-delivery:v1';
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

export type ReminderKey =
  | 'daily_checkin'
  | 'mindful_breaks'
  | 'sleep_winddown'
  | 'journal_reminder'
  | 'weekly_summary'
  | 'stress_alert';

const REMINDERS: Record<
  ReminderKey,
  { title: string; body: string; route: string } & ReminderSchedule
> = {
  daily_checkin: {
    title: 'Your daily check-in',
    body: 'Take a moment to notice how you feel.',
    route: '/(tabs)/mood/check-in',
    hour: 20,
    minute: 0,
    weekdays: EVERY_DAY,
  },
  mindful_breaks: {
    title: 'Pause and breathe',
    body: 'Take a short mindfulness break.',
    route: '/(tabs)/mindful',
    hour: 8,
    minute: 30,
    weekdays: EVERY_DAY,
  },
  sleep_winddown: {
    title: 'Time to wind down',
    body: 'Make room for a calmer evening.',
    route: '/(tabs)/sleep',
    hour: 22,
    minute: 0,
    weekdays: EVERY_DAY,
  },
  journal_reminder: {
    title: 'A little space to reflect',
    body: 'Write a few words about your day.',
    route: '/(tabs)/journal/new',
    hour: 20,
    minute: 30,
    weekdays: [1],
  },
  weekly_summary: {
    title: 'Your week in view',
    body: 'Reflect on your mood and wellness patterns.',
    route: '/(tabs)/home',
    hour: 18,
    minute: 0,
    weekdays: [2],
  },
  stress_alert: {
    title: 'A moment to reset',
    body: 'Try a short breathing or grounding exercise.',
    route: '/(tabs)/stress',
    hour: 18,
    minute: 0,
    weekdays: EVERY_DAY,
  },
};
const GENERIC = { title: 'Inner Glow', body: 'A gentle reminder is waiting for you.' };

type ReminderTime = { hour: number; minute: number };
type SavedReminder = {
  enabled: boolean;
  id?: string;
  ids?: string[];
  time?: ReminderTime;
  weekdays?: number[];
};
type SavedReminders = Partial<Record<string, SavedReminder>>;
export type ReminderSetting = ReminderSchedule & { enabled: boolean };

export type DeliveryPrefs = {
  sound: boolean;
  vibration: boolean;
  /** "Hide previews" (06 P5): reminders say only that something is waiting. */
  hidePreviews: boolean;
  quietHours: { enabled: boolean; from: string; to: string };
};
export const DEFAULT_DELIVERY: DeliveryPrefs = {
  sound: true,
  vibration: true,
  hidePreviews: false,
  quietHours: { enabled: false, from: '22:30', to: '07:30' },
};
let deliveryCache: DeliveryPrefs = DEFAULT_DELIVERY;

export async function loadDeliveryPrefs(): Promise<DeliveryPrefs> {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(DELIVERY_KEY)) || '{}');
    deliveryCache = {
      ...DEFAULT_DELIVERY,
      ...saved,
      quietHours: { ...DEFAULT_DELIVERY.quietHours, ...saved.quietHours },
    };
  } catch {
    deliveryCache = DEFAULT_DELIVERY;
  }
  return deliveryCache;
}

/** Saves delivery choices and reschedules reminders so sound, previews and quiet hours apply to them. */
export async function setDeliveryPrefs(patch: Partial<DeliveryPrefs>): Promise<DeliveryPrefs> {
  const next = { ...(await loadDeliveryPrefs()), ...patch };
  deliveryCache = next;
  await AsyncStorage.setItem(DELIVERY_KEY, JSON.stringify(next));
  if (
    Platform.OS === 'android' &&
    patch.vibration !== undefined &&
    (await notificationPermission())
  )
    await registerForPushNotificationsAsync();
  if (
    Platform.OS !== 'web' &&
    (patch.sound !== undefined ||
      patch.hidePreviews !== undefined ||
      patch.quietHours !== undefined)
  )
    await rescheduleReminders();
  return next;
}

async function savedReminders(): Promise<SavedReminders> {
  try {
    return JSON.parse((await AsyncStorage.getItem(PREFERENCES_KEY)) || '{}');
  } catch {
    return {};
  }
}

function settingFor(key: ReminderKey, saved?: SavedReminder): ReminderSetting {
  const d = REMINDERS[key];
  return {
    enabled: saved?.enabled === true,
    hour: saved?.time?.hour ?? d.hour,
    minute: saved?.time?.minute ?? d.minute,
    weekdays: saved?.weekdays?.length ? saved.weekdays : d.weekdays,
  };
}

export async function loadReminderSettings(): Promise<Record<ReminderKey, ReminderSetting>> {
  const saved = await savedReminders();
  return Object.fromEntries(
    (Object.keys(REMINDERS) as ReminderKey[]).map((key) => [key, settingFor(key, saved[key])]),
  ) as Record<ReminderKey, ReminderSetting>;
}

export async function loadReminderPreferences(): Promise<Record<string, boolean>> {
  const settings = await loadReminderSettings();
  return Object.fromEntries(Object.entries(settings).map(([key, s]) => [key, s.enabled]));
}

async function scheduleReminder(key: ReminderKey, setting: ReminderSetting): Promise<string[]> {
  const prefs = deliveryCache;
  if (
    prefs.quietHours.enabled &&
    inQuietHours(setting.hour, setting.minute, prefs.quietHours.from, prefs.quietHours.to)
  )
    return [];
  const reminder = REMINDERS[key];
  const text = prefs.hidePreviews ? GENERIC : reminder;
  const plan = triggerPlan(setting);
  const triggers: Notifications.NotificationTriggerInput[] = plan.daily
    ? [
        {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: setting.hour,
          minute: setting.minute,
        },
      ]
    : plan.weekdays.map((weekday) => ({
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour: setting.hour,
        minute: setting.minute,
        weekday,
      }));
  const ids: string[] = [];
  try {
    for (const trigger of triggers) {
      const id = await scheduleNotification(
        text.title,
        text.body,
        { route: reminder.route },
        trigger,
      );
      if (id) ids.push(id);
    }
  } catch (error) {
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    throw error;
  }
  return ids;
}

async function cancelSaved(saved?: SavedReminder) {
  for (const id of [...(saved?.ids ?? []), ...(saved?.id ? [saved.id] : [])])
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/**
 * Turns a reminder on or off and sets its time and days. Leaving `schedule` out keeps the saved one.
 */
export async function setReminder(
  key: ReminderKey,
  enabled: boolean,
  schedule?: Partial<ReminderSchedule>,
): Promise<ReminderSetting> {
  if (Platform.OS === 'web')
    throw new Error(
      'Phone reminders are available in the iPhone app. Your activity notifications remain available here.',
    );
  if (!REMINDERS[key]) throw new Error('Unknown reminder');
  await loadDeliveryPrefs();
  if (enabled) await requireNotificationPermission();
  const saved = await savedReminders();
  const setting = { ...settingFor(key, saved[key]), ...schedule, enabled };
  const ids = enabled ? await scheduleReminder(key, setting) : [];
  try {
    await cancelSaved(saved[key]);
    saved[key] = {
      enabled,
      ids,
      time: { hour: setting.hour, minute: setting.minute },
      weekdays: setting.weekdays,
    };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(saved));
  } catch (error) {
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    throw error;
  }
  return setting;
}

/**
 * Turns a reminder on or off. `time` overrides its default hour and minute (the daily check-in time
 * from profile setup); a saved time is kept for later toggles.
 */
export async function setReminderEnabled(key: string, enabled: boolean, time?: ReminderTime) {
  await setReminder(key as ReminderKey, enabled, time);
}

/** Re-applies every enabled reminder after a delivery change (sound, previews, quiet hours). */
async function rescheduleReminders() {
  const settings = await loadReminderSettings();
  for (const [key, setting] of Object.entries(settings) as [ReminderKey, ReminderSetting][])
    if (setting.enabled) await setReminder(key, true, setting).catch(() => undefined);
}
