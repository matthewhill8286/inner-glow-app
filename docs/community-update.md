# Community design update — 17 October 2026

Community now shares the application header, serif page titles, system body text, card geometry and form buttons. The welcome and success views use compact cards without decorative circles or carousel indicators. Category selection uses full-width rows and a Continue action. Comments clear the floating bottom navigation. Existing moderation, reporting and blocking controls remain.

Filters open in a modal bottom sheet over the feed. Topics use stable checkbox rows. Closing discards edits; Apply changes the existing feed query. Existing filter links open this same sheet through a compatibility redirect. Browser checks at 390×844 and 320×568 verified scrolling, selection, persistence after Apply and the visible footer.

## Publishing fix

The standalone OpenAI Moderations endpoint returned 403 with the deployed key. The authenticated dashboard confirmed that the key already had All permissions; no key settings were saved or changed. The same key successfully returned actual omni-moderation input results through the documented inline Chat Completions moderation interface.

The server now uses that interface only when the standalone endpoint returns 403. It still requires valid input moderation results and blocks flagged content. Missing, malformed or errored results never authorize a database write. Rate-limit and other standalone errors do not trigger the fallback. The fallback uses gpt-4o-mini with one output token, so it incurs a small generation request cost in addition to the moderation workflow.

Deployed community-publish to Supabase project ufbhteewrbcvcqxdzsui. A private synthetic post returned HTTP 200 with is_hidden=true. The exact test row was then removed, with one row confirmed deleted. No public test post was created. Four regression tests cover the fallback, flagged input, malformed/missing results and other provider failures.

Reference: https://developers.openai.com/api/docs/guides/moderation

## Follow-up fixes, 17 October

Community comment likes now persist and update their stored counter. Applied migration 20261017160000_community_comment_likes.sql directly to the production database; the idempotent migration file is retained for subsequent migration reconciliation. A private live regression confirmed publish, comment, like (stored count 1), unlike and exact test-post cleanup. Replies focus the composer with an author mention. Feed cards use stored comment counts. Own private posts are accessible through My posts. Follow, draft, publish and comment actions handle failures and pending requests. Notification groups use calendar timestamps, and taps open the corresponding post or actor.

Home quick actions now follow the score card. The duplicate Stress toolkit banner is removed. Hidden feature screens retain their owning Home tab highlight, and visible tabs keep their own highlight. The original native sans-serif typography is restored consistently. Search uses compact 44-point categories, immediate filtering, a draft/apply filter sheet and real Recommended/A–Z sorting. Removed fake date controls and duplicate destinations.

Personalised AI suggestion generation requires Premium or an active trial in the UI and the existing server authentication guard. Both list and category buttons direct accounts without access to the paywall. Score snapshots only generate basic template suggestions; they do not initiate paid AI calls. Explicit AI requests preserve failures instead of silently presenting templates as AI output. The incorrect GPT-5 badge is replaced with Premium/trial access information. Basic activity suggestions remain available.

Validation: 86 automated tests pass. TypeScript passes. Lint reports 0 errors and 119 existing warnings. These client changes require a new binary; no TestFlight upload was performed in this follow-up.
