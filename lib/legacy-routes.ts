export const LEGACY_ROUTES: Record<string, string> = {
  '/(tabs)/community-new-post': '/(tabs)/community/new-post',
  '/(tabs)/community-post-success': '/(tabs)/community/post-success',
  '/(tabs)/community-post': '/(tabs)/community/post',
  '/(tabs)/community-notifs': '/(tabs)/community/notifications',
  '/(tabs)/community-filter': '/(tabs)/community/filter',
  '/(tabs)/community-profile': '/(tabs)/community/profile',
  '/(tabs)/profile-edit': '/(tabs)/profile/edit',
  '/(tabs)/profile-overview': '/(tabs)/profile/overview',
  '/(tabs)/settings': '/(tabs)/profile/categories',
  '/(tabs)/notification-detail': '/(tabs)/notifications/detail',
};

export function canonicalRoute(path: string): string {
  const queryStart = path.indexOf('?');
  const pathname = queryStart < 0 ? path : path.slice(0, queryStart);
  const query = queryStart < 0 ? '' : path.slice(queryStart);
  const publicPath = pathname.replace(/\/\([^/]+\)/g, '');
  const target = LEGACY_ROUTES['/(tabs)' + publicPath];
  return target ? target + query : path;
}

const FORWARDED_PARAMS = [
  'from',
  'inboxFrom',
  'postId',
  'userId',
  'type',
  'title',
  'body',
  'time',
  'id',
  'tab',
  'route',
  'category',
  'content',
  'categories',
  'types',
];
export function legacyRouteParams(incoming: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of FORWARDED_PARAMS) {
    const value = incoming[key];
    if (typeof value === 'string') params[key] = key === 'from' ? canonicalRoute(value) : value;
  }
  return params;
}
