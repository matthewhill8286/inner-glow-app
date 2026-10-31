import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { cancelWakeUpAlarms } from '@/lib/notifications';

type AlarmModule = {
  isSupported(): boolean;
  status(): Promise<'authorized' | 'denied' | 'notDetermined' | 'unsupported'>;
  schedule(hour: number, minute: number, days: number[]): Promise<void>;
  cancel(): Promise<void>;
  test(): Promise<void>;
};
const native =
  Platform.OS === 'ios' ? requireOptionalNativeModule<AlarmModule>('InnerGlowAlarm') : null;
export const ringingAlarmsSupported = () => native?.isSupported() === true;
const weekdays: Record<string, number> = { Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7 };
export async function saveWakeAlarm(options: {
  enabled: boolean;
  wakeHour: number;
  wakeMin: number;
  selectedDays: string[];
}) {
  if (options.enabled) {
    if (!ringingAlarmsSupported())
      throw new Error('Ringing wake-up alarms require the updated iPhone app on iOS 26 or later.');
    const days = [...new Set(options.selectedDays)].map((day) => weekdays[day]);
    if (!days.length || days.some((day) => !day))
      throw new Error('Choose at least one repeat day for your wake-up alarm.');
    await native!.schedule(options.wakeHour, options.wakeMin, days);
  } else {
    await native?.cancel();
  }
  // Retire the old notification-based alarms and automatic snooze bursts.
  await cancelWakeUpAlarms();
}
export async function testWakeAlarm() {
  if (!ringingAlarmsSupported())
    throw new Error('Ringing alarms require the updated iPhone app on iOS 26 or later.');
  await native!.test();
}
export async function wakeAlarmPermission() {
  return native ? native.status() : 'unsupported';
}
