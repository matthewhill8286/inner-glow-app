# 07 — Recheck cold launch against the historical Build 2 crash

**Priority:** P2

**Status:** implemented locally; next binary verification pending

**Blocked by:** None — can start immediately.

**Source:** https://appstoreconnect.apple.com/teams/8254ef98-9311-4ecc-8f9e-d86f7ca9b832/apps/6760898488/testflight/crashes/ANYyw_YX7EyLHYFDWx7kmsw — 20 March 2026, Build 2, iPhone 13 Pro Max, iOS 26.4. Tester: “Crashes upon opening”.

**Reproduction:** Cold-open the historical Build 2 app. The report gives no further reproduction steps or stack.

**What to build:** Verify the current release no longer reproduces the historic startup failure and retain a clear diagnosis if it does.

## Acceptance criteria

- [ ] Cold-launch the current TestFlight build after install, force quit and device restart.
- [ ] Repeat with network unavailable and a returning authenticated session.
- [ ] If reproducible, capture a symbolicated crash log and identify the failing startup operation before fixing it.
- [ ] Document device, OS, build and outcomes; close as not reproduced only with evidence.

## Triage and validation

Only one crash feedback item is listed. The downloaded feedback ZIP contains feedback.json only, with no crash stack. Do not infer a root cause. No current-build crash report was visible.

## Implementation verification

Source changes and automated checks are complete. Browser evidence is available in ../verification/. Native acceptance checks require the next binary. The original crash report contains no stack trace; startup hardening does not establish or prove resolution of its original native cause.
