# Production diagnostics and access recovery

The signed-in app sends a fixed event name, error code, random reference, platform and release number to the `client-diagnostics` Supabase function. It never sends exception text, message contents, journal entries, email, user IDs, URLs or tokens in this payload. Supabase infrastructure may retain its own request metadata under the project's log retention settings.

To investigate a reported reference, open Supabase → Edge Functions → client-diagnostics → Logs and search that reference. Check the event and release, then reproduce the relevant action. Service errors map HTTP status codes to the fixed diagnostic taxonomy. These logs cover JavaScript errors and handled service/billing failures; they do not replace native crash reports in App Store Connect.

The device queue holds at most 20 events and retries on foreground or subsequent events. The endpoint requires a valid user session and applies a best-effort, per-instance limit of ten events per user per minute. This is not a distributed rate limiter. Diagnostics failures do not block app usage. Deploy using scripts/deploy-functions.cjs. Confirm log retention in Supabase's project settings before increasing the fields collected.

Premium access is shared across Profile, the paywall and feature gates. A successful receipt publishes immediately, but only for the account that initiated the purchase. Receipt updates trigger fresh verification. Delayed requests cannot overwrite newer receipts, malformed caches are rejected, and temporary verification failure preserves existing unexpired access. Profile exposes Refresh access and Restore Purchases for recovery.

## Device release checks

For each new TestFlight build, verify purchase and restore on the same signed-in account, account switching without leaked premium access, and foreground refresh after a subscription update. Check the sleep alarm rings on a locked phone and Stop works. Check notification delivery on a locked phone and its destination after tapping. These checks require the installed native build; passing automated tests does not establish physical alarm or notification delivery.

Navigation checks: Home → Continue a conversation → Back to Home; quick-start prompt → immediate user message → assistant response; failed response → retry without duplicate user messages; conversation back returns to Chat. Check Profile and paywall agree about access.

## Access boundaries for the updated release

Free signed-in tools: mood and sleep logging, text journaling, existing conversation reading, basic records/charts, breathing, grounding, the manual stress plan, alarms and reminders. Search must not label the onboarding assessment as Premium.

An active trial or Premium is required for new AI replies, AI mood/sleep analysis, generated suggestions and voice transcription. The five AI Edge Functions retain the shared server access check. Reading a conversation must not trigger an AI request. Paid benefit copy must not list free tracking or text journaling as an exclusive feature.

Notification routing: detail returns to Notifications using navigate, and Notifications returns to Home. Do not replace the detail with a new Notifications route or push another copy from its Settings link.
