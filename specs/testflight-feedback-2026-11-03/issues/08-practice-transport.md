# Repair breathing player rewind and forward controls

Priority: P2

Status: Outstanding — reproduce

## Source feedback

- Report 8, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALV0UE0h0lOVZdv2oQkMpDo.zip) · [screenshot](../evidence/08-1.jpg)

## Cross-reference with current code

The annotated breathing/rest player shows rewind and forward controls. The comment is ambiguous about transport versus navigation; confirm both on device.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify each visible transport control changes the session consistently, clamps at boundaries, updates timer and phase, and keeps sound in sync. Also verify header Back.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
