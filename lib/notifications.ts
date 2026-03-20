import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BEDTIME_NOTIF_IDS_KEY = 'bedtime-notification-ids';
const BEDTIME_REMINDER_MINUTES = 30; // remind 30 min before bedtime

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
