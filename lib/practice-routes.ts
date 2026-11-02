import { router } from 'expo-router';
import type { Practice } from '@/data/practices';

/** A practice opens its Set up screen, or Video details for Relax videos (07 §2.6, §2.12). */
export function openPractice(p: Practice) {
  router.push({ pathname: '/(tabs)/mindful/practice/[id]', params: { id: p.id } });
}
