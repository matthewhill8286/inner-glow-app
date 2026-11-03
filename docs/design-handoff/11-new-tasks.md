# 11 · New designs and functionality (3 Nov 2026)

These tasks come from the screens that Figma file `hxqo1m7R2VfbGfwoTMOfnT` has gained since the last round. Every frame listed here is new, and none of them is referenced in the app or in docs 00–10. Each task names its frames, what the app does today, and what is needed.

Frames that already existed may also have been edited. This list doesn't cover those edits, because the Figma API doesn't show when a frame changed. A visual pass over the existing screens is task 25.

**Labels:** **[app]** means only app code is needed. **[backend]** means it also needs Supabase work, such as a table, an edge function or email settings. **[native]** means it needs a native target or module and a new build.

## A · Sign in, sign up and account

1. **Email verification code at sign-up** `6809:6846` **[app][backend]**
   After sign-up, show "Verify your email" with a 6-digit code, a 10-minute expiry and a "Resend in 0:42" countdown. Today sign-up goes straight to the assessment. This needs Supabase's sign-up email changed to a code (OTP) template, and `verifyOtp({ type: 'signup' })` in the app.
2. **Friendly auth errors** `6832:7549` `6832:7603` `6832:7682` **[app]**
   Show inline messages for a wrong password, an email already in use (with a link to sign in) and a wrong code. Today the raw Supabase error text is shown.
3. **Session expired** `6832:8167` **[app]**
   When the refresh token fails, show "Please sign in again" with "Sign in" and "Use a different account", instead of dropping to the sign-in screen.
4. **Account deleted** `6801:7048` **[app]**
   After deletion, show the confirmation screen, which reminds the user to cancel Pro in the App Store.

## B · Paywall and plan

5. **Purchase states** `6832:8524` `6832:8598` **[app]**
   On the paywall, show a "Confirming with the App Store" sheet while a purchase runs, and a "Payment didn't go through" sheet with "Try again" when it fails.
6. **Restore results** `6832:8681` `6832:8761` **[app]**
   Show "Your Pro plan is back" or "No purchases found" (with "Contact support") after Restore. Today restore works but gives no designed result.
7. **Pro has ended** `6809:7083` **[app]**
   When a subscription expires, show a one-time screen listing what is now limited, with "Renew Pro" and "Continue with free".
8. **Trial ends tomorrow banner on Home** `6809:6897` **[app]**
   On the last trial day, show a card under the Glow AI bar that reads "Your free trial ends tomorrow · Then €59.99/year" and has a Manage link.

## C · Assessment and Glow score

9. **Your assessment in Profile, with Retake** `6832:9366` `6832:9496` **[app]**
   Add a new Profile screen that lists the saved answers and the last-updated date. Its "Retake assessment" button opens a confirm sheet. The retake must keep the history, and its new answers update suggestions from that day.
10. **How the Glow score works** `6832:9550` **[app]**
    Add an explainer screen opened from the Glow score. It lists the five inputs over 7 days, adds a "Good to know" note and ends with the disclaimer.
11. **Loading skeletons** `6817:7276` `6817:7339` **[app]**
    Add skeleton layouts for Home and for Glow score Insights while data loads.

## D · Glow AI

12. **Rate a reply** `6839:7909` `6839:7992` `6839:8108` **[app][backend]**
    Show "Was this helpful? Yes / No" under replies. "No" opens a "What went wrong?" sheet with five reasons and an optional note. Afterwards, show "Thanks — this helps Glow AI improve". This needs a `chat_feedback` table with RLS.
13. **Offline messages** `6817:7082` **[app]**
    When offline, show a "You're offline" banner. Queue messages and mark them "Not sent · Tap to retry". Retry exists for failed sends, but there is no offline banner or queue.
14. **Weekly reflection (Pro)** `6801:6247` **[app][backend]**
    Add a "Your week" screen with a headline, what Glow AI noticed, the score change, average sleep, practice minutes and two "Try next week" suggestions. This needs a weekly generation job in an edge function, plus storage.
15. **Microphone permission primer** `6801:6542` **[app]**
    Before the system prompt, explain why the microphone is needed, with "Allow microphone" and "Not now". Use it in Glow AI voice, journal voice and the assessment voice step.
16. **Restyle the confirm sheets to the new designs** `6809:7325` (clear history), `6809:7249` (delete journal entry) **[app]**
    Both flows exist but use the generic alert. The designs show a bottom sheet.

### D2 · Elements inside the chat

These come from frames `6699:3725` (new chat), `6699:3808` (conversation), `6839:7909` (rate), `6787:5301` (sending), `6817:7082` (not sent) and `6701:3885` (support in chat). They are compared against `components/chat/ChatParts.tsx`, `CrisisSheet.tsx` and `app/(tabs)/chat/[issueKey].tsx`.

The app already has these elements: the header with the mini orb, "Glow AI" and "● Here for you", the day stamp ("Today 08:42"), the plum and white bubbles, the typing bubble with "Glow AI is typing…", the "Sent · 08:44" receipt, the starter rows on a new chat, the legal note under the composer, and the crisis sheet with "Call emergency services", "Message someone I trust" and "I'm okay, keep talking". Task 25 covers their visual check.

These elements are missing:

34. **Practice card in the chat** **[app][backend]**
    **Status: built on `feature/glow-ai-chat-elements`.** The chat function returns `practiceId` and `quickReplies` through OpenAI structured output, and older app builds ignore both fields. The function still has to be deployed.
    Glow AI suggests a practice as a white card (260 × 91, radius 22). The card shows a "BREATHING · 4 MIN" eyebrow, the practice name and a Start button that opens the player. The chat function needs to return structured replies, for example a `practice` block with a practice id. The app then renders the card and maps the id through `openPractice`.
35. **Quick replies after a reply** **[app][backend]**
    **Status: built on `feature/glow-ai-chat-elements`.** The chat function returns `practiceId` and `quickReplies` through OpenAI structured output, and older app builds ignore both fields. The function still has to be deployed.
    Under the latest AI reply, show up to three reply chips, such as "Reply to one email", "Make a to-do list" and "I don't know". The first chip is lilac (`#F1ECF5`) with plum text, and the others are white. Today chips show only as starters on an empty chat. The chat function needs to return them in the same structured reply as task 34.
36. **"Was this helpful?" under the reply** **[app][backend]**
    Add a feedback row with a caption and Yes / No pills (26 high) under the latest AI reply. This is the inline part of task 12.
37. **"Not sent · Tap to retry" on the bubble, and an offline banner** **[app]**
    **Status: built on `feature/glow-ai-chat-elements`.** While offline, the failed message is retried every 8 seconds. Offline is detected from the failed request, because the app has no network listener.
    A failed message today shows a separate status card above the composer. The design marks the bubble itself and retries when it is tapped. When offline, a white banner card (327 × 78, radius 20) sits at the top of the talk. This is the in-chat part of task 13.
38. **Voice mode** `6699:3875` `6787:5388` `6787:5420` **[app][backend]**
    The header's voice button and the composer's mic are drawn in every chat frame. The voice screens have listening, thinking and paused states. Neither button is built, and the header slot is used for other actions. The `transcribe-audio` function exists, and replies would use the Voice replies setting. Voice mode needs the microphone primer (task 15) first.

## E · Journal and mood

17. **Journal edit screen** `6809:7160` **[app]**
    Editing reuses the New entry screen today. The design has its own "Editing · date" header with "Done", the mood slider, the "What helped" prompt and tag chips, and "Save changes".
18. **Mood day details: edit actions** `6817:7401` **[app]**
    The day sheet gains "Edit this check-in", "Open journal entry" and "Talk about this day with Glow AI".

## F · Practices, sleep and connected apps

19. **Downloads for offline use** `6801:6433` **[app]**
    Add downloads for practices, with sizes and progress, a "Download over Wi-Fi only" setting, the storage used and "Remove all downloads". This needs `expo-file-system` downloads and the player reading local files first.
20. **Offline mode screen** `6839:8590` **[app]**
    Replace the generic offline screen with one that lists what works offline (journal, mood check-in, breathing, downloads) and what needs a connection. This depends on task 19, and on mood and journal saving locally then syncing.
21. **Apple Health primer** `6801:6587` **[app]**
    Before the HealthKit prompt, explain what is read and that nothing is written, with "Connect Apple Health" and "Not now".
22. **Connected apps: more sources and a disconnect sheet** `6839:8758` **[app][native]**
    The screen gains Smart watch, Sleep tracker and Calendar rows, plus a "Disconnect Apple Health?" sheet. Only Apple Health is wired today. The other rows need a decision on which integrations to build (see open questions).

## G · Growth, sharing and system surfaces

23. **Share cards** `6845:8140` `6845:8203` **[app]**
    Add a Share screen with Weekly reflection, Streak and Glow score cards and a "Save image" button. This needs `react-native-view-shot` to render the card to an image.
24. **"Is Inner Glow helping?" and the App Store rating prompt** `6845:8787` `6845:8855` **[app]**
    After a completed day, ask "Is Inner Glow helping you?" A "Yes" leads to "Glad it's helping", which calls `expo-store-review`. A "Not really" opens feedback.
25. **Visual pass over the existing screens** **[app]**
    Compare every screen built in rounds 00–10 against its current Figma frame, and fix any drift.
26. **Home Screen widgets** `6848:8298` `6848:8409` **[native]**
    Add a "Your day, in light" summary widget (score, mood, sleep, stress and the next practice), a streak widget, a 1-minute breathing widget, an evening check-in widget, a Glow AI prompt widget and a score trend widget. They need a WidgetKit extension, App Group data sharing and deep links.
27. **Lock Screen widgets and Live Activity** `6852:8322` `6852:8397` **[native]**
    Add Lock Screen widgets for the score, streak and wind-down time, a Live Activity for a breathing session ("Box breathing · 2:15 left"), and a morning "How did you wake up?" notification with Heavy, Okay and Bright actions. They need ActivityKit and notification categories.

## H · Settings, help and utilities

28. **App lock screens** `6832:8118` `6832:8264` **[app]**
    Add a designed "Inner Glow is locked" screen with "Unlock with Face ID" and "Use passcode instead", and an in-app 6-digit passcode pad with "Forgot passcode? Sign in again". Today the lock goes straight to the system prompt.
29. **Update required** `6832:8215` **[app][backend]**
    Show a blocking "Time for a fresh glow" screen when the app version is below a minimum. This needs a minimum version from remote config or a Supabase table.
30. **Download my data: choices and email delivery** `6801:6640` **[app][backend]**
    Let the user pick what to include (mood, journal, chats, sleep, practices) and a format (PDF summary or CSV/JSON). The file is sent as an emailed secure link. Today the export is a JSON file in the share sheet.
31. **Legal hub** `6801:6742` **[app]**
    Add one Legal screen with the "not a medical service" card, Terms, Privacy, an AI use policy, Cookie settings and Open-source licences. The AI use policy, cookie settings and licences pages are new content.
32. **Contact us · Message sent** `6839:8726` **[app]**
    Check this against `feedback-sent.tsx`. The design names the reply email and the 2-working-day response time.
33. **Help Centre FAQ final copy** `6764:4845` **[app]**
    Replace the FAQ answers with the final copy from the frame, in English and Greek.

39. **Full-screen video** (TestFlight report 45) **[app][native]**
    A tester asked for a full-screen option in the Relax video player.
    **Status: built on `feature/glow-ai-chat-elements`.** The card fills the window and rotates to landscape, with no native module. There is no Figma frame for it, so the control style follows the video card.

## Overlap with the TestFlight feedback on main

`specs/testflight-feedback-2026-11-03/` (commit `77bd5fa`) has 25 issues from Build 26 and 27 testers. Most are fixes to screens that already exist, so they don't repeat the tasks above. Three of them touch these tasks:

- Issue 18 covers microphone denial and the Settings recovery. Task 15 adds the primer screen before the first request, so the two fit together.
- Issue 12, the Glow AI composer design, should be done together with task 13's offline banner, because both change the chat screen.
- Issue 15, the check-in time picker, says it is waiting for design. Frames `6787:5765` and `6787:5819` already show the morning and afternoon options.

Eleven of those issues are still outstanding: sleep player Back, sleep voice guidance, rain audio, sleep icon and wind-down list, breathing rewind and forward, the goal ring at zero, Home score centring, the composer design, the check-in picker, the multiple-feelings decision and the historical regression pass.

## Open questions

- **Connected apps (task 22):** which integrations should be built? Smart watch, sleep tracker and calendar each need their own SDK or OAuth.
- **Weekly reflection and share cards (tasks 14 and 23):** are they Pro only? The reflection frame shows a PRO tag, and the share frames show none.
- **Email verification (task 1):** should it be required before the assessment, or only nudged?
- **Widgets and Live Activity (tasks 26 and 27):** these need native work and a new build. Should they ship in this release or a later one?
