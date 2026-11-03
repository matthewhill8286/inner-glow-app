# Prevent score range labels overlapping

Priority: P2

Status: Implemented locally — awaiting device verification

## Source feedback

- Report 25, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AIdiHdmIO-HqMDLavE7t5I8.zip) · [screenshot](../evidence/25-1.jpg)

## Cross-reference with current code

RangeBar in app/(tabs)/freud-score/history.tsx places low, best and average labels at the same vertical coordinate without collision avoidance.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify equal scores, 79/80/81, endpoints and narrow screens; offset or combine labels while preserving their meaning and accessibility.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Score range labels retain their value positions and move to separate rows when they would overlap. The SVG height adapts to the required rows. Tests cover equal scores, neighbouring scores, boundaries and separated values.

Changes are local and are not in submitted Build 27. Automated regression tests pass; native navigation, persistence and layout need iPhone verification before closure.
