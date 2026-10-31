## Submitted — 17 October 2026

App Store version 1.1, Build 23, Premium Monthly, Premium subscription group and Premium Lifetime are Waiting for Review. Submission ID: 6cfc2ec2-57ef-43e6-a878-6852619ff802. Both purchase review screenshots and the physical iPhone deletion recording are attached. The review login was verified and remains active through 15 November 2026. The preparation notes below are historical.

## Current release status — 16 October 2026

Build 23 has finished building and uploading to Apple. The account holder reported that Restore Purchases, Premium persistence, notifications, the ringing alarm and account deletion work in TestFlight. These are user-reported physical passes, not agent-observed tests.

App Store version 1.1 has Build 23 selected. Build 11 was removed from review, and the version is Prepare for Submission. Review notes were updated. The recreated review account login was verified and its review access lasts through 15 November 2026. Physical-device deletion evidence and final review submission remain incomplete.

Current actual iPhone paywall captures are in `../release-assets/build-23/app-review/`. Private account credentials are stored only in ignored local environment files. The App Review account must remain available; use the separate disposable account for deletion evidence.

The older dated records below are historical and do not establish the current submission state.

---

# Inner Glow App Store submission

## Configuration completed on 14 October 2026

- Physical testing started on iPhone Matt, an iPhone 16 Pro Max running iOS 26.7.1, using TestFlight build 11. The confirmed App Review account signed in and completed onboarding with microphone and AI sharing declined. Neither Apple product loaded a price in this test; both displayed Unavailable. RevenueCat's public SDK offering endpoint returned the correct monthly and lifetime product identifiers. Purchase/restore tests have not passed, and no valid final paywall screenshot or account-deletion recording has been captured.
- Device testing found a template welcome title, a missing suggested-sections heading translation, and microphone permission requested before recording. These are fixed in source. Replacement production build 12 is queued as EAS build `5d5297e1-5636-4066-b8ea-f98995fbca86`; it has not yet been uploaded or tested.
- External group Inner Glow Testers (`6fe56077-bf36-49b2-9950-338aa7760512`) contains yaroslavadzihim@gmail.com. Build 11 was submitted to Beta App Review and shows Waiting for Review, with automatic tester notification enabled. Beta review uses the confirmed review account and the account holder's supplied contact phone number.
- A later Apple check showed App Store version 1.1 as Waiting for Review. This agent did not submit the main App Store version during device testing; the final purchase evidence and deletion recording remain incomplete. Verify the selected build and replace it with the corrected, tested build before treating submission readiness as complete.
- Apple Developer Program agreement and Paid Apps Agreement accepted with account-holder approval. On 14 October 2026, Apple confirmed the Paid Apps Agreement, Monzo bank account, W-8BEN, foreign-status certificate, and MRDP compliance as Active. The existing EU non-trader declaration remains Active.
- RevenueCat Apple app `app8b77a2c74d` created for `com.innerglowai.app`; purchase key `CFJ2PVPM57` validated. The private `.p8` is outside the app repository and must not be committed.
- Apple monthly product `6822637184` and lifetime product `6822638558` created with the exact IDs below, English descriptions, and worldwide availability. Base Cyprus prices are €9.99 monthly and €71.99 lifetime. Review screenshots still need to be attached.
- Subscription group `22474771` localized as Inner Glow Premium.
- Both Apple products attached to RevenueCat `premium` and mapped to `$rc_monthly` / `$rc_lifetime` in the existing default offering.
- Public Apple SDK key set in `.env.local` and EAS production. Dedicated V1 backend key saved privately and deployed to Supabase; sandbox access enabled for testing/review.
- RevenueCat webhook `whintgr5efcf37538` configured with the private authorization token. Its test returned HTTP 200 and `{"received":true}`. Apple production and sandbox server notification URLs saved.
- Signed production build 10 completed: EAS build `76bdbc4e-421a-4355-951b-622d1d943791`. Upload `63ab8475-9825-4832-96ae-2dae42bc8215` completed; Apple lists build 10 as Ready to Submit. Build 11 subsequently replaced build 10 for the existing version 1.1.
- Support, marketing, and privacy URLs replaced in App Store Connect. Description, keywords, subscription terms, reviewer navigation notes, and ten actual privacy data categories updated.
- TestFlight instructions saved for build 11. Team (Expo) has build 11 and the account holder was invited at matthill8286@gmail.com with explicit approval. A confirmed review account was created without sending email and successfully authenticated. Its credentials were entered and saved in Apple App Review Information; the private backup is `.env.review.local`. The browser masks persisted credential values, so they cannot be read back for comparison.
- Apple specifically requested an account-deletion screen recording captured on a physical device. This recording and physical-device purchase/restore verification are still outstanding. No App Review resubmission has been sent.

The app code, database changes, authenticated backend functions, and public marketing site are prepared. The configuration checklist below is retained as a reference; use the completion record above for current status. Pass the physical-device checklist and attach the account-deletion recording before resubmitting to Apple.

## Public URLs and existing projects

- Published marketing source: `InnerGlow/innerglow-public-site`.
- Marketing URL: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/
- Privacy Policy URL: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/privacy/
- Terms of Use URL: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/terms/
- Support URL: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/support/
- Account deletion instructions: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/delete-account/
- Community Guidelines: https://inner-glow-wellness.bushy-lynx-1749.chatgpt.site/community/
- iOS bundle ID: `com.innerglowai.app`
- RevenueCat project: https://app.revenuecat.com/projects/641899e0/apps
- Expo project: https://expo.dev/accounts/matthill8286/projects/innerglow
- Supabase project: https://supabase.com/dashboard/project/ufbhteewrbcvcqxdzsui

The RevenueCat project retains its original Test Store and `innerGlow Pro` entitlement. The production Apple app and separate `premium` entitlement are now configured. Both Apple products are attached to `premium` and included in the corresponding packages of the existing `default` offering. The Test Store products do not sell Apple purchases.

## 1. Complete Apple's commercial setup

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com/) as the Apple Developer account holder.
2. Open **Business → Agreements** and accept the current **Paid Apps Agreement**.
3. Complete the banking information and the tax information Apple requests for your account.
4. Resolve any account or compliance prompts until the agreement shows **Active**.
5. If distributing in the EU, complete Apple's trader-status declaration and verification under Business. The support form does not replace the contact details Apple requires for trader verification.

Apple requires the active agreement and commercial information for in-app purchases. See [Apple's configuration requirements](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/).

## 2. Create the real Apple purchase products

Open **My Apps → Inner Glow** and verify that its bundle ID is `com.innerglowai.app`. If a product with an identifier below already exists, finish that product instead of creating another.

### Monthly subscription

1. Open **Monetization → Subscriptions**.
2. Create a subscription group with reference name **Premium**. Add its English localization with display name **Inner Glow Premium**.
3. Add an auto-renewable subscription:
   - Reference name: **Premium Monthly**.
   - Product ID: `innerglow_premium_monthly`.
   - Duration: **1 month**.
   - English display name: **Premium Monthly**.
   - English description: **Monthly access to Inner Glow premium wellness tools.**
4. Set pricing and availability. The previous project setup proposed **€9.99 per month**; choose that euro price point if it is still your intended price and select the territories you want to sell in. The app displays Apple's localized price automatically.
5. Complete the tax-category fields and any remaining required metadata.
6. Add a screenshot of the actual paywall under **Review Information**, after the test build displays the products.

### Lifetime purchase

1. Open **Monetization → In-App Purchases** and click **+**.
2. Choose **Non-Consumable**.
3. Set:
   - Reference name: **Premium Lifetime**.
   - Product ID: `innerglow_premium_lifetime`.
   - English display name: **Premium Lifetime**.
   - English description: **One-time access to Inner Glow premium wellness tools.**
4. Set pricing and availability. The previous setup proposed **€71.99 once**; use that if it is still the intended price.
5. Complete the tax category, localization, and paywall review screenshot.

The seven-day trial in the app is a free, server-managed trial. It does not take payment or automatically start a subscription. Do not add an Apple introductory trial to recreate it.

## 3. Generate Apple's in-app purchase key

1. In App Store Connect, open **Users and Access → Integrations → In-App Purchase**.
2. Generate an In-App Purchase key named **Inner Glow RevenueCat**.
3. Download the `.p8` file immediately. Apple only allows one download.
4. Keep its **Key ID** and **Issuer ID** for the next step.
5. If Issuer ID is absent, follow RevenueCat's documented instructions to make it available through the App Store Connect API-key section.

Use an **In-App Purchase key**, normally named `SubscriptionKey_XXXXXXXXXX.p8`. A separate App Store Connect API key used for importing products is a different credential. Keep private Apple keys out of the app, Git, and public environment variables. See [RevenueCat's key instructions](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration).

## 4. Connect the Apple app in RevenueCat

Open [the existing project's Apple setup form](https://app.revenuecat.com/projects/641899e0/new-app/app_store).

1. Set **App name** to **Inner Glow App Store**.
2. Set **App Bundle ID** to `com.innerglowai.app`.
3. Under **In-app purchase key configuration**, upload the `.p8` file from step 3 and enter its Key ID and Issuer ID.
4. Save the configuration and run credential validation until it reports valid credentials.
5. If RevenueCat requests App Store Connect API credentials for automatic product import, connect those separately. You can also add store products by their exact product IDs rather than using automatic import.
6. In the Apple app configuration, copy RevenueCat's App Store Server Notifications URL. Configure that URL for Apple's production and sandbox **App Store Server Notifications**, using Version 2, in App Store Connect. Copy the actual URL from RevenueCat rather than constructing one.

The Apple configuration form was accessible during inspection. A permission message appeared in the web-provider section; a web billing provider is not needed for the iOS submission. If saving the Apple configuration is denied, the project's owner must grant you the necessary configuration permission or complete this step.

## 5. Attach Apple products, entitlement, and packages

1. In **Product catalog → Products**, import or add these two products under the new Apple app:
   - `innerglow_premium_monthly`.
   - `innerglow_premium_lifetime`.
2. In **Product catalog → Entitlements**, open the existing identifier **`premium`**, with display name **Inner Glow Premium**, and attach both Apple products.
3. The current `innerGlow Pro` entitlement is for the existing test setup. The production code expects the exact identifier `premium`; display names do not substitute for identifiers.
4. Open the existing **`default` offering**. Add the Apple product to each corresponding package:
   - **Monthly**, identifier `$rc_monthly` → `innerglow_premium_monthly`.
   - **Lifetime**, identifier `$rc_lifetime` → `innerglow_premium_lifetime`.
5. Keep the offering identifier `default`. The existing yearly Test Store package is not offered by this app.
6. Ensure `default` is available to the test and review users. If sandbox access is restricted in project settings, allow the test and App Review accounts.

The app deliberately disables a package if its product ID is wrong. The monthly product must also report a one-month period (`P1M`).

## 6. Configure public and private RevenueCat keys

### Public iOS SDK key

In RevenueCat **API keys**, copy the public SDK key for the **Apple App Store app**, beginning with `appl_`. Do not use the Test Store key beginning with `test_`.

Add it to the app's `.env.local`:

```dotenv
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_your_real_apple_app_key
```

In the [Expo project dashboard](https://expo.dev/accounts/matthill8286/projects/innerglow), open **Environment variables** and create the same variable for the **production** environment, with **Plain text** visibility. This is a public SDK key. Add it to development or preview too if using those build profiles.

The production Supabase URL, public Supabase key, and RevenueCat Apple SDK key are now configured in EAS production.

### Private subscriber API key and webhook authorization

1. In RevenueCat **API keys**, create a **V1 secret API key** for server-side subscriber lookups. The backend calls `GET /v1/subscribers/{app_user_id}`. Use a key that can read subscriber information.
2. Open the private, ignored `.env.server.local` file in the app folder. Add:

```dotenv
REVENUECAT_SECRET_API_KEY=your_private_revenuecat_v1_key
```

3. The file already contains a generated `REVENUECAT_WEBHOOK_AUTH` token. Preserve it. It is already configured in Supabase.
4. Set `REVENUECAT_ALLOW_SANDBOX=true` while testing and through App Review so sandbox purchases can unlock server-side AI access.
5. Load the file into Supabase from the app directory:

```bash
npx supabase secrets set --env-file .env.server.local --project-ref ufbhteewrbcvcqxdzsui
```

Keep this file private. Neither the secret API key nor the webhook token belongs in an `EXPO_PUBLIC_` variable.

## 7. Connect RevenueCat's webhook

In **Integrations → Webhooks**, add:

- Name: **Inner Glow Supabase**.
- URL: `https://ufbhteewrbcvcqxdzsui.supabase.co/functions/v1/revenuecat-webhook`.
- Authorization header: **`Bearer ` followed by the exact `REVENUECAT_WEBHOOK_AUTH` value from `.env.server.local`**.
- Events: all subscription and purchase events, including transfers.
- Environments: production and sandbox while testing and reviewing.

The test event returned HTTP **200** on 14 October 2026 after the private API key was configured. The endpoint verifies current subscriber snapshots rather than trusting webhook delivery order, and returns retryable errors when database writes fail.

After Apple approves the app and testing is complete, set `REVENUECAT_ALLOW_SANDBOX=false` in `.env.server.local` and run the Supabase secrets command again. Real production purchases continue to work. Sandbox events cannot replace a real paid production subscription.

## 8. Build and test

From `InnerGlow/InnerGlowApp`:

```bash
npm run check:submission
npm run verify
npm run test:db
npm run build:production:ios
npm run submit:ios
```

`test:db` needs Docker and uses an isolated disposable database. The production build guard fails until a valid public Apple RevenueCat key is present. EAS production builds use Xcode 26.0 and increment the remote build number automatically. Use the new build containing these changes; a JavaScript update alone cannot add native purchase modules.

EAS Submit uploads the build to App Store Connect. It does not submit the app for App Review.

Install the production build through TestFlight on a real iPhone. TestFlight purchases use Apple's sandbox rather than charging your real payment method. Verify:

- Monthly and lifetime prices load from Apple in the correct currency.
- Monthly purchase opens Apple's purchase sheet and unlocks premium immediately.
- Lifetime purchase opens Apple's purchase sheet and unlocks permanent premium access.
- AI features work immediately after purchase, even before the webhook updates Supabase.
- The RevenueCat customer uses the Supabase account UUID, has the `premium` entitlement, and appears in the Supabase `subscriptions` table.
- Refunds revoke the applicable entitlement.
- Canceling monthly renewal retains access until the paid period ends; expiration removes access.
- Reinstalling and signing in restores purchases with **Restore Purchases**.
- Switching accounts does not carry another user's premium cache across accounts.
- Declining AI permission prevents data being sent to OpenAI, and Profile allows permission withdrawal.
- Terms, privacy, support, account deletion, reporting, blocking, and unblocking work.
- Account deletion removes a disposable test account and its records. Confirm that other accounts remain intact.
- No iOS screen or loading overlay mentions Stripe or routes to Stripe checkout.
- Core onboarding, password recovery, mood, sleep, journal, and microphone-permission flows work. Also check iPad because tablet support is enabled.

## 9. Finish the App Store listing

In App Store Connect's app version and App Privacy sections:

1. Use the public privacy and support URLs at the top of this guide. Use the marketing URL if Apple asks for one.
2. Include a working Terms of Use link in the app description. The app also links to Apple's Standard EULA.
3. Add actual screenshots of the final app for the device sizes App Store Connect requests. The marketing mockups are not a substitute for current App Store screenshots.
4. Complete the description, subtitle, keywords, category, copyright, pricing, territories, age-rating questionnaire, and encryption questions. Describe AI as wellness support rather than licensed therapy or diagnosis. Disclose community user-generated content in the age-rating questionnaire.
5. Complete App Privacy for the app's actual collection: account name/email, User ID, health/wellness entries, journal/chat content and audio recordings, community content, and purchase history. These account-associated records are linked to users.
6. For RevenueCat purchase history, select **App Functionality** and **Analytics**, linked to identity, and disclose the custom **User ID**. RevenueCat does not inherently use this information for advertising tracking. Check any other integrations separately. See [RevenueCat's privacy instructions](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy).
7. Under **App Review Information**, supply a working review account and clear instructions for reaching the premium screen. Avoid a reviewer account that requires an inaccessible email confirmation or MFA step.
8. Select the newly uploaded build. Complete any export-compliance prompts that apply to it.
9. Add both `innerglow_premium_monthly` and `innerglow_premium_lifetime` to the same app-version submission. Complete any product metadata marked Missing Metadata or Developer Action Needed.
10. Fill in the actual version/build in `APP_REVIEW_REPLY.md`, paste the reply in the existing rejection conversation, then submit the new app version and products together.

Apple requires the first purchase of each type to accompany an app version. See [Apple's purchase submission instructions](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/).

## Support and moderation operation

The public support form works without a domain mailbox. Open Supabase **Table Editor → support_requests**, read open requests, reply using a monitored email account, and mark handled requests `resolved`. The app's support screen writes to the same private queue. There is no automatic notification or reply email yet, so check this queue regularly.

Open **Table Editor → community_reports** to review pending reports. Posts and comments are screened before publishing, but reports still require a person to review them. Hide violating posts with `community_posts.is_hidden`, remove violating comments when required, and update report status to `reviewed` or `removed`.

The Supabase project was restored from its inactive state. Keep the production backend available; free projects can pause after inactivity. The local checkout does not contain all historical remote migrations. The tested `node scripts/deploy-submission.cjs` helper applies only the submission additions atomically and records them in the remote history; do not replay the old subscriptions migrations with an unreviewed `supabase db push`.

## Validation record

On 13 October 2026, TypeScript and lint checks passed, 14 payment/access regressions passed, the isolated PostgreSQL regressions passed, and Expo Doctor passed all 18 checks. The iOS JavaScript bundle exported successfully. The public pages returned HTTP 200 and a synthetic support request was saved and then removed. Backend authentication and invalid-request responses were verified live.

The production build guard now passes. Signed build 10 was built and uploaded successfully. Replacement build 11 (`b45b95c0-0188-4caf-a292-1faf440c7ecb`) completed and was uploaded through submission `9adcfd94-42e4-4ea1-ba87-0b3ea3c731f1`. It is Ready to Submit and selected for version 1.1 with a more specific microphone purpose string that includes a voice-journal example and optional transcription sharing. Use build 11 for final testing and submission. The replacement review account was created, confirmed, and successfully authenticated. The earlier check of the original account used masked browser values and was inconclusive. Actual Apple purchases and account-deletion recording still require a physical iPhone. The existing EU non-trader declaration was retained at the account holder’s explicit request. No App Review submission has been sent.
