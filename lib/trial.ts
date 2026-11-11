/**
 * Trial ends banner (`6809:6897`). The card shows on the last day of the trial: when the trial ends
 * later today or tomorrow, in the person's local calendar.
 */
export function trialEndsIn(
  expiryDate: string | null | undefined,
  now: Date = new Date(),
): 'today' | 'tomorrow' | null {
  if (!expiryDate) return null;
  const end = new Date(expiryDate);
  if (!Number.isFinite(end.getTime()) || end.getTime() <= now.getTime()) return null;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(end) - startOf(now)) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return null;
}
