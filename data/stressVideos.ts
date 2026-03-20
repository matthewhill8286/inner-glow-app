export interface StressVideo {
  id: string;
  title: string;
  subtitle: string;
  youtubeId: string;
  thumbnail?: string;
  category: 'body' | 'mind';
}

export const STRESS_VIDEOS: StressVideo[] = [
  {
    id: 'body-1',
    title: 'Full Body Relaxation',
    subtitle: 'Relieve tension from head to toe.',
    youtubeId: '1v6R_789z8c',
    category: 'body',
  },
  {
    id: 'body-2',
    title: 'Neck & Shoulder Release',
    subtitle: 'Quick exercises for desk workers.',
    youtubeId: '7XmEosididA',
    category: 'body',
  },
  {
    id: 'body-3',
    title: 'Gentle Stretching',
    subtitle: 'Flowing movements to open up the body.',
    youtubeId: 'g_tea8ZNk5A',
    category: 'body',
  },
  {
    id: 'mind-1',
    title: 'Deep Breathing Guide',
    subtitle: 'Slow down and find your center.',
    youtubeId: 'aNXKjGFY_MQ',
    category: 'mind',
  },
  {
    id: 'mind-2',
    title: 'Mental Clarity',
    subtitle: 'Focus on your breath and clear your thoughts.',
    youtubeId: 'ZToicYcHIOU',
    category: 'mind',
  },
  {
    id: 'mind-3',
    title: 'Inner Peace',
    subtitle: 'Visualizing a calm and safe space.',
    youtubeId: 'vj0JDwZ7S_c',
    category: 'mind',
  },
  {
    id: 'yt-1',
    title: '10 Minute Stress Relief Yoga',
    subtitle: 'Gentle yoga to release stress.',
    youtubeId: 'sTANio_2E0Q',
    category: 'body',
  },
  {
    id: 'yt-2',
    title: 'Guided Meditation for Anxiety',
    subtitle: 'Find calm in the chaos.',
    youtubeId: 'O-6f5wQXSu8',
    category: 'mind',
  },
];
