# Make assessment recording start and stop explicit

Priority: P2

Status: Implemented locally — awaiting device verification

## Source feedback

- Report 18, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AFLbNRwWdnabgLj-e9k3pHU.zip) · [screenshot](../evidence/18-1.jpg)

## Cross-reference with current code

The assessment recording orb is pressable, but the report asks for an obvious recording/start action. Build 27 permission handling does not resolve discoverability.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Provide a clear labelled start control, recording state, stop action and accessible labels; verify a first-time user can record and replay without instruction.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Assessment voice check-in now has a visible Start recording / Stop recording button in addition to its orb. Both controls are disabled while recording startup/stop is busy. Existing translated labels are reused.

Changes are local and are not in submitted Build 27. Automated regression tests pass; native navigation, persistence and layout need iPhone verification before closure.
