# Complete microphone permission and recovery flows

Priority: P1

Status: Implemented locally — awaiting device verification

## Source feedback

- Report 20, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALurPFlSvh3R5CjmxnzL6zk.zip) · [screenshot](../evidence/20-1.jpg)
- Report 22, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHDVSXRUHnLkF3RiSthUyJ4.zip) · [screenshot](../evidence/22-1.jpg)

## Cross-reference with current code

Commit 97c7d7b adds MicPermissionError and assessment Settings recovery. app/(tabs)/journal/voice.tsx still catches the error generically and offers retry without a Settings path.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify first request, denied request, permanently denied Settings recovery, returning from Settings, record/replay and retry in both assessment and voice journal on device.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Voice journal now recognises permanently denied microphone permission and offers Open Settings, matching assessment recovery. Returning to the screen retains the retry action. Verify fresh permission, denial, Settings recovery and recording on iPhone.

Validation: `npm run verify` passed TypeScript, lint and 65 existing tests. `node --test tests/mfa-setup.test.cjs` passed four new tests. `git diff --check` passed. These fixes are not included in submitted Build 27 and have not been uploaded to TestFlight.
