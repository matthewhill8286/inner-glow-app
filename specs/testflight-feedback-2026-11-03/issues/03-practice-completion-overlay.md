# Dismiss completion overlay before opening Glow AI

Priority: P1

Status: Implemented locally — awaiting device verification

## Source feedback

- Report 3, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ABBVMlhFzo_nkmY0JtnfG5k.zip) · [screenshot](../evidence/03-1.jpg)

## Cross-reference with current code

app/(tabs)/mindful/play/[id].tsx navigates from CompleteModal onReflect without clearing done. This matches a possible overlay lifetime problem; native reproduction is required.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Complete wind-down, select Reflect with Glow AI, and verify chat is interactive with no completion overlay. Verify closing and repeating the flow.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Both soundscape and video completion actions now clear the completion modal before navigating back or into Glow AI. Reproduce the original wind-down → Reflect flow on iPhone before closing.

Validation: `npm run verify` passed TypeScript, lint and 65 existing tests. `node --test tests/mfa-setup.test.cjs` passed four new tests. `git diff --check` passed. These fixes are not included in submitted Build 27 and have not been uploaded to TestFlight.
