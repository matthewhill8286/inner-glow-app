# 05 — Verify existing subscribers bypass repurchase and retain access

**Priority:** P1

**Status:** implemented locally; next binary verification pending

**Blocked by:** None — can start immediately.

**Source:** https://appstoreconnect.apple.com/teams/8254ef98-9311-4ecc-8f9e-d86f7ca9b832/apps/6760898488/testflight/screenshots/AMxHCe4eZss_NqTq-j_md30 — 14 October, Build 14; no written comment. Screenshot shows Apple “You are currently subscribed” over the paywall.

**Reproduction:** With an active monthly subscription, open Premium and tap the monthly purchase action.

**What to build:** Check that current entitlement handling presents subscription management for active members and preserves access after Apple reports an existing subscription.

## Acceptance criteria

- [ ] On the current build, an active subscriber is shown their active plan and management action.
- [ ] Restore, foreground refresh and account reopen reconcile the same entitlement.
- [ ] An existing-subscription response never relocks an active account or offers a duplicate charge.
- [ ] Verify the case with the same app login and Apple sandbox account; capture device evidence.

## Triage and validation

The screenshot is an Apple informational dialog, not evidence of a failed charge. The owner subsequently reported restore and persistent access working on Build 23. Retest this exact entry path before closing; do not label it a confirmed current regression.

## Implementation verification

Source changes and automated checks are complete. Browser evidence is available in ../verification/. Native acceptance checks require the next binary. 
