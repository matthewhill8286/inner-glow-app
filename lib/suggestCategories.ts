import { IssueKey } from '@/data/issues';

export function suggestWithReasons(
  assessment: any,
): { key: IssueKey; score: number; reasons: string[] }[] {
  const scores = new Map<IssueKey, { score: number; reasons: string[] }>();

  function add(key: IssueKey, points: number, reason: string) {
    const cur = scores.get(key) ?? { score: 0, reasons: [] };
    cur.score += points;
    cur.reasons.push(reason);
    scores.set(key, cur);
  }

  const mood = String(assessment?.mood ?? '').toLowerCase();
  const stress = Number(assessment?.stress ?? Number.NaN);
  const sleep = Number(assessment?.sleep ?? Number.NaN);

  if (!Number.isNaN(stress)) {
    if (stress >= 8) add('stress', 4, `Stress rated ${stress}/10`);
    else if (stress >= 6) add('stress', 2, `Stress rated ${stress}/10`);
  }

  if (!Number.isNaN(sleep)) {
    if (sleep <= 2) add('sleep', 4, `Sleep quality rated ${sleep}/5`);
    else if (sleep === 3) add('sleep', 2, `Sleep quality rated ${sleep}/5`);
  }

  if (/(anx|worry|overthink)/.test(mood)) add('anxiety', 3, 'Anxiety/worry mentioned');
  if (/(panic)/.test(mood)) add('panic', 3, 'Panic mentioned');
  if (/(sad|hopeless|empty|down)/.test(mood)) add('depression', 3, 'Low mood mentioned');
  if (/(burnout|exhaust)/.test(mood)) add('burnout', 2, 'Burnout/exhaustion mentioned');
  if (/(lonely|conflict|argument)/.test(mood))
    add('relationships', 2, 'Relationship strain mentioned');
  if (/(grief|loss)/.test(mood)) add('grief', 2, 'Loss/grief mentioned');

  if (scores.size === 0) add('stress', 1, 'General check-in support');

  return Array.from(scores.entries())
    .map(([key, v]) => ({ key, score: v.score, reasons: v.reasons }))
    .sort((a, b) => b.score - a.score);
}
