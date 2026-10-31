import { canonicalRoute } from '@/lib/legacy-routes';
import { router, type Href } from 'expo-router';
import { ROUTE_PATHS } from '@/lib/route-paths';

const normalize = (path: string) => path.split('?')[0].replace(/\/\([^/]+\)/g, '') || '/';
const patterns = ROUTE_PATHS.map(
  (path) =>
    new RegExp(
      `^${normalize(path)
        .replace(/[.*+?^${}()|\\]/g, '\\$&')
        .replace(/\[[^\]]+\]/g, '[^/]+')}$`,
    ),
);
export function isAppRoute(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    patterns.some((pattern) => pattern.test(normalize(value)))
  );
}
/** Pop the actual history first; validated fallback handles direct links with no history. */
export function backTo(from?: string, fallback: Href = '/(tabs)/home') {
  if (router.canGoBack()) router.back();
  else router.replace(isAppRoute(from) ? (canonicalRoute(from) as Href) : fallback);
}

/** Optional profile answers must not send a completed user through setup again. */
export function entryRouteForProfile(
  hasAssessment: boolean,
  profile: { intention?: string | null; selected_issues?: unknown } | null,
): Href {
  if (!hasAssessment) return '/(onboarding)/assessment';
  const hasIssues = Array.isArray(profile?.selected_issues) && profile.selected_issues.length > 0;
  if (!profile || (!profile.intention && !hasIssues)) return '/(onboarding)/profile-setup';
  if (!hasIssues) return '/(onboarding)/suggested-categories';
  return '/(tabs)/home';
}

/** Top-level destinations switch tabs instead of pushing duplicate tab stacks. */
export function openConversations() {
  router.navigate('/(tabs)/chat');
}
export function returnHome() {
  router.navigate('/(tabs)/home');
}

/** Notification detail is a child of the inbox; returning must not replace it with another inbox entry. */
export function notificationOrigin(value?: unknown): '/(tabs)/profile' | '/(tabs)/home' {
  return value === '/profile' || value === '/(tabs)/profile' ? '/(tabs)/profile' : '/(tabs)/home';
}
export function returnToNotifications(origin?: unknown, tab?: 'settings') {
  router.dismissTo({
    pathname: '/(tabs)/notifications',
    params: { from: notificationOrigin(origin), ...(tab ? { tab } : {}) },
  });
}
/** Never pop back into a notification detail or a legacy redirect. */
export function returnFromNotifications(origin?: unknown) {
  router.navigate(notificationOrigin(origin));
}

/** Completing a flow discards its forms rather than leaving duplicate feature roots. */
export function finishTo(destination: Href) {
  router.dismissTo(destination);
}
