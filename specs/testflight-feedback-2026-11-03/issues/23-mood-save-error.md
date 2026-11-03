# Reproduce and resolve mood save failure

Priority: P1

Status: Not reproduced — current backend and iPhone simulator saves passed

## Source feedback

- Report 29, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ABw1C7fwlQJv0QIMjOyQtrk.zip) · [screenshot](../evidence/29-1.jpg)

## Cross-reference with current code

Build 23 screenshot reports mood could not be saved. It contains no diagnostic trace sufficient to establish cause or a verified fix.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Test first and repeat check-ins, authenticated and expired sessions, reconnect/retry, and persistence after relaunch. Capture a redacted error and identify a fix before closing.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Native investigation — 3 November 2026

Ran a real insert using the redesigned mood payload (null optional energy/stress and empty factors) against Supabase with the review account; save passed and the identified probe row was deleted. The saved disposable deletion-account credentials were invalid, so that account was not used. In the native app, Profile → Glow score → Check in now → Continue → Save mood reached Mood logged and Profile displayed the check-in. The earlier migration already allows null optional scores and adds factors. No speculative database or mood-write change was made for the historical Build 23 error. Offline, expired-session and physical-device checks remain outstanding; the original failure is not claimed diagnosed.

See [verification record](../verification.md). These changes are not in submitted Build 27.
