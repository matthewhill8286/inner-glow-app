import { aiAccess } from '../_shared/auth.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Practices a reflection may suggest, with what each is for (ids from `data/practices.ts`). */
const PRACTICES: Record<string, string> = {
  'box-breathing': 'Box breathing, 4 min: calm and focus',
  'four-seven-eight': '4-7-8 breathing, 3 min: settle before sleep or after stress',
  coherent: 'Coherent breathing, 5 min: steady, balanced breathing',
  'sigh-reset': 'Physiological sigh, 1 min: a quick reset when tense',
  grounding: 'Grounding, 5 min: come back to the present',
  'mindful-focus': 'Mindful focus, 7 min: settle a busy mind',
  'quiet-mind': 'Quiet mind, 10 min: let thoughts settle at night',
  'bedtime-breathing': 'Bedtime breathing, 6 min: slow breaths to relax before sleep',
  'shoulder-release': 'Shoulder release video, 20 min: release physical tension',
  'quiet-thoughts': 'Quiet thoughts video, 10 min: a guided mindfulness session',
};
const MOOD_SCORES = [1, 2, 3, 4, 5];

async function complete(system: string, user: string, maxTokens: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
  return JSON.parse((await response.json()).choices?.[0]?.message?.content ?? '{}');
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * journal-reflection (04 J4, J5). Pro only, like transcription.
 *
 * { action: 'reflect', entryId, locale? } → { reflection, practiceId }
 *   A short, kind reflection on one of the caller's entries and one practice to try, stored on the
 *   entry. An entry that already has one returns it; editing the entry clears it (database trigger).
 *
 * { action: 'analyse', text, locale? } → { highlights, moods }
 *   For voice review: up to three phrases quoted exactly from the transcript, and up to three feeling
 *   words, each with a score on the five-step mood scale (1 Tense … 5 Great). Nothing is stored.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const access = await aiAccess(req, CORS);
  if (access.response) return access.response;
  if (!access.premium)
    return Response.json(
      { error: 'An active trial or premium purchase is required.' },
      { status: 403, headers: CORS },
    );

  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
    const body = await req.json();
    const language = body.locale === 'el' ? 'Greek' : 'English';

    if (body.action === 'analyse') {
      const transcript = text(body.text, 6000);
      if (!transcript)
        return Response.json({ error: 'text is required' }, { status: 400, headers: CORS });
      const raw = await complete(
        `You read a voice journal transcript and return JSON only, with these keys:
- "highlights": up to three short phrases (2 to 6 words) copied exactly, letter for letter, from the transcript, that carry the most feeling.
- "moods": up to three feeling words in ${language}, one word each and at most 12 characters, such as "Anxious" or "Lighter", each as {"word": string, "score": 1-5} where 1 is tense and 5 is great.
Do not diagnose. Use only what the transcript says.`,
        transcript,
        250,
      );
      const highlights = (Array.isArray(raw.highlights) ? raw.highlights : [])
        .map((h: unknown) => text(h, 80))
        .filter((h: string) => h.length > 1 && transcript.includes(h))
        .slice(0, 3);
      const moods = (Array.isArray(raw.moods) ? raw.moods : [])
        .map((m: any) => ({ word: text(m?.word, 16), score: Number(m?.score) }))
        .filter((m: { word: string; score: number }) => m.word && MOOD_SCORES.includes(m.score))
        .slice(0, 3);
      return Response.json({ highlights, moods }, { headers: CORS });
    }

    if (body.action !== 'reflect' || typeof body.entryId !== 'string')
      return Response.json({ error: 'Invalid request' }, { status: 400, headers: CORS });

    const { data: entry, error } = await access.sb
      .from('journal_entries')
      .select('id,title,body,mood,tags,reflection,reflection_practice_id')
      .eq('id', body.entryId)
      .eq('user_id', access.userId)
      .maybeSingle();
    if (error) throw error;
    if (!entry) return Response.json({ error: 'Entry not found' }, { status: 404, headers: CORS });
    if (entry.reflection)
      return Response.json(
        { reflection: entry.reflection, practiceId: entry.reflection_practice_id },
        { headers: CORS },
      );

    const raw = await complete(
      `You are Glow AI, a warm wellbeing companion. Write a gentle reflection on the person's journal entry, in ${language}, speaking to them as "you".
Return JSON only, with these keys:
- "reflection": two or three sentences, at most 300 characters. Notice what they felt and anything that helped, name one strength you see, and offer one small, kind idea for next time.
- "practiceId": the one practice from this list that fits best, by its id:
${Object.entries(PRACTICES)
  .map(([id, about]) => `  ${id}: ${about}`)
  .join('\n')}
Do not diagnose or give medical advice. Do not invent details. If they mention wanting to harm themselves, say kindly that they deserve support right now and suggest reaching out to someone they trust or a local emergency line.`,
      `Title: ${text(entry.title, 200)}\nMood: ${text(entry.mood, 40)}\nTags: ${(entry.tags ?? []).join(', ')}\n\n${text(entry.body, 6000)}`,
      300,
    );
    const reflection = text(raw.reflection, 600);
    if (!reflection) throw new Error('Empty reflection');
    const practiceId =
      typeof raw.practiceId === 'string' && PRACTICES[raw.practiceId] ? raw.practiceId : null;

    const { error: saveError } = await access.sb
      .from('journal_entries')
      .update({
        reflection,
        reflection_practice_id: practiceId,
        reflection_at: new Date().toISOString(),
      })
      .eq('id', entry.id)
      .eq('user_id', access.userId);
    if (saveError) throw saveError;

    return Response.json({ reflection, practiceId }, { headers: CORS });
  } catch (error) {
    console.error('[journal-reflection]', error instanceof Error ? error.message : error);
    return Response.json(
      { error: 'Glow AI could not reflect on this right now. Please try again.' },
      { status: 500, headers: CORS },
    );
  }
});
