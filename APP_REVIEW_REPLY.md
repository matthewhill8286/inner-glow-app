## Latest submission — 3 November 2026, Build 27

Submitted four items together for App Review: iOS version 1.1, binary 1.0.0 (27), Premium Monthly, Premium Yearly, and the Premium subscription group. Apple confirmed “4 Items Submitted”.

Submission: https://appstoreconnect.apple.com/apps/6760898488/distribution/reviewsubmissions/details/4aef8d08-972d-4e56-8222-f5d7d7105b87

Build 26 was withdrawn by the developer solely to replace the binary. Reviewer notes now describe Build 27 onboarding, assessment selection, microphone recovery and keyboard improvements. Previous Build 23 physical-device evidence remains explicitly identified as historical. Existing automatic release setting was preserved. Build 27 is also distributed through TestFlight. The review monitor now targets this replacement submission.

Apple Developer account still displayed an updated license agreement notice with a November 13 deadline. Its review page was opened for the Account Holder; no agreement was accepted by the agent. It did not prevent this submission.

TestFlight feedback was reconciled into [25 project tasks covering all 42 screenshot reports](specs/testflight-feedback-2026-11-03/README.md), with current dispositions added to the seven historical tasks. Device verification remains outstanding where stated.

---

# Inner Glow App Review reply — Build 23

## Latest submission — 3 November 2026

Apple confirmed **4 Items Submitted** for version 1.1 with binary version 1.0.0, Build 26: the app, Premium Monthly, Premium Yearly and the Premium subscription group.

Submission: https://appstoreconnect.apple.com/apps/6760898488/distribution/reviewsubmissions/details/75ce3a9c-2490-4a09-86f4-9a195aca7b2b

Build: https://expo.dev/accounts/matthill8286/projects/innerglow/builds/875ae804-066e-44e1-9ecb-161c8d71b217

The production provisioning profile was regenerated for HealthKit. The missing NSHealthUpdateUsageDescription was added to app.json and verified in generated iOS configuration; the app continues to request read-only sleep access. Build 26 completed Apple upload processing successfully. Listing text, reviewer notes, eight iPhone screenshots and subscription review screenshots were updated for the current app. Previous lifetime purchases remain supported, but lifetime is not offered as a new purchase in this build.

Confirmation: ../release-assets/build-26/app-review/submitted-build26.png

## Earlier submission record

App Store version 1.1 with Build 23 (binary version 1.0.0) was submitted on 17 October 2026. Apple confirms Waiting for Review for all four items: app version, Premium Monthly, Premium subscription group and Premium Lifetime. Submission ID: 6cfc2ec2-57ef-43e6-a878-6852619ff802.

## Verified preparation

- Build 23 finished EAS build and delivery to Apple.
- TypeScript, lint and all 52 automated tests passed.
- The account holder reported successful physical TestFlight checks for Restore Purchases, persistent Premium access, notifications, ringing alarm and account deletion.
- The previous review login had been deleted. It was recreated using its existing credentials, and its login was verified. Review access lasts through 15 November 2026.
- Current monthly and lifetime paywall screenshots were captured from Build 23 on the physical iPhone and uploaded to both purchase products. Product review notes are saved.
- Premium Monthly, the Premium subscription group, Premium Lifetime and app version 1.1 (Build 23) were submitted together and show Waiting for Review.
- The App Store description now states the current free/Premium access rules.
- Physical iPhone deletion was recorded in Build23-Account-Deletion.mp4 and attached in App Review Information. Backend removal of the disposable auth account and profile was verified. The separate App Review login was verified again on 17 October and remains valid.

## Reply to attach with completed evidence

Hello App Review Team,

Build 23 replaces Build 11 for Inner Glow version 1.1.

The iOS Premium screen uses Apple In-App Purchase through StoreKit and RevenueCat. It offers innerglow_premium_monthly (one-month auto-renewable subscription) and innerglow_premium_lifetime (non-consumable one-time purchase). It displays localized Apple prices, native Apple purchase controls, Restore Purchases, renewal information, subscription management, Terms of Use and Privacy Policy. The iOS purchase flow does not direct users to external checkout.

The seven-day app trial does not automatically start a paid subscription. Core mood and sleep logging, text journaling, existing conversation history, breathing, grounding, alarms and reminders remain free. New AI replies, AI analysis, personalised AI suggestions and voice transcription require a trial or Premium.

The account holder verified restore, persistent Premium access, notifications, the ringing alarm and account deletion using Build 23 on a physical iPhone.

Account deletion is available from Profile > Delete Account. The supplied review login has access through 15 November 2026. Please use a disposable account when testing deletion so the review login remains available.

AI features require explicit consent before sending relevant information to OpenAI. Consent can be withdrawn in Profile > AI Privacy. Freud Score is a personal wellness progress indicator, not a medical assessment. The microphone is used for optional voice journals, and transcription requires separate AI-sharing consent. Community posts and comments include reporting and blocking controls.

Support: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/support/
Privacy: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/privacy/
Terms: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/terms/

Thank you,
The Inner Glow team

## Submission evidence

The review notes and physical-device deletion video were saved in App Review Information. Both product review screenshots were uploaded. All four submitted items show Waiting for Review. The reply text above is retained as a reference; it was not separately sent to the old removed submission.

https://appstoreconnect.apple.com/apps/6760898488/distribution/reviewsubmissions/details/6cfc2ec2-57ef-43e6-a878-6852619ff802

Evidence: ../release-assets/build-23/app-review/submitted-build23.jpg. Review credentials remain private.
