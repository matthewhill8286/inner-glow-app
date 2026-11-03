# Return to Profile after logging from its empty score history

Priority: P2

Status: Implemented — native return tested; broader regression verification pending

## Source feedback

- Report 2, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALweWl4hEX1nZF3sIJtauAo.zip) · [screenshot](../evidence/02-1.jpg)

## Cross-reference with current code

app/(tabs)/mood/logged.tsx unconditionally replaces the route with Home.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Carry the originating route through the check-in and return to Profile on Done; verify Home-origin flows still return Home.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Profile now passes its origin through Glow score, score history, mood check-in and the logged screen. Completion dismisses the flow to its originating primary tab. Arbitrary terminal destinations are rejected.

Changes are local and are not in submitted Build 27. Automated regression tests pass; native navigation, persistence and layout need iPhone verification before closure.

## Native investigation — 3 November 2026

Native testing exposed that dismissTo(Profile) could not cross tabs (unhandled POP_TO). Completion now conditionally clears dismissible forms and navigates to the originating tab. A repeat returned to Profile with the saved check-in visible; a POP_TO_TOP warning led to guarding dismissAll with canDismiss. Tests cover the revised sequence. The guard was type/test checked after that simulator run.

See [verification record](../verification.md). These changes are not in submitted Build 27.
