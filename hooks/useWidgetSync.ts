import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  formatSleep,
  latestTwoCheckIns,
  latestTwoNights,
  stressLevel,
  type Trend,
} from '@/lib/home';
import { moodScoreOf, moodStep } from '@/lib/mood-scale';
import {
  dailyPrompt,
  scoreSummary,
  sleepBars,
  weekMoodDots,
  type WidgetSnapshot,
} from '@/lib/widget-snapshot';
import type { MoodCheckIn, SleepEntry } from '@/lib/types';

const GROUP = 'group.com.innerglowai.app';

type Input = {
  score: number;
  scoreTrend: Trend;
  scoreHistory: { score: number; createdAt: string }[];
  checkIns: MoodCheckIn[];
  sleepEntries: SleepEntry[];
  streak: number;
  windDown?: { hour: number; minute: number } | null;
  ready: boolean;
};

/** Writes Home's summary to the App Group and reloads the widgets. A no-op where the native module is missing. */
export function useWidgetSync({
  score,
  scoreTrend,
  scoreHistory,
  checkIns,
  sleepEntries,
  streak,
  windDown,
  ready,
}: Input) {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (Platform.OS !== 'ios' || !ready) return;
    const mood = latestTwoCheckIns(checkIns);
    const moodScore = mood.latest ? moodScoreOf(mood.latest.mood) : null;
    const nights = latestTwoNights(sleepEntries);
    const nightMinutes = [...sleepEntries]
      .sort((a, b) => Date.parse(a.endISO) - Date.parse(b.endISO))
      .map((e) => (Date.parse(e.endISO) - Date.parse(e.startISO)) / 60000)
      .filter((m) => m > 0);
    const { series, weekDelta } = scoreSummary(scoreHistory, score);
    let windDownAt: number | undefined;
    if (windDown) {
      const d = new Date();
      d.setHours(windDown.hour, windDown.minute - 30, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      windDownAt = Math.round(d.getTime() / 1000);
    }
    const snapshot: WidgetSnapshot = {
      score: Math.round(score),
      scoreTrend: scoreTrend ?? 'stable',
      scoreWeekDelta: weekDelta,
      scoreSeries: series,
      mood: moodScore ? t(`moodScale.${moodStep(moodScore).key}`) : undefined,
      sleep: nights.latest != null ? formatSleep(nights.latest) : undefined,
      sleepBars: sleepBars(nightMinutes),
      stress:
        mood.latest?.stress != null
          ? t(`homeGlow.stressLevel.${stressLevel(mood.latest.stress)}`)
          : undefined,
      streak,
      nextPractice: t('widgets.nextPractice'),
      nextPracticeURL: 'innerglow://mindful',
      windDownAt,
      weekMoods: weekMoodDots(
        checkIns.map((c) => ({ createdAt: c.createdAt, score: moodScoreOf(c.mood) })),
      ),
      glowPrompt: dailyPrompt(t('widgets.prompts', { returnObjects: true }) as string[]),
      labels: t('widgets.labels', { returnObjects: true }) as Record<string, string>,
    };
    void (async () => {
      try {
        const { ExtensionStorage } = await import('@bacons/apple-targets');
        new ExtensionStorage(GROUP).set('snapshot', JSON.stringify(snapshot));
        ExtensionStorage.reloadWidget();
      } catch {
        // Builds without the widget extension have no shared storage.
      }
    })();
  }, [
    ready,
    score,
    scoreTrend,
    scoreHistory,
    checkIns,
    sleepEntries,
    streak,
    windDown,
    t,
    i18n.language,
  ]);
}
