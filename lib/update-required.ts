/** Update required (`6832:8215`): true when this native build is below the platform's minimum. */
export function needsUpdate(currentBuild: string | null | undefined, minBuild: unknown): boolean {
  const min = Number(minBuild);
  const current = Number(currentBuild);
  if (!Number.isFinite(min) || min <= 0) return false;
  if (!Number.isFinite(current) || current <= 0) return false; // Dev clients and web have no build number.
  return current < min;
}
