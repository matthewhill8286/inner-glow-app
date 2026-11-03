# Verify assessment goals and medication branching

Priority: P2

Status: Implemented in Build 27 — device retest required

## Source feedback

- Report 21, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ACfkXD50TQqI5KdaxXRAKEc.zip) · [screenshot](../evidence/21-1.jpg)
- Report 39, Build 11: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALAOCuPkJgEyFw4EGM2josY.zip) · [screenshot](../evidence/39-1.jpg)
- Report 36, Build 11: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMLGAxyCOZPhYXrJVd42zcU.zip) · [screenshot](../evidence/36-1.jpg)

## Cross-reference with current code

Commit 97c7d7b implements goal multi-select and medication choices with exclusive none/prefer-not options. lib/assessment-flow.ts controls follow-up branching. Supersedes the old Yes-only wording.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Select multiple goals and medications, reload draft, deselect choices, and test exclusive none/prefer-not answers. Next must remain disabled without a required answer. Cross-reference October tasks 01 and 02.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
