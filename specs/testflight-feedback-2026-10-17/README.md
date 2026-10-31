# TestFlight feedback work items — 17 October 2026

Reviewed all five screenshot feedback items and the one crash feedback item visible in App Store Connect. Screenshots are from Builds 11 and 14; the crash is from Build 2. Added the medication branching bug reported in chat. These are local work items, not externally filed tracker issues. Original feedback was not changed or deleted.

- [Show medication details only after an explicit Yes](issues/01-medication-follow-up.md) — P1; implemented — awaiting next binary/device verification.
- [Allow more than one assessment support goal](issues/02-assessment-multiple-goals.md) — P2; implemented locally; awaiting next binary/device verification.
- [Allow mixed feelings in the assessment mood question](issues/03-assessment-multiple-moods.md) — P2; implemented locally; awaiting next binary/device verification.
- [Verify the redesigned welcome artwork fits supported screens](issues/04-welcome-artwork.md) — P2; implemented locally; awaiting next binary/device verification.
- [Verify existing subscribers bypass repurchase and retain access](issues/05-existing-subscription.md) — P1; implemented locally; awaiting next binary/device verification.
- [Verify Mindful Stats remains readable above bottom navigation](issues/06-mindful-stats-clearance.md) — P2; implemented locally; awaiting next binary/device verification.
- [Recheck cold launch against the historical Build 2 crash](issues/07-historical-startup-crash.md) — P2; implemented locally; awaiting next binary/device verification.

## Evidence and release scope

Screenshots in evidence/ correspond to each source report. Private tester contact details were not copied into ticket text. The crash ZIP contains metadata only, with no stack trace.

The medication fix is local and requires the next binary. Build 23 remains submitted and Waiting for Review; this task does not cancel or replace it.

Yaroslava’s reports came from Build 11. Before validating these items, distribute the current test build to her testing group and confirm her installed build so old screenshots are not treated as current regressions.

## Medication validation

TypeScript passes. All 71 automated tests pass, including explicit Yes-only details, No/Not sure/unanswered skipping, backward navigation, and changing the answer back and forth. Existing non-Yes selection already cleared saved medication names; this fix also clears the unsaved input.

## Implemented feedback fixes

Assessment goals and feelings support multiple choices and custom text, with an account-specific draft. Medication details appear only for Yes. The welcome artwork is constrained on small screens, and Mindful Stats uses shared navigation clearance. Native purchases reconcile existing receipts before opening StoreKit and restore Apple already-owned responses. Startup checks have deadlines and optional startup failures are contained. The historical Build 2 crash has no stack trace, so its original cause remains unconfirmed.

Browser evidence is saved in verification/. Native purchase and cold-launch checks must be repeated with the next binary. Community filters now query the selected categories and post types. Stored English/Greek profile choices are normalized and rendered in the current language. Feature navigation and compatibility routes are documented in ../../docs/navigation.md.
