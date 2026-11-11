import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { eventsPerDay } from '@/lib/calendar-busy';

const KEY = 'calendar:connected:v1';
const DAYS = 30;

/** Connect, disconnect and read event counts for the last 30 days. Nothing is written or stored remotely. */
export function useCalendarBusy() {
  const [connected, setConnected] = useState(false);
  const [perDay, setPerDay] = useState<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const end = new Date();
    const start = new Date(end.getTime() - DAYS * 86_400_000);
    const events = await Calendar.getEventsAsync(
      calendars.map((c) => c.id),
      start,
      end,
    );
    setPerDay(eventsPerDay(events));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let live = true;
    void (async () => {
      const on = (await AsyncStorage.getItem(KEY).catch(() => null)) === '1';
      const perm = on ? await Calendar.getCalendarPermissionsAsync() : null;
      if (!live) return;
      setConnected(on && !!perm?.granted);
      if (on && perm?.granted) await load().catch(() => undefined);
    })();
    return () => {
      live = false;
    };
  }, [load]);

  const connect = async (): Promise<'ok' | 'denied'> => {
    const perm = await Calendar.requestCalendarPermissionsAsync();
    if (!perm.granted) return 'denied';
    await AsyncStorage.setItem(KEY, '1').catch(() => undefined);
    setConnected(true);
    await load().catch(() => undefined);
    return 'ok';
  };

  const disconnect = async () => {
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
    setConnected(false);
    setPerDay(new Map());
  };

  return { connected, perDay, connect, disconnect, available: Platform.OS !== 'web' };
}
