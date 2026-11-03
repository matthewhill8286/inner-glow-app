# Verify historical feedback against current redesigned screens

Priority: P2

Status: Historical — redesigned screens require regression verification

## Source feedback

- Report 26, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AJ7byKBSgvnY3UPl5dHqVr4.zip) · [screenshot](../evidence/26-1.jpg)
- Report 28, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AC6hdhsriMXv_PFVq6I7Ez4.zip) · [screenshot](../evidence/28-1.jpg)
- Report 30, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHmlu-zC0mdy7qtrNbpYMWs.zip) · [screenshot](../evidence/30-1.jpg)
- Report 31, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AIDx7_hXkq69tyr-K_ecwHk.zip) · [screenshot](../evidence/31-1.jpg)
- Report 32, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMP4sse1pFWRCp_mK9zyBAA.zip) · [screenshot](../evidence/32-1.jpg)
- Report 33, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AAuHWBuO4dT8qJ2nTLE0gu0.zip) · [screenshot](../evidence/33-1.jpg)
- Report 34, Build 23: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMN8h51jh-KcpfMj-6wHZR8.zip) · [screenshot](../evidence/34-1.jpg)
- Report 35, Build 11: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AGX2-7P9mN5Xoqkpw8AeM2s.zip) · [screenshot](../evidence/35-1.jpg)
- Report 37, Build 11: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AF6NIN0p_LcxY3HogZ78UHE.zip) · [screenshot](../evidence/37-1.jpg)
- Report 40, Build 11: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHWRfWsxffUdyg02Q0vM_0M.zip) · [screenshot](../evidence/40-1.jpg)
- Report 41, Build 14: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMxHCe4eZss_NqTq-j_md30.zip) · [screenshot](../evidence/41-1.jpg)
- Report 42, Build 11: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AIgPUmsdu_uqWORfMiLTVa4.zip) · [screenshot](../evidence/42-1.jpg)

## Cross-reference with current code

Reports from Builds 11, 14 and 23 predate several redesigns. Paywall redesign 4968743, navigation clearance 69b47ae and later welcome changes are relevant, but are not device proof.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Use the per-report checklist below and record Build 27 device evidence or create a focused fix for every failure.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Per-report regression checklist

- [ ] Report 26: Category settings: verify header top spacing.
- [ ] Report 28: Stress Relief → Mindful Hours → Back must return to Stress Relief.
- [ ] Report 30: Journal detail: verify matching Edit/Delete typography.
- [ ] Report 31: Journal detail: verify centred back arrow.
- [ ] Report 32: Paywall: verify close/back returns to the originating screen.
- [ ] Report 33: Paywall: verify body/plan spacing, name/price alignment and popularity badge.
- [ ] Report 34: Home: verify spacing after score and expired-trial card.
- [ ] Report 35: Home: verify horizontal content margins and upgrade banner.
- [ ] Report 37: Assessment: verify first-step Back returns safely to onboarding.
- [ ] Report 40: Welcome: verify artwork fits small and large phones; October task 04.
- [ ] Report 41: Existing subscriber: verify receipt restore/access without repurchase; October task 05.
- [ ] Report 42: Mindful Stats: verify lower content clears the tab bar; October task 06.
