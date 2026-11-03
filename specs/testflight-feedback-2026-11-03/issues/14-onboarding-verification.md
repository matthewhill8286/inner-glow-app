# Verify complete first-run onboarding in Build 27

Priority: P1

Status: Partial — signup fix shipped in Build 27; device retest required

## Source feedback

- Report 15, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AP_11-BgtL7yZpWz6w7oAmg.zip) · [screenshot](../evidence/15-1.jpg)

## Cross-reference with current code

Commit 97c7d7b routes signup through welcome, agreement and intro. This addresses the bypass, but does not prove cold-launch splash/loading behaviour.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

On a clean account and install verify splash/loading, welcome, consent, intro, assessment, interruption/resume and existing-account login. Attach physical-device evidence before closing.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
