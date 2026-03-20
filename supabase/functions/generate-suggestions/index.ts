// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * generate-suggestions
 *
 * Called by suggestionEngine.ts to produce personalised activity suggestions
 * based on the user's Freud Score breakdown and weak areas.
 *
 * Expects JSON body:
 *   { score, breakdown, weakAreas, categories, existingTitles, maxSuggestions }
 *
 * Returns:
 *   { suggestions: AISuggestionFromLLM[] }
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
      score,
      breakdown,
      weakAreas,
      categories,
      existingTitles = [],
      maxSuggestions = 6,
    } = body;

    const systemPrompt = `You are a mental health and wellness AI assistant for an app called InnerGlow.
Your job is to generate personalised, actionable activity suggestions based on a user's mental health profile.

Rules:
- Each suggestion must be specific, actionable, and achievable in a single session.
- Vary the difficulty: include a mix of easy, medium, and hard suggestions.
- Assign points: easy = 5-10, medium = 15-25, hard = 30-50.
- Duration should be realistic (e.g. "5 min", "15-30 min", "1 hour").
- The targetWeakness should match one of the user's weak dimensions.
- Do NOT repeat any titles from the existing list provided.
- Return valid JSON only — no markdown, no explanation.`;

    const userPrompt = `User's mental health profile:
- Overall Freud Score: ${score}/100
- Breakdown: ${JSON.stringify(breakdown)}
- Weak areas (below 60): ${JSON.stringify(weakAreas)}
- Suggested categories to focus on: ${JSON.stringify(categories)}
- Existing suggestion titles to AVOID duplicating: ${JSON.stringify(existingTitles)}

Generate exactly ${maxSuggestions} personalised activity suggestions.

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "category": "mindfulness" | "physical" | "social" | "professional",
      "title": "Short, compelling title",
      "description": "2-3 sentence description of the activity and why it helps",
      "duration": "estimated time",
      "points": number,
      "difficulty": "easy" | "medium" | "hard",
      "targetWeakness": "mood" | "sleep" | "stress" | "mindfulness" | "consistency" | "journal"
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
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error('[generate-suggestions] OpenAI error:', errText);
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

    return new Response(JSON.stringify({ suggestions: parsed.suggestions ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[generate-suggestions] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
