import { router } from 'expo-router';
import type { Practice } from '@/data/practices';

/**
 * Where a practice opens: its Set up screen, or for Relax videos the existing body and mind lists
 * until the video details and player are rebuilt (07 §2.10–2.13).
 */
export function openPractice(p: Practice) {
  if (p.kind === 'video')
    router.push({
      pathname: '/(tabs)/stress/list/[category]',
      params: { category: p.category === 'relax-body' ? 'body' : 'mind' },
    });
  else router.push({ pathname: '/(tabs)/mindful/practice/[id]', params: { id: p.id } });
}
