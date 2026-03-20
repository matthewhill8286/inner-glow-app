export type IssueKey =
  | 'anxiety'
  | 'depression'
  | 'stress'
  | 'burnout'
  | 'sleep'
  | 'relationships'
  | 'grief'
  | 'panic';

export type Issue = {
  key: IssueKey;
  title: string;
  description: string;
  tags: string[];
};

export const ISSUES: Issue[] = [
  {
    key: 'anxiety',
    title: 'Anxiety',
    description: 'Worry loops, overthinking, tension.',
    tags: ['grounding', 'reframing'],
  },
  {
    key: 'depression',
    title: 'Low mood',
    description: 'Low motivation, hopelessness, numbness.',
    tags: ['tiny steps', 'self-compassion'],
  },
  {
    key: 'stress',
    title: 'Stress',
    description: 'Overload, pressure, and edge-of-seat feelings.',
    tags: ['breathing', 'boundaries'],
  },
  {
    key: 'burnout',
    title: 'Burnout',
    description: 'Exhaustion, cynicism, reduced effectiveness.',
    tags: ['recovery', 'values'],
  },
  {
    key: 'sleep',
    title: 'Sleep',
    description: 'Falling asleep, staying asleep, quality.',
    tags: ['sleep hygiene'],
  },
  {
    key: 'relationships',
    title: 'Relationships',
    description: 'Conflict, loneliness, communication.',
    tags: ['communication'],
  },
  {
    key: 'grief',
    title: 'Grief',
    description: 'Loss, mourning, waves of sadness.',
    tags: ['processing'],
  },
  {
    key: 'panic',
    title: 'Panic',
    description: 'Sudden fear, racing heart, dread.',
    tags: ['panic cycle'],
  },
];
