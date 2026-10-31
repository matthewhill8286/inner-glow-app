# Open design questions and Figma fixes

Collected from the handoff docs 00–07 (audit of 31 Oct 2026). Each item names the doc where the detail and node ids live. Items marked **Product** need a decision from us rather than from design.

## 1. Library and palette

- The main components (Button `4002:11881`, Input Text, Tag Master, Top Nav, FAB, Progress Bar, status bar, Monotone/Solid icons) are still in the old brown/olive palette with Urbanist ExtraBold. Screens only look right because of per-instance overrides; resetting overrides would revert them. Please recolour the main components. (00 §1.4)
- Old-palette leftovers on screens: `#838264` link/status colour, `#9BB068@0.25` focus rings, `#926247` on `#E8DDD9` step tags, `#4B3425` card shadows, `#96784F` tab-bar shadow, `#3F3C36`, `#44403B`, `#5B6B3C` waveform edges, `#FE814B` tab ring, `#E1E1E0` index bar, `#00545D` (teal glow on Suggested for you and the dark app icon background), Tailwind greys `#E5E7EB` / `#F3F4F6` / `#F5F5F4`. (00 §1.4, 01, 02, 03, 07)
- Pick one value each: toggle off `#E8E0D5` vs `#E1DAE6`, toggle on `#6B5279` vs `#8E7FA6`, divider `#F0EBE5` vs `#EFEAF2`, Okay mood colour `#EFE6DA` vs `#E8DFD2`, field radius 16 vs 26. (00, 04, 06)
- Confirm as tokens: `#C9744F` / `#B4505A` destructive, `#FFB3BE` / `#E8828F` / `#FBEDEE` pinks, `#F2D96A`, `#B39A1E`, `#C9A92A`, `#D6CCC0`, `#CFC6D6`, `#F5F1F7`. (05, 06)
- About 20 text nodes use Inter instead of Urbanist (player times, sleep track title). (00, 07)
- CTA label size varies (16 on 63 buttons, 18 on 24, 17 on 4) and button height is 56 or 58. Back button comes in 44, 48 and 50; close button in 40 and 44. Which is canonical? (00 §4)
- No disabled, pressed or error states for buttons and inputs; no helper/error text style. (00)
- Journal-active tab icon is `#4E3A5E`, others `#6B5279`. (00 §4.5)

## 2. Copy and content

- Typos: "Social Withdrawl" (A11 `4002:14985`), "Use voice Instead" (A14 `4002:15058`), "No Physical Pain At All" Title Case (A7). (02)
- Stray U+2028 line separators in "Notice How You're Feeling", "Best if your mind feels busy or racing.", "Helpful when you feel distracted.", "Rain at Night"; stray newline in "Talk, Reflect, and Unwind"; leading/trailing spaces in player subtitles. (01, 07)
- Brand written three ways: "InnerGlow", "INNER GLOW", "inner glow". Title Case vs sentence case is mixed across step titles. "Help Center" is US spelling elsewhere UK. (01, 06)
- Placeholder data: medication "Axpelliarmus" (`6037:2332`); A10 selected chips (Aspirin, Ibuprofen) don't match the selected rows; A14 counter "75/250" vs 59 characters; A4 ruler indicator between 127 and 128 while value reads 128; S7 "92% of your goal" should be 98%; S1 vs S7 night times disagree; video player "[ Beginner ] [ No equipment ]" bracket placeholders; Full-Body Relax subtitle copied from Shoulder Release; sleep completion says "Winding Down complete." for Sleep Sounds; feed mini-grid shows 18 dots for "21/30"; delta pills "6 vs September" lack "+"; Glow rising core sits at ~90 for a value of 88. (02, 03, 06, 07)
- Missing level captions: mood (only Anxious, Good, Tense), sleep (only Good), stress (only High), sleep check-in moons 1/2/3/5. Low/Okay/Great mood orbs are not drawn (04 §A proposes them). (02, 04, 06)
- Five FAQ answers unwritten. (06)
- Rename layer `4002:15051` (named with self-harm sample text) and the "Dr Freud ai" layer names before the file is shared further. (02)

## 3. Missing screens and states

- Breathing player has no Hold phase (needed for Box and 4-7-8); in/out orbs are identical geometry. (07)
- Not designed: forgot-password code entry and new-password screens; paywall CTA when Monthly is selected and copy for trial-ineligible users; conversation history ("See all"); loading/sending states; medication search/empty; voice recording states; Morning/Afternoon check-in times; sound/soundscape picker; favourite filled state and favourites list; daily goal setting; pause glyph; end-early sheet for non-breathing players; empty states throughout; Month/Year sleep charts; Appearance; Active sessions; reminder-time editing; notification settings entry (old Settings tab removed); Android biometric wording; Pro-user variants. (01–07)
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
