# Render the practice goal ring correctly at zero

Priority: P2

Status: Implemented — the goal ring's drawing has room for the knob, so it is no longer clipped at 0 min; device retest required

## Source feedback

- Report 9, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AOVuC43PpBH-ef8BLXio9po.zip) · [screenshot](../evidence/09-1.jpg)

## Cross-reference with current code

The Build 26 screenshot shows a distorted zero-of-ten goal ring. Inspect SVG circle rendering in app/(tabs)/mindful/index.tsx; no Build 27 change addresses it.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify 0, 1, 9, 10 and over-goal sessions on device; ensure no oversized arc, clipping, or invalid zero-progress rendering.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
