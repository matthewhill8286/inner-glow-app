export type JournalPrompt = {
  id: string;
  title: string;
  prompt: string;
  category: 'stress' | 'mood' | 'sleep' | 'self' | 'relationships';
};

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: 'p1',
    title: 'What’s on your mind?',
    prompt: 'Write freely. If it helps, start with: “Right now I feel…”',
    category: 'mood',
  },
  {
    id: 'p2',
    title: 'Small wins',
    prompt: 'List 3 small wins from today, even if they feel tiny.',
    category: 'self',
  },
  {
    id: 'p3',
    title: 'Stress snapshot',
    prompt: 'What triggered your stress? What helped (even a little)?',
    category: 'stress',
  },
  {
    id: 'p4',
    title: 'Kind self-talk',
    prompt: 'What would you say to a friend in your situation? Write that to yourself.',
    category: 'self',
  },
  {
    id: 'p5',
    title: 'Sleep unpack',
    prompt: 'What might improve your sleep tonight? One realistic thing.',
    category: 'sleep',
  },
  {
    id: 'p6',
    title: 'Connection check-in',
    prompt: 'Is there a conversation you’re avoiding? What’s one gentle first step?',
    category: 'relationships',
  },
];
