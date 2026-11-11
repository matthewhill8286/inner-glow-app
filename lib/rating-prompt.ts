/**
 * "Is Inner Glow helping you?" (`6845:8787`) asks after a completed day, once the person has used
 * the app on three different days, and then not again for 90 days. A "Yes" leads to Apple's rating
 * sheet (`6845:8855`); "Not really" opens feedback.
 */
const DAY = 86_400_000;
export const MIN_ACTIVE_DAYS = 3;
export const ASK_AGAIN_AFTER_DAYS = 90;

export function shouldAskHelping(
  activeDays: number,
  lastAskedAt: number | null,
  now = Date.now(),
): boolean {
  if (activeDays < MIN_ACTIVE_DAYS) return false;
  if (lastAskedAt && now - lastAskedAt < ASK_AGAIN_AFTER_DAYS * DAY) return false;
  return true;
}
