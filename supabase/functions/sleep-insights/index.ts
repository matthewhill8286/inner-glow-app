// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * sleep-insights
 *
 * Analyses a user's recent sleep data and generates personalised
 * AI-powered insights and actionable suggestions for better sleep.
 *
 * Expects JSON body:
 *   { sleepEntries: Array<{ startISO, endISO, duration, quality?, awakenings?, notes? }>,
 *     irregularity: number, avgDuration: number, avgQuality: number }
 *
 * Returns:
 *   { summary: string, suggestions: SleepSuggestion[] }
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      sleepEntries = [],
      irregularity = 0,
      avgDuration = 0,
      avgQuality = 0,
    } = body;

    if (!sleepEntries.length) {
      return new Response(
        JSON.stringify({
          summary: 'No sleep data available yet. Start logging your sleep to receive insights.',
          suggestions: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build a concise summary for the LLM
    const entryCount = sleepEntries.length;
    const qualityEntries = sleepEntries.filter((e: any) => e.quality);
    const qualityDist: Record<number, number> = {};
    qualityEntries.forEach((e: any) => {
      qualityDist[e.quality] = (qualityDist[e.quality] || 0) + 1;
    });

    const bedtimes = sleepEntries.map((e: any) => {
      const d = new Date(e.startISO);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });

    const wakeTimes = sleepEntries.map((e: any) => {
      const d = new Date(e.endISO);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });

    const recentNotes = sleepEntries
      .filter((e: any) => e.notes)
      .slice(0, 5)
      .map((e: any) => e.notes);

    const systemPrompt = `You are a compassionate, evidence-based sleep health AI for the InnerGlow app.
Analyse the user's sleep tracking data and generate personalised, actionable suggestions for better sleep.

Guidelines:
- Be warm and supportive, use evidence-based sleep science.
- Each suggestion should be specific and actionable.
- Choose appropriate Material Design icon names (e.g. thermostat, nightlight, local-cafe, schedule, self-improvement, bedtime, hotel, dark-mode, volume-off, fitness-center, restaurant, phone-android, psychology).
- Choose a color that matches the suggestion:
  - Blue (#5A8FB5) for calming/environment suggestions
  - Green (#5B8A5A) for positive habits
  - Purple (#7B6DC9) for sleep quality/REM
  - Orange (#E8985A) for caution/timing
  - Red (#C45B5B) for warnings/irregularity
  - Brown (#8B6B47) for routine/consistency
- Generate 4-6 suggestions based on the richness of data.
- Return valid JSON only — no markdown, no explanation.`;

    const userPrompt = `User's sleep data summary:

Stats:
- Total sleep entries: ${entryCount}
- Average duration: ${avgDuration.toFixed(1)} hours per night
- Average quality: ${avgQuality.toFixed(1)}/5
- Sleep irregularity: ${irregularity}% (0% = very consistent, 100% = very erratic)
- Quality distribution: ${JSON.stringify(qualityDist)}

Patterns:
- Recent bedtimes: ${bedtimes.slice(0, 10).join(', ')}
- Recent wake times: ${wakeTimes.slice(0, 10).join(', ')}
- Sleep notes: ${recentNotes.length > 0 ? recentNotes.join(' | ') : 'none'}

Raw entries (most recent first, up to 15):
${JSON.stringify(sleepEntries.slice(0, 15).map((e: any) => ({
  bedtime: e.startISO,
  wakeTime: e.endISO,
  duration: e.duration,
  quality: e.quality,
  awakenings: e.awakenings,
  notes: e.notes,
})), null, 2)}

Generate personalised sleep improvement suggestions. Return this JSON structure:
{
  "summary": "One-sentence overview of their sleep patterns",
  "suggestions": [
    {
      "id": "unique-string-id",
      "icon": "material-icon-name",
      "title": "Short compelling title (3-6 words)",
      "subtitle": "2-3 sentences explaining the insight and a specific action to take",
      "color": "#hexcolor"
    }
  ]
}`;

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error('[sleep-insights] OpenAI error:', errText);
      return new Response(JSON.stringify({ error: `OpenAI returned ${chatRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chatData = await chatRes.json();
    const content = chatData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty response from OpenAI' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({
        summary: parsed.summary ?? '',
        suggestions: parsed.suggestions ?? [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[sleep-insights] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Insight generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
