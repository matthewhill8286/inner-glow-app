# Retest assessment keyboard dismissal

Priority: P2

Status: Implemented in Build 27 — device retest required

## Source feedback

- Report 17, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ANnZy3itE8o1-yMVf8z9qlc.zip) · [screenshot](../evidence/17-1.jpg)
- Report 19, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHHRUEIi8o8WUX0pG3PVQhA.zip) · [screenshot](../evidence/19-1.jpg)

## Cross-reference with current code

Commit 97c7d7b adds swipe-down dismissal on scrolling and non-scrolling screens. Assessment and keyboard tests passed before release; no tester confirmation yet.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify swipe dismissal while writing an assessment and searching medication, preserving input, selection, scrolling and focused-field visibility.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
