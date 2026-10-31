# 04 · Journal and Mood: design handoff

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` ("Main - Light Mode").
Raw extraction: `scratchpad/figma/specs/journal-1.txt`, `journal-2.txt`, `mood-1.txt`. Crops: `scratchpad/figma/shots/screen-<id>.png`.

Shared tokens, Urbanist loading, Button, Input, Top Nav, back button, Tag chip, Legal note, Tab bar, the icon SVG set and the Skia glow renderer are owned by the **foundations doc** in this folder. This doc only names them. This doc **owns the canonical spec for the Mood scale, Mood slider, Mood orb and the Crisis sheet**. Other areas should link to §A and §B rather than re-specify them.

Notation: `Urbanist SemiBold 30/140% #241A2E` = family, weight, size / line height, colour. Letter spacing is 0 everywhere in these sections. Positions are `x,y` in the 375-wide screen unless a parent is named. Glow = `<colour>@<opacity> d<diameter> blur<LAYER_BLUR radius>` (render with Skia, `blur = radius/2`).

## 1. Section overview

| Section | id | Screen id | Name | Size | Code route |
|---|---|---|---|---|---|
| Mental Health Journal | `4002:15069` | `6681:3211` | 1. Journal | 375x1060 | `app/(tabs)/journal/index.tsx` |
| | | `6681:3378` | 2. Write entry | 375x812 | `app/(tabs)/journal/new.tsx` (step `write`), alias `app/(suggestion-actions)/journal.tsx:1` |
| | | `6681:3439` | 3. Speak · recording | 375x812 | `app/(tabs)/journal/voice.tsx` (state `idle`/`recording`) |
| | | `6682:3306` | 4. Speak · review | 375x812 | `app/(tabs)/journal/voice.tsx` (state `done`) |
| | | `6682:3367` | 5. Entry | 375x900 | `app/(tabs)/journal/[id].tsx` |
| | | `6682:3444` | 6. Saved | 375x812 | none |
| | | `6682:3491` | 7. Support is here (crisis sheet) | 375x812 | none (inline banner in `[id].tsx:349-410`) |
| Mood Tracker | `4002:15067` | `6694:3432` | 1. Mood | 375x812 | `app/(tabs)/mood/index.tsx` |
| | | `6694:3555` | 2. How are you feeling · Good | 375x812 | `app/(tabs)/mood/check-in.tsx` (step `mood`), alias `app/(suggestion-actions)/check-in.tsx:1` |
| | | `6694:3607` | 3. How are you feeling · Tense | 375x812 | same |
| | | `6695:3543` | 4. What's shaping your mood? | 375x812 | `check-in.tsx` step `details` (330-641), content differs completely |
| | | `6695:3624` | 5. Mood logged | 375x812 | none (code shows a toast, `check-in.tsx:142`) |
| | | `6695:3672` | 6. Mood history | 375x812 | `app/(tabs)/mood/history.tsx` |

Code with no Figma counterpart: `journal/history.tsx`, `journal/stats.tsx`, `journal/prompts.tsx`, `mood/[id].tsx`, `mood/stats.tsx`, the Insights tab inside `mood/history.tsx:380-880`. `components/Calendar.tsx` and `components/MoodChart.tsx` are not imported anywhere. `components/MoodCheckInModal.tsx` (used by `freud-score/ai-suggestion*.tsx`) has its own 5-point scale with Tailwind colours (`MoodCheckInModal.tsx:14-18`) and should move to §A.

Common screen chrome: background `#F7F4F2`; two corner glows `#E2CC40@0.28 d280 blur80` at `-50,-20` and `#D8B4D8@0.28 d220 blur80` at `180,60` (Mood screens use `@0.25`). Back button `24,54` 44x44, stroke `#6B5279` 1.5, r22, `Icon/Arrow back` 22. Centred nav title `Urbanist SemiBold 14/140% #241A2E` at y66. Close button (modal screens) `307,54` 44x44 `#FFFFFF@0.80` r22 with `Icon/Arrow close` 22. Primary CTA 327x56 `#6B5279` r999, optional 18px icon + gap 10, label `Urbanist SemiBold 16/140% #FFFFFF`, bottom CTA at y690 (y676 when a text link sits below). Text link under CTA: `Urbanist SemiBold 14/140% #8E7FA6` centred.

---

## A. Mood scale (canonical)

Five ordered states. Score is what we persist in `mood_logs.mood_score`.

| Score | Label | Colour (dot, bar, calendar) | Spectrum stop | Face (`Icon/Mood` variant, main id) | Orb outer glow | Orb inner glow |
|---|---|---|---|---|---|---|
| 1 | Tense | `#FFB3BE` | `#FFB3BE` @0.00 | `angry` `6598:1777` | `#FFB3BE@0.60` | `#D8B4D8@0.40` |
| 2 | Low | `#D8B4D8` | `#D8B4D8` @0.27 | `sad` `6598:1763` | `#D8B4D8@0.60` * | `#FFB3BE@0.40` * |
| 3 | Okay | `#E8DFD2` (see blocker) | `#EFE6DA` @0.50 | `neutral` `6598:1739` | `#E8DFD2@0.60` * | `#FFF6D6@0.40` * |
| 4 | Good | `#E2CC40` | `#E2CC40` @0.73 | `happy` `6598:1722` | `#E2CC40@0.60` | `#FFF6D6@0.40` |
| 5 | Great | `#7FC6F1` | `#7FC6F1` @1.00 | `very-happy` `6598:1728` | `#7FC6F1@0.60` * | `#E2CC40@0.40` * |

`*` Not drawn in Figma. Only Good and Tense orbs exist. The starred values are a proposed rule (outer = own colour, inner = neighbour colour or cream) and need design sign-off.

Mood colour usages and opacities:
- Calendar day: fill `@0.95`, halo `@0.55 blur8`.
- Week bar fill: `@0.85`, LAYER_BLUR 2.
- Legend dot: solid, 10x10.
- Slider knob glow: `@0.50 d70 blur18` (full screen) or `d120x70 blur24` ellipse (compact card, Low shown as `#D8B4D8@0.50`).

Copy: labels are exactly `Tense`, `Low`, `Okay`, `Good`, `Great`. Slider end captions are `Tense` and `Great`.

## B. Mood slider and orb (canonical)

### B1. Slider: full size (check-in, `6694:3593`)
- Track: rect 303x20 at `36,556`, r10, LAYER_BLUR 5, linear gradient left to right: `#FFB3BE@0.95 0.00`, `#D8B4D8@0.95 0.27`, `#EFE6DA@0.95 0.50`, `#E2CC40@0.95 0.73`, `#7FC6F1@0.95 1.00`.
- Stops: 5 dots 4x4 `#FFFFFF@0.90`, centres at track-relative x = 10, 80.75, 151.5, 222.25, 293 (inset 10, step 70.75), vertically centred.
- Knob: circle 30x30 `#FFF6D6`, stroke `#6B5279` 2.5, centred on the active stop. Knob glow (Skia) in the mood colour `@0.50 d70 blur18` centred on the knob.
- Captions: `Tense` left at `36,590`, `Great` right-aligned to 339, `Urbanist Medium 12/140% #A6A09B`.
- Behaviour: snaps to 5 stops. The orb, mood word and knob glow update live while dragging.

### B2. Slider: compact (Write entry card `6686:3501`, 343x150 `#FFFFFF` r28 at `16,106`)
- Header: `How are you feeling?` `Urbanist SemiBold 16/auto #241A2E` at `20,18`; date `Fri, 30 Oct` `Urbanist Medium 12/auto #A6A09B` right-aligned at y21.
- Current mood row: face 26x26 at `20,50`; label `Low` `Urbanist SemiBold 22/auto #6B5279` at `54,48`; hint `Slide to adjust` `Urbanist Regular 12/auto #A6A09B` at `107,56`.
- Track 303x20 at `20,94` (same gradient and blur as B1), stops at the same relative x, knob 28x28 fill `#FAEDB8` stroke `#6B5279` 2.5 with DROP_SHADOW `0,0 r14 spread3 #E2CC40@0.80`. Mood glow ellipse 120x70 `@0.50 blur24` under the knob.
- Captions at y124, `Urbanist Medium 11/auto #A6A09B`.
- Note: the compact knob uses `#FAEDB8` plus a yellow shadow, and the full knob uses `#FFF6D6` with a separate mood-coloured glow. Pick one (blocker list).

### B3. Mood orb (check-in hero, centre `187.5,346`)
Layer order from back to front:
1. Outer glow d320 `blur60`, mood outer colour (§A).
2. Inner glow d180 `blur40` at offset `+130,+100` from the outer glow's left-top (`157.5,286`), mood inner colour.
3. Aura contours: 7 closed 96-vertex paths, stroke `#6B5279` 1px with opacities 0.30, 0.26, 0.20, 0.15, 0.10, 0.08, 0.05 (inner to outer). Sizes from 144x135 to 275x242. Good (`6694:3578`) is smooth and organic. Tense (`6694:3630`) is wavy with about 12 lobes.
4. Inner light d96 `#FFF6D6@0.90 blur18`, centred.
5. Face `Icon/Mood` 56x56, centred, stroke colour `#6B5279`.

Implementation: draw the contours in react-native-svg as parametric polar paths (`r(θ) = base·(1 + a·sin(kθ + φ))`) so all five moods and a slow "breathing" animation come from one component. Suggested amplitude and frequency: Great is smooth, Good gently irregular, Okay irregular, Low drooping or flattened, Tense high frequency (k≈12). Export `6694:3578` and `6694:3630` as the reference SVGs to tune against.

Variants of the same orb:
- Mood home (`6694:3432`): outer glow `#E2CC40@0.55 d240 blur46` at `67.5,100`, second glow `#7FC6F1@0.30 d150 blur36` at `162.5,165`, 6 contours (`6694:3456`, opacities 0.30 to 0.05), face 56 at `159.5,192`. No inner light.
- Mood logged (`6695:3624`): glows `#E2CC40@0.50 d300 blur60` at `37.5,100` and `#7FC6F1@0.35 d180 blur50` at `157.5,190`. Contours are replaced by 3 circular ripples d220/180/140 with stroke `#6B5279` @0.12/0.20/0.30, centre `187.5,250`. Inner light d80 `#FFF6D6@0.95 blur14`. Face 48.
- Voice recording orb (§J3) is the same ripple construction.

## C. Crisis sheet (canonical) — `7. Support is here` `6682:3491`

The sheet is presented over the current screen (here, Write entry).
- Scrim: `#241A2E@0.55` full screen.
- Sheet: 375x470 at y342, `#F7F4F2`, top radii 36, bottom 0, clips content.
- Glow `#E2CC40@0.35 d260 blur60` at sheet `57.5,-90`.
- Grabber 40x5 `#D6CCC0` r3 at sheet `167.5,12`.
- `Icon/Line heart` 30x30 centred at sheet y40.
- Title `You don’t have to carry this alone` at sheet `24,84`, width 327, `Urbanist SemiBold 22/140% #241A2E` centred.
- Body `Some of what you wrote sounds really heavy. If you’re thinking about harming yourself or you’re in danger, please get help now.` at sheet `32,150`, width 311, `Urbanist Regular 14/140% #736B66` centred.
- Primary button at sheet `24,246`, 327x56 `#6B5279` r999, label `Call emergency services` `Urbanist SemiBold 16/140% #FFFFFF`, no icon.
- Secondary button at sheet `24,312`, 327x52, stroke `#6B5279` 1.5, r999, transparent, label `Message someone I trust` `Urbanist SemiBold 15/auto #6B5279`. The height of 52 differs from the 56 used elsewhere.
- Tertiary at sheet y388 `I’m okay, keep writing` `Urbanist Medium 14/140% #A6A09B` centred. This dismisses the sheet and keeps the draft.

Interaction:
- Triggered by risk detection on entry text while writing or on save, on transcripts, and potentially on chat.
- Call opens the dialler with a region-appropriate number. Message opens the share sheet or SMS composer to a trusted contact (no trusted-contact data model exists).
- Must not block saving. Must log an anonymised event for safety review.

---

## J. Journal screens

### J1. Journal home `6681:3211` (375x1060, scrolls; tab bar Active=Journal)
- Title `Journal` `24,60` `Urbanist SemiBold 30/140% #241A2E`.
- Buttons, each 44x44 `#FFFFFF` r22: Search at `255,56` (custom vector `icon/search`, stroke `#6B5279` 1.5, not an `Icon/Line` instance) and Stats at `307,56` (`Icon/Line chart` 20).
- **Month constellation card** `6681:3233`: 327x190 at `24,124`, `#FFFFFF` r24.
  - `OCTOBER` `Urbanist Bold 11/140% #8E7FA6` at `20,18`.
  - `21 of 30 days` `Urbanist SemiBold 22/140% #241A2E` at `20,34`.
  - Streak pill at `198,22`: `#F1ECF5` r999, padding 4/10/4/8, gap 4, `Icon/Line flame` 14, then `12-day streak` `Urbanist SemiBold 12/140% #6B5279`.
  - Dot grid: 2 rows by 15 columns. Dots are 8x8. Column x = 22 + 19.5·i (i=0..14), row y = 88 and 128 (card coordinates, dot top-left). One dot per elapsed day of the month up to and including today. Here there are 30 dots for 30 Oct, so the grid is 15 days per row and not calendar weeks.
    - Logged day: fill `#E2CC40`, with a halo 18x18 `#E2CC40@0.55 blur5` centred on it.
    - Missed day: no fill, stroke `#D6CCC0` 1.2.
    - Today (not yet logged): no fill, stroke `#6B5279` 2.
  - Links (`6681:3241`): a single polyline, stroke `#E2CC40@0.55` 1.2, through the centres of **logged days in date order**. It skips missed days, so the line passes over the open dots. It runs from the last logged dot in row 1 diagonally to the first logged dot in row 2. Path relative to the first dot centre (26,92): `M0 0 L19.5 0 L39 0 L78 0 … L273 0 L0 40 L19.5 40 L58.5 40 … L214.5 40`.
  - Sample pattern. Row 1: `D D D o D D D D o D D D o D D`. Row 2: `D D o D D D o D D o D D o o T`. That gives 21 logged days.
  - Footer `Tonight is still open` `Urbanist Medium 12/140% #736B66` at `20,160`. The copy rule is needed: show it when today is not logged.
  - Build as an animatable react-native-svg component (dots, Skia halos, polyline).
- `New entry` heading at `24,338`, `Urbanist SemiBold 16/140%`.
- Two tiles 159.5x124, `#FFFFFF` r24, at `24,368` and `191.5,368` (gap 8). Each has:
  - a corner glow d90 `blur22` at `75,-15` (Write `#E2CC40@0.45`, Speak `#D8B4D8@0.45`);
  - an icon disc 44 `#6B5279` r22 at `16,16` with `Icon/Line note` or `mic` 20;
  - a title at `16,72` (`Write` or `Speak`, `Urbanist SemiBold 16/140% #241A2E`);
  - a subtitle at `16,94` (`Type your thoughts` or `We’ll turn it into text`, `Urbanist Regular 12/140% #A6A09B`).
- `Recent` heading at `24,518`, and `See all` at `309,520`, `Urbanist SemiBold 14/140% #8E7FA6`.
- Entry cards 327x118, `#FFFFFF` r24, at y550, 678 and 806 (gap 10). Each card contains:
  - Date block 44x52 `#F5F1F7` r16 at `16,16`. `OCT` uses `Urbanist Medium 10/140% #A6A09B` at y8. The day number (`30`) uses `Urbanist SemiBold 17/140% #241A2E` at y22. Both are centred.
  - Mood face 18 at `72,17`.
  - Title at `96,14`, width 215, `Urbanist SemiBold 15/140% #241A2E`, one line.
  - Excerpt at `72,42`, width 239, `Urbanist Regular 12/140% #736B66`, up to 2 lines.
  - Tags at `72,84`, gap 6. Each tag pill is `#F1ECF5` r999 with padding 2/8 and `Urbanist SemiBold 11/140% #6B5279` text. This is the small read-only Tag from foundations.
  - Copy, card 1: `Overwhelmed before work`, `Too many things at once. I tried breathing and it helped a bit.`, tags `Work` and `Breathing`, face sad.
  - Copy, card 2: `A good long walk`, `Talked to Anna for an hour. Felt light all evening.`, tag `Friends`, face very-happy.
  - Copy, card 3: `Tired but okay`, `Slept six hours. Coffee, emails, the usual.`, tag `Sleep`, face neutral.

Gaps vs code (`app/(tabs)/journal/index.tsx`):
- The header has a single `+` button (`:156`). The design has Search and Stats buttons.
- The stats card is a green `#526651` year contribution grid of 12x12 squares coloured positive/negative/no-mood (`:179-267`, colours `:88-92`). Replace it with the month constellation.
- Remove the "Journal Statistics" link row (`:269-317`) and the Quick Actions grid (`:319-370`, `:97-123`). Replace them with the Write and Speak tiles. Write goes to `/journal/new` and skips the picker step, and Speak goes to `/journal/voice`.
- Remove the no-mood nudge (`:399-440`), which is not in the design.
- Recent rows use emoji and the old palette (`:571-593`). Redo them to the card spec above with the `Icon/Mood` face, a 2-line excerpt and tags.
- Copy: `Recent Journals` should be `Recent` and `See All` should be `See all` (`i18n/locales/en/translation.ts:1101-1102`). Add keys for `New entry`, `Write`, `Type your thoughts`, `Speak`, `We’ll turn it into text`, `{{n}} of {{total}} days`, `{{n}}-day streak` and `Tonight is still open`.
- No streak logic exists on this screen. `computeStreak` is private to `journal/stats.tsx:362`. Move it to a shared helper.

### J2. Write entry `6681:3378`
- Nav: back button, title `Fri, 30 Oct` (format `EEE, d MMM`), and a `Save` text button at `317,66` (`Urbanist SemiBold 15/140% #6B5279`).
- Mood check-in card: compact slider (§B2).
- Editor card 327x226 at `24,268`, `#FFFFFF` r24. It grows with content.
  - Title input at `20,20`, `Urbanist SemiBold 20/140% #241A2E`.
  - Body at `20,60`, width 287, `Urbanist Regular 15/155% #44403B`. The caret is shown as `|` in the mock.
  - Prompt chip at `20,158`, height 38, `#F5F1F7` r16, padding 10/14/10/12, gap 8. It holds `Icon/Line sparkle` 16 and `What helped, even a little?` `Urbanist Medium 13/140% #6B5279`. This is an AI follow-up prompt, and tapping it inserts it as a line or heading.
- `Tags` label at `24,514`, `Urbanist SemiBold 13/140% #241A2E`.
- Tag wrap at `24,540`, gap 8 horizontal and 8 vertical (foundations Tag, selectable, md size).
  - Selected: `#F1ECF5` with stroke `#6B5279` 1.5, padding 8/14, `Urbanist SemiBold 13/140% #6B5279`.
  - Unselected: `#FFFFFF` with stroke `#E8E0D5` 1, `Urbanist Medium 13/140% #736B66`.
  - Options: `Work`, `Breathing`, `Sleep`, `Family`, `Friends`, `+ Add`. The `+ Add` chip opens an input for a custom tag.
- CTA at `24,700`: `Icon/Line check` 18 and `Save entry`. Both `Save` (nav) and `Save entry` save, and then route to J6 Saved.

Gaps vs code (`app/(tabs)/journal/new.tsx`):
- Remove the pick step with the Voice and Text cards (`:119-255`). Home now holds those choices.
- There is no mood slider. The code has a 12-emotion emoji grid (`:19-31`, `:522-578`). Replace it with §B2 and store the 5-point mood.
- Remove the prompt banner (`:335-366`) and the date/timeline row (`:407-458`). The date moves to the nav title. Add the AI prompt chip.
- The TAGS list (`:34-50`, 16 items such as `Loneliness` and `Money Issue`) does not match the design (`Work`, `Breathing`, `Sleep`, `Family`, `Friends` and custom `+ Add`). Selected colours use `#8B6B47` (`:607-617`), which is old palette.
- The CTA is green `#5B8A5A` (`:636`) and says "Create Journal". It should be `Save entry` in `#6B5279` with a check icon. Add the nav `Save` button.
- After save the code calls `finishTo('/(tabs)/journal')` (`:104`). It should go to J6 Saved.
- The crisis check runs only on the detail screen. It should run here (§C).

### J3. Speak · recording `6681:3439`
- Nav title `Voice entry`.
- Heading `Say anything that’s on your mind` at `24,124`, width 327, `Urbanist SemiBold 26/140% #241A2E`, centred, 2 lines.
- Subtitle `There’s no right way to start.` at y200, `Urbanist Regular 14/140% #736B66`, centred.
- Recording orb, centred at `187.5,380`. Layers from back to front:
  - glow `#D8B4D8@0.50 d280 blur50`;
  - glow `#E2CC40@0.55 d170 blur36`;
  - ripples d230/190/150 with stroke `#6B5279` @0.12/0.20/0.30, 1px;
  - inner light d64 `#FFF6D6@0.95 blur14`.
  - Animate the ripples outward and scale the inner light with the mic level.
- **Waveform** `6681:3470`: 300x44 at `37.5,560`. It has 40 bars, each 3px wide, on a 7.5 step, square ends, vertically centred on y22.
  - Played or recorded bars (first 26) use `#6B5279@0.85`. Upcoming bars (last 14) use `#6B5279@0.25`.
  - Mock heights: 6, 15.5, 24.8, 29.8, 27.2, 16.7, 10.6, 25.5, 34.5, 34.4, 25.7, 12, 13.4, 22, 23.8, 19.7, 12.9, 6.7, 8.8, 9.2, 7.9, 6.6, 6, 6, 6.5, 8, 9.9, 10.8, 8.8, 8.9, 16.9, 23.9, 26.3, 21.5, 9.9, 17, 29.9, 35.9, 32.5, 21. Minimum 6, maximum 36.
  - In the app, drive the heights from metering as a scrolling history.
- Timer `00:42` at y620, `Urbanist SemiBold 16/140% #6B5279`, centred, format `mm:ss`.
- Controls:
  - Cancel: 52x52 `#FFFFFF` r26 at `70,684` with `Icon/Arrow close` 20.8.
  - Stop: 76x76 `#6B5279` r38 at `149.5,672`, with DROP_SHADOW `0,0 r20 spread4 #E2CC40@0.60` and a 22x22 `#FFFFFF` r6 square inside.
  - Done: 52x52 `#FFFFFF` at `253,684` with `Icon/Line check` 20.8.
  - Done stops the recording and goes to J4.

Gaps vs code (`app/(tabs)/journal/voice.tsx`):
- The local `BRAND` palette (`:29-40`) is old brown and olive. Remove it.
- The header (`:271-306`) has the title "Voice Journal" (`translation.ts:1183`), which should be `Voice entry`, and a status badge (`:308-330`) that is not in the design.
- The white card with `SoundPulse` (`:339-385`, `components/SoundPulse.tsx`) should become the open orb above with no card.
- `WaveformBars` (`:43-100`) already has 40 bars of 3px, but its heights are random, the height is 80, the gap is 2 and it has no played/unplayed split. Change it to the 44 height and 7.5 step spec and drive it from recorder metering.
- Add the heading and subtitle copy. Replace the cancel row (`:420-448`) with the 3-button control row.

### J4. Speak · review `6682:3306`
- Nav title `Review`.
- Heading `Here’s what you said` at `24,120`, `Urbanist SemiBold 26/140%`.
- Subtitle `Edit anything before saving.` at `24,158`, `Urbanist Regular 14/140% #736B66`.
- Transcript card 327x300 at `24,200`, `#FFFFFF` r24. It contains editable text at `20,20`, width 287, `Urbanist Regular 16/160% #44403B`.
  - **Highlighted phrases** use `Urbanist SemiBold`, same size, `#6B5279`, with no background. In the mock they are `worried about making mistakes` and `a bit lighter`.
  - Full copy: `Today I had a hard time concentrating. I was worried about making mistakes, and I kept checking my messages. After lunch I went for a short walk and things felt a bit lighter.`
- Play pill at card `20,248`, 131x33, `#F5F1F7` r999, padding 8/14/8/10, gap 8. It has a 7x8.2 play triangle `#6B5279` and `Recording · 0:42` `Urbanist SemiBold 12/140% #6B5279`.
- `Mood we noticed` label at `24,524`, `Urbanist SemiBold 13/140%`.
- Mood chips at `24,550`, gap 8, padding 8/14/8/10, gap 6, each with a 16px `Icon/Mood` face.
  - Selected: `#F1ECF5` with stroke `#6B5279` 1.5, `SemiBold 13 #6B5279`. In the mock these are `Anxious` (sad face) and `Lighter` (happy face).
  - Unselected: `#FFFFFF` with stroke `#E8E0D5` 1, `Medium 13 #736B66`. In the mock this is `Okay` (neutral face).
  - These are free-form AI emotion words, not the 5-point scale. The user toggles them.
- CTA `Save entry` at y676, then the text link `Record again` at y744.

Gaps vs code (`voice.tsx:606-821`):
- The code has a "Transcription" card with an edit toggle (`:615-678`), a word count (`:733-746`) and different CTAs (`:748-821`). The design has an always-editable transcript with highlights, a playback pill and mood chips.
- No highlight data and no detected moods exist (see Backend gaps).
- Saving uses the fixed title `t('journalVoice.title')` (`:253`). The title must come from the AI or the first sentence.
- `audioUrl` is never set (`:252-257`), so the playback pill has nothing to play after the app restarts.

### J5. Entry `6682:3367` (375x900)
- Nav: back, date title, and a right button 44 `#FFFFFF` r22 with `Icon/Line note` (the layer is named "More", and the action is ambiguous; see blockers).
- Meta at `24,121`: face 18, then `Low · 08:40` `Urbanist SemiBold 13/140% #6B5279`.
- Title at `24,148`, `Urbanist SemiBold 26/140% #241A2E`.
- Body at `24,226`, width 327, `Urbanist Regular 15/160% #44403B`.
- Tags at `24,342`, gap 6. Each pill is `#F1ECF5` r999 with padding 4/10 and `Urbanist SemiBold 12/140% #6B5279`.
- **Reflection card** 327x300 at `24,394`, `#FFFFFF` r24.
  - Glows: `#E2CC40@0.35 d160 blur40` at `200,-60` and `#D8B4D8@0.35 d120 blur30` at `180,10`.
  - AI disc 36 `#6B5279` r18 at `20,20` with `sparkle` 18.
  - `A gentle reflection` at `66,21`, `Urbanist SemiBold 15/140%`, and `from Glow AI` at `66,41`, `Urbanist Regular 12/140% #A6A09B`.
  - Reflection text at `20,76`, width 287, `Urbanist Regular 14/155% #44403B`. Copy: `It sounds like the morning rush landed all at once. You noticed it in your body and paused to breathe, that’s a real skill. Starting with one small task might make tomorrow feel lighter.`
  - Suggested practice row at `20,206`, 287x74, `#F5F1F7` r18. It has an icon disc 40 `#FFFFFF` with `leaf` 20, `Box breathing` `Urbanist SemiBold 14/140%`, `4 min · Calm your focus` `Urbanist Regular 12/140% #736B66`, and `chevron-right` 18. Tapping it opens that practice.
- Legal note at `24,712` (foundations `Legal/Note` `6674:2966`) with the text `Reflections are AI-generated and are not professional advice.`
- CTA at `24,772`: `Icon/Line chat` 18 with gap 8, then `Talk it through with Glow AI` `Urbanist SemiBold 15/140%`. It opens chat seeded with the entry.

Gaps vs code (`app/(tabs)/journal/[id].tsx`):
- The "AI Insights" are hard-coded keyword tips (`:68-104`, `:815-886`) and are not AI. Replace them with the reflection card and suggested practice, which needs a backend.
- The header has a mood badge and the title "Journal Entry" (`:273-345`). The design shows the date title and moves the mood into the meta line.
- Remove the meta chips (`:512-571`).
- Edit is inline (`:573-786`), and Edit and Delete buttons sit at the bottom (`:888-940`). The design has neither of these, and only the "More" button, so the edit and delete entry point must be decided.
- Replace the crisis banner (`:349-410`) and the "struggling" card (`:412-460`) with the §C sheet. The current copy `Suicidal Mental Pattern Detected by AI!` (`translation.ts:1117`) is inaccurate, because detection is a keyword list (`:38-45`). The number is hard-coded to US `tel:988` (`:385`).
- Add the Legal note and the Glow AI CTA.

### J6. Saved `6682:3444`
- Close button at `319,54`, 40x40 `#FFFFFF@0.80` r20, with `close` 20. The Close button is 40 here and 44 elsewhere.
- Glow `#E2CC40@0.45 d300 blur60` at `37.5,150`.
- **Constellation**:
  - 5 stars, each 9x9 `#E2CC40` with a halo d22 `#E2CC40@0.50 blur6`, centred at (77.5,340), (117.5,280), (167.5,310), (217.5,260) and (267.5,295).
  - New star d20 `#FFF6D6` with a halo d60 `#E2CC40@0.70 blur14` at (307.5,350).
  - Polyline `6682:3464`, stroke `#E2CC40@0.60` 1.5: `M77.5 340 L117.5 280 L167.5 310 L217.5 260 L267.5 295 L307.5 350`.
  - Animate the line drawing to the new star, and then the new star blooms. Use the last 6 logged days, or a fixed decorative shape (needs a decision).
- `Saved to your sky` at y440, `Urbanist SemiBold 28/140%`, centred.
- Body at y482: `That’s 22 of 30 days in October.\nThank you for showing up for yourself.`, `Urbanist Regular 14/140% #736B66`.
- Streak pill at `128,548`, 119x29, padding 6/14/6/12, gap 6, flame 14, `13-day streak`.
- CTA at y676: `sparkle` with `See my reflection`, which goes to J5 scrolled to the reflection.
- Link `Back to journal`.
- Gap: there is no code. Saves currently toast and return (`new.tsx:103-104`, `voice.tsx:258-259`).

### J7. Support is here: see §C. Gap: no sheet component exists, and detection is only on the detail screen.

---

## M. Mood screens

### M1. Mood `6694:3432`
- The tab bar is drawn with Active=Home, so Mood is reached from Home and is not a tab.
- Title `Mood` at `24,60`, `Urbanist SemiBold 30/140%`.
- History button 44 at `307,56` with `chart` 20.
- Orb: home variant (§B3).
- `Good` at y328, `Urbanist SemiBold 28/140%`, centred.
- `Today · logged 08:40` at y367, `Urbanist Medium 13/140% #736B66`, centred.
- Pill `Talk about it with Glow AI` at `94,395`, 185x28, `#FFFFFF` r999, padding 7/14/7/12, gap 6. It has `sparkle` 14 and `Urbanist SemiBold 12/auto #6B5279`, centred.
- **This week card** 327x170 at `24,435`, `#FFFFFF` r24.
  - `This week` at `20,18`, `Urbanist SemiBold 15/140%`. `Mostly good` right-aligned at y20, `Urbanist Medium 12/140% #8E7FA6`. This is the most frequent mood of the week, as `Mostly <label lowercase>`.
  - 7 columns with x = 20 + 42·i. Each track is 30x80 `#F5F1F7` r15 at y52.
  - The fill is bottom-anchored (bottom at y132), r15, with height = 16 × score (Tense 16, Low 32, Okay 48, Good 64, Great 80). The fill colour is mood `@0.85` with LAYER_BLUR 2.
  - Face 18 at fill top + 6, x + 6.
  - Day letters `M T W T F S S` at y138, `Urbanist Medium 11/140% #A6A09B`. An empty day shows the track only.
  - Mock data: Okay, Okay, Good, Great, Low, Good, Good.
- CTA `Log my mood` at y632, with `Icon/Line plus` 18. It opens M2.

Gaps vs code (`app/(tabs)/mood/index.tsx`):
- The header has History and Stats buttons (`:159-196`). The design has a single chart button that goes to history.
- The emoji hero with the old palette (`:21-25`, `:208-296`) should become the orb, the label, the logged time and the Glow AI pill.
- "Mood Timeline / Last 7 days" (`:298-394`) should become the This week bars spec.
- Remove Mood Distribution (`:396-465`), Quick Stats including Energy and Stress (`:467-570`), the AI Insights list (`:572-705`) and Recent Check-ins (`:707-870`). None of them are in the design.
- Mood is a tab in `app/(tabs)/_layout.tsx:122-128`. The design tab bar has no Mood tab (foundations owns this).

### M2/M3. How are you feeling `6694:3555` (Good), `6694:3607` (Tense)
- The screen has no corner glows.
- Close button at `307,54`.
- Question `How are you feeling right now?` at `24,118`, width 327, `Urbanist SemiBold 26/140%`, centred.
- Orb (§B3), centre `187.5,346`.
- Mood word at y470, `Urbanist SemiBold 32/140% #241A2E`, centred.
- Slider (§B1).
- CTA `Continue` at y690 with no icon. It goes to M4.
- Default selection: not shown. Okay (middle) is suggested.

Gaps vs code (`app/(tabs)/mood/check-in.tsx`):
- `getMoods` (`:28-78`) uses the scale Bad, Low, Okay, Good, Great with labels Depressed, Sad, Neutral, Happy and Overjoyed, emoji faces, and full-screen solid backgrounds (`#7B6DC9` to `#D4A843`). Replace these with the §A scale and labels and with `Icon/Mood` faces.
- The swipe, dot and arrow selector (`:117-134`, `:221-290`) and the "1 / 5" counter (`:179-188`) should become the §B1 drag slider.
- The question copy should be `How are you feeling right now?` (`translation.ts:1475`). The white Continue button tinted with the mood colour (`:293-320`) should become the standard primary CTA.

### M4. What's shaping your mood? `6695:3543`
- Back button, plus a mood chip centred in the nav at `146,61`: 83x30, `#F1ECF5` r999, padding 6/14/6/10, gap 6, face 18, `Good` `Urbanist SemiBold 14/auto #6B5279`.
- Heading `What’s shaping your mood?` at `24,128`, `Urbanist SemiBold 26/140%`.
- Subtitle `Pick anything that fits. Optional.`, `Urbanist Regular 14/140% #736B66`.
- Factor chips wrap at `24,208`, gap 8, with rows every 49. Each chip has padding 9/14/9/12, gap 6, an `Icon/Line` 16 and 13pt text. Selected and unselected styles are the same as the J2 tags.
- Factors (icon):
  - `Work` (journal)
  - `Sleep` (moon)
  - `Friends` (users)
  - `Family` (heart)
  - `Exercise` (activity)
  - `Health` (health)
  - `Weather` (leaf)
  - `Money` (chart)
  - `Alone time` (meditate)
  - Selected in the mock: Sleep, Friends and Exercise.
- `Add a note` at `24,372`, `Urbanist SemiBold 13/140%`.
- Note card 327x120 at `24,398`, `#FFFFFF` r24, padding 20/18. Text is `Urbanist Regular 15/155% #44403B`, and the mock copy is `Long walk with Anna, slept well for once.`
- Helper at card y90: `Saved to your journal too`, `Urbanist Medium 11/140% #A6A09B`.
- CTA `Save mood` with a check icon. It goes to M5.

Gaps vs code (`check-in.tsx:326-641`):
- Step 2 has Energy 1-5 (`:425-480`), Stress 0-10 (`:497-560`) and a note (`:572-603`). The design has no energy or stress controls, and it has factor chips. `addMoodCheckIn` still requires energy and stress (`hooks/useMood.ts:76-77`), and the DB columns are NOT NULL.
- The note does not create a journal entry. On save the code toasts and goes back (`:141-143`). It should go to M5.

### M5. Mood logged `6695:3624`
- Close button.
- Orb: logged variant (§B3).
- `Mood logged` at y400, `Urbanist SemiBold 28/140%`.
- Summary `Good, with friends, sleep and exercise.\nThat’s 4 good days this week.`, `Urbanist Regular 14/140% #736B66`, centred. The template is `<Mood>, with <factors joined by ", " and " and ">.` followed by `That’s <n> <good> days this week.` Rules are needed for no factors and for negative moods.
- Suggestion card 327x84 at `24,500`, `#FFFFFF` r24.
  - AI disc 44 `#8E7FA6@0.14` r22 with `sparkle` 20 at `16,20`.
  - `Keep it going` `Urbanist Medium 12/140% #A6A09B`.
  - `Note what made today good` `Urbanist SemiBold 15/140%`.
  - Chevron at `293,33`.
  - It opens Write entry prefilled with the mood.
- Secondary button at `24,622`, 327x56, stroke `#6B5279` 1.5, with `sparkle` 18 and `Talk it through with Glow AI` `Urbanist SemiBold 16/auto #6B5279`.
- CTA `Done` at y690.
- Link `See my mood history` at y752.
- Gap: there is no screen.

### M6. Mood history `6695:3672`
- Nav title `Mood history`.
- Month title `October` at `24,118`, `Urbanist SemiBold 26/140%`.
- Month navigation at `271,118`: two 36x36 `#FFFFFF` r18 buttons with `chevron-left` and `chevron-right` 18, gap 8.
- **Calendar card** 327x330 at `24,170`, `#FFFFFF` r24. Columns start at x = 16 + 42.5·c and are 40 wide.
  - Weekday header `M T W T F S S` at y16, `Urbanist Medium 11/140% #A6A09B`. Weeks start on Monday.
  - Each day cell is a 24x24 disc at x = 24 + 42.5·c, y = 44 + 52·row, filled with the mood colour `@0.95`, with a halo d34 in the mood colour `@0.55 blur8`.
  - The number is centred, `Urbanist Medium 10/140% #241A2E`.
  - Today: `Urbanist Bold 10/140% #6B5279`, on its mood disc.
  - A future day or a day without data has no fill and a stroke `#D6CCC0` 1.2 (as on day 31).
  - If a day has several logs, use the latest or the average (needs a decision).
  - October 2026 mock (matches "Fri, 30 Oct"): Thu 1 Oct falls at column index 3. The data is 1G 2G 3O 4Gr 5L 6G 7G 8O 9G 10Gr 11T 12L 13O 14G 15G 16Gr 17G 18O 19G 20L 21L 22O 23G 24G 25Gr 26Gr 27G 28G 29L 30G(today) 31–.
- Legend at `24,516`, gap 12. Each item is a 10px dot plus `Urbanist Medium 12/140% #736B66` with gap 5, in the order Tense, Low, Okay, Good, Great.
- Summary card 327x96 at `24,556`, `#FFFFFF` r24.
  - `Mostly good this month` `Urbanist SemiBold 15/140%`, and `30 check-ins` right-aligned, `Urbanist Medium 12/140% #A6A09B`.
  - Mood mix bar 287x14 at `20,54`, r7, LAYER_BLUR 4.
  - The bar is hard-stop segments proportional to counts, ordered Great, Good, Okay, Low, Tense, each `@0.95`, with a 0.02 to 0.04 blend between segments. The mock stops are 0–.20 Great, .24–.60 Good, .64–.80 Okay, .84–.95 Low and .97–1 Tense.
- CTA `See insights` with the chart icon. It goes to the insights view, which is out of scope here and uses the existing `mood/history.tsx?tab=suggestions` or `mood/stats.tsx`.

Gaps vs code (`app/(tabs)/mood/history.tsx`):
- The title is "My Mood" (`:115-117`) and should be `Mood history`. There is a filter button (`:118-140`) and History/Insights tabs (`:150-185`).
- The body is a list of check-ins with the old palette (`:18-22`). Replace it with the calendar, legend and summary.
- `components/Calendar.tsx` is unused and uses yet another palette (`:10-14`) with 38x38 r13 cells (`:263-265`). Rewrite it to this spec and use it here.
- `components/MoodChart.tsx` is unused, and it can be deleted or rebuilt as the week bars.

---

## Backend and data gaps

| Need (screen) | Today | Required |
|---|---|---|
| 5-point scale Tense to Great (all) | `mood_score` 1–5 is mapped to `Bad, Low, Okay, Good, Great` (`hooks/useMood.ts:31-40`, `:63-69`, `lib/types.ts:4`) | Rename `Bad` to `Tense` in the type, the hook and i18n. Score 1 keeps its meaning in the DB, but old "Bad" logs will now read "Tense". Product should confirm this. |
| Energy and stress no longer collected (M4) | `mood_logs.energy_score` and `stress_score` are `int4 NOT NULL` (`tests/fixtures/schema.sql:160-161`, `types/database.types.ts:681,686`) | A migration to drop NOT NULL, or to default them to null, and an update to `MoodCheckIn` (`lib/types.ts:5-6`) and the stats code that averages them (`mood/index.tsx:509-530`). |
| Mood factors (M4, M5 summary) | Only `emotions text[]` exists, which the hook maps to `tags` | Add `factors text[]` with a fixed enum of keys (work, sleep, friends, family, exercise, health, weather, money, alone_time), or reuse `emotions` with a documented meaning. |
| Linked journal note (M4 "Saved to your journal too") | `journal_entries.mood_log_id uuid` exists (`schema.sql:134`) but is never written (`hooks/useJournal.ts:55-68`) | When a note is present, insert a journal entry with `mood_log_id` and `mood`. Define the title (for example the first line) and the tags (the factors). |
| Journal mood on the 5-point scale (J2, J5) | `journal_entries.mood text` stores free emotion labels (`new.tsx:19-31`) | Store the §A label or score. Optionally add `mood_score int2`. Map legacy values. |
| AI reflection and suggested practice (J5, J6) | None. Local keyword tips only (`[id].tsx:68-104`) | A new edge function (for example `journal-reflection`) that calls the same LLM as `supabase/functions/chat`, returns `{reflection, practiceId}`, and stores it in a `journal_reflections` table or in columns. Gate it with `lib/ai-privacy.ts`. |
| AI writing prompt chip (J2) | `journal_prompts` table plus a static prompt banner | Either a contextual follow-up from an LLM or a pick from `journal_prompts`. This needs a decision. |
| Highlighted phrases (J4) | `transcribe-audio` returns only `{text}` (`supabase/functions/transcribe-audio/index.ts:86`), using Whisper | Post-process with an LLM to return `highlights: [{start,end}]` (character offsets) and `moods: string[]`. Persist the highlights if they should show again later. |
| Moods noticed (J4) | None | As above, returning the selected moods. Store the selected chips (for example in `journal_entries.tags`, or a new `emotions text[]`). |
| Audio upload and playback (J4 pill, J5) | `audio_url` column exists, but voice save never uploads or sets it (`voice.tsx:252-257`). The recording URI stays local. | A Supabase Storage bucket (private, per-user RLS), upload on save, and a signed URL for playback. Decide on retention and privacy. |
| Crisis detection (J7, §C) | A client keyword list on the detail screen only, after save (`[id].tsx:38-65`), with US `tel:988` | Run it while writing (debounced) and on transcripts, preferably as a server-side classifier with the keyword list as a fallback. Use region-aware numbers (UK: 999, NHS 111 option 2, Samaritans 116 123; product decision). Add a trusted-contact model for "Message someone I trust", and log an anonymised safety event. |
| Streak, days logged and "Tonight is still open" (J1, J6) | `computeStreak` is private in `journal/stats.tsx:362-376` | A shared selector over journal entries for this month's logged days, the streak and today's status. |
| Weekly and monthly summaries (M1, M5, M6) | None | Client selectors for the most common mood, the count of Good and Great days this week, and the monthly distribution and count. |
| `updatedAt` | `JournalEntry.updatedAt` (`lib/types.ts:18`) has no column in `journal_entries` | Add `updated_at`, or drop it from the type. This affects edits from J5. |

---

## Asset table

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| `6681:3233` (`6681:3241` + dots) | Month constellation | J1 | SVG (code) | 327x190 card, grid 281x48 | Build with react-native-svg from data, with Skia halos. Do not export a static file. |
| `6682:3463` / `6682:3464` + stars `6682:3465-3476` | Saved constellation | J6 | SVG (code) plus Glow | 230x90 path | Build programmatically with a draw-on animation. Export once as a reference. |
| `6681:3470` | Waveform | J3 | SVG (code) | 300x44, 40 bars | Animated from metering, so it is not a file. |
| `6681:3466-3469` | Recording ripples and inner light | J3 | SVG + Glow | d230/190/150 rings, d64 light | Animate. |
| `6694:3578` | Aura contours · Good | M2 | SVG (reference) | 275x242 | Export as SVG to tune the parametric orb. |
| `6694:3630` | Aura contours · Tense | M3 | SVG (reference) | 278x245 | Same. Low, Okay and Great are missing. |
| `6694:3456` | Aura contours · home | M1 | SVG (reference) | 218x200, 6 rings | Same component with a smaller scale. |
| `6695:3648-3650` | Logged ripples | M5 | SVG | d220/180/140 | Static or with a subtle pulse. |
| `6686:3508` / `6694:3593` | Mood spectrum track | J2, M2, M3 | Gradient (code) | 303x20 | Linear 5-stop gradient plus blur 5. Use react-native-svg `LinearGradient` and a Skia blur, or Skia only. |
| `6695:3822` | Mood mix bar | M6 | Gradient (code) | 287x14 | Data-driven stops. |
| `6694:3473-3528` | Week bars | M1 | Code | 30x80 per day | Plain Views, with a blur 2 on the fill that can be dropped. |
| `6695:3713-3804` | Calendar day discs and halos | M6 | Code + Glow | 24 disc, d34 halo blur8 | Skia halos. |
| Glows: J1 tiles `6681:3296` `#E2CC40@0.45 d90 b22`, `6681:3304` `#D8B4D8@0.45 d90 b22`; J3 `6681:3464` `#D8B4D8@0.50 d280 b50`, `6681:3465` `#E2CC40@0.55 d170 b36`, `6681:3469` `#FFF6D6@0.95 d64 b14`; J5 `6682:3408` `#E2CC40@0.35 d160 b40`, `6682:3409` `#D8B4D8@0.35 d120 b30`; J6 `6682:3462` `#E2CC40@0.45 d300 b60`, star halos d22 `@0.50 b6`, new star halo `6682:3475` `#E2CC40@0.70 d60 b14`; §C `6682:3548` `#E2CC40@0.35 d260 b60`; M1 `6694:3454` `#E2CC40@0.55 d240 b46`, `6694:3455` `#7FC6F1@0.30 d150 b36`; M2/M3 `6694:3576/3628` d320 b60, `6694:3577/3629` d180 b40, `6694:3586` `#FFF6D6@0.90 d96 b18`, knob glow `6694:3599/3652` d70 b18; M5 `6695:3646` `#E2CC40@0.50 d300 b60`, `6695:3647` `#7FC6F1@0.35 d180 b50`, `6695:3651` `#FFF6D6@0.95 d80 b14`; compact slider `6686:3507` 120x70 b24; J1 day halos 18 b5 | various | all | Glow | see the values in this cell | Skia renderer (foundations). |
| Icons (`Icon/Line`) | chart `6598:1859`, flame `6598:1834`, note `6609:2494`, mic `6598:1848`, sparkle `6598:1814`, check `6598:1837`, chat `6598:1798`, leaf `6598:1785`, heart `6598:1781`, plus `6609:2490`, moon `6598:1792`, users `6598:1821`, activity `6598:1817`, health `6598:1825`, meditate `6598:1789`, journal `6598:1795` | — | Icon | 14–30 | Foundations icon set. |
| Icons (`Icon/Arrow`) | back `6589:1632`, close `6589:1672`, chevron-left `6589:1652`, chevron-right `6589:1657` | — | Icon | 18–22 | Foundations. |
| Icons (`Icon/Mood`, set `6598:1778`) | angry `6598:1777`, sad `6598:1763`, neutral `6598:1739`, happy `6598:1722`, very-happy `6598:1728` | — | Icon | 16, 18, 26, 48, 56 | The canonical mood faces (§A). Export at viewBox scale, with a stroke-colour prop. |
| `6706:4101` | icon/search (loose vectors) | J1 | Icon | 20 | Not a component. Map it to the foundations search icon. |

No raster assets are used in these sections.

---

## Proposed tasks

1. Build a shared mood scale module (`lib/moodScale.ts`) with the §A labels, scores, colours, faces and orb colours, rename `Bad` to `Tense` across types, hooks and i18n, and point `MoodCheckInModal`, `Calendar` and the mood and journal screens at it (doc §A).
2. Build the `MoodSlider` component with full and compact sizes, a gradient track, 5 snap stops, a knob and a mood glow (doc §B1, §B2; used by M2, M3 and J2).
3. Build the `MoodOrb` component with parametric react-native-svg aura contours for all five moods, the home, check-in and logged variants, and a breathing animation (doc §B3; M1, M2, M3, M5), and export the `6694:3578`, `6694:3630` and `6694:3456` reference SVGs.
4. Build the `CrisisSheet` bottom sheet with region-aware call actions, a share-sheet action for "Message someone I trust" and a dismiss action (doc §C, J7), and replace the banners in `journal/[id].tsx:349-460`.
5. Move crisis detection into a shared detector that runs debounced while writing, on voice transcripts and on save, with a server-side classifier option, and log an anonymised safety event (doc §C, Backend gaps).
6. Rebuild Journal home with the header buttons, the month constellation component, the streak pill, the Write and Speak tiles and the new Recent cards, and extract the shared streak and month-days selectors (doc J1).
7. Rebuild Write entry with the compact mood slider, the editor card, the AI prompt chip, design tags with `+ Add`, the nav Save and the Save entry CTA, and remove the picker step and the emoji emotion grid (doc J2).
8. Rebuild the voice recording screen with the open ripple orb, the metering-driven 40-bar waveform, the timer and the cancel, stop and done controls, and remove the `BRAND` palette and `SoundPulse` usage (doc J3).
9. Rebuild voice review with an editable transcript with highlighted phrases, a playback pill, "Mood we noticed" chips and Record again (doc J4).
10. Extend `transcribe-audio`, or add a follow-up function, to return highlight offsets and detected moods, and persist the selected moods (doc J4, Backend gaps).
11. Add a private Supabase Storage bucket for voice recordings, upload on save, set `audio_url`, and play back through a signed URL (doc J4, J5, Backend gaps).
12. Add a `journal-reflection` edge function and storage for the reflection text and the suggested practice id (doc J5, Backend gaps).
13. Rebuild the Entry detail screen with the meta line, body, tags, reflection card, suggested practice row, Legal note and the "Talk it through with Glow AI" CTA, and decide where edit and delete live (doc J5).
14. Build the Saved to your sky screen with an animated constellation, the days count, the streak, the See my reflection CTA and the Back to journal link, and route both save paths to it (doc J6).
15. Rebuild Mood home with the orb hero, the logged time, the Glow AI pill, the This week bars and the Log my mood CTA, and remove the timeline, distribution, quick stats, AI insights and recent list (doc M1).
16. Rebuild the mood check-in step 1 with the question, the orb, the mood word, the full slider and the Continue CTA (doc M2, M3).
17. Rebuild the mood check-in step 2 as "What's shaping your mood?" with the nav mood chip, the factor chips with icons and a note that also creates a linked journal entry (doc M4).
18. Add a migration that makes `mood_logs.energy_score` and `stress_score` nullable, adds `mood_logs.factors text[]`, adds `journal_entries.updated_at`, and writes `journal_entries.mood_log_id` from the mood note, and update the types and hooks (doc Backend gaps).
19. Build the Mood logged screen with the logged orb, the summary sentence, the "Keep it going" suggestion card, the Glow AI secondary button, Done and the history link (doc M5).
20. Rebuild Mood history with month navigation, the calendar disc and halo grid (rewrite `components/Calendar.tsx`), the legend, the monthly mix bar summary and See insights, and delete the unused `components/MoodChart.tsx` (doc M6).
21. Update the en i18n strings for journal and mood to the verbatim design copy, and remove the unused keys (`journalHome`, `journalDetail`, `journalVoice`, `moodCheckIn`) (all screens).

## Blockers and open questions

- **Okay colour mismatch.** The slider gradient uses `#EFE6DA` at the 0.50 stop. The calendar, week bars, legend and mix bar use `#E8DFD2`. One value is needed.
- **Missing orb states.** Only the Good and Tense orbs are drawn. The Low, Okay and Great glow colours and contour shapes are proposals (§A starred values) and need design sign-off.
- **Two knob styles.** The compact knob is `#FAEDB8` with a yellow drop shadow, and the full knob is `#FFF6D6` with a separate glow in the mood colour.
- **Mood home tab bar** is drawn with Active=Home, and Mood has no tab, but the code has a Mood tab. Foundations or product must confirm where Mood lives.
- **Entry "More" button** (`6682:3390`) uses the note icon, and the edit and delete entry points are not designed.
- **Crisis numbers and region.** The design says "Call emergency services", and the code dials US 988. The UK numbers and the "trusted contact" flow need a product and clinical decision.
- **Saved constellation data.** It is unclear whether the shape reflects real recent days or is decorative.
- **Minor inconsistencies.**
  - The Saved Close button is 40x40, and the others are 44.
  - The crisis secondary button is 52 high, and the others are 56.
  - The M1 "Today · logged" text layer sits at x=-1.
  - The Legal note's layer name holds the default copy, and only the override text applies.
- **No old-palette colours** were found in these Figma sections. The old palette (`#8B6B47`, `#5B8A5A`, `#E8985A`, `#7B6DC9`, `#C45B5B`) exists only in the code.
- **No Figma call failures.**
