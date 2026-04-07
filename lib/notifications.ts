import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BEDTIME_NOTIF_IDS_KEY = 'bedtime-notification-ids';
const WAKEUP_NOTIF_IDS_KEY = 'wakeup-notification-ids';
const BEDTIME_REMINDER_MINUTES = 30; // remind 30 min before bedtime
const SNOOZE_INTERVAL_MINUTES = 5; // minutes between snooze alarms

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  data: any = {},
  trigger: Notifications.NotificationTriggerInput = null,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger,
  });
}

/* ── Bedtime reminder notifications ───────────────────────────── */

const DAY_MAP: Record<string, number> = {
  Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7,
};

/**
 * Cancel all previously scheduled bedtime reminders.
 */
export async function cancelBedtimeReminders() {
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
  const { sleepHour, sleepMin, selectedDays } = opts;

  // Always clear previous reminders first
  await cancelBedtimeReminders();

  if (selectedDays.length === 0) return;

  // Calculate the reminder time (30 min before bedtime)
  let reminderHour = sleepHour;
  let reminderMin = sleepMin - BEDTIME_REMINDER_MINUTES;
  if (reminderMin < 0) {
    reminderMin += 60;
    reminderHour = (reminderHour - 1 + 24) % 24;
  }

  const ids: string[] = [];

  for (const day of selectedDays) {
    const weekday = DAY_MAP[day];
    if (!weekday) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bedtime in 30 minutes',
          body: 'Time to start winding down. A good night\'s sleep makes all the difference.',
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
      console.warn(`[Bedtime] Failed to schedule for ${day}:`, err);
    }
  }

  // Persist IDs so we can cancel them later
  await AsyncStorage.setItem(BEDTIME_NOTIF_IDS_KEY, JSON.stringify(ids));

  return ids;
}

/* ── Wake-up alarm notifications ─────────────────────────────── */

/**
 * Cancel all previously scheduled wake-up alarms.
 */
export async function cancelWakeUpAlarms() {
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
  const { wakeHour, wakeMin, selectedDays, snoozeCount } = opts;

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
            body: s === snoozeCount
              ? 'Last snooze! Time to get up.'
              : 'Still time for a stretch — but don\'t fall back asleep!',
            data: { type: 'wakeup_snooze', snoozeNumber: s, route: '/(tabs)/sleep' },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
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

  return ids;
}
