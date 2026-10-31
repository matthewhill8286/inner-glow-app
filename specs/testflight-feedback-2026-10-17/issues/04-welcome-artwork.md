# 04 — Verify the redesigned welcome artwork fits supported screens

**Priority:** P2

**Status:** implemented locally; next binary verification pending

**Blocked by:** None — can start immediately.

**Source:** https://appstoreconnect.apple.com/teams/8254ef98-9311-4ecc-8f9e-d86f7ca9b832/apps/6760898488/testflight/screenshots/AHWRfWsxffUdyg02Q0vM_0M — 16 October, Build 11. Tester requested changing picture size. Screenshot shows old tall robot artwork.

**Reproduction:** Open the first welcome screen on the reported iPhone size; the legacy illustration dominates the layout.

**What to build:** Verify the newer welcome design resolves the old image-sizing report, and adjust only if the current binary still has clipping or oversized artwork.

## Acceptance criteria

- [ ] Test the current TestFlight welcome screen at small and large iPhone sizes and with larger text.
- [ ] Title, artwork, Get Started, Sign In and disclaimer remain readable and reachable.
- [ ] Artwork preserves its proportions and does not force horizontal scrolling.
- [ ] Capture current-build evidence and close the old report only after device verification.

## Triage and validation

Current source already replaces the old raster robot with bounded WelcomeArtwork (200–300 height) and a scrollable layout. The old screenshot alone does not prove the new layout is broken.

## Implementation verification

Source changes and automated checks are complete. Browser evidence is available in ../verification/. Native acceptance checks require the next binary. 
