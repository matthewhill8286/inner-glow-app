# 02 — Mental Health Assessment & Profile Setup

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` (Main - Light Mode).
Raw extraction: `scratchpad/figma/specs/assessment-1..4.txt`, `profile-1.txt`. Screenshots: `scratchpad/figma/shots/as-*.png`, `pf-*.png`.

Shared items (colour/type tokens, Urbanist, Button, Top Nav, back button, Tag, Legal note, icon set, Skia glow renderer, status bar / home indicator) are owned by **00-foundations**. The paywall layout is owned by **01-onboarding-auth.md (Welcome paywall)**; this doc records only the differences for "Your plan is ready".

Typography notation: `Family Weight size/lineHeight ls<letterSpacing> colour`. All screens are 375×812, background `#F7F4F2`.

## 1. Overview

### Sections and screens

| # | Node | Figma name | Code |
|---|---|---|---|
| A1 | 4002:14608 | Assessment 1 of 14 — support goal | `app/(onboarding)/assessment.tsx` step `goal` |
| A2 | 4002:14621 | 2 of 14 — gender | step `gender` |
| A3 | 4002:14633 | 3 of 14 — age | step `age` |
| A4 | 4002:14647 | 4 of 14 — weight | step `weight` |
| A5 | 6023:1797 | 5 of 14 — mood | step `mood` |
| A6 | 4002:14729 | 6 of 14 — professional help | step `help` |
| A7 | 4002:14813 | 7 of 14 — physical distress | step `physical` |
| A8 | 4002:14823 | 8 of 14 — sleep quality | step `sleep` |
| A9 | 4002:14839 | 9 of 14 — medications? | step `meds` |
| A10 | 4002:14851 | 10 of 14 — which medications | step `medsSpecify` |
| A11 | 4002:14883 | 11 of 14 — other concerns | step `symptoms` |
| A12 | 4002:14998 | 12 of 14 — stress | step `stress` |
| A13 | 4002:15015 | 13 of 14 — Voice Check-In | step `sound` |
| A14 | 4002:15033 | 14 of 14 — Write What's on Your Mind | **none** |
| A15 | 6600:2103 | Paywall · Your plan is ready | **none** (closest: `app/(utils)/trial-upgrade.tsx`) |
| P1 | 6676:3017 | 1. Your profile | `app/(onboarding)/profile-setup.tsx` steps `name` (partial) |
| P2 | 6676:3066 | 2. Daily check-in | step `routine` (partial) |
| P3 | 6676:3118 | 3. Notifications | **none** |
| P4 | 6676:3178 | 4. Protect your space | **none** |
| P5 | 6676:3226 | 5. All set | `app/(onboarding)/profile-completion.tsx` (different content) |

Section 4002:14604 "Mental Health Assessment" (6777×1292) holds A1–A15. Section 4002:15061 "Profile Setup & Completion" (2387×1311) holds P1–P5.

### Flow difference

- **Design:** A1 → … → A14 → A15 paywall → P1 → P2 → P3 → P4 → P5 → home.
- **Code:** assessment (13 steps) → `assessment-summary.tsx` → `profile-setup.tsx` (intro, language, name, intention, routine, finish) → `profile-completion.tsx` → `suggested-categories.tsx` → home (`suggested-categories.tsx:40`).
- `assessment-summary.tsx`, `suggested-categories.tsx`, and the profile `intro`, `language`, `intention` and `finish` steps have no design counterpart. The `intention` step duplicates A1.
- The design counter is a fixed "N of 14". The code hides `medsSpecify` unless `takingMeds === 'Yes'` (`lib/assessment-flow.ts:33`), so the total changes between 12 and 13. Decide whether A10 is conditional. If it is, the tag must read "N of 13" or keep 14 and skip a number.

## 2. Assessment shell (all of A1–A14)

Top to bottom:

1. **Top glow:** ELLIPSE at 37,−20, 300×300, colour @0.14, LAYER_BLUR 90. The colour steps through a ramp, one per step: `#E2CC40, #E7C654, #ECC067, #F1BA7B, #F5B78E, #F9B5A1, #FDB4B4, #F9B3C2, #EDB3CA, #E1B4D2, #D1B5DA, #B6BBE2, #9AC0E9, #7FC6F1` (A1 → A14). Animate between colours on step change.
2. **Top Nav** (4002:13114) at 16,60, 343×48, row gap 12: back button 48×48 with stroke `#6B5279` 1, pill radius, icon `Icon/Arrow back` 24. Title "Assessment" `Urbanist SemiBold 20/auto ls-0.5% #4E3A5E`. Tag Master sm Outlined: fill `#E8DDD9`, r 32, padding 6/10, `Urbanist Bold 14 ls-0.2% #926247`, copy "N of 14".
3. **Content column** at x 16, y 148, width 343, vertical auto-layout. The question title is `Urbanist SemiBold 30/38 ls-1% #4E3A5E` centred. The gap from the title to the body is 48 unless noted otherwise.
4. **Continue:** Button Primary lg (4002:11898), 343×56, fill `#6B5279`, radius 1000, padding 16/24. Label "Continue" `Urbanist SemiBold 18 ls-0.4% #FFFFFF` with a 12 gap and `Icon/Arrow forward` 24. Its y position varies per screen (listed below). Pin it to the bottom safe area (≈ y 648–678).
5. **Legal note** (6674:2966, foundations): 14px info icon `#8E7FA6` plus `Urbanist Regular 11/140% #8A8296`, 327 wide at x 24. Used on A1, A9 and A12.

**Selectable row tokens.** Default row: fill `#FFFFFF`, DROP_SHADOW 0,8,16 `#4B3425@0.05`, label `#4E3A5E`, empty radio. Selected row: fill `#F1ECF5`, stroke `#6B5279` 1.5, label `#241A2E`, filled radio. Radio icons are `Monotone/71 radio empty` 4002:13177 / `Solid/72 radio filled` 4002:13179 (A1). A9 and A10 use `Solid/71 radio empty` 4002:13695. A7 uses `Monotone/72 radio filled` 4002:13652. All are 24×24.

**Gaps vs code (shell):**
- `assessment.tsx:37-52` uses the old palette (`brown #a07b55`, `olive #828a6a`, `orange`, `purple #7B6DC9`). Replace it with foundation tokens.
- `assessment.tsx:1489-1573`: the code places content in a white card (r 28, padding 24/20, min height 380). The design has no card; content sits directly on the background.
- `assessment.tsx:57-80, 1548`: the code shows a segmented progress bar. The design has none, so remove it.
- `assessment.tsx:1507-1521`: the back button is 42 with a brown border and MaterialIcons. The design uses 48, stroke `#6B5279` 1 and the shared icon.
- `assessment.tsx:1522, 1542` and `translation.ts` `assessment.stepCount = 'Step {{current}} of {{total}}'`. The design copy is "{{current}} of {{total}}" with no "Step".
- `assessment.tsx:1576-1611`: the button reads "Next"/"Complete" at 17px with fill `#a07b55` and a shadow. The design uses "Continue" on every step, 18px, `#6B5279`, and no shadow. The disabled state is not designed, so foundations must define it.
- `styles.h2` (`assessment.tsx:1619`) is 24/32 `#6a5e55`. The design is 30/38 ls −1% `#4E3A5E`.
- No top glow exists in the code. Skia is not installed (foundations owns this).
- The legal notes are missing on A1, A9 and A12.

## 3. Per-screen spec

### A1 — support goal (4002:14608)
- Title: "What would you like support with today?" (2 lines).
- Option list starts 48 below the title, with a 12 gap between rows. Each row is 343×56, pill radius, padding 16, label `Urbanist SemiBold 16 ls-0.3%`, and a 24 radio at the right.
- Options, verbatim: "Reduce daily stress", "Try guided AI support" (shown selected), "Work through difficult experiences", "Grow and understand myself better", "Just checking things out".
- Continue sits at content y 500 (absolute 648).
- Legal note at 24,716: "This check-in helps us personalise your experience. It is not a diagnosis."
- The design is single-select (radio icons) with no free-text field and no "Select all that apply." subtitle.
- **Gaps:** the code is multi-select with checkboxes (`assessment.tsx:1015`), adds emoji icons (`:997-1001`), the "Select all that apply." subtitle (`:1006`) and a free-text input (`:1033-1055`). The option copy already matches `translation.ts` `goalOptions`.

### A2 — gender (4002:14621)
- Title: "What’s your official gender?" (2 lines). The gap to the body is 40.
- There are two cards, each 343×152 with r 32 and padding 16, separated by an 8 gap. The label sits top-left in `Urbanist SemiBold 16 ls-0.3% #3F3C36`.
  - **"I am Male"** (shown selected, 6671:3174): fill `#FFF`, stroke `#6B5279` 1, focus ring DROP_SHADOW 0,0,0 spread 4 `#9BB068@0.25` (old green; use the foundations focus token). Art: glow 155,−9 170² `#7FC6F1@0.45` blur 36; glow 222.5,15.8 90² `#E2CC40@0.30` blur 24; aura contours SVG 6671:3358; inner light 230,66 20² `#F2D96A@0.90` blur 6.
  - **"I am Female"** (6671:3294): default shadow 0,8,16 `#4B3425@0.05`. Glow 155,−9 170² `#FFB3BE@0.45` blur 36; glow 162.7,10.8 100² `#D8B4D8@0.40` blur 26; contours 6671:3371; inner light as on the Male card.
- Below the cards (40 gap), with a 16 gap between them:
  - Secondary button, 343×56, fill `#F1ECF5`, label "Prefer to skip, thanks" `#6B5279`, with the `Icon/Arrow close` icon.
  - Continue.
- **Gaps:** the code offers four radio rows with emoji: Woman / Man / Non-binary / Prefer not to say (`assessment.tsx:801-806`). The design drops Non-binary and turns "prefer not to say" into a skip button. Product needs to confirm the option set (see Blockers). The title copy differs: the code has `genderTitle: "What's your gender?"` and the design adds "official".

### A3 — age wheel (4002:14633)
- Title: "What’s your age?" (1 line).
- The wheel (4002:14639) is 256×404, centred, 86 below the title top, vertical with an 8 gap. Rows:

| Row | Copy | Box | Type |
|---|---|---|---|
| −2 | 16 | 26×38 | `SemiBold 30/38 ls-1% #6B5279@0.30` |
| −1 | 17 | 51×68 | `SemiBold 60/68 ls-1.8% #6B5279@0.30` |
| 0 (selected) | 18 | frame 256×160 | `SemiBold 128/100% ls-2.5% #6B5279` |
| +1 | 19 | 50×68 | 60/68 @0.30 |
| +2 | 20 | 34×38 | 30/38 @0.30 |

- Build it as a vertical snapping wheel. Interpolate size and opacity by distance from the centre (0 → 128 / 1.0, 1 → 60 / 0.3, 2 → 30 / 0.3).
- Age aura (6673:2994) sits behind the selected number and covers the full screen: glow 57.5,306 260² `#E2CC40@0.45` blur 50; glow 152.5,371 170² `#D8B4D8@0.40` blur 40; contours SVG 6673:2997 (7 rings).
- Continue at content y 538.
- **Gaps:** the code uses a horizontal ruler with 72px digits (`assessment.tsx:1083-1088, 131-343`), min 13 and max 100. The design does not state a range. Keep 13–100 or set the product minimum age.

### A4 — weight ruler (4002:14647)
- Title: "What’s your weight?". Inner column gap 64.
- **Unit tabs** (Tab Group Text lg 4002:13561): 343×56, `#FFF`, r 32, padding 4. Selected "kg" tab: 167.5×48, `#F1ECF5`, stroke `#6B5279` 1.5, `SemiBold 16 #241A2E`. Subtle "lbs" tab: `#4E3A5E`.
- **Value** (64 below the tabs): "128" `SemiBold 96/100% ls-2% #4E3A5E` plus "kg" `SemiBold 36/44 ls-1.2% #736B66`, bottom-aligned, no gap.
- **Ruler** (24 below the value), 343×118:
  - Tick pitch is 16 (tick width 0, row gap 16).
  - Minor tick: 24 high, stroke `#E8DDD9` 4, round cap, y 47.
  - Major tick: every 5th, 42 high, stroke `#D6C2B8` 8, y 38.
  - Indicator: 12×118 rounded rect `#8E7FA6` with ring spread 4 `#9BB068@0.25` (old green), centred on the screen.
  - Labels: `SemiBold 16 #D6C2B8` under the majors at y 99. The visible labels are 126, 127, 128 and 129, so 1 kg = 5 ticks = 80px and a minor tick = 0.2 kg.
- Continue at inner y 422.
- **Design defect:** the indicator sits between the 127 and 128 labels, yet the value reads 128. Centre the indicator on the current value.
- **Gaps:**
  - `UnitToggle` (`assessment.tsx:83-128`) is 200 wide with `#f2ece6` and an olive selected state. The design is full width with a `#F1ECF5` selected tab.
  - `TICK_SPACING = 20` (`:54`). The design pitch is 16.
  - Ticks are 1/3 px `#6a5e5530` (`:311-318`). The design ticks are 4/8 px in the colours above.
  - The indicator is 4×60 olive (`:249-261`). The design indicator is 12×118 `#8E7FA6`.
  - The value is 72px (`:225`). The design value is 96px with a 36px unit.
  - The code steps 1 unit per tick and labels every 5. The design labels every unit (5 ticks per unit), so decide between 0.2 kg resolution and integers.

### A5 — mood orb and slider (6023:1797)
- Title: "How are you feeling right now?". The title frame is only 290 wide at x 43 (other steps use 343); it still wraps to 2 lines.
- **Orb** (6673:3073):
  - Glow 57.5,240 260² `#D8B4D8@0.55` blur 50.
  - Glow 72.5,275 170² `#FFB3BE@0.45` blur 40.
  - Contours SVG 6673:3076 (7 rings).
  - Inner light 167.5,350 40² `#FFF6D6@0.95` blur 10.
- **Value label** at y 490, full width: "Anxious" `SemiBold 30/auto #241A2E` centred.
- **Spectrum bar** at 36,560, 303×18, r 9. LINEAR gradient, all stops @0.95: `#FFB3BE` 0, `#D8B4D8` 0.27, `#EFE6DA` 0.50, `#E2CC40` 0.73, `#7FC6F1` 1.0. The bar also has LAYER_BLUR 5 (soft edge). Draw it with react-native-svg `LinearGradient`; expo-linear-gradient is not installed.
- **Knob:** 28² `#FFF6D6`, stroke `#6B5279` 2.5, glow DROP_SHADOW 0,0,14 spread 3 `#FFB3BE@0.90`. Its centre x is 90.5 for "Anxious". Tint the glow with the spectrum colour under the knob.
- **End labels:** "Tense" (36,590) and "Great" (310,590) in `Medium 11 #A6A09B`.
- Continue at y 678.
- **Leftovers to delete in Figma:** empty frame "Button" 6016:1597 and hidden frame 6050:2776/6050:2777 (an old medications list).
- **Level list (not fully defined):** Figma only shows "Anxious" here, plus "Good" and "Tense" on Mood Tracker 6694:3555 / 6694:3607. No caption appears under the value. The orb colour probably follows the knob, but only one state is drawn.
- **Gaps:** the code is an 8-chip multi-select with emoji (Happy, Calm, Anxious, Sad, Angry, Tired, Neutral, Hopeful) plus a free-text input (`assessment.tsx:758-767, 1113-1177`). It must become a single continuous or banded value. `assessments.mood` is text; decide whether to store a label, a 0–1 value, or both. The `moodTitle` copy differs.

### A6 — professional help (4002:14729)
- Title: "Have you talked to a professional before?". Content column 344 wide.
- **Illustration** 6671:3381, 286², centred 48 below the title:
  - Glow 23,23 240² `#E2CC40@0.35` blur 50.
  - Glow 113,83 160² `#D8B4D8@0.40` blur 40.
  - "Thoughts to calm" SVG 6671:3384 (12 vectors: a tangled scribble that resolves into contour rings).
  - Inner light 142,150 22² `#F2D96A@0.95` blur 6.
- **Buttons** (48 below), with a 16 gap: a row of two 164×56 pill buttons. "Yes" is selected: `#F1ECF5`, stroke `#6B5279` 1.5. "No" is the default: `#FFF`. Both use the 18 SemiBold label. Continue sits 16 below.
- **Gaps:** the code shows three radio rows (Yes / No / Not sure, `assessment.tsx:795-799, 1179-1194`). The design has two segmented buttons. The `helpTitle` copy differs.

### A7 — physical distress (4002:14813)
- Title: "Are you experiencing any physical distress?". The cards start 48 below, with a 12 gap.
- **Card** (Assessment Distress Level 4002:13636 / 4002:13643): 343×174, r 32, padding 16, horizontal layout.
  - Left column, 271 wide, gap 16: a 48² FAB with fill `#F7F4F2`, then the title `SemiBold 18 ls-0.4%` and body `Medium 16/160% ls-0.3%` (gap 4).
  - The radio sits at the right, vertically centred (x 303, y 75).
  - "Yes, in a few places" / "I notice physical discomfort in different areas of my body." Default: white, title `#4E3A5E`, body `#736B66`, pulse icon.
  - "No Physical Pain At All" / "I’m not noticing any physical pain right now." Selected: `#F1ECF5`, stroke 1.5, text `#241A2E`, check icon.
- Continue at content y 532.
- **Gaps:** the code has three plain rows (`PHYSICAL_OPTIONS` `assessment.tsx:779-783`), including "Not sure / prefer not to say", plus a notes field when the answer is Yes (`:1210-1219`). The design has two cards and no notes field, so `physical_distress_notes` becomes unused unless kept. The copy differs, and "No Physical Pain At All" uses Title Case (see Blockers).

### A8 — sleep moons (4002:14823)
- Title: "How would you rate your sleep quality?" (frame 340 wide).
- **Sleep moons** (6673:3005, full-screen layer):
  - Background glow 27.5,240 320² `#D8B4D8@0.35` blur 70.
  - Arc: dashed path 47.5,360, 280×110, stroke `#6B5279@0.18` 1 (6673:3008).

| Level | Label (at) | Moon frame | Crescent shadow (x offset, opacity) |
|---|---|---|---|
| 1 | "Very poor" (7.5,496) | 29.5,452 · 36² | −24.1, `#6B5279@0.44` |
| 2 | "Poor" (48.5,418) | 70.5,374 · 36² | −17.6, @0.33 |
| 3 | "Okay" (147.5,386) | 169.5,342 · 36² | −11.2, @0.22 |
| 4 (selected) | "Good" (246.5,427) | 259.5,365 · **54²** | −7, @0.11 |
| 5 | "Restful" (287.5,496) | 309.5,452 · 36² | none (full moon) |

- Moon disc: fill `#EDE6F2`, stroke `#6B5279@0.35` 1.08. The shadow disc is the same size, offset left, clipped to the moon, which gives the crescent.
- Selected moon: disc `#FFF6D6`, stroke `#6B5279@0.90` 2.7, halo 238.5,344 96² `#E2CC40@0.55` blur 22.
- Labels are 80 wide and centred: `Medium 11 #A6A09B`; the selected label is `Bold 11 #6B5279`.
- Value at y 520: "Good" `SemiBold 30 #241A2E`. Caption at y 562: "Most nights you wake up rested." `Regular 14 #736B66`.
- Continue at y 676.
- Captions for Very poor, Poor, Okay and Restful are **not in Figma**. A hidden frame 6040:2493 holds stale stress copy: "It looks like things feel quite overwhelming right now". Delete it.
- Build the moons in code with react-native-svg (Circle plus a ClipPath crescent), not exported files, so that selection can animate.
- **Gaps:** the code shows 5 emoji rows (Excellent, Good, Fair, Poor, Very Poor; `assessment.tsx:770-776, 1223-1241`). Rename them to Very poor, Poor, Okay, Good, Restful with values 1–5; the stored scale is unchanged. The `sleepTitle` copy differs.

### A9 — medications? (4002:14839)
- Title: "Are you currently taking any medications?".
- **Content width is 329**, not 343, so the rows end at x 345. Treat this as a design slip and use 343.
- Rows (Assessment Medications 4002:13692 / 4002:13689): 56 high, pill radius, padding 16, gap 24, label `SemiBold 18 ls-0.4%`. The row gap is 8, and the list starts 40 below the title.
- Options: "Prescription medications", "Over-the-counter supplements", "Not taking any" (shown selected), "Prefer not to share".
- Continue at y 672.
- Legal note at y 740: "Never change or stop medication without talking to your doctor."
- **Gaps:** the code offers Yes / No / Not sure (`assessment.tsx:1243-1265`), and `medsSpecify` shows only for `'Yes'` (`lib/assessment-flow.ts:33`). The new rule is to show A10 when the first or second option is selected. Single-select versus multi-select is unclear because the design shows radios. `taking_meds` text values change.

### A10 — which medications (4002:14851)
- Title: "Which medications do you take?". Column gap 18.
- Subtitle: "This helps us better support you." `SemiBold 14 ls-0.2% #4E3A5E`.
- **Alphabet index bar** (6037:2316): 342×32, fill `#E1E1E0`, pill radius. It holds 8 cells, each 42.8×32 with padding 8/10.
  - Active cell "A": fill `#8E7FA6`, text `#FFF SemiBold 12`, ring spread 4 `#FE814B@0.25` (**old orange**; use the focus token).
  - Inactive cells: `#736B66`. Cells read "B", "C", "...", "X", "Y", "Z", then `Monotone/11 search` 16 (opens a search field, which is not designed).
  - Implement it as a horizontally scrollable A–Z strip plus a search action.
- **List** (8 below the bar): 343×312, with A9-style rows 329 wide and a gap of 8.
  - Scroll track at x 337: 6×312, `#E8DDD9`, pill radius. Thumb: `#6B5279`, 6×104 (the rotated Progress Bar Atom 4002:12309).
  - Rows: "Abilify", "Abilify Maintena", "Abiraterone" (selected), "Axpelliarmus" (selected). **"Axpelliarmus" is a joke placeholder, not a drug.**
- **Selected summary** (18 below), centred: "Selected:" `SemiBold 14 #4E3A5E`, then Tag xs Fill with icon right (`#E8DDD9`, r 32, padding 4/8, `Bold 12 #4E3A5E`, close icon 16). The chips read "Aspirin" and "Ibuprofen", which **do not match** the selected rows (Abiraterone, Axpelliarmus).
- Continue at content y 523.
- **Data:** there is no medication list in `data/` (only breathingExercises, issues, journalPrompts, stressVideos). A curated medication dataset with licensing is needed, or an API. The search action and free-text fallback for unlisted drugs are not designed.
- **Gaps:** the code uses free-text entry plus an add button and orange `MedTag` rows (`assessment.tsx:606-637, 1267-1315`). `assessments.meds` is comma-joined text (`:883-889`); a structured array is preferable (see Backend).

### A11 — other concerns (4002:14883)
- Title: "Are you noticing any other mental health concerns?" (3 lines, 343×114). Gap 32.
- **Chip input:** 343×124, `#FFF`, stroke `#8E7FA6` 1, r 40, focus ring spread 4 `#9BB068@0.25` (old green), padding 16. Chips wrap with an 8 gap and 8 between rows.
  - Entered chips (Tag xs Fill Text Only 4002:12385): fill `#F2F5EB` (**old green tint**), r 32, padding 4/8, `Bold 14 ls-0.2% #8E7FA6`. Copy: "Social Withdrawl" (**typo: "Withdrawal"**), "Feeling Numbness", "Feeling Sad".
  - Typing chip (Outlined 4002:12373): "Depresse|" in `#736B66`, caret `#838264` (old olive).
- **"Most Common:"** row (24 below, centred, 274 wide): label `SemiBold 14 #4E3A5E`. Suggestion chips: fill `#8E7FA6`, `Bold 12 #FFF`, close icon. Copy: "Depressed", "Angry".
  - The design shows these with an × icon, as though they were already selected. Clarify whether tapping adds the chip or removes it. `components/MostCommonChips.tsx` already models "title + chips + onRemove" and is used only by `suggested-categories.tsx`.
- Continue at y 670.
- **Gaps:** the code is a plain multiline textarea (`assessment.tsx:1317-1331`). The suggestion vocabulary is not defined beyond the 5 chips shown. `other_symptoms` is text; store it as newline-joined values (see `lib/assessment-answers.ts`) or JSON.

### A12 — stress lights (4002:14998)
- Title: "How stressed do you feel right now?" (frame 340 wide).
- **Stress lights** (6673:3032, full-screen layer): five orbs in a row with centres at x 43, 115, 187, 259, 331. Each orb is a glow plus a contour SVG (4 organic rings, stroke `#6B5279` at opacities .30/.22/.15/.08, width 1). The labels sit at y 424, 72 wide, `Medium 11 #A6A09B`.

| Level | Glow | Contour SVG |
|---|---|---|
| Calm | 8,325 70² `#7FC6F1@0.35` blur 16 | 6673:3034 |
| Light | 80,325 70² `#B6BBE2@0.35` blur 16 | 6673:3041 |
| Moderate | 152,325 70² `#E2CC40@0.35` blur 16 | 6673:3048 |
| **High** (selected) | 204,305 **110²** `#F2A98A@0.60` blur 22, inner light 251,352 16² `#FFF6D6` blur 4 | 6673:3055 (6 rings, .50→.08) |
| Intense | 296,325 70² `#FFB3BE@0.35` blur 16 | 6673:3065 |

- The selected label is `Bold 11 #6B5279`. The screenshot shows the rings as spirograph/star line art, so export the contour frames as SVG; do not redraw them as circles.
- Value at y 470: "High" `SemiBold 30 #241A2E`. Caption at y 512: "It looks like a lot is on your plate.\nWe’ll start gently." `Regular 14 #736B66`.
- Captions for Calm, Light, Moderate and Intense are **not in Figma**. A hidden stale caption sits in frame 4002:15004.
- Legal note at y 617: "Feeling overwhelmed or unsafe? Please contact your local emergency services now."
- Continue at y 665.
- **Gaps:** the code uses an 11-dot 0–10 picker with labels None/Low/Moderate/High/Extreme (`assessment.tsx:493-603, 1333-1344`). That becomes 5 levels. `stress_level` is an integer that downstream code treats as 0–10: `lib/types.ts:6` `MoodCheckIn.stress`, `lib/freudScore.ts:145-146` (`100 - avgStress*10`). Choose a mapping (for example Calm 1 → 2, Light → 4, Moderate → 6, High → 8, Intense → 10) or migrate the scale (see Backend).

### A13 — Voice Check-In (4002:15015)
- Header (gap 12):
  - Title "Voice Check-In" (1 line). The code has "Voice Check-in" with a lowercase i.
  - Subtitle "This helps us better understand how you’re feeling today." `Medium 16/160% ls-0.3% #736B66`.
- **Orb** 4002:15023, 236², centred, 32 below the header:
  - Ring 236 stroke `#6B5279@0.15` 1.
  - Glow 32,32 172² `#D8B4D8@0.55` blur 30.
  - Glow 63,63 110² `#E2CC40@0.85` blur 16.
  - Inner light 93,93 49.5² `#FFF6D6@0.95` blur 8.
  - Core 94,94 48² `#FFF6D6` solid.
  - Use it as the record button. While recording, pulse the glows to the audio level (`components/SoundPulse.tsx` today).
- **Prompt** (32 below, 343×78): "I am here, taking a moment for myself." `SemiBold 30/38 ls-1%` centred. Words already spoken are `#FFFFFF` on a `#8E7FA6` pill highlight (radius full; in the design it covers "I am here", 142×41). The remaining words are `#736B66`.
- Continue at content y 528.
- Mic idle, recording, recorded and playback states are **not designed**. The code has them (`:1352-1418`).
- **Gaps:** `highlightedWordIndex` is constant −1 (`assessment.tsx:876`), so the highlight never advances. Wire it to transcript progress. The code also shows a "Your words" boxed card (`:1421-1478`) at 20px with an olive highlight. The design has no box and uses 30px text. The `soundSubtitle` copy differs. `expressionCheck` exists in the type and table (`:745-751`, `expression_check`) but has no step.

### A14 — Write What’s on Your Mind (4002:15033) — new
- Header 308 wide, gap 12:
  - Title "Write What’s \non Your Mind" (forced break).
  - Subtitle "You can write freely here. / This is a private space to share / how you’re feeling." `Medium 16/160% ls-0.3% #736B66`. Figma contains a U+2028 line separator; use `\n`.
- **Field** (48 below): 343×186, `#FFF`, stroke `#6B5279` 1, r 32, ring spread 4 `#4B3425@0.25`, padding 24.
  - Text: `SemiBold 20/25 ls-1% #241A2E`. Sample: "There’s a lot on my mind, and I don’t know where to start."
  - Counter at the bottom right: `Solid/17 document` 24 plus "75/250" `SemiBold 16 #736B66`, with a 250-character limit. The sample text is 59 characters, so the counter value is wrong in Figma.
- **Voice pill** (24 below, centred): 189×40, `#F1ECF5`, stroke `#6B5279` 1.5, pill radius, padding 8/16. `Solid/76 microphone` 24 plus "Use voice Instead" `SemiBold 16 #241A2E`. The **capital "I" is a typo**; it should read "Use voice instead". The pill switches to dictation.
- Continue at content y 512.
- **Gaps:** there is no step, no type field and no column (see Backend). The placeholder state is not designed.

### A15 — Paywall · Your plan is ready (6600:2103)
The canonical layout is in **01-onboarding-auth.md → Welcome paywall**. Differences on this screen:
- Title: "Your plan is ready" (`SemiBold 30 #241A2E`, 24,212).
- Subtitle: "Unlock it with Pro, free for 7 days." (`Regular 15/145% #736B66`, 44,256).
- CTA: **"Get my plan"** (327×58, `#6B5279`, r 999, `SemiBold 17 #FFF`, no arrow).
- The features, plan cards (Yearly "7 days free, then €59.99/year" €4.99/mo "Save 50%"; Monthly €9.99/month), close button, logo mark and legal line ("Auto-renews unless cancelled 24h before the period ends · Restore purchase") are the same as the Welcome paywall, per the extraction in `assessment-4.txt`.
- Glows: 37.5,0 300² `#E2CC40@0.38` blur 80; 160,90 200² `#D8B4D8@0.30` blur 80.
- **Gaps:** the code routes completion to `/(onboarding)/assessment-summary` (`assessment.tsx:911`). Route it to this paywall variant instead. Close and success both continue to P1. Pass the variant copy as a prop to the shared paywall component built for 01.

## 3b. Built (Nov 2026): profile setup

The profile frames were re-extracted from Figma section `4002:15061` before building; they now use the library back button (white, `#CFC6D6` stroke), SemiBold 26 titles, Primary L buttons at y 674, library Chips on P2 and the library Toggle with a `#FFF6D6` knob on P3. The §4–5 values below are the earlier extraction.

- **Flow:** assessment → (starting Glow score saved) → P1 → P2 → P3 → P4 → P5 → Home. `assessment-summary` and `suggested-categories` are no longer in onboarding. P5 saves the assessment goal as `profiles.intention` and the top three suggested topics as `selected_issues`, which is what `entryRouteForProfile` treats as setup done. The "Your plan is ready" paywall (A15) is not wired yet.
- **P1:** the photo goes to the private `avatars` bucket (`<user id>/avatar.jpg`, signed URLs, owner-only policies) and `profiles.avatar_path`; `delete-account` removes it first. The birthday is stored in `profiles.birthday` and is the source of truth; the field is masked as DD / MM / YYYY and must be a real past date.
- **P2:** presets Morning 08:30, Afternoon 14:00, Evening 21:00; tapping the time opens a time picker (iOS sheet, Android dialog) and a custom time selects no chip. "Set reminder" saves `profiles.checkin_time` and reschedules `daily_checkin` at that time.
- **P3:** choices are saved to `profiles.notification_prefs`. Journal reminder and Weekly insights schedule local reminders. **Glow AI messages is saved but sends nothing yet**: it needs server push and a push-token table.
- **P4:** only shown when the phone has biometrics enrolled. The wording follows the phone: Face ID or Touch ID on iOS; "fingerprint or face unlock", "fingerprint unlock" or "face unlock" on Android. The lock is per user and per device (AsyncStorage) and asks at launch and after 30 seconds in the background (`components/AppLockGate.tsx`; the lock screen is not designed and reuses the P4 look).
- **Figma slips kept or changed:** the step track is full plum in every frame, so its empty part is as dark as the fill end; code follows Figma. The P5 ring track is also full plum, which hides the progress; code draws it at plum @0.12.

## 4. Profile setup shell (P1–P4)

1. **Glows:** 37.5,−10 300² `#E2CC40@0.30` blur 80; 170,90 200² `#D8B4D8@0.28` blur 80.
2. **Back button** at 24,54: **44×44**, stroke `#6B5279` 1.5, r 22, `Icon/Arrow back` 22. This differs from the 48 Top Nav; foundations should decide whether it is a size variant.
3. **Step progress** at 127.5,75: a 120×3 track `#6B5279@0.12` r 2, with a LINEAR fill `#E2CC40 → #8E7FA6`, r 2. The fill width is 30/60/90/120 for steps 1–4.
4. **"Skip"** at 323,66: `SemiBold 14/140% #8E7FA6`.
5. **Title** at 24,126, 327 wide: `SemiBold 28/140% #241A2E`, left-aligned. **Subtitle** at 24,171: `Regular 14/140% #736B66`.
6. **CTA:** 327×56 (24 gutters, not 16), `#6B5279`, r 999. Label `SemiBold 16/140% #FFF` with a 10 gap and `Icon/Arrow forward` 20. It sits at y 660 when a text link follows, otherwise at y 700.
7. **Text link** at y 732, centred: `SemiBold 14/140% #8E7FA6`.

**Gaps (shell):**
- `profile-setup.tsx:59` uses a dark background `#6f6660`, a white card (`:95-104`), white header text and a "←" glyph (`:69-87`), and a `ProfileProgressRing` (`:88`).
- The code has 6 steps (`:16-17`): intro, language, name, intention, routine, finish. The design has 4 data steps plus P5.
- The language step has no design. Decide whether to drop it or move it to Settings.
- The code button reads "Next"/"Complete" (`:346-384`), and "Skip setup" (`:387-402`) jumps to suggested-categories.

## 5. Profile screens

### P1 — Your profile (6676:3017)
- Title "Let’s get to know you". Subtitle "Just the basics. You can change these any time."
- **Avatar:** glow 102.5,215 170² `#E2CC40@0.40` blur 30. Circle 131.5,244 112² `#FFF`, stroke `#6B5279@0.25` 1.5, `Icon/Line user` 40 centred. Add badge 215.5,326 36² `#6B5279`, stroke `#F7F4F2` 3, `Icon/Line plus` 18.
- Caption at y 376: "Add a photo (optional)" `Medium 13/140% #8E7FA6`, centred.
- Label "What should we call you?" at 24,420: `SemiBold 13/140% #241A2E`. Name field at 24,444: 327×52, `#FFF`, r 26, focused stroke `#6B5279` 1.5, text 20,15 `Medium 15/140% #241A2E`. Sample value "Matthew".
- Label "Your birthday" at 24,516. Birthday field at 24,540: 327×52, `#FFF`, r 26, no stroke, placeholder "DD / MM / YYYY" `Regular 15/140% #A6A09B`. It needs a masked date input or a date picker. Locale order is not designed.
- CTA "Continue" at y 700.
- **Gaps:**
  - The name step exists with different copy (`translation.ts` `profileSetup.nameQuestion` matches; `nameOptional` and `namePlaceholder` are not shown in the design).
  - Avatar: `expo-image-picker` is **not installed** (absent from `package.json`). There is no storage bucket usage and no `profiles.avatar_url` column (only `community_profiles.avatar`).
  - Birthday: no column exists. It also overlaps with A3 age; decide which is the source of truth and derive the other.

### P2 — When should we check in? (6676:3066)
- Title "When should we check in?". Subtitle "A gentle daily nudge to notice how you feel."
- Glow 67.5,210 240² `#E2CC40@0.45` blur 50. Aura contours 6676:3094: 6 rings, stroke `#6B5279` at .30/.25/.20/.15/.10/.05, width 1, sizes 140×131.6 up to 233.5×214.7, centred at about 187,330.
- Time "21:00" at y 290: `SemiBold 56/140% #6B5279`, centred. "every evening" at y 360: `Medium 14 #736B66`.
- Presets at 40,460, row gap 8, pill radius, padding 10/18:
  - Default: "Morning" (89 wide), "Afternoon" (101 wide). `#FFF`, stroke `#E8E0D5` 1, `Medium 14 #736B66`.
  - Selected: "Evening", `#F1ECF5`, stroke `#6B5279` 1.5, `SemiBold 14 #6B5279`.
- CTA "Set reminder" at y 660. Link "Not now".
- Not designed: the default times for Morning and Afternoon, the captions ("every morning"/"every afternoon"), and whether tapping the time opens a picker.
- **Gaps:**
  - The code routine step offers Morning / Evening / Anytime chips (`profile-setup.tsx:248-266`, `lib/profile-choices.ts:12`) stored as `profiles.routine` text. There is no Afternoon option and no time.
  - `lib/notifications.ts:299-305` hard-codes `daily_checkin` at 20:00. The design shows 21:00.
  - The time must be stored (no column; prefs live in AsyncStorage `notification-preferences:v1`, `:294`), and "Set reminder" must reschedule `daily_checkin`.

### P3 — Stay gently in touch (6676:3118)
- Title "Stay gently in touch". Subtitle "Choose what you’d like to hear from us."
- **Card** at 24,230: 327×226, `#FFF`, r 24, padding 6/16. Rows: horizontal, gap 12, padding 14/0. Dividers: 295×1 `#F0EBE5`.
  - Icon bubble: 40² `#8E7FA6@0.14`, r 20, `Icon/Line` 20.
  - Title: `SemiBold 15 #241A2E`. Subtitle: `Regular 12 #A6A09B`, 185 wide.
  - Toggle: 46×28, r 14. On: `#6B5279`, knob 22 `#FFF` at x 21. Off: `#E8E0D5`, knob at x 3.

| Row | Subtitle | Icon | Default |
|---|---|---|---|
| "Glow AI messages" | "When Glow AI has something for you" | sparkle 6598:1814 | on |
| "Journal reminder" | "A calm prompt in the evening" | journal 6598:1795 | on |
| "Weekly insights" | "Your week, every Sunday" | chart 6598:1859 | off |

- CTA "Allow notifications" at y 660 requests OS permission (`registerForPushNotificationsAsync`, `lib/notifications.ts:32`), then saves the toggles. Link "Maybe later".
- **Gaps:** no onboarding screen exists. `REMINDERS` (`lib/notifications.ts:295-342`) has `journal_reminder` (20:30) and `weekly_summary` (weekday 1 = Sunday, 18:00), but **no Glow AI messages key**. That key needs server push (no push token storage exists in the schema). Prefs are device-local only.

### P4 — Keep your space private (6676:3178)
- Title "Keep your space private". Subtitle (2 lines): "Use Face ID so only you can open your journal and check-ins."
- Glow 67.5,240 240² `#D8B4D8@0.50` blur 50. Glow 142.5,305 150² `#E2CC40@0.35` blur 40. Aura contours 6676:3207 (8 vectors). Face ID glyph 6676:3216: 64², stroke `#6B5279` 3.7, centred at about 187,360.
- CTA "Enable Face ID" at y 660. Link "Not now".
- Copy must switch by platform and capability: "Face ID" or "Touch ID" on iOS, "fingerprint" or "biometrics" on Android, and the screen is hidden when no biometrics are enrolled. These variants are not designed.
- **Gaps:** `expo-local-authentication` is **not installed**. There is no app-lock gate on resume, no stored preference, and no `NSFaceIDUsageDescription` in `app.json`. No screen exists.

### P5 — You’re all set (6676:3226)
- No back button, progress bar or Skip.
- Glows: the shell pair plus 27.5,130 320² `#E2CC40@0.45` blur 70 and 157.5,230 200² `#D8B4D8@0.40` blur 60. Aura contours 6676:3246 (8 vectors).
- **Ring** at 101.5,204, 172²:
  - Track: arc ellipse with innerRadius 0.96 (≈3.4px stroke), `#6B5279@0.12`, full circle (6676:3255).
  - Progress: same thickness `#6B5279`, from −90° to 198° (288° = 80%) (6676:3256).
  - Draw it with react-native-svg `Circle` using strokeDasharray, a 3.5 stroke and a round cap; the screenshot shows round ends.
- "80" at y 246: `SemiBold 60/140% #6B5279`. "your starting glow" at y 316: `Medium 13 #736B66`.
- Title at 24,440: "You’re all set, Matthew" `SemiBold 28/140% #241A2E`, centred. Use "You’re all set" when there is no name.
- Body at 44,482: "We’ve built your first plan around your answers. Let’s start with something small." `Regular 14/140% #736B66`, centred.
- CTA "Go to my home" at y 700 → `/(tabs)/home`.
- **Gaps:**
  - `profile-completion.tsx` shows a "Freud Score" circle with a coloured border (`:160-195`), six breakdown bars (`:199-240`) and a "Continue" button to suggested-categories (`:248`).
  - The design shows only the score as "your starting glow". It drops the breakdown and the "Freud" naming.
  - The score source stays `useFreudScore` (`:85`).

## 6. Backend gaps

There is no migration for `assessments` or `profiles` in `supabase/migrations/`; both tables exist only remotely. Columns are taken from `types/database.types.ts:133-173` and `:714-730`.

| Need | Current | Change |
|---|---|---|
| A1 goal single-select | `assessments.goal` text (newline list) | keep; write a single value |
| A2 gender Male/Female/skip | `gender` text (Woman/Man/Non-binary/Prefer not to say) | value set changes; keep the old values readable |
| A5 mood slider | `mood` text | add `mood_value numeric` (0–1) or store the band label |
| A6 Yes/No | `sought_help_before` text | drop "Not sure" |
| A7 2 options | `physical_distress` + `physical_distress_notes` | notes unused |
| A8 sleep labels | `sleep_quality` int 1–5 | labels only |
| A9 4 options | `taking_meds` text Yes/No/Not sure | new values: prescription / otc / none / prefer_not |
| A10 picker | `meds` comma text | add `medications jsonb` (array of ids/names) + medication catalogue |
| A11 chips | `other_symptoms` text | newline list or `concerns jsonb` |
| A12 5 levels | `stress_level` int read as 0–10 (`lib/freudScore.ts:146`, `lib/types.ts:6`) | map 5 levels to 0–10 or add `stress_band` and update consumers |
| A13 voice | `sound_check` json | unchanged; `expression_check` unused |
| A14 write step | none | add `reflection_text text` (≤250) to `assessments` and `Assessment` type (`assessment.tsx:724`), `useProfile.saveAssessment` (`hooks/useProfile.ts:147-176`) |
| P1 avatar | none | `profiles.avatar_url` + storage bucket `avatars` with RLS + expo-image-picker |
| P1 birthday | none | `profiles.birthday date` |
| P2 check-in time | `profiles.routine` text; reminder fixed 20:00 | `profiles.checkin_time time` (or local pref) + reschedule `daily_checkin` |
| P3 notification prefs | AsyncStorage only | sync prefs table or `profiles.notification_prefs jsonb`; push token table for Glow AI messages |
| P4 biometric lock | none | expo-local-authentication, device-local flag (`SecureStore`), lock gate in `app/_layout.tsx` |

## 7. Assets

Glows are data for the foundations Skia renderer, not files. Icons come from the foundations icon set.

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| 6594:1717…6594:1730 | Glow · step colour | A1–A14 | Glow | 300² | @0.14 blur 90, colour ramp in §2 |
| 6671:3356 / 3357 / 3367 | Glow, Glow, Inner light | A2 Male | Glow | 170 / 90 / 20 | `#7FC6F1@.45` b36; `#E2CC40@.30` b24; `#F2D96A@.90` b6 |
| 6671:3369 / 3370 / 3380 | Glow, Glow, Inner light | A2 Female | Glow | 170 / 100 / 20 | `#FFB3BE@.45` b36; `#D8B4D8@.40` b26; inner as Male |
| 6671:3358 | Aura contours | A2 Male | SVG | 343×152 | 8 vectors, clip to card |
| 6671:3371 | Aura contours | A2 Female | SVG | 343×152 | 8 vectors |
| 6673:2995 / 2996 | Glow | A3 | Glow | 260 / 170 | `#E2CC40@.45` b50; `#D8B4D8@.40` b40 |
| 6673:2997 | Aura contours | A3 | SVG | 375×812 frame | 7 rings around the wheel; crop to the bounds |
| 6673:3074 / 3075 / 3084 | Glow, Glow, Inner light | A5 | Glow | 260 / 170 / 40 | `#D8B4D8@.55` b50; `#FFB3BE@.45` b40; `#FFF6D6@.95` b10 |
| 6673:3076 | Aura contours | A5 | SVG | full-frame | 7 rings; may scale/rotate with mood |
| 6673:3086 | Mood spectrum | A5 | Code (SVG gradient) | 303×18 | 5-stop gradient §3 A5 |
| 6671:3382 / 3383 / 3397 | Glow, Glow, Inner light | A6 | Glow | 240 / 160 / 22 | `#E2CC40@.35` b50; `#D8B4D8@.40` b40; `#F2D96A@.95` b6 |
| 6671:3384 | Thoughts to calm | A6 | SVG | 286² | 12 vectors |
| I4002:14819 / I4002:14820 FAB | pulse / check icons | A7 | Icon | 24 | inside Button Icon FAB 4002:12318; confirm variants |
| 6673:3006 / 3021 | Glow, Halo | A8 | Glow | 320 / 96 | `#D8B4D8@.35` b70; `#E2CC40@.55` b22 |
| 6673:3007 | Arc | A8 | SVG | 280×110 | dashed path |
| 6673:3009, 3013, 3017, 3022, 3026 | Moon 1–5 | A8 | Code (SVG) | 36 / 54 | circle + clipped shadow; table §3 A8 |
| 6673:3033 / 3040 / 3047 / 3054 / 3064 | Glow | A12 | Glow | 70 / 110 | colours §3 A12 |
| 6673:3062 | Inner light | A12 | Glow | 16 | `#FFF6D6` b4 |
| 6673:3034, 3041, 3048, 3055, 3065 | Contour | A12 | SVG | 70² / 110² | export each; selected = 3055 |
| 4002:15024–15027, 6671:3398 | Voice orb | A13 | Code + Glow | 236 | ring stroke + 3 glows + core |
| 4002:15029 | Highlight pill | A13 | Code | dynamic | `#8E7FA6` behind spoken words |
| 6655:3284 / 3285 | Glow | A15 | Glow | 300 / 200 | see 01 doc |
| 6655:3290 | Logo mark | A15 | SVG | 72² | shared with 01 |
| 6676:3018/3019 (+ same on 3067/68, 3119/20, 3179/80, 3227/28) | Glow | P1–P5 | Glow | 300 / 200 | `#E2CC40@.30`, `#D8B4D8@.28` b80 |
| 6676:3044 | Glow | P1 | Glow | 170 | `#E2CC40@.40` b30 |
| 6676:3093 | Glow | P2 | Glow | 240 | `#E2CC40@.45` b50 |
| 6676:3094 | Aura contours | P2 | SVG | 234×215 | 6 rings |
| 6676:3205 / 3206 | Glow | P4 | Glow | 240 / 150 | `#D8B4D8@.50` b50; `#E2CC40@.35` b40 |
| 6676:3207 | Aura contours | P4 | SVG | full-frame | 8 vectors |
| 6676:3216 | Face ID | P4 | SVG | 64² | stroke 3.7 |
| 6676:3244 / 3245 | Glow | P5 | Glow | 320 / 200 | `#E2CC40@.45` b70; `#D8B4D8@.40` b60 |
| 6676:3246 | Aura contours | P5 | SVG | full-frame | 8 vectors |
| 6676:3255 / 3256 | Ring track / Ring · 80 | P5 | Code (SVG arc) | 172² | 3.4 stroke, 80% |
| 6589:1632 / 1637 / 1672 | Icon/Arrow back, forward, close | all | Icon | 20–24 | |
| 4002:13177, 4002:13179, 4002:13652, 4002:13695 | radio empty/filled variants | A1, A7, A9, A10 | Icon | 24 | consolidate into one Radio component |
| 4002:13685 | Monotone/11 search | A10 | Icon | 16 | |
| 4002:13697 | Solid/17 document | A14 | Icon | 24 | |
| 4002:13701 | Solid/76 microphone | A14 | Icon | 24 | |
| 6598:1837 | Icon/Line check | A15 | Icon | 14 | |
| 6604:2067 / 6609:2490 | Icon/Line user / plus | P1 | Icon | 40 / 18 | |
| 6598:1814 / 1795 / 1859 | Icon/Line sparkle / journal / chart | P3 | Icon | 20 | |

There are no raster assets in these sections.

## 8. Blockers and design issues

- **Copy typos:**
  - "Social Withdrawl" should be "Social Withdrawal" (A11 4002:14985).
  - "Use voice Instead" should be "Use voice instead" (A14 4002:15058).
  - "No Physical Pain At All" uses Title Case while the rest of the copy is sentence case (A7).
- **Placeholder and inconsistent data:**
  - "Axpelliarmus" is a fake medication (A10 6037:2332).
  - The A10 selected chips (Aspirin, Ibuprofen) do not match the selected rows.
  - The A14 counter reads "75/250" for 59 characters.
  - On A4 the indicator sits between 127 and 128 while the value reads 128.
- **Undefined states:**
  - Mood levels beyond Anxious, Good and Tense, and whether the orb changes colour.
  - Sleep captions for 4 of 5 levels.
  - Stress captions for 4 of 5 levels.
  - Morning and Afternoon times and captions on P2.
  - Medication search, free-text fallback and empty state.
  - Voice recording states.
  - Disabled Continue.
  - Biometric copy on Android.
- **Product decisions:**
  - The gender options drop Non-binary (A2).
  - Whether A10 is conditional, and what that does to the "of 14" count.
  - Mapping the 5-level stress scale onto the 0–10 consumers.
  - Birthday versus age as the source of truth.
  - Whether the profile language step and `suggested-categories` / `assessment-summary` are retired.
  - A medication dataset source and its licence.
- **Old palette colours left in Figma:** `#9BB068` focus rings (A2, A4, A11), `#F2F5EB` chip fill (A11), `#FE814B` tab ring (A10), `#838264` caret (A11), `#3F3C36` card label (A2), `#E1E1E0` index bar (A10).
- **Leftover layers to delete in Figma:**
  - Empty frames 6016:1597 and 6050:2776 (A5).
  - Hidden stale caption frames 6040:2493 (A8) and 4002:15004 (A12).
  - The A9 content width of 329 instead of 343.
  - Layer names carry old copy ("Dr Freud ai is here to listen"). The A14 text layer is named with self-harm sample text ("I don t want to be alive anymore…", 4002:15051). Rename it before sharing the file.
- **Figma calls:** two `use_figma` calls failed with an SSE JSON parse error on A13 and A14 (an invalid character in layer text). A sanitised rerun succeeded, and no data is missing.

## 9. Proposed tasks

1. Export the assessment and profile vector art as SVG (contours 6671:3358, 6671:3371, 6673:2997, 6673:3076, 6671:3384, 6673:3007, 6673:3034/3041/3048/3055/3065, 6676:3094, 6676:3207, 6676:3246, Face ID 6676:3216) into `assets/svg/assessment/` and `assets/svg/profile/` (§7).
2. Rebuild the assessment shell in `assessment.tsx`: Top Nav with the "N of 14" tag, no white card or progress bar, per-step top-glow colour ramp, a pinned "Continue" button, a legal-note slot and foundation tokens (§2).
3. Restyle the option-row steps A1 (single-select goal), A6 (Yes/No segmented), A7 (distress cards) and A9 (four medication options plus the new A10 condition) to the Figma row components (§3 A1, A6, A7, A9).
4. Build the A2 gender aura cards with "Prefer to skip, thanks" once product confirms the option set (§3 A2).
5. Replace the age ruler with the A3 vertical snapping age wheel and aura (§3 A3).
6. Rebuild A4 weight: a full-width kg/lbs tab group, a 96px value and a 16px-pitch ruler with a 12×118 indicator (§3 A4).
7. Replace the A5 mood chips with the mood orb and gradient spectrum slider (§3 A5; blocked on the level list).
8. Build the A8 sleep moons selector with crescent moons on a dashed arc, value and caption (§3 A8).
9. Build the A10 medication picker (A–Z index, search, scrollable list with track, selected chips) and add a medication catalogue to `data/` (§3 A10).
10. Build the A11 concerns chip input with the "Most Common" suggestions using `MostCommonChips` (§3 A11).
11. Build the A12 stress lights 5-level selector with captions and the legal note, and map the levels onto the 0–10 stress consumers (§3 A12, §6).
12. Restyle the A13 Voice Check-In with the orb record button and a live word highlight wired to the transcript (§3 A13).
13. Add the A14 "Write What’s on Your Mind" step with the 250-character counter and the "Use voice instead" dictation switch (§3 A14).
14. Add a Supabase migration that captures the `assessments` table and adds `reflection_text`, `medications jsonb`, `mood_value` and a stress band, then update `Assessment`, `useProfile.saveAssessment` and the database types (§6).
15. Route assessment completion to the "Your plan is ready" paywall variant ("Get my plan") and retire `assessment-summary.tsx` from the flow (§3 A15).
16. Rebuild the profile setup shell as 4 steps: 44px back, gradient step progress, Skip, a 327 CTA and a text link, with the language and intention steps dropped (§4).
17. Build P1 "Let’s get to know you": an avatar picker (install `expo-image-picker`, `avatars` storage bucket, `profiles.avatar_url`), name and birthday (`profiles.birthday`) (§5 P1, §6).
18. Build P2 "When should we check in?": the time display, Morning/Afternoon/Evening presets, a stored check-in time, and a `daily_checkin` reschedule (§5 P2, §6).
19. Build P3 "Stay gently in touch": notification toggles, a permission request, a new `glow_ai_messages` preference and synced prefs (§5 P3, §6).
20. Build P4 "Keep your space private": install `expo-local-authentication`, add the platform-aware biometric copy, a stored flag and an app-lock gate on resume (§5 P4, §6).
21. Rebuild P5 "You’re all set" with the 80% starting-glow ring and named title, route it to home, and retire `suggested-categories.tsx` from onboarding (§5 P5).
22. Raise a Figma cleanup ticket: copy typos, the placeholder medication, mismatched chips, the counter, the ruler label, old-palette colours, leftover and hidden layers, sensitive layer names, and the missing level captions and states (§8).
