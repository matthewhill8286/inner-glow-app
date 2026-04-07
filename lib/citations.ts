/**
 * Citation system for medical/health information
 *
 * Provides types, curated medical source mappings, and utilities
 * for attaching evidence-based citations to AI-generated content.
 */

/* ── Types ─────────────────────────────────────────── */

export type Citation = {
  /** Short display name, e.g. "Mayo Clinic" */
  source: string;
  /** Full title or description of the referenced content */
  title: string;
  /** URL to the source material */
  url: string;
};

/* ── Curated Medical Sources ───────────────────────── */

/**
 * Maps common health/wellness topics to trusted, peer-reviewed or
 * institutional sources. These are used as a lookup when the AI
 * identifies relevant topics in its response.
 */
export const MEDICAL_SOURCES: Record<string, Citation[]> = {
  /* ── Mental Health & Therapy ── */
  cbt: [
    {
      source: 'APA',
      title: 'What is Cognitive Behavioral Therapy?',
      url: 'https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral',
    },
    {
      source: 'NIMH',
      title: 'Psychotherapies',
      url: 'https://www.nimh.nih.gov/health/topics/psychotherapies',
    },
  ],
  anxiety: [
    {
      source: 'NIMH',
      title: 'Anxiety Disorders',
      url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
    },
    {
      source: 'Mayo Clinic',
      title: 'Anxiety Disorders — Symptoms and Causes',
      url: 'https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961',
    },
  ],
  depression: [
    {
      source: 'NIMH',
      title: 'Depression',
      url: 'https://www.nimh.nih.gov/health/topics/depression',
    },
    {
      source: 'WHO',
      title: 'Depressive Disorder (Depression)',
      url: 'https://www.who.int/news-room/fact-sheets/detail/depression',
    },
  ],
  therapy: [
    {
      source: 'APA',
      title: 'Understanding Psychotherapy and How It Works',
      url: 'https://www.apa.org/topics/psychotherapy/understanding',
    },
  ],

  /* ── Stress ── */
  stress: [
    {
      source: 'APA',
      title: 'Stress Effects on the Body',
      url: 'https://www.apa.org/topics/stress/body',
    },
    {
      source: 'Mayo Clinic',
      title: 'Stress Management',
      url: 'https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/stress/art-20046037',
    },
  ],
  cortisol: [
    {
      source: 'Cleveland Clinic',
      title: 'Cortisol: What It Is, Function, Symptoms & Levels',
      url: 'https://my.clevelandclinic.org/health/articles/22187-cortisol',
    },
  ],

  /* ── Mindfulness & Meditation ── */
  mindfulness: [
    {
      source: 'NCCIH (NIH)',
      title: 'Meditation and Mindfulness: What You Need to Know',
      url: 'https://www.nccih.nih.gov/health/meditation-and-mindfulness-what-you-need-to-know',
    },
    {
      source: 'APA',
      title: 'Mindfulness Meditation: A Research-Proven Way to Reduce Stress',
      url: 'https://www.apa.org/topics/mindfulness/meditation',
    },
  ],
  meditation: [
    {
      source: 'NCCIH (NIH)',
      title: 'Meditation and Mindfulness: What You Need to Know',
      url: 'https://www.nccih.nih.gov/health/meditation-and-mindfulness-what-you-need-to-know',
    },
  ],
  breathing: [
    {
      source: 'Cleveland Clinic',
      title: 'Diaphragmatic Breathing Exercises & Techniques',
      url: 'https://my.clevelandclinic.org/health/articles/9445-diaphragmatic-breathing',
    },
    {
      source: 'Harvard Health',
      title: 'Relaxation Techniques: Breath Control Helps Quell Errant Stress Response',
      url: 'https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response',
    },
  ],

  /* ── Sleep ── */
  sleep: [
    {
      source: 'Sleep Foundation',
      title: 'How Much Sleep Do You Need?',
      url: 'https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need',
    },
    {
      source: 'CDC',
      title: 'Sleep and Sleep Disorders',
      url: 'https://www.cdc.gov/sleep/index.html',
    },
  ],
  sleep_hygiene: [
    {
      source: 'Sleep Foundation',
      title: 'Sleep Hygiene',
      url: 'https://www.sleepfoundation.org/sleep-hygiene',
    },
    {
      source: 'Mayo Clinic',
      title: 'Sleep Tips: 6 Steps to Better Sleep',
      url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/sleep/art-20048379',
    },
  ],
  insomnia: [
    {
      source: 'Mayo Clinic',
      title: 'Insomnia — Symptoms and Causes',
      url: 'https://www.mayoclinic.org/diseases-conditions/insomnia/symptoms-causes/syc-20355167',
    },
    {
      source: 'NIMH',
      title: 'Tips for Better Sleep',
      url: 'https://www.nimh.nih.gov/health/publications/tips-for-better-sleep',
    },
  ],
  circadian: [
    {
      source: 'NIGMS (NIH)',
      title: 'Circadian Rhythms',
      url: 'https://nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx',
    },
    {
      source: 'Sleep Foundation',
      title: 'What Is a Circadian Rhythm?',
      url: 'https://www.sleepfoundation.org/circadian-rhythm',
    },
  ],
  melatonin: [
    {
      source: 'NCCIH (NIH)',
      title: 'Melatonin: What You Need to Know',
      url: 'https://www.nccih.nih.gov/health/melatonin-what-you-need-to-know',
    },
  ],
  rem: [
    {
      source: 'Sleep Foundation',
      title: 'Stages of Sleep: What Happens in a Sleep Cycle',
      url: 'https://www.sleepfoundation.org/stages-of-sleep',
    },
  ],
  caffeine: [
    {
      source: 'Sleep Foundation',
      title: 'Caffeine and Sleep',
      url: 'https://www.sleepfoundation.org/nutrition/caffeine-and-sleep',
    },
  ],
  screen_time: [
    {
      source: 'Sleep Foundation',
      title: 'How Electronics Affect Sleep',
      url: 'https://www.sleepfoundation.org/how-sleep-works/how-electronics-affect-sleep',
    },
  ],

  /* ── Exercise & Physical Health ── */
  exercise: [
    {
      source: 'WHO',
      title: 'Physical Activity',
      url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
    },
    {
      source: 'CDC',
      title: 'Benefits of Physical Activity',
      url: 'https://www.cdc.gov/physicalactivity/basics/pa-health/index.htm',
    },
  ],
  exercise_mental_health: [
    {
      source: 'Harvard Health',
      title: 'Exercise Is an All-Natural Treatment to Fight Depression',
      url: 'https://www.health.harvard.edu/mind-and-mood/exercise-is-an-all-natural-treatment-to-fight-depression',
    },
    {
      source: 'APA',
      title: 'Working Out Boosts Brain Health',
      url: 'https://www.apa.org/topics/exercise-fitness/stress',
    },
  ],

  /* ── Mood & Emotions ── */
  mood: [
    {
      source: 'NIMH',
      title: 'Caring for Your Mental Health',
      url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
    },
  ],
  emotional_regulation: [
    {
      source: 'APA',
      title: 'Emotion Regulation',
      url: 'https://www.apa.org/topics/emotion-regulation',
    },
  ],
  gratitude: [
    {
      source: 'Harvard Health',
      title: 'Giving Thanks Can Make You Happier',
      url: 'https://www.health.harvard.edu/healthbeat/giving-thanks-can-make-you-happier',
    },
  ],

  /* ── Journaling ── */
  journaling: [
    {
      source: 'University of Rochester Medical Center',
      title: 'Journaling for Mental Health',
      url: 'https://www.urmc.rochester.edu/encyclopedia/content.aspx?ContentID=4552&ContentTypeID=1',
    },
    {
      source: 'Harvard Health',
      title: 'Writing About Emotions May Ease Stress and Trauma',
      url: 'https://www.health.harvard.edu/healthbeat/writing-about-emotions-may-ease-stress-and-trauma',
    },
  ],

  /* ── Social Connection ── */
  social: [
    {
      source: 'CDC',
      title: 'How Does Social Connectedness Affect Health?',
      url: 'https://www.cdc.gov/emotional-wellbeing/social-connectedness/affect-health.html',
    },
    {
      source: 'NIMH',
      title: 'Social Media and Mental Health',
      url: 'https://www.nimh.nih.gov/health/topics/social-media-and-mental-health',
    },
  ],

  /* ── Professional Help ── */
  professional_help: [
    {
      source: 'NIMH',
      title: 'Help for Mental Illnesses',
      url: 'https://www.nimh.nih.gov/health/find-help',
    },
    {
      source: 'SAMHSA',
      title: 'National Helpline',
      url: 'https://www.samhsa.gov/find-help/national-helpline',
    },
  ],
};

/* ── Topic Detection Keywords ──────────────────────── */

/**
 * Maps keywords found in AI responses to their corresponding
 * source topic keys in MEDICAL_SOURCES above.
 */
const KEYWORD_TO_TOPIC: [RegExp, string][] = [
  // Sleep
  [/\b(sleep hygiene|bedtime routine|sleep schedule)\b/i, 'sleep_hygiene'],
  [/\b(insomnia|can't sleep|trouble sleeping|difficulty sleeping)\b/i, 'insomnia'],
  [/\b(circadian|body clock|sleep.wake cycle)\b/i, 'circadian'],
  [/\b(melatonin)\b/i, 'melatonin'],
  [/\b(rem sleep|deep sleep|sleep cycle|sleep stage)\b/i, 'rem'],
  [/\b(caffeine|coffee|tea)\b/i, 'caffeine'],
  [/\b(screen time|blue light|electronic|phone before bed)\b/i, 'screen_time'],
  [/\b(sleep|nap|rest|slumber)\b/i, 'sleep'],

  // Mental health
  [/\b(cbt|cognitive.behav|thought pattern|negative thought)\b/i, 'cbt'],
  [/\b(anxi|worry|panic|nervous|fear)\b/i, 'anxiety'],
  [/\b(depress|low mood|hopeless|sadness)\b/i, 'depression'],
  [/\b(therap|counseling|psycholog|psychiatr)\b/i, 'therapy'],

  // Stress
  [/\b(cortisol|stress hormone)\b/i, 'cortisol'],
  [/\b(stress|tension|overwhelm|burnout)\b/i, 'stress'],

  // Mindfulness
  [/\b(mindful|present moment|awareness)\b/i, 'mindfulness'],
  [/\b(meditat|zen|contemplat)\b/i, 'meditation'],
  [/\b(breath|inhale|exhale|diaphragm)\b/i, 'breathing'],

  // Exercise
  [/\b(exercise|workout|physical activity).*(mental|mood|stress|depress|anxi)/i, 'exercise_mental_health'],
  [/\b(exercise|workout|physical activity|walking|running|yoga|stretch)\b/i, 'exercise'],

  // Mood & emotions
  [/\b(emotion.regul|manag.*emotion|cop.*strateg)\b/i, 'emotional_regulation'],
  [/\b(gratitude|grateful|thankful)\b/i, 'gratitude'],
  [/\b(mood|feeling|emotion)\b/i, 'mood'],

  // Journaling
  [/\b(journal|writing|diary|express.*thought)\b/i, 'journaling'],

  // Social
  [/\b(social.*connect|social.*support|community|relationship|isolation|lonely)\b/i, 'social'],

  // Professional
  [/\b(professional.*help|seek.*help|mental.*health.*provider|therapist|counselor|hotline|crisis)\b/i, 'professional_help'],
];

/* ── Citation Extraction ───────────────────────────── */

/**
 * Scans a text response and returns relevant citations based on
 * keyword matching against the curated medical source database.
 *
 * De-duplicates citations by URL and limits to a sensible count.
 */
export function extractCitations(text: string, maxCitations = 4): Citation[] {
  const matched = new Map<string, Citation>(); // keyed by URL

  for (const [pattern, topicKey] of KEYWORD_TO_TOPIC) {
    if (pattern.test(text)) {
      const sources = MEDICAL_SOURCES[topicKey];
      if (sources) {
        for (const citation of sources) {
          if (!matched.has(citation.url)) {
            matched.set(citation.url, citation);
          }
        }
      }
    }
    // Stop early if we have plenty of matches
    if (matched.size >= maxCitations * 2) break;
  }

  // Return up to maxCitations, prioritising variety of sources
  const results = Array.from(matched.values());
  if (results.length <= maxCitations) return results;

  // Prefer one source per institution
  const bySource = new Map<string, Citation>();
  const extras: Citation[] = [];

  for (const c of results) {
    if (!bySource.has(c.source)) {
      bySource.set(c.source, c);
    } else {
      extras.push(c);
    }
  }

  const diverse = Array.from(bySource.values());
  if (diverse.length >= maxCitations) return diverse.slice(0, maxCitations);

  return [...diverse, ...extras].slice(0, maxCitations);
}

/**
 * Merge citations from the LLM (if provided) with locally extracted ones.
 * De-duplicates by URL.
 */
export function mergeCitations(
  llmCitations: Citation[],
  localCitations: Citation[],
  maxTotal = 5,
): Citation[] {
  const seen = new Set<string>();
  const merged: Citation[] = [];

  // LLM citations take priority
  for (const c of llmCitations) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      merged.push(c);
    }
  }

  // Fill with local matches
  for (const c of localCitations) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      merged.push(c);
    }
    if (merged.length >= maxTotal) break;
  }

  return merged.slice(0, maxTotal);
}
