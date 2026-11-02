/**
 * Helpers for the password reset flow (01 §2.10, 08 §2.1–2.3).
 * Kept free of imports so the tests can load it on its own.
 */

export const RESET_CODE_LENGTH = 6;
/** Supabase sends at most one recovery email a minute, so Resend waits this long (08 §2.1). */
export const RESEND_SECONDS = 60;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** "h•••@gmail.com": the first letter of the name, three dots and the domain. */
export function maskEmail(email: string): string {
  const [name, domain] = email.trim().split('@');
  if (!name || !domain) return email.trim();
  return `${name[0]}•••@${domain}`;
}

/** Keeps only digits, up to the code length (paste and iOS autofill can bring spaces or dashes). */
export function cleanCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH);
}

/** "0:42" for the resend countdown. */
export function countdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The three live rules on New password (08 §2.2). */
export function passwordRules(password: string, confirm: string) {
  return {
    length: password.length >= 8,
    symbol: /[^\p{L}]/u.test(password),
    match: password.length > 0 && password === confirm,
  };
}
