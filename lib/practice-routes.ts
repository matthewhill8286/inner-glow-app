import { router } from 'expo-router';
import type { Practice } from '@/data/practices';

/** A practice opens its Set up screen, or Video details for Relax videos (07 §2.6, §2.12). */
export function openPractice(p: Practice, duration?: number) {
  router.push({ pathname: '/(tabs)/mindful/practice/[id]', params: duration ? { id: p.id, duration: String(duration) } : { id: p.id } });
}
