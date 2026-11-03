# Save the Home mood slider inline

Priority: P2

Status: Implemented locally — awaiting device verification

## Source feedback

- Report 14, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AL7TiAhJDE747yh4rqixJWY.zip) · [screenshot](../evidence/14-1.jpg)

## Cross-reference with current code

app/(tabs)/home.tsx pushes mood/check-in when there is no entry today, rather than saving the slider inline. Existing entries follow a different edit path.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Update the mood without opening the full check-in, show the persisted result and handle save failure; verify first entry and subsequent edits.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Home slider now creates the first mood entry inline and updates an existing entry inline. Saving is guarded against concurrent release events. Failure restores the saved value and shows an error, rather than leaving an unpersisted selection displayed.

Changes are local and are not in submitted Build 27. Automated regression tests pass; native navigation, persistence and layout need iPhone verification before closure.
