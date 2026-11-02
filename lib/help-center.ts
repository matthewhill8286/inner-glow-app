export const HELP_CATEGORIES = ['all', 'glow', 'privacy', 'plans', 'sleep'] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];
export const HELP_QUESTIONS = [
  { id: 'therapist', category: 'glow' },
  { id: 'score', category: 'glow' },
  { id: 'privacy', category: 'privacy' },
  { id: 'cancel', category: 'plans' },
  { id: 'offline', category: 'all' },
  { id: 'reminders', category: 'sleep' },
] as const;

export type HelpQuestion = {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/ς/g, 'σ');
}

export function filterHelpQuestions(
  questions: readonly HelpQuestion[],
  category: HelpCategory,
  query: string,
) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return questions.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    const text = normalize(`${item.question} ${item.answer}`);
    return words.every((word) => text.includes(word));
  });
}
