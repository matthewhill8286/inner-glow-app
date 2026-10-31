# 06 — Verify Mindful Stats remains readable above bottom navigation

**Priority:** P2

**Status:** implemented locally; next binary verification pending

**Blocked by:** None — can start immediately.

**Source:** https://appstoreconnect.apple.com/teams/8254ef98-9311-4ecc-8f9e-d86f7ca9b832/apps/6760898488/testflight/screenshots/AIgPUmsdu_uqWORfMiLTVa4 — 14 October, Build 11; no written comment. Screenshot shows Mindful Stats with lower content behind the floating tab bar.

**Reproduction:** Open Mindful Stats and scroll through the weekly metrics and total sessions.

**What to build:** Ensure every metric and the last card can scroll fully above the floating navigation on supported screen sizes.

## Acceptance criteria

- [ ] Weekly values and Total sessions can be fully revealed above navigation.
- [ ] Safe-area clearance works on small and large iPhones and with larger text.
- [ ] No horizontal clipping, blocked controls or blank excess scrolling is introduced.
- [ ] Record current-build screenshots; distinguish intentional scroll position from genuinely unreachable content.

## Triage and validation

This is a visual inference from a screenshot without a comment. Current code has a fixed bottom padding of 100; verify against actual tab-bar and safe-area height before changing it.

## Implementation verification

Source changes and automated checks are complete. Browser evidence is available in ../verification/. Native acceptance checks require the next binary. 
