# Make QR setup and repeated enrollment reliable

Priority: P1

Status: Implemented — authenticator QR/layout checked in iPhone simulator; physical-device verification pending

## Source feedback

- Report 1, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ANbUS2r6yJ0I6DdvCfV0Zt0.zip) · [screenshot](../evidence/01-1.jpg)
- Report 27, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ABCNi0iVjbCEXfzUXL_0atA.zip) · Screenshot omitted because it contains an authenticator provisioning secret.

## Cross-reference with current code

Two-factor setup renders its QR using a React Native Image URI and enrolls InnerGlowAuthenticator after cleaning unverified factors. Build 26 still reports a duplicate friendly name. Build 27 changes keyboard handling, not this enrollment logic. See app/(auth)/two-factor-setup.tsx.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify QR rendering on iPhone, retry and re-entry without duplicate factors, existing verified-factor handling, and alignment with the current design.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Serialized overlapping setup requests per account, checked cleanup errors before enrollment, preserved verified factors, and rendered Supabase SVG QR codes with SvgXml. Added four behaviour tests for concurrent setup, verified-factor preservation, cleanup/retry and QR decoding. No live account factors were changed. The design comparison and native scan/re-entry checks remain outstanding.

Validation: `npm run verify` passed TypeScript, lint and 65 existing tests. `node --test tests/mfa-setup.test.cjs` passed four new tests. `git diff --check` passed. These fixes are not included in submitted Build 27 and have not been uploaded to TestFlight.

## Native investigation — 3 November 2026

Authenticator setup now uses the shared palette, Type typography, AppButton, IconButton, surface cards and input styling instead of the old brown/olive screen. iPhone 17 Pro / iOS 26.5: entered from Security → Two-step verification → Turn on; QR visibly rendered and Verify & Enable remained disabled without six digits. No factor was verified or security protection disabled. Scanning with a separate authenticator and repeated enrollment still need device checks.

See [verification record](../verification.md). These changes are not in submitted Build 27.
