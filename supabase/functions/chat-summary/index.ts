import { aiAccess } from '../_shared/auth.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const MOODS = ['angry', 'sad', 'neutral', 'happy', 'very-happy'] as const;

/**
 * chat-summary (05 §3.5, Session summary)
 *
 * Expects JSON body:
 *   { chatKey, locale?, messages: Array<{ role, content, createdAt? }> }
 *
 * Returns and stores (glow_ai_summaries):
 *   { title, summary, moodBefore, moodAfter, moodBeforeLabel, moodAfterLabel, keyPoints, minutes }
 *
 * Free users may summarise only a talk the chat function has counted for them, so the endpoint is not
 * a free way round the weekly quota.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const access = await aiAccess(req, CORS);
  if (access.response) return access.response;

  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
    const { chatKey, locale, messages } = await req.json();
    if (
      typeof chatKey !== 'string' ||
      !chatKey ||
      chatKey.length > 200 ||
      !Array.isArray(messages) ||
      !messages.length
    )
      return Response.json(
        { error: 'Invalid request: chatKey and messages are required' },
        { status: 400, headers: CORS },
      );

    if (!access.premium) {
      const { count, error } = await access.sb
        .from('glow_ai_usage')
        .select('chat_key', { count: 'exact', head: true })
        .eq('user_id', access.userId)
        .eq('chat_key', chatKey);
      if (error) throw error;
      if (!count)
        return Response.json(
          { error: 'An active trial or premium purchase is required.' },
          { status: 403, headers: CORS },
        );
    }

    const talk = messages
      .filter(
        (m: any) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role),
      )
      .slice(-40);
    const times = talk
      .map((m: any) => Date.parse(m.createdAt))
      .filter((t: number) => Number.isFinite(t));
    const minutes =
      times.length > 1
        ? Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 60000))
        : 1;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Summarise this wellness chat for the person who had it, in ${locale === 'el' ? 'Greek' : 'English'}, speaking to them as "you".
Return JSON only, with these keys:
- "title": at most 40 characters, a short name for the talk.
- "summary": one sentence of at most 60 characters.
- "moodBefore" and "moodAfter": each one of ${MOODS.join(', ')}, for how they seemed at the start and at the end.
- "moodBeforeLabel" and "moodAfterLabel": one word each, at most 12 characters, such as "Tense" and "Calmer".
- "keyPoints": up to three short points of at most 40 characters each, about what came up and what helped.
Do not diagnose. Do not invent details that are not in the chat.`,
          },
          {
            role: 'user',
            content: talk
              .map(
                (m: any) =>
                  `${m.role === 'user' ? 'Person' : 'Glow AI'}: ${String(m.content).slice(0, 1500)}`,
              )
              .join('\n'),
          },
        ],
      }),
    });
    if (!response.ok)
      throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
    const raw = JSON.parse((await response.json()).choices?.[0]?.message?.content ?? '{}');

    const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const mood = (v: unknown) =>
      MOODS.includes(v as (typeof MOODS)[number]) ? (v as string) : null;
    const row = {
      user_id: access.userId,
      chat_key: chatKey,
      title: text(raw.title, 80) || 'Talk',
      summary: text(raw.summary, 200),
      mood_before: mood(raw.moodBefore),
      mood_after: mood(raw.moodAfter),
      mood_before_label: text(raw.moodBeforeLabel, 24) || null,
      mood_after_label: text(raw.moodAfterLabel, 24) || null,
      key_points: (Array.isArray(raw.keyPoints) ? raw.keyPoints : [])
        .map((p: unknown) => text(p, 80))
        .filter(Boolean)
        .slice(0, 3),
      minutes,
      updated_at: new Date().toISOString(),
    };
    const { error: saveError } = await access.sb.from('glow_ai_summaries').upsert(row);
    if (saveError) throw saveError;

    return Response.json(
      {
        title: row.title,
        summary: row.summary,
        moodBefore: row.mood_before,
        moodAfter: row.mood_after,
        moodBeforeLabel: row.mood_before_label,
        moodAfterLabel: row.mood_after_label,
        keyPoints: row.key_points,
        minutes,
      },
      { headers: CORS },
    );
  } catch (error) {
    console.error('[chat-summary]', error instanceof Error ? error.message : error);
    return Response.json(
      { error: 'We could not summarise this talk. Please try again.' },
      { status: 500, headers: CORS },
    );
  }
});
