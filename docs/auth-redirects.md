# Password recovery redirects

On 16 October 2026, the production Supabase project ufbhteewrbcvcqxdzsui had `site_url = http://localhost:8081` and an empty redirect allow list. Password recovery requests therefore fell back to a development address.

The live default is now `innerglow://reset-password`. Exact allowed destinations include `innerglow://reset-password`, its triple-slash equivalent, and the existing Build 23 grouped-route variants `innerglow:///(auth)/reset-password` and `innerglow://(auth)/reset-password`, including percent-encoded parentheses. No localhost redirect is approved.

All three recovery methods now use `PASSWORD_RESET_REDIRECT` from `lib/auth-redirects.ts`, instead of deriving an email destination from the current Expo/web host. This code change requires the next binary, but the production configuration fix also applies to Build 23 and earlier installed builds.

Verification used admin-generated recovery links for the dedicated review account without sending emails or changing passwords. New native, legacy native and localhost-requested links all resolved to an approved app destination with no localhost fallback. TypeScript and 53 automated tests passed. Lint completed with zero errors and existing warnings.

Existing email links may retain their previous redirect or be expired. Request a fresh reset email and open it on the iPhone with Inner Glow installed. Password entry and submission must be completed by the account owner. Never save or publish recovery tokens.
