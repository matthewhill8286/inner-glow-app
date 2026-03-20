import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSleep } from '@/hooks/useSleep';
import { showAlert } from '@/lib/state';
import { useRouter } from 'expo-router';

export function useSleepDetection() {
  const { sleepMode, setSleepMode } = useSleep();
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // If we are in Sleep Mode and the app comes to the foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        sleepMode.sleepModeStartISO &&
        sleepMode.autoDetectionEnabled
      ) {
        const start = new Date(sleepMode.sleepModeStartISO);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

        // Only prompt if it's been more than 30 minutes (to avoid prompts on quick switches)
        if (diffHrs >= 0.5) {
          showAlert(
            'Wake up detected',
            `It looks like you've woken up. You've been in Sleep Mode for ${diffHrs} hours. Would you like to log this?`,
            [
              {
                text: 'Not yet',
                style: 'cancel',
              },
              {
                text: 'Log Sleep',
                onPress: async () => {
                  await setSleepMode({ sleepModeStartISO: null });
                  router.push({
                    pathname: '/(tabs)/sleep/log',
                    params: { duration: diffHrs.toString() },
                  });
                },
              },
            ],
          );
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [sleepMode.sleepModeStartISO, sleepMode.autoDetectionEnabled, setSleepMode, router]);
}
