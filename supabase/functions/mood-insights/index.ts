import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * mood-insights
 *
 * Analyses a user's recent mood check-in history and generates personalised
 * AI-powered insights and actionable suggestions.
 *
 * Expects JSON body:
 *   { moodEntries: Array<{ mood, energy, stress, note?, tags?, createdAt }> }
 *
 * Returns:
 *   { insights: MoodInsight[] }
 *
 * Each MoodInsight:
 *   { id, title, description, category, icon, color, actionLabel }
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
    const { moodEntries = [] } = body;

    if (!moodEntries.length) {
      return new Response(
        JSON.stringify({
          insights: [],
          summary: 'No mood data available yet. Start tracking to receive insights.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build a concise summary of mood data for the prompt
    const entryCount = moodEntries.length;
    const moodCounts: Record<string, number> = {};
    let totalEnergy = 0;
    let totalStress = 0;
    const recentNotes: string[] = [];
    const allTags: string[] = [];

    for (const entry of moodEntries) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      totalEnergy += entry.energy || 0;
      totalStress += entry.stress || 0;
      if (entry.note) recentNotes.push(entry.note);
      if (entry.tags) allTags.push(...entry.tags);
    }

    const avgEnergy = (totalEnergy / entryCount).toFixed(1);
    const avgStress = (totalStress / entryCount).toFixed(1);
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Okay';
    const uniqueTags = [...new Set(allTags)];

    // Determine time span
    const dates = moodEntries.map((e: any) => new Date(e.createdAt).getTime());
    const spanDays = Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) || 1;

    const systemPrompt = `You are a compassionate, evidence-based mental health AI for the InnerGlow app.
Analyse the user's mood tracking data and generate personalised, actionable insights.

Guidelines:
- Be warm and supportive, never clinical or cold.
- Base insights on patterns you observe in the data.
- Each insight should have a clear, specific action the user can take.
- Use categories: "pattern" (observed trends), "suggestion" (actionable advice), "affirmation" (positive reinforcement), "warning" (gentle alert about concerning patterns).
- Choose appropriate Material Design icon names (e.g. self-improvement, directions-walk, people, spa, nights-stay, favorite, psychology, lightbulb, trending-up, warning).
- Choose a color that matches the insight mood: green (#5B8A5A) for positive, blue (#5A8FB5) for calming, amber (#E8985A) for caution, purple (#7B6DC9) for mindfulness, brown (#8B6B47) for grounding.
- Generate 3-5 insights based on the richness of data available.
- Return valid JSON only.`;

    const userPrompt = `Here is the user's mood data from the past ${spanDays} day(s):

Summary:
- Total check-ins: ${entryCount}
- Mood distribution: ${JSON.stringify(moodCounts)}
- Dominant mood: ${dominantMood}
- Average energy: ${avgEnergy}/5
- Average stress: ${avgStress}/10
- Emotion tags used: ${uniqueTags.length > 0 ? uniqueTags.join(', ') : 'none'}
- Recent notes: ${recentNotes.length > 0 ? recentNotes.slice(0, 5).join(' | ') : 'none'}

Raw entries (most recent first, up to 20):
${JSON.stringify(
  moodEntries.slice(0, 20).map((e: any) => ({
    mood: e.mood,
    energy: e.energy,
    stress: e.stress,
    tags: e.tags,
    note: e.note,
    date: e.createdAt,
  })),
  null,
  2,
)}

Generate personalised insights. Return this JSON structure:
{
  "summary": "One-sentence overview of their mood patterns",
  "insights": [
    {
      "id": "unique-string-id",
      "title": "Short compelling title (3-6 words)",
      "description": "2-3 sentences explaining the insight and a specific action to take",
      "category": "pattern" | "suggestion" | "affirmation" | "warning",
      "icon": "material-icon-name",
      "color": "#hexcolor",
      "actionLabel": "Short action button text (2-4 words)"
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
      console.error('[mood-insights] OpenAI error:', errText);
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
        insights: parsed.insights ?? [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[mood-insights] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Insight generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
