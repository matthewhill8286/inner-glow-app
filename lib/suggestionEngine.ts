import { supabase } from '@/supabase/supabase';
import type { FreudBreakdown } from './freudScore';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SuggestionTemplate = {
  id: string;
  category: 'mindfulness' | 'physical' | 'social' | 'professional';
  title: string;
  description: string | null;
  duration: string | null;
  points: number;
  minScore: number;
  maxScore: number;
  targetWeakness: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
};

type AISuggestionFromLLM = {
  category: string;
  title: string;
  description: string;
  duration: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  targetWeakness: string;
};

/* ------------------------------------------------------------------ */
/*  Identify weak areas from breakdown                                 */
/* ------------------------------------------------------------------ */

/**
 * Returns the breakdown dimensions sorted by weakness (lowest first).
 * Only includes dimensions scoring below the given threshold.
 */
export function identifyWeakAreas(
  breakdown: FreudBreakdown,
  threshold = 60,
): { dimension: string; score: number }[] {
  const entries = Object.entries(breakdown) as [string, number][];
  return entries
    .filter(([, score]) => score < threshold)
    .sort((a, b) => a[1] - b[1])
    .map(([dimension, score]) => ({ dimension, score }));
}

/* ------------------------------------------------------------------ */
/*  Map weakness dimension → suggestion categories                     */
/* ------------------------------------------------------------------ */

const WEAKNESS_TO_CATEGORIES: Record<string, string[]> = {
  mood: ['physical', 'social', 'mindfulness'],
  sleep: ['physical', 'mindfulness'],
  stress: ['mindfulness', 'physical', 'professional'],
  mindfulness: ['mindfulness'],
  consistency: ['professional', 'social'],
  journal: ['mindfulness', 'professional'],
};

/* ------------------------------------------------------------------ */
/*  AI-powered suggestion generation (Edge Function → OpenAI)          */
/* ------------------------------------------------------------------ */

/**
 * Calls the `generate-suggestions` Supabase Edge Function which uses
 * OpenAI to create personalised, contextual activity suggestions based
 * on the user's Freud Score profile.
 *
 * Returns null if the edge function fails (caller should fall back to
 * template-based generation).
 */
async function generateAISuggestions(opts: {
  score: number;
  breakdown: FreudBreakdown;
  weakAreas: { dimension: string; score: number }[];
  categories: string[];
  existingTitles: string[];
  maxSuggestions: number;
}): Promise<AISuggestionFromLLM[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-suggestions', {
      body: {
        score: opts.score,
        breakdown: opts.breakdown,
        weakAreas: opts.weakAreas,
        categories: opts.categories,
        existingTitles: Array.from(opts.existingTitles),
        maxSuggestions: opts.maxSuggestions,
      },
    });

    if (error) {
      console.warn('[SuggestionEngine] Edge function error:', error.message);
      return null;
    }

    if (!data?.suggestions || !Array.isArray(data.suggestions)) {
      console.warn('[SuggestionEngine] Invalid AI response format');
      return null;
    }

    return data.suggestions as AISuggestionFromLLM[];
  } catch (err) {
    console.warn('[SuggestionEngine] AI generation failed:', err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Template-based suggestion generation (fallback)                    */
/* ------------------------------------------------------------------ */

async function fetchTemplates(score: number, categories?: string[]): Promise<SuggestionTemplate[]> {
  let query = supabase
    .from('suggestion_templates')
    .select('*')
    .eq('active', true)
    .lte('min_score', score)
    .gte('max_score', score);

  if (categories && categories.length > 0) {
    query = query.in('category', categories);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(
    (d): SuggestionTemplate => ({
      id: d.id,
      category: d.category as SuggestionTemplate['category'],
      title: d.title,
      description: d.description,
      duration: d.duration,
      points: d.points,
      minScore: d.min_score ?? 0,
      maxScore: d.max_score ?? 100,
      targetWeakness: d.target_weakness,
      difficulty: (d.difficulty as SuggestionTemplate['difficulty']) ?? 'medium',
    }),
  );
}

function rankTemplates(
  templates: SuggestionTemplate[],
  score: number,
  weakAreas: { dimension: string; score: number }[],
  priorityWeaknesses: Set<string>,
  maxSuggestions: number,
): SuggestionTemplate[] {
  const scored = templates.map((t) => {
    let relevance = 0;

    if (t.targetWeakness && priorityWeaknesses.has(t.targetWeakness)) {
      const weakEntry = weakAreas.find((w) => w.dimension === t.targetWeakness);
      relevance += weakEntry ? Math.max(0, 60 - weakEntry.score) : 10;
    }

    if (score < 40 && t.difficulty === 'easy') relevance += 15;
    if (score < 40 && t.difficulty === 'hard') relevance -= 10;
    if (score >= 70 && t.difficulty === 'hard') relevance += 10;
    if (score >= 70 && t.difficulty === 'easy') relevance -= 5;

    relevance += Math.random() * 8;
    return { template: t, relevance };
  });

  scored.sort((a, b) => b.relevance - a.relevance);

  const selected: SuggestionTemplate[] = [];
  const categoryCount: Record<string, number> = {};
  const maxPerCategory = Math.ceil(maxSuggestions / 3);

  for (const { template } of scored) {
    if (selected.length >= maxSuggestions) break;
    const count = categoryCount[template.category] ?? 0;
    if (count >= maxPerCategory) continue;
    selected.push(template);
    categoryCount[template.category] = count + 1;
  }

  return selected;
}

/* ------------------------------------------------------------------ */
/*  Get existing suggestion titles to avoid duplicates                 */
/* ------------------------------------------------------------------ */

async function getExistingSuggestionTitles(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('ai_suggestions')
    .select('title')
    .eq('user_id', userId)
    .eq('completed', false);

  return new Set((data ?? []).map((d) => d.title));
}

/* ------------------------------------------------------------------ */
/*  Core: generate suggestions for a user                             */
/*  Strategy: AI-first with template fallback                         */
/* ------------------------------------------------------------------ */

export async function generateSuggestionsForUser(opts: {
  userId: string;
  score: number;
  breakdown: FreudBreakdown;
  freudScoreId?: string;
  maxSuggestions?: number;
  /** When set, only generate suggestions for this specific category */
  category?: string;
}): Promise<{ inserted: number; source: 'ai' | 'templates' | 'mixed' }> {
  const { userId, score, breakdown, freudScoreId, maxSuggestions = 6, category } = opts;

  // 1. Identify weak areas
  const weakAreas = identifyWeakAreas(breakdown);

  // 2. Determine which categories to prioritise
  const priorityCategories = new Set<string>();
  const priorityWeaknesses = new Set<string>();

  if (category) {
    // Caller requested a specific category — only generate for that one
    priorityCategories.add(category);
    // Still track all weaknesses for template ranking relevance
    for (const { dimension } of weakAreas) {
      priorityWeaknesses.add(dimension);
    }
  } else {
    for (const { dimension } of weakAreas) {
      const cats = WEAKNESS_TO_CATEGORIES[dimension] ?? [];
      cats.forEach((c) => priorityCategories.add(c));
      priorityWeaknesses.add(dimension);
    }

    if (priorityCategories.size === 0) {
      ['mindfulness', 'physical', 'social', 'professional'].forEach((c) =>
        priorityCategories.add(c),
      );
    }
  }

  const categories = Array.from(priorityCategories);

  // 3. Get existing titles to avoid duplicates
  const existingTitles = await getExistingSuggestionTitles(userId);

  // 4. Try AI-powered generation first
  const aiSuggestions = await generateAISuggestions({
    score,
    breakdown,
    weakAreas,
    categories,
    existingTitles: Array.from(existingTitles),
    maxSuggestions,
  });

  let insertedCount = 0;
  let source: 'ai' | 'templates' | 'mixed' = 'templates';

  if (aiSuggestions && aiSuggestions.length > 0) {
    // Filter out any AI suggestions that duplicate existing ones
    const freshAI = aiSuggestions.filter((s) => !existingTitles.has(s.title));

    if (freshAI.length > 0) {
      const aiRows = freshAI.map((s) => ({
        user_id: userId,
        freud_score_id: freudScoreId ?? null,
        category: s.category,
        title: s.title,
        description: s.description,
        duration: s.duration,
        points: s.points,
        difficulty: s.difficulty,
        template_id: null, // AI-generated, no template
      }));

      const { error } = await supabase.from('ai_suggestions').insert(aiRows);
      if (!error) {
        insertedCount = freshAI.length;
        source = 'ai';

        // Add AI titles to existing set for template dedup
        freshAI.forEach((s) => existingTitles.add(s.title));
      } else {
        console.warn('[SuggestionEngine] Failed to insert AI suggestions:', error.message);
      }
    }
  }

  // 5. If AI didn't produce enough, fill remainder with templates
  const remaining = maxSuggestions - insertedCount;
  if (remaining > 0) {
    const templates = await fetchTemplates(score, categories);
    const available = templates.filter((t) => !existingTitles.has(t.title));

    if (available.length > 0) {
      const selected = rankTemplates(available, score, weakAreas, priorityWeaknesses, remaining);

      if (selected.length > 0) {
        const templateRows = selected.map((t) => ({
          user_id: userId,
          freud_score_id: freudScoreId ?? null,
          category: t.category,
          title: t.title,
          description: t.description,
          duration: t.duration,
          points: t.points,
          difficulty: t.difficulty,
          template_id: t.id,
        }));

        const { error } = await supabase.from('ai_suggestions').insert(templateRows);
        if (!error) {
          const templateCount = selected.length;
          insertedCount += templateCount;

          if (source === 'ai' && templateCount > 0) {
            source = 'mixed';
          } else if (source !== 'ai') {
            source = 'templates';
          }
        }
      }
    }
  }

  return { inserted: insertedCount, source };
}

/* ------------------------------------------------------------------ */
/*  Log an activity completion                                         */
/* ------------------------------------------------------------------ */

export async function logActivityCompletion(opts: {
  userId: string;
  suggestionId?: string;
  category: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  pointsEarned: number;
  moodBefore?: string;
  moodAfter?: string;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    user_id: opts.userId,
    suggestion_id: opts.suggestionId ?? null,
    category: opts.category,
    title: opts.title,
    description: opts.description ?? null,
    duration_minutes: opts.durationMinutes ?? null,
    points_earned: opts.pointsEarned,
    mood_before: opts.moodBefore ?? null,
    mood_after: opts.moodAfter ?? null,
    notes: opts.notes ?? null,
  });

  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Get activity stats for a user                                      */
/* ------------------------------------------------------------------ */

export async function getActivityStats(userId: string): Promise<{
  totalActivities: number;
  totalPoints: number;
  thisWeekActivities: number;
  thisWeekPoints: number;
  streak: number;
  byCategory: Record<string, { count: number; points: number }>;
}> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const logs = data ?? [];

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thisWeek = logs.filter((l) => l.created_at >= weekAgo);

  // Calculate streak (consecutive days with at least one activity)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().slice(0, 10);
    const hasActivity = logs.some((l) => l.created_at.slice(0, 10) === dayStr);
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const byCategory: Record<string, { count: number; points: number }> = {};
  for (const log of logs) {
    const cat = log.category;
    if (!byCategory[cat]) byCategory[cat] = { count: 0, points: 0 };
    byCategory[cat].count++;
    byCategory[cat].points += log.points_earned;
  }

  return {
    totalActivities: logs.length,
    totalPoints: logs.reduce((sum, l) => sum + l.points_earned, 0),
    thisWeekActivities: thisWeek.length,
    thisWeekPoints: thisWeek.reduce((sum, l) => sum + l.points_earned, 0),
    streak,
    byCategory,
  };
}
