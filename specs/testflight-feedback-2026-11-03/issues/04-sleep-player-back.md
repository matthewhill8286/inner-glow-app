# Restore sleep player Back navigation

Priority: P2

Status: Outstanding

## Source feedback

- Report 4, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AJW62DuI9_TyLLvY0n4kIi0.zip) · [screenshot](../evidence/04-1.jpg)

## Cross-reference with current code

The practice player intercepts Back with an end-session confirmation in app/(tabs)/mindful/play/[id].tsx. Report 4 says Back does not work. No Build 27 fix found.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify Back while playing and paused, cancel/end confirmation, and return to the originating sleep screen without stranded overlays or audio.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
