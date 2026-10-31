import type { CommunityNotification } from './community';
/** Bucket by the original timestamp, never by a translated display string. */
export function isCommunityNotificationToday(
  notification: Pick<CommunityNotification, 'createdAt'>,
  now = new Date(),
): boolean {
  if (!notification.createdAt) return false;
  const date = new Date(notification.createdAt);
  return (
    Number.isFinite(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
export function communityNotificationTarget(
  notification: Pick<CommunityNotification, 'postId' | 'actorId'>,
) {
  if (notification.postId)
    return { pathname: '/(tabs)/community/post' as const, params: { postId: notification.postId } };
  if (notification.actorId)
    return {
      pathname: '/(tabs)/community/profile' as const,
      params: { userId: notification.actorId },
    };
  return null;
}
