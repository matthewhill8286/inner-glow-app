/**
 * Friendly auth errors (`6832:7549`, `6832:7603`). Supabase errors are mapped to a small set of
 * kinds, and each kind has its own message under `authErrors` in the translations. The raw
 * Supabase text is never shown.
 */
export type AuthErrorKind =
  | 'wrongPassword'
  | 'emailInUse'
  | 'unconfirmed'
  | 'weakPassword'
  | 'rateLimited'
  | 'network'
  | 'other';

type AuthLikeError = { code?: unknown; message?: unknown; status?: unknown; name?: unknown };

export function authErrorKind(err: unknown): AuthErrorKind {
  const e = (err ?? {}) as AuthLikeError;
  const code = typeof e.code === 'string' ? e.code : '';
  const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';
  if (code === 'invalid_credentials' || message.includes('invalid login credentials'))
    return 'wrongPassword';
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered'))
    return 'emailInUse';
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'unconfirmed';
  if (code === 'weak_password') return 'weakPassword';
  if (code.startsWith('over_') || e.status === 429) return 'rateLimited';
  if (
    e.name === 'AuthRetryableFetchError' ||
    message.includes('network request failed') ||
    message.includes('failed to fetch')
  )
    return 'network';
  return 'other';
}

/**
 * With email confirmation on, Supabase doesn't report a taken email on sign-up. It returns a user
 * with no identities instead, so that case is treated as "email already in use".
 */
export function isTakenSignUp(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}
