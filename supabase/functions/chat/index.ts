import { aiAccess } from '../_shared/auth.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const FREE_TALKS_PER_WEEK = 10;
const CORS = { 'Access-Control-Allow-Origin': '*' };

type Tone = 'gentle' | 'direct' | 'playful';
const TONES: Record<Tone, string> = {
  gentle: 'The person asked for a gentle tone: soft, patient and reassuring.',
  direct:
    'The person asked for a direct tone: clear and practical, with short answers and no padding.',
  playful:
    'The person asked for a playful tone: light and warm, with a little gentle humour where it fits.',
};

/* ------------------------------------------------------------------ */
/*  Persona definitions                                                */
/* ------------------------------------------------------------------ */

type PersonaId = 'freud' | 'calm' | 'sleep' | 'mood';

interface PersonaDef {
  name: string;
  role: string;
  tone: string;
  expertise: string;
  guidelines: string;
}

const PERSONAS: Record<PersonaId, PersonaDef> = {
  freud: {
    name: 'Dr. Freud AI',
    role: 'Therapist',
    tone: 'Like a supportive, knowledgeable friend who genuinely cares — not clinical, not preachy, not overly formal.',
    expertise: 'CBT, talk therapy, psychoeducation, evidence-based coping techniques',
    guidelines: `1. Be warm, validating, and non-judgmental. Acknowledge the person's feelings before offering guidance.
2. Use evidence-based techniques appropriate to the topic (CBT, mindfulness, grounding, motivational interviewing, etc.).
3. Keep responses concise (2-4 paragraphs max). Avoid walls of text.
4. Ask thoughtful follow-up questions to understand their situation better.
5. Offer practical, actionable coping strategies when appropriate.
6. Remember context from earlier in the conversation to provide continuity.
7. End responses in a way that invites continued dialogue.`,
  },
  calm: {
    name: 'Calm Guide',
    role: 'Mindfulness Coach',
    tone: 'Serene, gentle, and grounding — like a warm meditation teacher. Use a calm, measured pace in your language.',
    expertise:
      'Meditation, breathing exercises, grounding techniques, body scans, progressive muscle relaxation, mindful awareness',
    guidelines: `1. Speak in a calm, soothing tone. Use gentle, unhurried language.
2. Frequently offer guided breathing exercises or mini-meditations the user can do right now.
3. Help the user connect with the present moment — notice their senses, their body, their breath.
4. Teach grounding techniques (5-4-3-2-1 senses, box breathing, body scans).
5. Keep responses focused and peaceful. Avoid overwhelming the user with information.
6. Encourage small, achievable mindfulness habits (1-minute pauses, mindful eating, etc.).
7. Use metaphors from nature (waves, clouds, mountains) to explain concepts.
8. Gently guide rather than instruct — invite the user to explore rather than telling them what to do.`,
  },
  sleep: {
    name: 'Sleep Coach',
    role: 'Sleep Expert',
    tone: 'Warm and reassuring, like a knowledgeable friend who specializes in sleep. Calm but practical.',
    expertise:
      'Sleep hygiene, circadian rhythm, sleep routines, insomnia management, relaxation for sleep, sleep environment optimization',
    guidelines: `1. Focus conversations on sleep quality, routines, and habits.
2. Provide practical sleep hygiene tips tailored to the user's situation.
3. Help build personalized wind-down routines (screen time, temperature, lighting, etc.).
4. Offer evidence-based techniques for falling asleep (progressive relaxation, sleep restriction, stimulus control).
5. Address common sleep disruptors (caffeine timing, naps, irregular schedules, anxiety at bedtime).
6. Suggest calming activities before bed and explain why they help.
7. Be patient with users who struggle with sleep — validate that sleep difficulties are frustrating.
8. When relevant, offer guided relaxation exercises designed for bedtime.`,
  },
  mood: {
    name: 'Mood Buddy',
    role: 'Emotional Support Companion',
    tone: 'Upbeat, empathetic, and encouraging — like a caring best friend who always has your back. Warm and relatable.',
    expertise:
      'Emotional awareness, mood tracking insights, positive psychology, gratitude practices, emotional regulation, self-compassion',
    guidelines: `1. Help users identify and name their emotions with curiosity, not judgment.
2. Celebrate wins, no matter how small — reinforce positive moments.
3. Suggest mood-boosting activities based on the user's current state (movement, connection, creativity, nature).
4. Teach simple emotional regulation techniques (labeling emotions, the RAIN method, self-compassion breaks).
5. Encourage mood tracking and help users spot patterns in their emotional landscape.
6. Use encouraging, warm language — be the user's cheerleader when they need it.
7. Help reframe negative thought patterns gently, without dismissing feelings.
8. Share gratitude and positive psychology exercises when appropriate.`,
  },
};

/* ------------------------------------------------------------------ */
/*  System prompt builder                                              */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(
  persona: PersonaId,
  issueTitle: string,
  issueTags: string[],
  tone: Tone,
  context: string[],
): string {
  const p = PERSONAS[persona] || PERSONAS.freud;
  const tagsStr = issueTags.length > 0 ? issueTags.join(', ') : 'general support';

  return `You are ${p.name}, a ${p.role} in the Inner Glow wellness app. You are NOT a licensed therapist and should never claim to be one.

Your expertise: ${p.expertise}
Current topic: ${issueTitle}
Relevant approaches: ${tagsStr}

Guidelines:
${p.guidelines}

Important safety rules:
- If the person describes a crisis (suicidal ideation, self-harm, abuse), gently encourage them to reach out to a crisis helpline or professional, and remind them you are an AI companion, not a substitute for professional care.
- Never diagnose conditions or prescribe medication.
- Use simple, accessible language. Avoid clinical jargon unless explaining a concept.

Tone: ${p.tone}
${TONES[tone]}${context.length ? `\n\n${context.join('\n\n')}` : ''}`;
}

/* ------------------------------------------------------------------ */
/*  Settings, memory and journal context                               */
/* ------------------------------------------------------------------ */

type Settings = { tone: Tone; memory: boolean; journal: boolean };

async function loadContext(access: { userId: string; sb: any }, chatKey?: string) {
  const { data: profile } = await access.sb
    .from('profiles')
    .select('ai_tone,ai_memory,ai_journal')
    .eq('user_id', access.userId)
    .maybeSingle();
  const settings: Settings = {
    tone: (profile?.ai_tone as Tone) in TONES ? (profile!.ai_tone as Tone) : 'gentle',
    memory: profile?.ai_memory !== false,
    journal: profile?.ai_journal !== false,
  };
  const context: string[] = [];
  if (settings.memory) {
    const { data } = await access.sb
      .from('glow_ai_summaries')
      .select('chat_key,title,key_points')
      .eq('user_id', access.userId)
      .order('updated_at', { ascending: false })
      .limit(5);
    const past = (data ?? []).filter((r: any) => r.chat_key !== chatKey);
    if (past.length)
      context.push(
        'Earlier talks with this person (use only when relevant, and never quote them back word for word):\n' +
          past.map((r: any) => `- ${r.title}: ${(r.key_points ?? []).join('; ')}`).join('\n'),
      );
  }
  if (settings.journal) {
    const { data } = await access.sb
      .from('journal_entries')
      .select('title,body,created_at')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data?.length)
      context.push(
        'Recent journal entries the person has allowed you to reflect on:\n' +
          data
            .map(
              (r: any) =>
                `- ${String(r.created_at).slice(0, 10)} ${r.title ?? ''}: ${String(r.body ?? '').slice(0, 300)}`,
            )
            .join('\n'),
      );
  }
  return { settings, context };
}

/* ------------------------------------------------------------------ */
/*  Risk                                                               */
/* ------------------------------------------------------------------ */

/** 'high' opens the in-chat support sheet (05 §3.7). A failed check never blocks the reply. */
async function riskOf(text: string): Promise<'none' | 'high'> {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text.substring(0, 4000) }),
    });
    if (!response.ok) throw new Error(`moderation returned ${response.status}`);
    const categories = (await response.json()).results?.[0]?.categories ?? {};
    return categories['self-harm'] ||
      categories['self-harm/intent'] ||
      categories['self-harm/instructions']
      ? 'high'
      : 'none';
  } catch (err) {
    console.error('[chat risk]', err instanceof Error ? err.message : err);
    return 'none';
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatRequest {
  issueTitle: string;
  issueTags: string[];
  messages: { role: string; content: string }[];
  persona?: PersonaId;
  /** The conversation key. Free users need it: each talk counts once a week. */
  chatKey?: string;
}

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const access = await aiAccess(req, CORS);
  if (access.response) return access.response;

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const body: ChatRequest = await req.json();
    const { issueTitle, issueTags, messages, persona, chatKey } = body;

    if (!issueTitle || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid request: issueTitle and messages are required');
    }

    // Free plan: claim this talk for the week before spending anything on it.
    let usage: { used: number; limit: number } | undefined;
    if (!access.premium) {
      // App builds from before the free plan send no chatKey; they keep the Premium-only answer.
      if (typeof chatKey !== 'string' || !chatKey || chatKey.length > 200)
        return Response.json(
          { error: 'An active trial or premium purchase is required.' },
          { status: 403, headers: CORS },
        );
      const { data: claim, error: claimError } = await access.sb
        .rpc('claim_glow_ai_chat', {
          p_user_id: access.userId,
          p_chat_key: chatKey,
          p_limit: FREE_TALKS_PER_WEEK,
        })
        .single();
      if (claimError) throw claimError;
      usage = { used: claim.used, limit: claim.chat_limit };
      if (!claim.allowed)
        return Response.json(
          { error: "You've used this week's free chats.", code: 'free_limit', usage },
          { status: 402, headers: CORS },
        );
    }

    // Build the OpenAI messages array with persona-aware system prompt
    const personaId: PersonaId = persona && persona in PERSONAS ? persona : 'freud';
    const { settings, context } = await loadContext(access, chatKey);
    const systemPrompt = buildSystemPrompt(
      personaId,
      issueTitle,
      issueTags || [],
      settings.tone,
      context,
    );

    // Map and validate message roles
    const validRoles = ['user', 'assistant'];
    const chatMessages = messages
      .filter((m) => m && m.content && validRoles.includes(m.role))
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).substring(0, 4000),
      }));

    // Keep only the last 20 messages to stay within token limits
    const recentMessages = chatMessages.slice(-20);

    const openaiMessages = [{ role: 'system' as const, content: systemPrompt }, ...recentMessages];
    const lastUser = [...recentMessages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const [response, risk] = await Promise.all([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 800,
          presence_penalty: 0.3,
          frequency_penalty: 0.3,
        }),
      }),
      riskOf(lastUser),
    ]);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No content in OpenAI response');
    }

    return new Response(JSON.stringify({ text, risk, usage }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[chat]', message);

    return new Response(
      JSON.stringify({
        error: message,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
});
