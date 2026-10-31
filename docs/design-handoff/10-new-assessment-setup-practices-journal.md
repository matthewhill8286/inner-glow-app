# 10 · New screens: medication search, check-in times, practice extras, Hold phase, entry options

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456`. Audit of 31 Oct 2026, read-only.

This doc only covers what is new or different. It builds on these docs and does not repeat them:

- `02-assessment-profile-setup.md` §2 (assessment shell), A9/A10, §4 (profile setup shell) and P2.
- `07-mindful-hours.md` §2.6 (Set up), §2.7 (breathing player), §2.8 (End early sheet), §2.9 (Complete modal), §2.13 (video player), §5 (backend).
- `04-journal-mood.md` J5 (journal entry).

Shared code it references is already built: `components/ui/AppButton.tsx` (AppButton, IconFab), `components/ui/IconButton.tsx` (IconButton, TitlePill, StepTag, TopNav), `components/ui/AppField.tsx`, `components/ui/Chip.tsx` (Chip, MetaChip, Tag), `components/ui/controls.tsx` (Toggle, Radio, Checkbox, SelectableCard, SegmentedControl, StepProgress, ProgressBar, LegalNote), `components/glow/Glow.tsx` (GlowField, Glow, GlowOrb), `components/navigation/GlowTabBar.tsx`, `components/icons/Icon.tsx` + `iconData.ts`, and the tokens in `constants/theme.ts` and `constants/typography.ts`.

Notation: `x,y w×h` is relative to the 375-wide screen unless stated. Type is `Family Weight size/lineHeight colour`. Every text node on these screens uses `auto` line height and letter spacing 0, so only size and colour are given. Copy is verbatim from Figma.

Raw extraction: `scratchpad/figma/specs/10-new-1.txt` … `10-new-4.txt`. Renders (1:1): `scratchpad/figma/shots/new/<node-id>.png`.

---

## 1. Overview

### 1.1 Where the screens live now

The brief listed section `6786:4878` "New screens — to place". **That node no longer exists.** The nine screens have already been moved into the regular frames, and the frames have been renamed:

| Frame (was) | Frame id | Now named |
|---|---|---|
| Mental Health Assessment | `4002:14604` | 04 · Assessment |
| Profile setup | `4002:15061` | 05 · Profile setup |
| Mindful Hours — Flow | `6614:2030` | 10 · Practices (Mindful Hours) |
| Mental Health Journal | `4002:15069` | 08 · Journal |

The breathing player frames in `6614:2030` were also reorganised. `6105:1350` (the old "Breathe out") has been deleted. `6160:1577` is now named "Mindful 11 · Breathe out" and is the **last breath with the Complete modal on top** (see §3.10).

### 1.2 Screens and route mapping

| # | Screen id | Name | Size | Frame | Current code | Proposed route / place |
|---|---|---|---|---|---|---|
| N1 | `6787:5620` | Assessment · Medication search | 375×812 | 04 | `app/(onboarding)/assessment.tsx:1267-1315` (`medsSpecify`: free text + add button) | same step, rebuilt |
| N2 | `6787:5710` | Assessment · Medication not found | 375×812 | 04 | none | empty state of N1 |
| N3 | `6787:5765` | Profile setup · Check-in · Morning | 375×812 | 05 | `app/(onboarding)/profile-setup.tsx:248-266` (routine chips) | P2 state |
| N4 | `6787:5819` | Profile setup · Check-in · Afternoon | 375×812 | 05 | same | P2 state |
| N5 | `6787:6126` | Practices · Choose a sound | 375×834 | 10 | none (`mindful/new-exercise.tsx:23-35` soundscape list is a wizard step) | sheet on `mindful/practice/[id].tsx` |
| N6 | `6787:6276` | Practices · Saved to favourites | 375×856 | 10 | none | Set up state + toast |
| N7 | `6787:6374` | Practices · Favourites | 375×812 | 10 | none | `mindful/favourites.tsx` |
| N8 | `6787:6472` | Practices · Daily goal | 375×812 | 10 | none | `mindful/goal.tsx` |
| N9 | `6787:6539` | Practices · Video · End early? | 375×812 | 10 | none (`stress/list/[category]/[videoId].tsx` has no end handling) | sheet in `mindful/play/[id].tsx` (kind `video`) |
| N10 | `6764:5089` | Mindful 08b · Hold | 375×813 | 10 | `app/(tabs)/mindful/session.tsx` (phase `hold`, `:21-37`) | `mindful/play/[id].tsx` (kind `breathing`) |
| N11 | `6764:5374` | Mindful 09 · Breathe out | 375×813 | 10 | same | same |
| N12 | `6764:5668` | 8. Entry options | 375×900 | 08 | `app/(tabs)/journal/[id].tsx` (inline edit `:573-786`, Edit/Delete buttons `:888-940`) | sheet on the entry screen |

---

## 2. New library components used by these screens

These screens are built from a **new component library** on the "🧩 Design System" page. None of it is described in `00-foundations.md`. The shared code components were built from the older library, so several of them need a variant or a value change. The table lists only what these screens need.

| Figma component (set id) | Spec | Code today | Change needed |
|---|---|---|---|
| **Nav Bar** `6753:4187`, Theme=Light `6753:4165` | 327×44 at `24,54`, row gap 8. Back Button 44 + centred title `Urbanist SemiBold 15 #4E3A5E` (223 wide) + 44 right slot. | `TopNav` (`IconButton.tsx:79-104`): 48 back, left-aligned SemiBold 20 title. | Add a `bar` layout to `TopNav` (centred 15 title, 44 slots). |
| **Back Button** `6746:4457`, Theme=Light `6746:4449` | 44×44, fill `#FFFFFF`, stroke `#CFC6D6` 1, r 22, `arrow/back` 22 at 11,11. | `IconButton` outline: transparent, stroke plum 1.5 at 44 (`IconButton.tsx:46-47`). | Add a `light` variant (white fill, `#CFC6D6` 1). `#CFC6D6` is not in `palette`; add it (it is also the radio-off and grabber colour). |
| Right-slot circle (not a component) | 44×44, `#FFFFFF` r 22, no stroke, icon 20 `#6B5279` (heart is drawn 19.4). Active state fill `#F1ECF5`. | none | `IconButton` variant `light` with no stroke, plus `active`. |
| **Search Field** `6753:4157` | 327×48, `#F5F1F7`, r 24, focused stroke `#6B5279` 1.5, padding 0/16, gap 10. Search glyph 20 stroke `#8E7FA6` 1.5. Text `Urbanist Regular 14 #241A2E`. | `AppField`: 56 high, white, 1 px border, 24 icon, SemiBold 16 text (`AppField.tsx:46-73`). | Add `variant="search"` to `AppField`. Needs the `search` icon (§5). Note 07 §2.2 draws the practice search white and unfocused; this one is the focused state. |
| **List Row** `6746:4495` (Style=Grouped; Trailing=Radio `6746:4478`, Toggle `6746:4469`) | Group: `#FFFFFF` r 24, no padding. Row 327×60, padding 12/16, gap 12. Optional leading bubble 36 `#F1ECF5` r 18 with a 20 icon. Label `Urbanist Medium 15 #241A2E`; supporting text 2 below `Urbanist Regular 12 #736B66`. Divider on rows 2+ at `64,0` 247×1 `#EFEAF2`. Trailing radio 22 or toggle 46×28. | none (`SelectableCard` is a different pattern). | New `ListGroup` + `ListRow` in `components/ui`. Inset the divider to 16 when there is no leading icon (Figma keeps 64 on the medication rows, which is a slip). The set also has Chevron and Value trailing and a Card style; build all four trailings. |
| **Radio** `6746:4346` | On: 22 circle filled `#6B5279` (stroke `#6B5279` 1.5) with an 8 white dot. Off: 22 ring stroke `#CFC6D6` 1.5, no fill. | `Radio` (`controls.tsx:28-34`): plum ring with a 12 plum dot; off ring lavender. | Recolour to the new spec. |
| **Toggle** `6746:4340` | On: 46×28 `#6B5279` r 999, knob 22 white at 21,3. | `Toggle` (`controls.tsx:9-25`): on plum, off `#E8E0D5`. | On matches. The Set up option rows still draw a non-component toggle (on `#8E7FA6`, off `#E6E0EA`); use the component colour everywhere and set off to `#E6E0EA` (`palette.borderLilac`). |
| **Chip** `6746:4356` | Default: h 34, `#FFFFFF`, stroke `#E6E0EA` 1, padding 8/14, `Urbanist Medium 13 #4E3A5E`. Selected: h 35, `#F1ECF5`, stroke `#6B5279` 1.5, `Urbanist Medium 13 #6B5279`. | `Chip kind="filter"` (`Chip.tsx:17-49`): h 36, border `#E8E0D5`, text `#736B66`, selected SemiBold. | Add a `preset` kind (h 34, `borderLilac`, `plumDeep` text, Medium when selected). |
| **Tag** `6753:4154`, Style=Default `6753:4146` | h 22, `#F1ECF5`, r 999, padding 4/10, `Urbanist SemiBold 12 #6B5279`. Other styles: Brand, Glow, On dark (not used here). | `Tag` (`Chip.tsx:91-102`): h 24, r 32, Bold 12 `#4E3A5E`, optional close. `StepTag` h 28 Bold 14. | Match Tag Default; keep `onRemove` as an option. |
| Meta chip (frame, not a component) | h 22, `#E6E0EA`, r 999, padding 4/10, `Urbanist SemiBold 12 #4E3A5E`. | `MetaChip variant="meta"` uses `palette.border` `#E8E0D5` (`Chip.tsx:78`). | Change the fill to `palette.borderLilac`. |
| Option pill (frame) | h 30, padding 6/12, r 999, stroke `#8E7FA6` 1. Selected fill `#8E7FA6`, `Urbanist SemiBold 13 #FFFFFF`; default `Urbanist Medium 13 #8E7FA6`. | `Chip kind="speed"` forces weight 700 when selected (`Chip.tsx:65`). | Use SemiBold (600). |
| **Button** `6746:4335` | Primary L 327×56 `#6B5279` r 999, padding 0/24, `Urbanist SemiBold 16 #FFFFFF`, **no icon**. Secondary L: fill `#F1ECF5`, stroke `#6B5279` 1.5, text `#6B5279`. Ghost L: 56, no fill, `SemiBold 16 #6B5279`. Ghost S: h 40, padding 0/16, no fill, `SemiBold 14 #6B5279`. The set also has Danger and On dark, each with Default / Pressed / Disabled, at sizes L and S. | `AppButton` (`AppButton.tsx:25-36`): `secondary`/`outline` are white with a plum border; `ghost` has a `#F1ECF5` fill; `text` is 48 high. No pressed or disabled styling from Figma. | Make `secondary` the lavender-fill style, make `ghost` fill-less with sizes L 56 and S 40, and pull Pressed / Disabled / Danger / On dark from the set (one extraction call on `6746:4335`, not done here). |
| Toast (frame `6787:6370`, not a component) | Hug × 41, `#241A2E` r 999, padding 12/16, gap 10, icon 16 white, `Urbanist Medium 14 #FFFFFF`. Centred, 16 above the CTA. | `components/Toast.tsx`: light card r 16 with a tinted icon well (`:162-213`). | Add a `dark` pill style for confirmations. |
| Bottom sheet (frames) | Overlay `#241A2E` @0.40 (entry) / @0.45 (practices). Sheet fill `#F7F4F2`, top radii 32, padding 12/24/40–42/24, column gap 20, centred. Grabber 40×4 `#CFC6D6` r 2. | none shared. | New `BottomSheet` in `components/ui`. The End early sheet (N9) still uses the older white style; see §3.8. |

---

## 3. Per-screen specs

### 3.1 N1 · Assessment · Medication search `6787:5620`

Replaces the A10 alphabet list (02 A10) with a search. Background `#F7F4F2`.

- **Glows** (blur 90): 220 at `200,40` `#E2CC40@0.15`; 280 at `-70,-50` `#FFB3BE@0.25`.
- **Nav Bar** Light at `24,54`, title "Assessment". There is **no "N of 14" step tag and no colour-ramp glow**, unlike the 02 §2 shell.
- **Content** column at `0,116`, padding 0/24, gap 24:
  1. Title "Which medications do you take?" 327 wide, `Urbanist SemiBold 30 #241A2E`, centred (two lines). The 02 shell title is `#4E3A5E`; this one is ink.
  2. Search Field (§2) at y 212, value "Ser".
  3. Results block, gap 8: caption "3 results" `Urbanist Bold 12 #8E7FA6`, then a List Group (Trailing=Radio, no leading icon) of 60-high rows:
     - "Sertraline" / "Antidepressant" (radio on)
     - "Seroquel" / "Antipsychotic"
     - "Serevent" / "Inhaler"
  4. Selected block, gap 8: caption "Selected" `Urbanist Bold 12 #8E7FA6`, then a row of Tags (gap 8): "Sertraline", "Abiraterone".
  5. Legal note (`LegalNote`): "Never change or stop medication without talking to your doctor." The text colour is `#8E7FA6`, while `LegalNote` uses `palette.textLegal` `#8A8296`; foundations should pick one.
- **Actions** at `0,674`, padding 0/24, gap 8, centred: Primary L "Continue", then Ghost S "Skip this question" (160×40).
- Home indicator at y 778.

Interaction:
- Typing filters the medication catalogue (starts-with, then contains). The count caption follows the result count.
- The row radio is a **multi-select toggle**: tapping a row adds or removes it from Selected. A radio glyph implies single-select, so a checkbox would read better (design question).
- Tags in Selected have no remove control. Tapping a selected row again removes it; add an optional × on the Tag.
- "Skip this question" saves no medications and moves to the next step.

Gaps vs code (`assessment.tsx`):
- `:1267-1315`: free text plus an olive add button (`C.olive`, `:1301`) and orange `MedTag` rows (`:605-637`). Replace with Search Field, List Group and Tags.
- `:883-889`, `:977-990`: medications are a comma-joined string in `assessments.meds`. Store an array of `{id, name, custom}` (02 §6 already proposes `medications jsonb`).
- No catalogue exists in `data/` (02 A10). The search needs a dataset with a class label per drug ("Antidepressant", "Inhaler").
- No skip action exists on assessment steps.

### 3.2 N2 · Assessment · Medication not found `6787:5710`

Same shell, glows, title, Search Field and Actions as N1. The Search Field holds "Xyzolam". In place of the Results and Selected blocks:

- **Empty block** at y 284, padding 40/0/24/0, gap 12, centred:
  - "Searching rings" 96×96 (SVG): rings 96 `stroke #6B5279@0.12 1`, 68 (at 14,14) `@0.22`, 40 (at 28,28) `@0.35`, and a centre dot 14 (at 41,41) fill `#F2D96A`.
  - "No match for “Xyzolam”" `Urbanist SemiBold 20 #241A2E` centred.
  - "Check the spelling, or add it the way you know it." `Urbanist Regular 14 #736B66` centred.
- **Secondary L** button at `24,533` 327×56: "Add “Xyzolam” manually" (§2 Secondary). It adds the query as a custom Tag (`custom: true`).
- No legal note on this state.

Gaps: no empty state exists. The Selected block is hidden here even if items were already chosen; keep it visible below the button when there are selections (design question).

### 3.3 N3/N4 · Profile setup · Check-in · Morning `6787:5765` / Afternoon `6787:5819`

These are new states of P2 (02 §5). Only the differences from the P2 spec are listed.

| Element | P2 (02 §5) | N3 / N4 |
|---|---|---|
| Glows | `#E2CC40@0.30`, `#D8B4D8@0.28` (blur 80) | `#E2CC40@0.28` 300 at `37.5,-10`; `#D8B4D8@0.25` 200 at `170,90` (blur 80) |
| Back button | 44, stroke `#6B5279` 1.5 | Back Button Light: 44, white, stroke `#CFC6D6` 1 |
| Step track | 120×3 `#6B5279@0.12` | 120×3 `#6B5279` (full opacity), fill 60 (step 2 of 4) LINEAR `#E2CC40 → #8E7FA6`. Full-opacity plum makes the empty part as dark as the fill end; keep `@0.12` (design question). |
| Title | SemiBold 28/140% | `Urbanist SemiBold 26 #241A2E` at `24,126`; subtitle 14 below |
| Hero glow | 240 `#E2CC40@0.45` blur 50 | 240 at `67.5,210` `#E2CC40@0.28` blur 50 |
| Aura contours | 6 rings `@.30/.25/.20/.15/.10/.05` | same geometry (`6787:5790-5795` / `6787:5844-5849`), strokes `#6B5279` `@.32/.27/.22/.16/.11/.06`, 1 |
| Time | "21:00" SemiBold 56 | "08:30" (Morning) / "14:00" (Afternoon) `Urbanist Regular 56 #6B5279` centred at y 290 |
| Caption | "every evening" | "every morning" / "every afternoon" `Urbanist Medium 14 #736B66`, 3 below |
| Presets | padding 10/18, Medium 14 `#736B66`, stroke `#E8E0D5` | Chip (§2) row at `58.5,460`, gap 8: "Morning", "Afternoon", "Evening". Selected chip = current slot. |
| CTA | label + forward arrow 20 | Primary L "Set reminder" with **no icon**, at y 674; "Not now" `Urbanist SemiBold 14 #8E7FA6` centred 16 below |

Interaction:
- A preset sets the time to its default: Morning 08:30, Afternoon 14:00, Evening 21:00 (from P2).
- Whether tapping the time opens a picker is still not designed. Use the installed `@react-native-community/datetimepicker` (time mode) on tap, and deselect the presets when the time no longer matches one.
- "Set reminder" saves the time and reschedules `daily_checkin`. "Skip" and "Not now" both continue without a reminder.

Gaps vs code:
- `profile-setup.tsx:248-266` and `lib/profile-choices.ts:12` offer Morning / Evening / Anytime with no time. Add Afternoon, drop Anytime, and add the time display.
- `lib/notifications.ts:299-305` hard-codes `daily_checkin` at 20:00. Make hour and minute come from the saved time.
- No storage for the time (02 §6 proposes `profiles.checkin_time`).

### 3.4 N5 · Practices · Choose a sound `6787:6126`

The Sleep Sounds Set up screen with the sound picker sheet open. 375×834.

**Underlying Set up screen.** It has been restyled since 07 §2.6. Differences from 07 §2.6:

- Header: **Nav Bar Light** (44 white back + centred title "Sleep") and a Favourite circle 44 `#FFFFFF` r 22 at `307,54` with `heart` 19.4. This replaces Header B (50 plum back + TitlePill).
- Glows (blur 90): `#D8B4D8@0.25` 270 at `150,30`; `#E2CC40@0.28` 220 at `-60,10`.
- Hero `24,114` 327×176: glow 158.4 at `149.7,-12.3` `#D8B4D8@0.25` blur 30; five "Sound lines" 327 wide strokes `#6B5279` `@.32/.26/.19/.13/.06` 1 (at y 110–143); moon 30 fill `#6B5279` at `213.9,49.9`.
- Content column at y 304, padding 0/24, gap 37. Title "Sleep sounds" (sentence case) `Urbanist SemiBold 26 #4E3A5E`; meta chips (§2 meta chip) "20 min", "Rain & ocean", "Bedtime"; description "Rain, ocean and soft night sounds to drift off." `Urbanist Regular 14 #736B66`.
- Options card 327×242 `#FFFFFF` r 28, padding 16/20/18/20. Dividers 287×1 **`#EFEAF2`** (07: `#F0EBE5`) at card y 80, 132, 184. Rows: Duration pills 10 / **20** / 45 min; "Sound" + "Rain at night" + `chevron-right` 18; "Fade out at the end" toggle on; "Voice guidance" toggle off (`#E6E0EA`).
- CTA at y 696: Primary L "Start practice" with **no play glyph** (07 had one).

**Sheet:**

- Overlay 375×834 `#241A2E@0.45`.
- Sheet `0,338` 375×496, `#F7F4F2`, top radii 32, padding 12/24/40/24, gap 20, centred.
  - Grabber 40×4 `#CFC6D6` r 2.
  - "Choose a sound" `Urbanist SemiBold 20 #241A2E` centred.
  - List Group (Trailing=Radio, leading bubble 36 `#F1ECF5` with a 20 icon), five rows:

    | Icon | Label | Supporting |
    |---|---|---|
    | `music` | Rain at night (on) | Soft rain on a window |
    | `music` | Ocean waves | Slow, steady shoreline |
    | `leaf` | Forest night | Crickets and a light breeze |
    | `activity` | Brown noise | Deep and even |
    | `mic-off` | No sound | Voice guidance only |

  - Primary L "Done".

Interaction: tapping a row selects it and previews the loop (not designed; suggest a 3 s fade preview). "Done" writes the choice back to the Sound row value. Dragging down or tapping the overlay dismisses without saving. For mindfulness the row is "Soundscape" (07 §3.4) and should open the same sheet with that category's list (only the sleep list is designed). "No sound / Voice guidance only" should be disabled or relabelled when Voice guidance is off.

Gaps vs code: `new-exercise.tsx:23-35` has a soundscape list inside a wizard step, and `lib/soundscape.ts` has no "Ocean waves", "Forest night" or "Brown noise" loops. No sheet component exists.

### 3.5 N6 · Practices · Saved to favourites `6787:6276`

The Box breathing Set up after tapping the heart. 375×856 (the frame is taller only because the toast and CTA were placed lower).

- Same Set up restyle as N5, title "Breathing" in the Nav Bar.
- Glows (blur 90): `#7FC6F1@0.18` 270 at `150,30`; `#E2CC40@0.28` 220 at `-60,10`.
- Hero (07 §2.6 breathing hero) with **new values**: glow 200 at `63,-12` `#7FC6F1@0.18` blur 40; glow 140 at `150,40` `#E2CC40@0.28` blur 40; rings 150 at `88.5,13` and 110 at `108.5,33` `stroke #6B5279 1` (full opacity, 07 had @0.20); aura contours `6787:6288` (7 vectors); inner light 46 at `140.5,65` `#F2D96A` blur 12; "4 · 4 · 4 · 4" `Urbanist Bold 12 #4E3A5E` centred at y 80.
- "Box breathing", chips "4 min", "Focus", "Beginner", description "Breathe in, hold, out, hold for 4 counts each. Steadies your focus."
- Options card 327×266: Pace **Slow** / Normal / Fast; Duration 1 / **3** / 5 / 10 min; Sound "Soft chime"; "Haptic cues" on.
- **Favourite button, saved state**: fill `#F1ECF5`, heart still the outline glyph. The Favourites list (N7) draws the heart filled `#6B5279`; use a filled heart for the saved state too.
- **Toast** (§2) `98.5,661` 178×41: `heart` 16 white + "Saved to favourites". Show for 2 s, then fade. Un-saving shows "Removed from favourites" (not designed).
- CTA at y 718.

Gaps vs code: no favourites anywhere (07 §5.4). The duration chip says "4 min" but the selected pill is "3 min" and there is no 4-minute pill; the player (N10) runs for 04:00 (see §6).

### 3.6 N7 · Practices · Favourites `6787:6374`

- Glows (blur 90): `#E2CC40@0.15` 220 at `200,40`; `#FFB3BE@0.25` 280 at `-70,-50`.
- Nav Bar Light, title "Favourites".
- Content at y 116, padding 0/24, gap 24:
  - "Your go-to practices" `Urbanist SemiBold 26 #241A2E`, left.
  - Four **favourite rows** 327×72, `#FFFFFF` r 20, padding 12/16/12/12, gap 12, centred:
    - Thumb 48×48 r 14 (square, tinted) with a 22 `#6B5279` icon centred.
    - Text column 207 wide, gap 2: title `Urbanist Medium 15 #241A2E`, meta `Urbanist Regular 12 #736B66` ("{min} min · {Category}").
    - Trailing heart 20 at `291,26`, **filled** `#6B5279`.

    | Title | Meta | Thumb fill | Icon |
    |---|---|---|---|
    | Box breathing | 4 min · Breathing | `#E6F2FB` | `meditate` |
    | Rain at night | 20 min · Sleep | `#EFE8F4` | `moon` |
    | Shoulder release | 2 min · Relax | `#FAF3D6` | `leaf` |
    | Grounding | 25 min · Mindfulness | `#FDEDF0` | `sparkle` |

  - Legal note: "Tap the heart on any practice to save it here."
- Tab bar (`GlowTabBar`), Practices active.

Interaction: a row opens that practice's Set up or Video details. The heart removes the favourite; the row should animate out with an undo toast (not designed). Order is most recent first.

Notes:
- This row is a **third practice-row style**. 07 §2.2 uses a 44 round bubble with alpha tints, SemiBold 15 `#4E3A5E` and a chevron. Here it is a 48 square thumb with opaque pastel tints, Medium 15 ink and a heart. Icons also disagree with 07 (breathing `leaf` there, `meditate` here; mindfulness `meditate` there, `sparkle` here). Build one `PracticeRow` with `variant="favourite"`, and take icon and tint from the catalogue (design question).
- "Rain at night" is a sound name, not a practice; the practice is "Sleep sounds" (07 §3.5). The favourite title should be the practice title.
- Entry point to this screen is not designed. Suggested: a heart button in the hub header next to History.
- Empty state is not designed; the legal-note copy can serve as the empty message.

Gaps: no screen, table or hook (07 §5.4).

### 3.7 N8 · Practices · Daily goal `6787:6472`

- Glows (blur 90): `#E2CC40@0.15` 220 at `200,40`; `#D8B4D8@0.25` 280 at `-70,-50`.
- Nav Bar Light, title "Daily goal".
- Content at y 116, padding 0/24, gap 24:
  - "How much calm a day?" `Urbanist SemiBold 30 #241A2E`, left.
  - "Small and steady works best. You can change it any time." `Urbanist Regular 15 #736B66`.
  - **Stepper card** 327×131 `#FFFFFF` r 28, padding 24/20, space-between, centred:
    - "−" and "+" buttons 48×48 `#F1ECF5` r 24, glyph `Urbanist SemiBold 22 #6B5279` (text characters, not icons).
    - Value column: "10" `Urbanist Regular 56 #241A2E`, "minutes a day" `Urbanist Regular 13 #736B66`, centred.
  - Presets: Chip row (§2), gap 6, centred: "5 min", **"10 min"**, "15 min", "20 min".
  - List Group with one Trailing=Toggle row: "Remind me if I haven’t reached it" / "One gentle nudge at 19:00", toggle on.
- Actions at y 674: Primary L "Save goal".

Interaction: the stepper moves in steps of 5 (presets suggest it; not specified), range 5–60 (assumption). A preset sets the value. "Save goal" stores the goal and pops back. The reminder schedules a local notification at 19:00 that is cancelled when today's minutes reach the goal.

Gaps and conflicts:
- No goal exists in code or data (07 §5.2). The step logic in `mindful/new-exercise.tsx:376-603` (±1/±5 stepper) can be reused.
- **The hub says "of 5h daily goal"** (07 §2.1). This screen works in minutes (5–20). The hub copy and ring maths must follow the minute goal; the "5h" default in 07 task 4 should become 10 min.
- Entry point is not designed. Suggested: tapping the hub goal ring.
- The 19:00 time is fixed in the copy; whether it is editable is not designed.

### 3.8 N9 · Practices · Video · End early? `6787:6539`

The video player with the End early sheet. The **video player itself has been redesigned** since 07 §2.13:

- Glow `#FFB3BE@0.22` 230 at `180,110` blur 90.
- Header A (48 back, stroke `#736B66` 1) only.
- Title "Shoulder release" (sentence case) `Urbanist SemiBold 30 #4E3A5E` centred; "2:15 · Body" `Urbanist Medium 16 #736B66`; "Follow along gently. Stop anytime you need." same style; gap 14.
- **Video card** `16,295` 343×212, `#FFFFFF` r 24, shadow `0,0,0` spread 4 `#6B5279@0.25` (the old `#9BB068` ring is gone), no stroke:
  - Video (raster placeholder `6787:6560`, IMAGE fill).
  - Shade LINEAR top→bottom `#241A2E` @0 at 50 % → @0.35 at 100 %.
  - Centre button 60×60 `#FFFFFF` r 30 at `141.5,76` with `pause` 24 `#6B5279`. **The control pill from 07 is gone.**
- **Progress row** under the card (y 520), padding 0/16, gap 12: "00:48" `Urbanist Medium 12 #736B66`, track 250×4 `#E6E0EA` r 2 with fill `#6B5279` (72 = 32 %), "02:15".
- "Beginner · No equipment" `Urbanist Medium 16 #736B66` centred (replaces the bracket placeholder). Then "Move slowly. Keep your breathing soft."
- Tab bar, Practices active.

**Sheet** (same pattern as 07 §2.8, with these changes):

- Overlay `#241A2E@0.45` (07: `#3F3C36@0.75`).
- Sheet `0,512` 375×300 `#FFFFFF`, top radii 40. Grabber 40×5 **`#E6E0EA`** r 3.
- "End practice early?" `Urbanist SemiBold 22 #4E3A5E` (07: 24) at `24,40`.
- Body at `24,78`: "You’ve watched 48 seconds of 2:15. We’ll save your spot so you can pick it up later." Template: "You’ve watched {elapsed} of {total}." where elapsed is "N seconds" under a minute and "m:ss" above.
- "Keep going" Primary L at y 150; "End session" outline 327×56 (stroke `#6B5279` 1.5, `Urbanist SemiBold 16 #4E3A5E`, not a library instance) at y 216.

This sheet still uses the older white style, while the new sheets (N5, N12) use `#F7F4F2`, r 32 and a `#CFC6D6` 40×4 grabber. Build one `BottomSheet` and use the new style for both (design question).

Behaviour: opening the sheet pauses the video. "Keep going" resumes. "End session" saves a partial session with the playback position and returns to the hub. "Save your spot" means Video details must offer resume (not designed).

Gaps vs code (`stress/list/[category]/[videoId].tsx`): YouTube iframe full-width black box (`:73-80`, `:99-104`), random quote card (`:82-91`), no time tracking and no end handling. Drive the play/pause button and progress from the `react-native-youtube-iframe` ref (`getCurrentTime`, `getDuration`).

### 3.9 N10 · Mindful 08b · Hold `6764:5089`

New Hold phase for the breathing player (07 §2.7). It matches "Mindful 08 · Breathe in" `6105:1305` except where noted. The player values in the file have also changed since 07 §2.7 was written; the current values for all phases are:

- Glows (blur 90): `#E2CC40@0.28` 220 at `-60,30`. The sky glow `6764:5090` (270 at `150,70`) has **no fill**, so it renders nothing (same as 07).
- Header A at `6,50`: 48 back (stroke `#736B66` 1), "Mindful Hours" `Urbanist SemiBold 20 #4E3A5E`, and a Tag "13 of 14" on the right. **"13 of 14" is a leftover assessment step tag**; drop it or replace it with the practice name (design question).
- "Hold" `Urbanist SemiBold 30 #4E3A5E` centred at y 145. "Stay soft and still." `Urbanist Medium 16 #736B66` at y 193. This confirms the copy proposed in 07 §6.
- **Orb** frame 236×236 at `69.5,244`, layers centred:
  1. Ring 236 `stroke #6B5279 1` (07 had @0.15; now full opacity).
  2. Halo 172 `#D8B4D8@0.25` blur 30.
  3. Body 110 `#E2CC40` blur 18.
  4. Inner light 49.5 `#FFF6D6` blur 8.
  5. Core 48 `#E2CC40`.
  6. **Hold ring** `6764:5159`: 270 at `52.5,227` (17 outside the frame), `stroke #6B5279@0.35 1.5`, **dashed 4/6**.
- "4 of 15 breaths" `Urbanist SemiBold 30 #4E3A5E` at y 512.
- Progress at `50,600`, 276 wide: "01:08" and "04:00" `Urbanist Regular 18 #736B66` (Inter is gone). Bar 276×8 at y 640, fill 59.1. **Track and fill are both `#6B5279`**, so the bar reads as full. Use the track `#6B5279@0.30` from 07 (design question).
- Controls at `50,687`, gap 24: replay 56 (`stroke #6B5279 2`, `replay` 24); centre 80 `#FFFFFF` `stroke #6B5279 2` with `pause` 24; forward-10 56. The centre button has an **empty 20×24 "Icon" frame** before the pause glyph, which pushes the glyph 10 right of centre (visible in the render). Centre it.

Interaction: show Hold for the hold seconds of the practice pattern (Box 4, 4-7-8 7). Keep the orb at the inhale size (scale 1.0). Fade the dashed ring in over 300 ms, and rotate it slowly (one turn per 8 s) to show time passing (motion is a suggestion; the design is static). Fire a light haptic at the phase start when Haptic cues is on. Box breathing also has a hold after the exhale; use the same screen at the exhale size (not designed).

### 3.10 N11 · Mindful 09 · Breathe out `6764:5374`, and how it compares

N11 is the same frame as N10 with these changes:

- "Breathe out" / "Let it go slowly through your mouth." (07 had "Take your time. You’re doing great.").
- No dashed Hold ring.
- Smaller orb (frame still 236 at `69.5,244`): ring **190** at frame `23,23`; halo **138** at `49,49`; body **90** at `73,73`. Inner light 49.5 and core 48 are unchanged.
- Elapsed "01:12".

Comparison of the three player frames:

| | Breathe in `6105:1305` | Hold `6764:5089` | Breathe out `6764:5374` | Mindful 11 · Breathe out `6160:1577` |
|---|---|---|---|---|
| Ring / halo / body | 236 / 172 / 110 | 236 / 172 / 110 | 190 / 138 / 90 | 190 / 138 / 90 |
| Inner light / core | 49.5 / 48 | 49.5 / 48 | 49.5 / 48 | 49.5 / 48 |
| Extra | — | dashed 270 ring | — | Complete modal on top |
| Guidance | Take a slow breath in through your nose. | Stay soft and still. | Let it go slowly through your mouth. | Let it go slowly through your mouth. |
| Counter | 4 of 15 breaths | 4 of 15 breaths | 4 of 15 breaths | 15 of 15 breaths |
| Elapsed / total | 01:04 / 04:00 | 01:08 / 04:00 | 01:12 / 04:00 | 04:00 / 04:00 |

What this resolves for 07 §2.7: the orb **does** change size per phase. Exhale is about **0.80** of inhale on the ring, halo and body (190/236 = 0.81, 138/172 = 0.80, 90/110 = 0.82), and the inner light and core stay fixed. Animate layers 1–3 (including the outer ring, which 07 told you to keep fixed) between scale 1.0 and 0.8, ease in-out sine, over the phase seconds. 07's 0.7 assumption is replaced by 0.8.

`6160:1577` is the same breathe-out frame at the end of the session (15 of 15, 04:00 / 04:00) under the Complete modal. Its modal differs from 07 §2.9: overlay `#241A2E@0.55` (07: `#3F3C36@0.82`), title "Breathing complete." `Urbanist SemiBold 22` (07: 24), subtitle "You’re doing great." `Medium 16` (07: 18), "Back to Mindful Hours" SemiBold 16 (07: 18) and "Reflect with Glow AI" as a 16 SemiBold secondary-style button (07: a 13 chip). Re-extract the modal card before building 07 task 17. Its progress fill is still 59.1 wide at 04:00, which only looks full because the track is the same colour.

The 15-breath, 04:00 sample also implies 16 s per breath, which is Box 4·4·4·4 at Normal pace.

Gaps vs code (`mindful/session.tsx`): everything in 07 §2.7 still applies. In addition: `PHASE_DURATIONS` (`:25-31`) is keyed by the old goal ids and includes `holdAfter`; map it to the practice pattern. There is no per-phase orb size or dashed ring. `GlowOrb` (`components/glow/Glow.tsx:68-117`) has a different layer set (lilac, sky, mustard, cream) and a fixed 2 s breathe; add a `BreathingOrb` with the five layers above plus the dashed ring, driven by a phase prop.

### 3.11 N12 · 8. Entry options `6764:5668`

The journal entry (04 J5) with an options sheet. 375×900.

Changes to the entry screen itself compared with 04 J5:

- The right Nav Bar button is now `more` (three dots, `6764:5084`), 20 in a 44 white circle. This answers 04's question about the "More" button using the note icon.
- Nav Bar Light with title "Fri, 30 Oct".
- Body text is `#241A2E` (04: `#44403B`); reflection text is `#241A2E` too.
- Glows `#E2CC40@0.28` 280 at `-50,-20` and `#D8B4D8@0.25` 220 at `180,60` (blur 80); reflection-card glows `@0.28` and `@0.25` (04: 0.35).
- The CTA "Talk it through with Glow AI" is Primary L with no icon (04 had `chat` 18).

**Sheet** `6770:4929`:

- Overlay `#241A2E@0.40` over the whole screen.
- Sheet `0,466` 375×434, `#F7F4F2`, top radii 32, padding 12/24/42/24, gap 20, centred. Two glows inside, clipped by the sheet: 240 at `-60,-120` `#D8B4D8@0.30` blur 70; 200 at `230,-110` `#E2CC40@0.22` blur 70.
- Grabber 40×4 `#CFC6D6` r 2.
- **Entry summary**, gap 6, centred:
  - Meta pill h 22 `#F1ECF5` r 999, padding 4/10, gap 6: `heart` 14 `#6B5279` + "Low · Fri, 30 Oct · 08:40" `Urbanist Medium 12 #6B5279`. The entry header shows the `mood/sad` face for Low; the pill should use the same mood face, not a heart (design slip).
  - "Overwhelmed before work" `Urbanist SemiBold 22 #241A2E` centred.
- **Action tiles** row, gap 10: three tiles 102.3×100 `#FFFFFF` r 24, padding 16/0/14/0, gap 10, centred. Each has a 44 circle `#F1ECF5` r 22 with a 22 `#6B5279` icon and a label `Urbanist Medium 13 #4E3A5E`:
  - `edit` "Edit"
  - `calendar` "Change date"
  - `download` "Export"
- **Delete** pill 327×52 `#FBEDEE` r 999, gap 8, centred: `trash` 18 `#B4505A` + "Delete entry" `Urbanist SemiBold 15 #B4505A`.
- "Deleted entries can’t be recovered." `Urbanist Regular 12 #A6A09B` centred.
- Ghost L "Cancel".

Interaction:
- Edit closes the sheet and opens the Write entry screen (04 J2) prefilled. It should not edit inline as the code does today.
- Change date opens a date picker (`@react-native-community/datetimepicker`, date mode, max today) and updates `created_at`. The picker UI is not designed.
- Export shares the entry as plain text through the system share sheet (`Share` from `react-native` needs no new package). PDF export would need `expo-print` and `expo-sharing`, which are not installed.
- Delete entry asks no further question in the design. Because the note says deletion is permanent, keep a confirm step: use the existing `showAlert` confirm (`journal/[id].tsx:166-182`) or a second sheet state (not designed).

Gaps vs code (`app/(tabs)/journal/[id].tsx`):
- Header uses a "Journal Entry" title and mood badge (`:273-345`, 04 J5). Replace with the Nav Bar and `more`.
- Edit is inline (`:136-163`, `:573-786`); Edit and Delete buttons sit at the bottom (`:888-940`). Move both into the sheet and route Edit to the write screen.
- No change-date or export code exists. `hooks/useJournal.ts` exposes `upsertJournalEntry` (`:202`), which writes `created_at` (`:64`), so change-date can use it.
- The danger colours `#FBEDEE` / `#B4505A` are pending confirmation as tokens (99 §1); `#B4505A` exists as `palette.danger`, `#FBEDEE` does not.

---

## 4. Asset table

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| `6787:5622` / `6787:5621` | Glow | N1, N2 (also `6787:5712` / `5711`) | Glow | 220 / 280 | `#E2CC40@0.15` at `200,40`; `#FFB3BE@0.25` at `-70,-50`; blur 90 |
| `6787:5748` | Searching rings | N2 | SVG | 96×96 | 3 rings `#6B5279` @.12/.22/.35 + `#F2D96A` dot 14. Small enough to build inline with react-native-svg. |
| `6787:5766` / `6787:5767` | Glow | N3 (N4 `6787:5820` / `5821`) | Glow | 300 / 200 | `#E2CC40@0.28` at `37.5,-10`; `#D8B4D8@0.25` at `170,90`; blur 80 |
| `6787:5788` | Glow | N3 (N4 `6787:5842`) | Glow | 240 | `#E2CC40@0.28` at `67.5,210`, blur 50 |
| `6787:5789` | Aura contours | N3 (N4 `6787:5843`) | SVG | 375×812 frame, art 233.5×214.7 at `72,227.3` | 6 strokes; same shapes as P2 `6676:3094`, new opacities. Export once. |
| `6787:6127` / `6787:6128` | Glow | N5 | Glow | 270 / 220 | `#D8B4D8@0.25` at `150,30`; `#E2CC40@0.28` at `-60,10`; blur 90 |
| `6787:6131` | Hero (sleep sounds) | N5 | SVG + Glow | 327×176 | Sound lines `6787:6134` + moon `6787:6140` as SVG; glow `6787:6133` 158.4 `#D8B4D8@0.25` blur 30 as data. Same art as 07 `6668:3196` with new opacities. |
| `6787:6277` / `6787:6278` | Glow | N6 | Glow | 270 / 220 | `#7FC6F1@0.18` at `150,30`; `#E2CC40@0.28` at `-60,10`; blur 90 |
| `6787:6283` | Hero (box breathing) | N6 | SVG + Glow | 327×176 | Rings `6787:6286`/`6287` + aura `6787:6288` as SVG; glows `6787:6284` (200 `#7FC6F1@0.18` b40), `6787:6285` (140 `#E2CC40@0.28` b40), `6787:6296` (46 `#F2D96A` b12) as data. Replaces 07's breathing hero values. |
| `6787:6376` / `6787:6375` | Glow | N7 | Glow | 220 / 280 | `#E2CC40@0.15` at `200,40`; `#FFB3BE@0.25` at `-70,-50`; blur 90 |
| `6787:6474` / `6787:6473` | Glow | N8 | Glow | 220 / 280 | `#E2CC40@0.15` at `200,40`; `#D8B4D8@0.25` at `-70,-50`; blur 90 |
| `6787:6540` | Glow | N9 | Glow | 230 | `#FFB3BE@0.22` at `180,110`, blur 90 |
| `6787:6560` | Rectangle 1 (video still) | N9 | Raster | 343×212 | Placeholder photo; real playback is the YouTube video. Use as poster @2x/@3x. |
| `6787:6561` | Shade | N9 | Gradient | 343×212 | LINEAR `#241A2E` @0 at 0.50 → @0.35 at 1.00 (react-native-svg `LinearGradient`) |
| `6764:5091` | Glow | N10, N11 (`6764:5376`) | Glow | 220 | `#E2CC40@0.28` at `-60,30`, blur 90. `6764:5090` / `6764:5375` have no fill; skip. |
| `6764:5112` | Orb (hold) | N10 | Glow + SVG | 236 frame + 270 ring | Ring 236 and dashed 270 ring `6764:5159` (dash 4/6) as react-native-svg `Circle`; halo, body, inner light, core as Skia glows (values in §3.9). Animated. |
| `6764:5397` | Orb (out) | N11 | Glow + SVG | 236 frame | Ring 190 SVG; halo 138, body 90, inner light 49.5, core 48 as glows. Same component as N10 at scale 0.8. |
| `6764:5669` / `6764:5670` | Glow | N12 | Glow | 280 / 220 | `#E2CC40@0.28` at `-50,-20`; `#D8B4D8@0.25` at `180,60`; blur 80 |
| `6764:5688` / `6764:5689` | Glow | N12 reflection card | Glow | 160 / 120 | `#E2CC40@0.28` b40 at card `200,-60`; `#D8B4D8@0.25` b30 at `180,10` |
| `6770:4930` / `6770:4931` | Glow | N12 sheet | Glow | 240 / 200 | `#D8B4D8@0.30` at sheet `-60,-120`; `#E2CC40@0.22` at `230,-110`; blur 70; clipped by the sheet |
| Icon/Line | heart `6598:1781`, music `6598:1856`, leaf `6598:1785`, activity `6598:1817`, meditate `6598:1789`, moon `6598:1792`, sparkle `6598:1814`, journal `6598:1795`, home `6604:2063`, user `6604:2067` | N5–N9, N12 | Icon | 14–22 | In `iconData.ts`. Heart also needs a filled variant (N6, N7). |
| Icon/Line (new) | search (in `6753:4157`), mic-off `6764:5036`, pause `6764:5055`, edit `6764:5062`, calendar `6764:5069`, download `6764:5076`, more `6764:5084`, trash `6753:4261` | N1, N2, N5, N9–N12 | Icon | 18–24 | **Missing from `iconData.ts`.** Export SVG paths from these nodes. |
| Icon/Arrow | back `6589:1632`, chevron-right `6589:1657`, replay `6589:1678`, forward-10 `6589:1684` | all | Icon | 18–24 | In `iconData.ts`. |
| Icon/Mood | sad `6598:1763` | N12 | Icon | 18 | In `iconData.ts`. |

---

## 5. Icons missing from `components/icons/iconData.ts`

These screens need eight icons that the code set lacks: `line/search`, `line/mic-off`, `line/pause`, `line/edit`, `line/calendar`, `line/download`, `line/more`, `line/trash`. They also need a filled heart (`line/heart` drawn with `paint: 'fill'`, or a `heart-filled` entry).

The Figma Icon/Line set `6598:1860` now also contains `settings`, `globe`, `logout`, `email`, `shield`, `send` and `play`. These are not used on these screens, but they are listed as missing in 99 §3, so export the whole new batch (15 icons) in one go.

---

## 6. Backend and data gaps (new only)

1. **Medication catalogue** with a class label per drug, searchable offline. Store selections as `medications jsonb` `[{id, name, class, custom}]` on `assessments` (02 §6). The manual-add path needs `custom: true`.
2. **Assessment skip**: a skipped step should store `null` and a `skipped_steps text[]` (or equivalent) so the score logic does not read it as "none".
3. **Check-in time**: `profiles.checkin_time time` (02 §6), with a Morning / Afternoon / Evening slot derived from it. `lib/notifications.ts` must schedule `daily_checkin` from it.
4. **Sound catalogue**: per category list of `{id, label, subtitle, icon, file}`. Sleep needs Rain at night, Ocean waves, Forest night, Brown noise and None. The `options.sound` field in 07 §5.1 stores the id.
5. **Favourites**: `practice_favourites (user_id, practice_id, created_at)` with RLS (07 §5.4), plus a `useFavourites` hook with optimistic toggle.
6. **Daily goal**: `profiles.mindful_goal_minutes int default 10` and `profiles.mindful_goal_reminder boolean default true`. The 19:00 nudge is a local notification that is cancelled once today's total reaches the goal.
7. **Video partial sessions and resume**: store `elapsed_seconds` with `completed=false` (07 §5.6), and read it on Video details to offer resume.
8. **Journal change date and export**: change date uses `upsertJournalEntry` with a new `createdAt`; export needs no backend.

---

## 7. Blockers and design questions

- **Section moved.** `6786:4878` is gone; the screens now sit in frames 04, 05, 10 and 08 (§1.1). `6105:1350` was deleted, and `6160:1577` was renamed. Any task that cites 07's player ids needs the new ids.
- **New component library** (§2) is not covered by `00-foundations.md`. Its Button set has Pressed, Disabled, Danger and On dark states that were not extracted here. One foundations pass on the "🧩 Design System" page is needed before the component changes in §2 are final.
- **Progress track colour**: the breathing player track and fill are both `#6B5279`, and the P2 step track is now full-opacity `#6B5279`. Both look like slips.
- **"13 of 14" tag** on every breathing player frame is an assessment leftover.
- **Off-centre pause glyph** in the 80 button (empty 20×24 frame).
- **Box breathing duration**: chip "4 min", selected pill "3 min", player total 04:00, Favourites "4 min". There is no 4-minute pill. Pick one.
- **Medication rows use radios for multi-select**; the empty state hides existing selections.
- **Three practice-row styles** (07 §2.2, N7, and the reflection card's suggested-practice row) with different icons per category.
- **Favourites title** shows the sound name ("Rain at night") instead of the practice title ("Sleep sounds").
- **Daily goal units**: the hub shows "of 5h daily goal"; the goal screen offers 5–20 minutes.
- **Two sheet styles**: N5 and N12 use `#F7F4F2` r 32 with a `#CFC6D6` 40×4 grabber; N9 uses `#FFFFFF` r 40 with a `#E6E0EA` 40×5 grabber and a fill-less outline button.
- **Entry options meta pill** uses a heart instead of the mood face.
- **Not designed**: entry points to Favourites and Daily goal; favourites empty state and remove/undo; "Removed from favourites" toast; delete confirmation; change-date picker; export format; video resume; sound preview; the soundscape list for mindfulness; hold-after-exhale visual; time picker on P2.
- **Legal note colour** `#8E7FA6` here versus `#8A8296` in `LegalNote`.
- No Figma call failed.

---

## 8. Answers to open questions

Items in `99-open-questions.md` that these screens resolve:

- 99 §2 "Proposed Hold phase copy: "Hold" / "Stay soft and still." Confirm." → **Confirmed** by `6764:5089`.
- 99 §3 "Breathing player has no Hold phase (needed for Box and 4-7-8); in/out orbs are identical geometry." → **Resolved.** Hold exists (`6764:5089`), and the out orb is 0.8 of the in orb (§3.10).
- 99 §2 "the breathing player shows "05:21 / 25:00" and "1 of 3 breaths" for a 3-minute practice" → **Resolved.** The players now show "4 of 15 breaths" and "/ 04:00".
- 99 §2 "the video header says "2 min • Body" for a 2:15 video" and "video player "[ Beginner ] [ No equipment ]" bracket placeholders" → **Resolved.** "2:15 · Body" and "Beginner · No equipment" (§3.8).
- 99 §1 "About 20 text nodes use Inter instead of Urbanist (player times …)" → **Resolved for the breathing player**: times are Urbanist Regular 18. The sleep track title was not checked.
- 99 §1 old-palette `#9BB068@0.25` on the video player card → **Resolved** for the video card: now `#6B5279@0.25`.
- 99 §3 "Not designed: … medication search/empty; … Morning/Afternoon check-in times; sound/soundscape picker; favourite filled state and favourites list; daily goal setting; pause glyph; end-early sheet for non-breathing players" → **All resolved** by N1–N9 (pause glyph = `pause` `6764:5055`). The soundscape picker is designed for sleep only.
- 99 §3 "Entry screen has no edit/delete entry point (the "More" button uses the note icon)." → **Resolved** by `6764:5668` (`more` icon, Edit / Change date / Export / Delete sheet).
- 99 §3 "Icons missing from the icon set: mic-off, send, play, pause, search, sliders, globe, logout, trash, mail, edit, calendar, download" → **Resolved in Figma** except `sliders` (Icon/Line now has all the others, `email` in place of mail). Still missing in code (§5).
- 99 §1 "No disabled, pressed or error states for buttons and inputs" → **Partly resolved.** The new Button set has Pressed and Disabled; inputs still have no error state.
- 99 §1 "The foundation components have no unselected radio …; Confirm `#CFC6D6` for radio off" → **Resolved for radio**: Radio Off is `#CFC6D6` 1.5. Checkbox off is still not shown.
- 99 §1 "Pick one value each: toggle off `#E8E0D5` vs `#E1DAE6` … divider `#F0EBE5` vs `#EFEAF2`" → **Answered by the new screens**: toggle off `#E6E0EA`, divider `#EFEAF2`. Toggle on is `#6B5279` in the component and `#8E7FA6` on the Set up rows, so that pair is still open.
- 02 P2 "Not designed: the default times for Morning and Afternoon, the captions" → **Resolved**: 08:30 "every morning", 14:00 "every afternoon".

Left unresolved by these screens:

- 99 §2 Box breathing 4 vs 3 minutes is now three-way inconsistent (§7). The other duration mismatches are untouched.
- 99 §3 "conversation history", "voice recording states", "empty states throughout", "Pro-user variants", "notification settings entry" and the rest of that list are not covered.
- 99 §4 **Product**: "Is A10 medications conditional?" and "medication dataset and licence" are still open; the search design makes the dataset more urgent.
- 99 §4 **Product**: "Where is mood-after-session captured?" is still open; the Complete modal on `6160:1577` has no mood row.
- 99 §1 "The Top Nav back ring is `#736B66` on Sign In and `#6B5279` elsewhere" gets a third answer: the new Back Button is white with `#CFC6D6`. The breathing and video players still use `#736B66`.
- 99 §1 "CTA label size varies" and "back button comes in 44, 48 and 50": the new screens use 16 and 44 throughout, but the players still use 48.

---

## 9. Proposed tasks

1. Update shared components to the new library: `TopNav` `bar` layout, `IconButton` `light` variant, `Radio` recolour, `Toggle` off colour, `Chip` `preset` kind, `Tag` Default, `MetaChip` fill, option-pill weight, `AppButton` secondary/ghost/sizes, and add `palette` `#CFC6D6` and `#FBEDEE` (10 §2).
2. Add `ListGroup` / `ListRow` (Radio, Toggle, Chevron, Value trailing; optional leading bubble), a `BottomSheet` (grabber, overlay, new style) and a dark `Toast` pill to `components/ui` (10 §2).
3. Add `AppField` `variant="search"` (48 high, `#F5F1F7`, 20 search glyph) (10 §2, §3.1).
4. Export the new icons `search`, `mic-off`, `pause`, `edit`, `calendar`, `download`, `more`, `trash`, plus `settings`, `globe`, `logout`, `email`, `shield`, `send`, `play`, and a filled heart, into `components/icons/iconData.ts` (10 §5).
5. Export the new SVG art (searching rings `6787:5748`, check-in aura `6787:5789`, restyled sleep and breathing heroes `6787:6131` / `6787:6283`) and record the new glow data for N1–N12 (10 §4).
6. Rebuild the assessment medication step as search with results, selected tags, "not found" empty state, manual add and "Skip this question", backed by a medication catalogue and `medications jsonb` (10 §3.1, §3.2, §6.1–6.2).
7. Rebuild the P2 check-in step with Morning 08:30 / Afternoon 14:00 / Evening 21:00 presets, time picker, `profiles.checkin_time`, and schedule `daily_checkin` from it (10 §3.3, §6.3).
8. Restyle the practice Set up screen to the Nav Bar header and new values, and add the "Choose a sound" sheet with a per-category sound catalogue (10 §3.4, §6.4).
9. Add favourites: `practice_favourites` table, `useFavourites`, Set up heart saved state with toast, and the Favourites list screen `mindful/favourites.tsx` with a hub entry point (10 §3.5, §3.6, §6.5).
10. Add the Daily goal screen `mindful/goal.tsx` with stepper, presets, reminder toggle, profile columns and the 19:00 nudge, and switch the hub ring to the minute goal (10 §3.7, §6.6).
11. Rebuild the video player to the new card, centre play/pause and progress row, and add the video End early sheet with partial-session save (10 §3.8, §6.7).
12. Build `BreathingOrb` with per-phase scale (in 1.0, out 0.8), the Hold phase with the dashed ring, and map practice patterns to phases in the breathing player (10 §3.9, §3.10).
13. Add the journal Entry options sheet (`more` button, Edit to write screen, Change date, Export via `Share`, Delete with confirm) and remove inline edit and bottom buttons from `journal/[id].tsx` (10 §3.11).
14. Raise the §7 design questions (progress track, "13 of 14" tag, pause offset, Box duration, radio vs checkbox, row styles, goal units, sheet styles, meta pill icon, missing entry points) with design (10 §7).
15. Run a foundations extraction of the "🧩 Design System" page (Button states, List Row Card style, Tag styles, Toggle Off, Back Button Dark) and fold it into `00-foundations.md` (10 §2, §7).
