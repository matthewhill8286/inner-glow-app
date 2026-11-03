# Align Home score and header icons

Priority: P2

Status: Implemented — icon sizes aligned, and the score number now centres on the aura's rings (commit 06d4232, in #46); device retest required

## Source feedback

- Report 10, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AC8nF2GKRSt4detuAvEJ9x4.zip) · [screenshot](../evidence/10-1.jpg)
- Report 12, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AEa8se4B_Fo5zzqY9N7c5T0.zip) · [screenshot](../evidence/12-1.jpg)

## Cross-reference with current code

Home uses search iconSize 20 and notification iconSize 24. The score number is also reported off-centre. See app/(tabs)/home.tsx.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Match the approved optical sizing and alignment of both header icons and centre the score across single, double and triple digits.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Search and notification icons now both use size 24. Score artwork/number optical centring still needs design and device comparison; this task is not complete.

Changes are local and are not in submitted Build 27. Automated regression tests pass; native navigation, persistence and layout need iPhone verification before closure.
