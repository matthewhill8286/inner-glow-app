export const PASSWORD_MIN_LENGTH = 8;

/** At least 8 characters with a number or symbol (design 08 §2.2). Supabase enforces the length too. */
export function passwordMeetsPolicy(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && /[^\p{L}]/u.test(password);
}
