# Improve rain volume and loop quality

Priority: P2

Status: Implemented — rain is now a 3 min 14 s seamless loop built from the original (was 54 s), about 2.5 dB louder, and soundscapes play at 85% instead of 60%; listen on a device to confirm

## Source feedback

- Report 4, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AJW62DuI9_TyLLvY0n4kIi0.zip) · [screenshot](../evidence/04-1.jpg)

## Cross-reference with current code

The tester reports low rain volume and an obvious short loop. Source inspection cannot validate perceptual audio quality.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Listen on a physical iPhone and headphones, balance rain against other soundscapes, and verify seamless looping over multiple cycles.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
