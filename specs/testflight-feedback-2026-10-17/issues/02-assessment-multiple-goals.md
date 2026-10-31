# 02 — Allow more than one assessment support goal

**Priority:** P2

**Status:** implemented locally; next binary verification pending

**Blocked by:** None — can start immediately.

**Source:** https://appstoreconnect.apple.com/teams/8254ef98-9311-4ecc-8f9e-d86f7ca9b832/apps/6760898488/testflight/screenshots/ALAOCuPkJgEyFw4EGM2josY — 16 October, Build 11. Tester: “Needs a multi election”. Screenshot shows the initial support-goal question.

**Reproduction:** Open assessment and try selecting two support goals. The second replaces the first.

**What to build:** Let users select multiple support goals while preserving existing stored assessments and AI context.

## Acceptance criteria

- [ ] Two or more goals can be selected, deselected and distinguished accessibly.
- [ ] Custom goal text can coexist with selected goals.
- [ ] Selections survive Back/Next, completion and reload.
- [ ] Summary, storage and AI context handle all selected goals and continue reading older single-goal records.
- [ ] At least one selected or custom goal is required to continue.
- [ ] Selection does not change button dimensions or move neighbouring options.

## Triage and validation

The report requests a capability; it does not establish a crash or a Build 23 regression.

## Implementation verification

Source changes and automated checks are complete. Browser evidence is available in ../verification/. Native acceptance checks require the next binary. 
