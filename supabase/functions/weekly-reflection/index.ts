import { aiAccess } from '../_shared/auth.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const DAY = 86_400_000;
const PRACTICES: Record<string, string> = {
  'box-breathing': 'Box breathing, 4 min',
  'four-seven-eight': '4-7-8 breathing, 3 min',
  coherent: 'Coherent breathing, 5 min',
  'sigh-reset': 'Physiological sigh, 1 min',
  grounding: 'Grounding, 5 min',
  'mindful-focus': 'Mindful focus, 7 min',
  'quiet-mind': 'Quiet mind, 10 min',
  'bedtime-breathing': 'Bedtime breathing, 6 min',
};
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Monday 00:00 UTC of the week before the one containing `now`: reflections cover a finished week. */
export function lastWeekStart(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - 7);
  return d;
}

/**
 * weekly-reflection (11 task 14). Pro only.
 * { locale? } → { weekStart, content } for last week. The numbers are counted here from the person's
 * own logs; Glow AI writes only the headline, what it noticed and two suggestions. A week that
 * already has a reflection returns it.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const access = await aiAccess(req, CORS);
  if (access.response) return access.response;
  if (!access.premium)
    return Response.json({ error: 'An active trial or premium purchase is required.' }, { status: 403, headers: CORS });
  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
    const body = await req.json().catch(() => ({}));
    const language = body.locale === 'el' ? 'Greek' : 'English';
    const start = lastWeekStart();
    const end = new Date(start.getTime() + 7 * DAY);
    const weekStart = start.toISOString().slice(0, 10);

    const { data: existing } = await access.sb
      .from('weekly_reflections')
      .select('content')
      .eq('user_id', access.userId)
      .eq('week_start', weekStart)
      .maybeSingle();
    if (existing) return Response.json({ weekStart, content: existing.content }, { headers: CORS });

    const range = (q: any, column: string) => q.gte(column, start.toISOString()).lt(column, end.toISOString());
    const [moods, sleeps, practices, scores, prevScores] = await Promise.all([
      range(access.sb.from('mood_logs').select('mood_score,stress_score,factors,logged_at').eq('user_id', access.userId), 'logged_at'),
      range(access.sb.from('sleep').select('start_iso,end_iso,quality').eq('user_id', access.userId), 'end_iso'),
      range(access.sb.from('mindfulness').select('seconds,practice_id,date_iso').eq('user_id', access.userId), 'date_iso'),
      range(access.sb.from('freud_scores').select('score,created_at').eq('user_id', access.userId), 'created_at').order('created_at'),
      access.sb.from('freud_scores').select('score').eq('user_id', access.userId).lt('created_at', start.toISOString()).order('created_at', { ascending: false }).limit(1),
    ]);
    const moodRows = (moods.data ?? []) as { mood_score: number; stress_score: number | null; factors: string[] | null; logged_at: string }[];
    const days = new Set(moodRows.map((m) => m.logged_at.slice(0, 10))).size;
    const nights = ((sleeps.data ?? []) as { start_iso: string; end_iso: string }[])
      .map((s) => (Date.parse(s.end_iso) - Date.parse(s.start_iso)) / 60000)
      .filter((m) => m > 0);
    const avgSleep = nights.length ? Math.round(nights.reduce((a, b) => a + b, 0) / nights.length) : null;
    const practiceMinutes = Math.round(((practices.data ?? []) as { seconds: number | null }[]).reduce((a, p) => a + (p.seconds ?? 0), 0) / 60);
    const scoreRows = (scores.data ?? []) as { score: number }[];
    const lastScore = scoreRows.at(-1)?.score ?? null;
    const before = (prevScores.data?.[0] as { score: number } | undefined)?.score ?? scoreRows[0]?.score ?? null;
    const scoreChange = lastScore != null && before != null ? Math.round(lastScore - before) : null;

    if (!moodRows.length && !nights.length && !practiceMinutes)
      return Response.json({ weekStart, content: null, reason: 'not_enough_data' }, { headers: CORS });

    const factorCounts: Record<string, number> = {};
    for (const m of moodRows) for (const f of m.factors ?? []) factorCounts[f] = (factorCounts[f] ?? 0) + 1;
    const summary = {
      checkInDays: days,
      moods: moodRows.map((m) => ({ day: new Date(m.logged_at).toUTCString().slice(0, 3), mood: m.mood_score, stress: m.stress_score })),
      commonFactors: Object.entries(factorCounts).sort((a, b) => b[1] - a[1]).slice(0, 4),
      averageSleepMinutes: avgSleep,
      practiceMinutes,
      glowScoreChange: scoreChange,
    };
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 350,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are Glow AI, a warm wellbeing companion. Write a short reflection on the person's past week in ${language}, speaking to them as "you", using only the summary given.
Return JSON only with:
- "headline": at most 45 characters, gentle and specific, such as "A steadier week than the last".
- "noticed": two sentences, at most 220 characters, about patterns you can see in the numbers. Do not invent events.
- "suggestions": exactly two objects {"practiceId": one id from the list or null, "title": at most 40 characters, "detail": at most 50 characters}.
Practices: ${Object.entries(PRACTICES).map(([id, about]) => `${id} (${about})`).join('; ')}.
Do not diagnose or give medical advice.`,
          },
          { role: 'user', content: JSON.stringify(summary) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const raw = JSON.parse((await response.json()).choices?.[0]?.message?.content ?? '{}');
    const content = {
      headline: text(raw.headline, 60),
      noticed: text(raw.noticed, 300),
      suggestions: (Array.isArray(raw.suggestions) ? raw.suggestions : []).slice(0, 2).map((s: any) => ({
        practiceId: typeof s?.practiceId === 'string' && PRACTICES[s.practiceId] ? s.practiceId : null,
        title: text(s?.title, 50),
        detail: text(s?.detail, 60),
      })),
      scoreChange,
      avgSleepMinutes: avgSleep,
      practiceMinutes,
      checkInDays: days,
    };
    if (!content.headline || !content.noticed) throw new Error('Empty reflection');
    const { error } = await access.sb.from('weekly_reflections').upsert(
      { user_id: access.userId, week_start: weekStart, content },
      { onConflict: 'user_id,week_start' },
    );
    if (error) throw error;
    return Response.json({ weekStart, content }, { headers: CORS });
  } catch (error) {
    console.error('[weekly-reflection]', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Glow AI could not reflect on your week right now.' }, { status: 500, headers: CORS });
  }
});
