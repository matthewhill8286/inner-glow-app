import { canonicalRoute } from './legacy-routes';

// Tab bar order from the design: Home, Practices (mindful), Glow AI (chat), Journal, Profile.
const PRIMARY_TABS = ['home', 'mindful', 'chat', 'journal', 'profile'];
const FEATURES = [
  'chat',
  'journal',
  'mood',
  'sleep',
  'stress',
  'mindful',
  'freud-score',
  'community',
  'profile',
  'notifications',
];
export function normalizedRoute(path: string): string {
  return (
    canonicalRoute(path.split('?')[0])
      .replace(/\/\([^/]+\)/g, '')
      .replace(/\/$/, '') || '/'
  );
}
export function isPrimaryTabPath(path: string): boolean {
  return PRIMARY_TABS.some((feature) => normalizedRoute(path) === '/' + feature);
}
/** Parent fallback for direct links. Normal in-app Back still pops actual history. */
export function parentRouteForPath(path: string): string {
  const route = normalizedRoute(path);
  if (route === '/freud-score/ai-suggestion-category') return '/(tabs)/freud-score/ai-suggestions';
  if (route.startsWith('/stress/breathing/')) return '/(tabs)/stress/breathing';
  if (route.startsWith('/stress/list/')) {
    const parts = route.split('/');
    return parts.length > 4 ? '/(tabs)' + parts.slice(0, -1).join('/') : '/(tabs)/stress';
  }
  for (const feature of FEATURES) {
    if (route.startsWith('/' + feature + '/')) return '/(tabs)/' + feature;
    if (route === '/' + feature) return '/(tabs)/home';
  }
  if (
    [
      '/delete-account',
      '/blocked-users',
      '/ai-privacy',
      '/support',
      '/trial-upgrade',
      '/legal',
    ].includes(route)
  )
    return '/(tabs)/profile';
  if (['/forgot-password', '/reset-password'].includes(route)) return '/(auth)/sign-in';
  return '/(tabs)/home';
}

export type PrimaryTab = 'home' | 'mindful' | 'chat' | 'journal' | 'profile';
/** Every feature has a visible tab owner, even when its own route is hidden. */
export function primaryTabForPath(path: string): PrimaryTab {
  const root = normalizedRoute(path).split('/')[1];
  return PRIMARY_TABS.includes(root) ? (root as PrimaryTab) : 'home';
}
