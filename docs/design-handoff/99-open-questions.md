# Open design questions and Figma fixes

Collected from the handoff docs 00–07 (audit of 31 Oct 2026). Each item names the doc where the detail and node ids live. Items marked **Product** need a decision from us rather than from design.

## 0. Update after the new screens (31 Oct 2026, afternoon)

Design added 35 screens, now placed in their area sections, and a new component library on the "🧩 Design System" page (ids `6746:*`, `6753:*`). Docs 08, 09 and 10 spec them. The sections below are kept as they were. This list says which of their items are now answered, and adds the new questions.

**Resolved by the new screens:**
- Forgot-password code entry, new password and password updated (08 §2.1–2.3).
- Paywall Monthly-selected CTA ("Subscribe · €9.99/month") and the trial-ineligible state ("Welcome back to Pro") (08 §2.4–2.5).
- Appearance is replaced by Settings · Accessibility `6795:6236` (08 §2.7). Active sessions, reminder-time editing and Android biometric wording ("Fingerprint or face unlock") are designed (08 §2.8–2.10).
- Conversation history, Month and Year sleep charts, and empty states for Home, Journal, Mood history, Sleep, Glow score history and Glow AI talks (09).
- Medication search and not found, Morning (08:30) and Afternoon (14:00) check-in times, the sound picker (sleep only), the favourite saved state, the favourites list, daily goal, the pause glyph and the video end-early sheet (10).
- The breathing Hold phase, with copy "Hold" / "Stay soft and still." The out orb is 0.8 of the in orb (10 §3.9–3.10).
- The journal entry now has a `more` button with edit and delete (10 §3.11).
- Player placeholders are fixed ("4 of 15 breaths", "2:15 · Body", "Beginner · No equipment"), and the player times use Urbanist (10).
- Radio off is `#CFC6D6` with a 2px ring. Divider is `#EFEAF2`. Header title is SemiBold 15. The new Tag uses a `#F1ECF5` fill. Buttons now have Pressed and Disabled states in the library (08, 09, 10).
- There is no Mood tab: mood screens show Home active (09).
- Figma now has most of the missing icons (`search`, `mic-off`, `pause`, `edit`, `calendar`, `download`, `more`, `trash`, `settings`, `globe`, `logout`, `email`, `shield`, `send`, `play`). `sliders` is still missing.

**Still open from the earlier list:** inputs have no error state; checkbox off is not drawn; the Okay mood colour now has four values (`#EFE6DA`, `#E8DFD2`, `#E6E0EA`, `#DDD3E8`); toggle on is still `#6B5279` or `#8E7FA6`, and toggle off is now `#E1DAE6` or `#E6E0EA`; the score label taxonomy; Pro versions of Profile and Settings; a loading state when opening a conversation; a voice error state; search "no matches", mindful history empty; the Glow AI "€4.99/mo" card; and every **Product** item in section 4 except the Mood tab.

**New design questions:**
- Confirm the new library values as canonical: 44 white back button with a 1px `#CFC6D6` stroke, 52-high radius-16 field with a Bold 12 lavender label, `#F1ECF5` secondary button, transparent 56 ghost button, and Legal note text `#8E7FA6`. The players still use 48 back buttons (08 §1.1, 10 §2).
- There are two bottom sheet styles. Which is canonical? (10 §7)
- The toggle knob is `#FFF6D6` on Notifications and Security but `#FFFFFF` on Accessibility (08).
- The breathing progress track and fill are the same colour, so the bar always looks full. Every breathing player frame still has a "13 of 14" tag. The pause glyph sits off-centre (10 §7).
- Box breathing duration is now 4 min on the chip, 3 min on the selected pill and 04:00 in the player (10 §7).
- The medication list uses radios for a multi-select (10 §7).
- The hub says "5h daily goal" while the goal screen works in 5–20 minutes (10 §7).
- Favourites shows "Rain at night" where the practice is "Sleep sounds". The Entry options meta pill uses a heart instead of the mood face (10 §7).
- Mood · This week explained: the "Log my mood" button sits under the tab bar. "Taller bars mean you felt it more strongly" is wrong, because height is the mood score (09).
- Day details: the calendar card has a 2px plum stroke that Mood history lacks, and the tapped day has no selected marker (09).
- Voice: the controls move up 22pt between Thinking and Paused, the ripple rings are at full opacity, and the mini orb outer layer is at 1.0 rather than 0.5 (09).
- Sleep Month and Year placeholder data: the Year bars copy the Month bars and include future months, Month has 30 bars for October, and "What helps" is the same for every period (09).
- Home · First day has no avatar, search, bell, Glow AI input or Free plan card. Is that intended? (09)
- Journal · Empty mentions speaking but only offers Write (09).
- "Talking to Anna" has a different summary in history and on Glow AI home (09).
- Security says "2 devices" while Active sessions lists three. The reminder sheet shows M–F while the row says "Every day". Plan card heights vary from 67 to 72 (08).
- Active sessions uses the `activity` icon for devices. Phone, tablet and desktop icons are needed (08).
- Wind down has no offset picker in the reminder sheet (08).
- Wrong or expired code and unmet password rule states are not drawn (08).
- Breathe out `6105:1350` was deleted and `6160:1577` now carries the Complete modal with new values, so 07 §2.7 and §2.9 need re-extracting (10).

**Product decisions (31 Oct 2026):**
- "Freud score" is renamed "Glow score" in all user-facing copy. Code names such as `useFreudScore` and the `freud-score` route are unchanged. The "Dr. Freud AI" companion persona is a separate question and is not renamed.
- Passwords need at least 8 characters with a number or symbol (`lib/password-policy.ts`, used by sign-up and reset). Supabase must also enforce a minimum of 8 and have leaked password protection on.
- Changing plan: monthly to yearly is an upgrade bought in the app. Yearly to monthly goes through the store (Apple's subscription screen, or the Stripe portal) and takes effect when the paid year ends. Yearly and Monthly must be on the same level in the App Store group. Stripe needs real Prices before its portal can switch plans.
- Build Apple Health and Health Connect sleep import. Health Connect still needs wording.
- Stripe trial eligibility uses the same rule as checkout: an account gets the free week only if it has never paid.

**Still open product questions:** Do we show per-device detail, revoke and IP-based city names in Active sessions? What exactly do Larger text and Reduce motion change? (08)

## 1. Library and palette

- The main components (Button `4002:11881`, Input Text, Tag Master, Top Nav, FAB, Progress Bar, status bar, Monotone/Solid icons) are still in the old brown/olive palette with Urbanist ExtraBold. Screens only look right because of per-instance overrides; resetting overrides would revert them. Please recolour the main components. (00 §1.4)
- Old-palette leftovers on screens: `#838264` link/status colour, `#9BB068@0.25` focus rings, `#926247` on `#E8DDD9` step tags, `#4B3425` card shadows, `#96784F` tab-bar shadow, `#3F3C36`, `#44403B`, `#5B6B3C` waveform edges, `#FE814B` tab ring, `#E1E1E0` index bar, `#00545D` (teal glow on Suggested for you and the dark app icon background), Tailwind greys `#E5E7EB` / `#F3F4F6` / `#F5F5F4`. (00 §1.4, 01, 02, 03, 07)
- Pick one value each: toggle off `#E8E0D5` vs `#E1DAE6`, toggle on `#6B5279` vs `#8E7FA6`, divider `#F0EBE5` vs `#EFEAF2`, Okay mood colour `#EFE6DA` vs `#E8DFD2`, field radius 16 vs 26. (00, 04, 06)
- Confirm as tokens: `#C9744F` / `#B4505A` destructive, `#FFB3BE` / `#E8828F` / `#FBEDEE` pinks, `#F2D96A`, `#B39A1E`, `#C9A92A`, `#D6CCC0`, `#CFC6D6`, `#F5F1F7`. (05, 06)
- About 20 text nodes use Inter instead of Urbanist (player times, sleep track title). (00, 07)
- CTA label size varies (16 on 63 buttons, 18 on 24, 17 on 4) and button height is 56 or 58. Back button comes in 44, 48 and 50; close button in 40 and 44. Which is canonical? (00 §4)
- No disabled, pressed or error states for buttons and inputs; no helper/error text style. (00)
- The foundation components have no unselected radio or unchecked checkbox, but Sleep and Profile draw the radio off state in `#CFC6D6`. Code currently uses a 1.5 `#8E7FA6` outline for both. Confirm `#CFC6D6` for radio off and checkbox off. The tag fill is still old-palette brown; code uses `#F1ECF5` with `#4E3A5E` text. (00 §4.9, §4.11, 06)
- The Top Nav back ring is `#736B66` on Sign In and `#6B5279` elsewhere. (00)
- Arrow/Soft and Arrow/Sketch styles are not used by any ready screen. Do they replace the Glow arrows? (00)
- A11 chip fill is the old `#F2F5EB`. The Insights tag stroke is `#F2F5F9` while other tags use `#8E7FA6`. Chip and day outlines use `#E6E0EA` and `#E8E0D5` on the same S2 screen. (02, 03, 06)
- Sleep and Profile typography drifts: S5–S8 and Profile use `auto` line height while S1–S4 use 140%; large numbers switch between SemiBold and Regular; the header title is 14 on S2/S3 and 15 elsewhere. (06)
- AI check-in bubble radii are mixed; assumed to match the AI chat bubble. (03)
- Mood slider has two knob styles: compact `#FAEDB8` with a yellow shadow, and full `#FFF6D6` with a mood-colour glow. (04)
- Crisis secondary button is 52 high while others are 56. (04)
- Journal-active tab icon is `#4E3A5E`, others `#6B5279`. (00 §4.5)

## 2. Copy and content

- Typos: "Social Withdrawl" (A11 `4002:14985`), "Use voice Instead" (A14 `4002:15058`), "No Physical Pain At All" Title Case (A7). (02)
- Stray U+2028 line separators in "Notice How You're Feeling", "Best if your mind feels busy or racing.", "Helpful when you feel distracted.", "Rain at Night"; stray newline in "Talk, Reflect, and Unwind"; leading/trailing spaces in player subtitles. (01, 07)
- Brand written three ways: "InnerGlow", "INNER GLOW", "inner glow". Title Case vs sentence case is mixed across step titles. "Help Center" is US spelling elsewhere UK. (01, 06)
- Placeholder data: medication "Axpelliarmus" (`6037:2332`); A10 selected chips (Aspirin, Ibuprofen) don't match the selected rows; A14 counter "75/250" vs 59 characters; A4 ruler indicator between 127 and 128 while value reads 128; S7 "92% of your goal" should be 98%; S1 vs S7 night times disagree; video player "[ Beginner ] [ No equipment ]" bracket placeholders; Full-Body Relax subtitle copied from Shoulder Release; sleep completion says "Winding Down complete." for Sleep Sounds; feed mini-grid shows 18 dots for "21/30"; delta pills "6 vs September" lack "+"; Glow rising core sits at ~90 for a value of 88. (02, 03, 06, 07)
- Missing level captions: mood (only Anxious, Good, Tense), sleep (only Good), stress (only High), sleep check-in moons 1/2/3/5. Low/Okay/Great mood orbs are not drawn (04 §A proposes them). (02, 04, 06)
- Five FAQ answers unwritten. (06)
- "Forgot Password", "Sign In." and "Sign Up." have inconsistent capitalisation and trailing full stops. (01)
- S7 says "Woke up 1×" but the hypnogram reaches Awake twice, and the S7 axis labels are evenly spaced for uneven times. S6 doesn't show how awakenings are entered. (06)
- P8 lists Greek and Russian by their English names with "Beta", but other languages by their native names. (06)
- Hub card ranges ("3–5 min" Mindfulness, "5–10 min" Sleep) don't match the catalogue (7–25 and 6–25), and every video choose-card says "2–6 min". (07)
- Player placeholders: the breathing player shows "05:21 / 25:00" and "1 of 3 breaths" for a 3-minute practice; the video header says "2 min • Body" for a 2:15 video. (07)
- Proposed Hold phase copy: "Hold" / "Stay soft and still." Confirm. (07)
- Is the Saved constellation shape real recent data or decorative? (04)
- Rename layer `4002:15051` (named with self-harm sample text) and the "Dr Freud ai" layer names before the file is shared further. (02)

## 3. Missing screens and states

- Breathing player has no Hold phase (needed for Box and 4-7-8); in/out orbs are identical geometry. (07)
- Not designed: forgot-password code entry and new-password screens; paywall CTA when Monthly is selected and copy for trial-ineligible users; conversation history ("See all"); loading/sending states; medication search/empty; voice recording states; Morning/Afternoon check-in times; sound/soundscape picker; favourite filled state and favourites list; daily goal setting; pause glyph; end-early sheet for non-breathing players; empty states throughout; Month/Year sleep charts; Appearance; Active sessions; reminder-time editing; notification settings entry (old Settings tab removed); Android biometric wording; Pro-user variants. (01–07)
- Grounding Practice video uses vector art instead of a photo, and two list thumbnails reuse the Shoulder Release photo. (07)
- History bar colour rule is unclear (Sunday is `#6B5279`), and the history rows have no tap target. (07)
- Paywall shows Yearly and Monthly plans in EUR, but the configured products are Monthly and Lifetime. (03)
- Entry screen has no edit/delete entry point (the "More" button uses the note icon). (04)
- Icons missing from the icon set: mic-off, send, play, pause, search, sliders, globe, logout, trash, mail, edit, calendar, download (currently `note` stands in). 404 chip uses a bar-chart icon; Glow AI settings button uses the filter icon. (05, 06)

## 4. Product decisions

- **Product** Paywall sits before sign-up but purchases need an account: anonymous RevenueCat purchase linked at sign-up, or move the paywall after sign-up? (01)
- **Product** Trial model: store intro offer that auto-renews (design) vs current non-renewing server trial. Yearly €59.99 / Monthly €9.99 / Glow AI card "€4.99/mo" — confirm prices and currency. (01, 05)
- **Product** Social sign-in: Supabase has no Instagram provider, and offering Google/Facebook requires Sign in with Apple; monochrome Google glyph breaks Google branding rules. (01)
- **Product** Forgot password shows masked email and phone with no input: where does the account come from? Ship SMS reset or hide Phone? (01)
- **Product** Gender step drops Non-binary; is A10 medications conditional (then the count isn't fixed at 14)?; stress moves from 0–10 to 5 levels (affects `lib/freudScore.ts`); birthday (P1) vs age (A3) — which is the source of truth?; medication dataset and licence. (02)
- **Product** Score labels: 80 is "Healthy" on Home and "Mentally stable" on Freud Score; need a label taxonomy and score-to-colour rule; mood mix needs a 5→4 bucket mapping; "Go to Score Tracker" target; "Start my plan" behaviour. (03)
- **Product** Crisis: which emergency numbers per region, how "Message someone I trust" works (no trusted contacts exist), clinical review of copy. (04, 05)
- **Product** Is there still a Mood tab? Mood home draws the tab bar with Home active and the new tab bar has none. (04)
- **Product** Which practices are Pro? Paywall says "All 40+ practices" but there are 19. Deep Focus appears in both Mindfulness and Sleep. Where is mood-after-session captured? Practice durations disagree between list and set-up (Box 4 vs 3, Coherent 6 vs 5, Mindful Focus 7 vs 5, Soothing Melodies 9 vs 10, Bedtime Breathing 6 vs 10, Deep Sleep 25 vs 45). (07)
- **Product** Features with no place in the new design: Community entry, Manage categories, Blocked users, wake-alarm toggle, `assessment-summary`, `suggested-categories`, profile language step. (02, 06)
- **Product** Dark app icon background colour (currently old teal). (00)

## 5. File hygiene

- Layer names left over from the freud UI kit ("Welcome to the ultimate freud UI Kit", "Sign In To freud ai", "Personalize Your Men…", "Expression Analysis", "I am Male", "Use FA"). Most frames are still named "Mental Health Assessment" or "Mindful Hours". (01, 07)
- Each onboarding step has an empty `Progress Bar` instance (`4002:13972` etc.). Step Three's bottom frame (`4002:14217`) is 2px right and 373 wide. (01)
- Empty frames `6016:1597` and `6050:2776` (A5), hidden stale caption frames `6040:2493` (A8) and `4002:15004` (A12), and A9 content is 329 wide instead of 343. (02)
- M1 "Today · logged" text layer sits at x = −1. The Legal/Note layer name holds different copy from its text. (01, 04)
- Relax · Mind step captions all read "3 · Video details", and the paywall has no incoming arrow. (07)
- The "Profile & Help" section label on the canvas is white on a light background. (06)
