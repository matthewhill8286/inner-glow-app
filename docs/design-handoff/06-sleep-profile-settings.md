# 06 — Sleep, Profile, Settings & Help Center

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` (Main - Light Mode). Raw extraction is in the session scratchpad under `figma/specs/06-*.txt`.

Shared specs are owned elsewhere and are only referenced here:

- **00-foundations.md** owns colour and type tokens, Urbanist loading, Button (primary 327x56 `#6B5279` r999, label SemiBold 16/140% `#FFFFFF`), Back button (44x44 r22, stroke `#6B5279`/1.5, or `#FFFFFF@0.60` on dark screens), Tag/Chip, Toggle, Input field, Legal/Note (`6674:2966`), Tab bar (`6604:2068` Active=Home, `6604:2155` Active=Profile), the icon set, the Skia glow renderer and the status bar/home indicator.
- **01-onboarding-auth.md** owns the paywall. "See plans" and "See Pro plans" open it.
- **04-journal-mood.md** owns the mood faces. They are not used in this area. The sleep check-in uses its own moon scale, which is specified below.

Conventions used in this doc: positions are `x,y` relative to the 375-wide screen. Typography is written as `Urbanist <Style> <size>/<line-height> <colour>`. Where Figma says `auto` line height, use Urbanist's default line height (about 1.2), not 140%. Glows are written as `Glow(x,y,size,colour@opacity,blur)` and are rendered by the foundations Skia glow component.

---

## 1. Section overview

### 1.1 Sleep Quality — section `4002:15071` (3704x1499)

| # | Node | Name | Size | Code route |
|---|---|---|---|---|
| S1 | `6712:4203` | 1. Sleep | 375x1000 | `app/(tabs)/sleep/index.tsx` (full redesign) |
| S2 | `6712:4332` | 2. Bedtime schedule | 375x812 | `app/(tabs)/sleep/schedule.tsx` |
| S3 | `6712:4403` | 3. Wind down | 375x812 | none (new route, proposed `app/(tabs)/sleep/wind-down.tsx`) |
| S4 | `6712:4502` | 4. Sleep mode | 375x812 | `app/(tabs)/sleep/start.tsx` (sleeping state) |
| S5 | `6716:4314` | 5. Wake up | 375x812 | none (new route, proposed `app/(tabs)/sleep/wake.tsx`) |
| S6 | `6716:4345` | 6. How did you sleep | 375x812 | `app/(tabs)/sleep/log.tsx` |
| S7 | `6716:4411` | 7. Last night | 375x1000 | `app/(tabs)/sleep/[id].tsx` |
| S8 | `6716:4508` | 8. Sleep insights | 375x1000 | `app/(tabs)/sleep/insights.tsx` |

`app/(tabs)/sleep/history.tsx` has no design. `app/(suggestion-actions)/sleep.tsx` re-exports the sleep index and needs no separate work.

Flow: S1 "Start wind down" → S3 → "Start sleep mode" → S4 → swipe → S5 → "I’m up" → S6 → Save → S7. S1 "Tonight" card → S2. S7 "See sleep insights" → S8.

### 1.2 Profile Settings & Help Center — section `4002:15083` (6338x1817)

This section has not been audited before. The canvas label reads "Profile & Help" and is drawn in white on a near-white background, so it is almost invisible in Figma.

| # | Node | Name | Size | Code route |
|---|---|---|---|---|
| P1 | `6719:4387` | 1. Profile | 375x909 | `app/(tabs)/profile/index.tsx` (full redesign) |
| P2 | `6719:4516` | 2. Settings | 375x1318 | none. `app/(legacy)/settings.tsx` only redirects to `profile/categories`. Proposed `app/(tabs)/profile/settings.tsx` |
| P3 | `6719:4677` | 3. Personal information | 375x1001 | `app/(tabs)/profile/edit.tsx` |
| P4 | `6720:4507` | 4. Notifications | 375x1162 | Reminder toggles currently live in `app/(tabs)/notifications/index.tsx`. Proposed `app/(tabs)/profile/notifications.tsx` |
| P5 | `6720:4617` | 5. Security | 375x821 | none. Partly covered by `app/(auth)/two-factor-setup.tsx` and `forgot-password.tsx` |
| P6 | `6720:4692` | 6. Glow AI & your data | 375x912 | `app/(utils)/ai-privacy.tsx` |
| P7 | `6720:4774` | 7. Connected apps | 375x812 | none |
| P8 | `6720:4839` | 8. Language | 375x910 | Modal in `app/(tabs)/profile/index.tsx:353-430` |
| P9 | `6722:4679` | 9. My plan | 375x888 | none (paywall is `app/(utils)/trial-upgrade.tsx`) |
| P10 | `6722:4755` | 10. Help Center | 375x1026 | `app/(utils)/help-center.tsx` (38-line stub) |
| P11 | `6722:4837` | 11. Contact us | 375x927 | `app/(utils)/support.tsx` |
| P12 | `6723:4733` | 12. Send feedback | 375x867 | none |
| P13 | `6723:4798` | 13. Feedback sent | 375x812 | none |
| P14 | `6723:4831` | 14. Delete account | 375x1005 | `app/(utils)/delete-account.tsx` |

Code screens with no design: `app/(tabs)/profile/overview.tsx`, `app/(tabs)/profile/categories.tsx`, `app/(utils)/blocked-users.tsx`, `app/(utils)/legal.tsx`, `app/(utils)/resources.tsx`, `app/(utils)/utilities.tsx`. Blocked users is still needed for community safety, so it should stay reachable (proposed: a row under Privacy & security). Legal is the target of "Terms, privacy & disclaimer". Resources is the target of "Get support now".

---

## 2. Sleep screens

All sleep screens use background `#F7F4F2` unless stated as dark (`#241A2E`). Header titles are `Urbanist SemiBold 14/140% #241A2E` (S2, S3) or `SemiBold 15/auto` (S6–S8), centred at y=66. The size mismatch (14 vs 15) should be resolved to 15 by foundations.

### S1 — Sleep (`6712:4203`, 375x1000, scrolls)

| Element | Spec |
|---|---|
| Page glows | `Glow(-50,-20,280,#D8B4D8@0.30,80)`, `Glow(180,60,220,#7FC6F1@0.22,80)` (sit under the hero, mostly hidden) |
| Night hero `6712:4206` | 0,0 375x380 fill `#241A2E`. The hero has square corners in Figma but the screenshot shows a rounded bottom; use bottom radius 0 as in the node. Inside: `Glow(140,0,240,#D8B4D8@0.35,70)`; Star field `6712:4208` (26 stars, see §4.1); Moon `6712:4235` at 226,82, 72x72 (vector 46.4x57 at 18.1,7.5, fill `#F3E9F3`) |
| Status bar | light content (`Is Black=True` instance on dark) |
| Back button | 24,54, stroke `#FFFFFF@0.60` |
| Eyebrow | 24,150 "LAST NIGHT · 23:10 → 07:00" `Urbanist Bold 11/140% ls 6% #FFFFFF@0.60` |
| Duration | 24,170 "7h 50m" `Urbanist SemiBold 52/140% #FFFFFF` |
| Quality pill `6712:4258` | 24,244 hug 169x27, fill `#E2CC40` r999, pad 5/12/5/10, gap 4; Icon/Line star 14; "Restful · best this month" `Urbanist Bold 12/140% #241A2E` |
| Stat row `6712:4262` | 24,290, three tiles 103.6x53 gap 8, fill `#FFFFFF@0.08` r18 pad 8/14; value `SemiBold 16/140% #FFFFFF`, label `Medium 11/140% #FFFFFF@0.60`. Copy: "23:10"/"Bedtime", "1h 40m"/"Deep", "1×"/"Woke up" |
| This week card `6712:4272` | 24,404 327x180 `#FFFFFF` r24. "This week" 20,18 `SemiBold 15/140% #241A2E`; "avg 7h 05m" right-aligned to x=307, y=20 `Medium 12/140% #8E7FA6`. Bar chart, see §4.4 |
| Tonight card `6712:4296` | 24,598 327x76 `#FFFFFF` r24. Icon bubble 16,16 44x44 `#8E7FA6@0.14` r22 with Icon/Line bell 20. "Bedtime 23:00 · wake 07:00" 72,16 `SemiBold 15/140% #241A2E`; "Wind-down reminder at 22:30" 72,38 `Regular 12/140% #A6A09B`; chevron-right 18 at 295,29. Tapping opens S2 |
| CTA | 24,694 primary Button with Icon/Line moon 18, "Start wind down" → S3 |
| Link | y=764 "Ask Glow AI about my sleep" `SemiBold 14/140% #8E7FA6` centred → Glow AI chat with sleep context |
| Tab bar | y=908, Active=Home. Sleep is entered from Home, so the Home tab is highlighted |

Gaps vs code (`app/(tabs)/sleep/index.tsx`):
- The whole screen is a different layout. Code has a header with emoji title (`:292-345`), a purple score card `#5A3E7A` with a fake breakdown ring (`:352-378`), an overview card, a legend, a 2x2 quick-action grid (`:430-491`), an AI teaser, recent entries and a mindful link (`:607-630`). None of these are in the design.
- The stage split is hard-coded mock data (`:275-287`: 45/30/15/10) and the "improvement" figure is mocked (`:289`). Remove both.
- Old-palette colours in code: `#5A3E7A`, `#5A8FB5`, `#7B6DC9`, `SLEEP_COLORS.*`, `#2A1A3E`.
- The design needs data the app does not have: "best this month" ranking, "Deep" duration (no stage data), number of awakenings is available (`sleep.awakenings`). See §6.
- History (`/(tabs)/sleep/history`) and manual log are no longer linked from this screen. Decide whether "This week" bars open history.

### S2 — Bedtime schedule (`6712:4332`, 375x812)

| Element | Spec |
|---|---|
| Glows | `Glow(-50,-20,280,#D8B4D8@0.30,80)`, `Glow(180,60,220,#7FC6F1@0.22,80)` |
| Header | "Sleep schedule" |
| Title | 24,120 327w "When do you want to sleep?" `SemiBold 26/140% #241A2E` (wraps to 2 lines) |
| Dial | 24-hour dial, see §4.2. Dial glow `Glow(62.5,185,250,#D8B4D8@0.40,50)` |
| Centre label | "8h 00m" y=284 `SemiBold 30/140% #241A2E` centred; "in bed" y=322 `Medium 13/140% #736B66` |
| Time tiles | 24,440 and 191.5,440, each 159.5x76 `#FFFFFF` r24. Icon 16 at 16,16 (moon for Bedtime, star for Wake up); label 38,15 `Medium 12/140% #A6A09B`; time 16,36 `SemiBold 22/140% #241A2E`. Tapping a tile opens a native time picker |
| Repeat | label 24,536 `SemiBold 13/140% #241A2E`. Day row 24,560, seven 41x41 circles gap 6. Selected: fill `#F1ECF5` stroke `#6B5279`/1.5, letter `SemiBold 13 #6B5279`. Unselected: `#FFFFFF` stroke `#E8E0D5`/1, letter `Medium 13 #736B66` |
| Wind-down row | 24,620 327x56 `#FFFFFF` r24; "Wind-down reminder · 30 min before" 20,17 `Medium 14/140% #241A2E`; Toggle (foundations) at 261,14 |
| CTA | 24,698 primary with Icon/Line check 18, "Save schedule" |

Gaps vs code (`app/(tabs)/sleep/schedule.tsx`):
- Code uses +/- stepper buttons per hour and minute (`:200-262`); design uses a draggable dial plus tappable tiles.
- Code shows "auto display stats" (`:338`) and has `autoSetAlarm`/`snoozeCount` in state; these rows are not in the design. Wake alarm settings need a home (proposed: keep `autoSetAlarm` as a row under the wind-down row; ask design).
- Wind-down offset is fixed at 30 min (`lib/notifications.ts:7`); the design copy implies a configurable offset ("· 30 min before"). Keep fixed but render from the constant.
- Schedule is stored only in AsyncStorage (`hooks/useSleep.ts:43-98`). See §6.
- Day letters must use i18n; code uses keys `Mon`…`Sun` (`hooks/useSleep.ts:37`).

### S3 — Wind down (`6712:4403`, dark, 375x812) — new screen

| Element | Spec |
|---|---|
| Background | `#241A2E`; `Glow(37.5,100,300,#8E7FA6@0.35,80)`; Star field `6712:4405` 375x540 (30 stars) |
| Header | "Wind down" `SemiBold 14/140% #FFFFFF` |
| Title | 24,120 "Let’s slow things down" `SemiBold 28/140% #FFFFFF`; 24,160 "Pick something to fall asleep to." `Regular 14/140% #FFFFFF@0.65` |
| Options | four cards 327x72 at y=210, 292, 374, 456; fill `#FFFFFF@0.08` r24; selected adds stroke `#E2CC40@0.80`/1.5. Icon bubble 14,14 44x44 `#FFFFFF@0.10` r22 with Icon/Line 20 (music, leaf, moon, note). Title 70,15 `SemiBold 15/140% #FFFFFF`; meta 70,37 `Regular 12/140% #FFFFFF@0.60`. Radio 291,26 20x20: selected fill `#E2CC40`; unselected stroke `#FFFFFF@0.40`/1.5 |
| Copy | "Rain at night" / "Sleep sounds · 20 min"; "Bedtime breathing" / "Breathing · 6 min"; "Quiet mind" / "Guided · 10 min"; "Write it out" / "Journal · 3 min" |
| Timer row | 24,546 327x56 `#FFFFFF@0.08` r24; "Stop sound after" 20,17 `Medium 14/140% #FFFFFF`; "30 min" 244,17 `SemiBold 14/140% #E2CC40`; chevron-right 16 at 293,20. Opens a picker (15/30/45/60 min, Never) |
| CTA | 24,698 327x56 fill `#F3E9F3` r999, Icon/Line moon 18 + "Start sleep mode" `SemiBold 16/140% #241A2E` (light variant of the primary button for dark screens; add to foundations Button as `variant="onDark"`) |

Gaps: no route exists. "Rain at night" maps to `rain` in `lib/soundscape.ts:5-11`. The other three options launch existing practices (breathing, guided meditation, journal) and must then continue to S4. There is no stop-after timer in `lib/soundscape.ts`. See §6.

### S4 — Sleep mode (`6712:4502`, dark, 375x812)

| Element | Spec |
|---|---|
| Background | `#241A2E`; Star field `6712:4503` 375x740 (35 stars); `Glow(57.5,170,260,#D8B4D8@0.30,70)`; Moon `6712:4540` at 139.5,252, 96x96 (same moon vector scaled: 61.8x76 at 24.2,10, `#F3E9F3`) |
| Greeting | y=440 "Good night, Matthew" `SemiBold 22/140% #FFFFFF` centred (first name / nickname) |
| Clock | y=474 "23:10" `SemiBold 64/140% #FFFFFF` centred; live current time, 24h format following locale |
| Alarm pill | 94,566 hug 188x29 `#FFFFFF@0.10` r999 pad 6/14/6/12 gap 6; bell 14; "Alarm 07:00 · Rain at night" `SemiBold 12/140% #FFFFFF`. When no alarm is set, show only the sound; when neither, hide |
| Swipe track `6712:4567` | 24,690 327x60 `#FFFFFF@0.08` r30. Knob 6,6 48x48 `#F3E9F3` r24 with Icon/Arrow forward 20 (`#241A2E`). Label 72,20 "Swipe when you wake up" `SemiBold 15/140% #FFFFFF@0.80`. Drag knob right; on release beyond ~80% of track, complete and go to S5; otherwise spring back. Fade the label as the knob passes it |

Gaps vs code (`app/(tabs)/sleep/start.tsx`): code has a pulsing tap button and elapsed timer (`:46-57`, `:108-180`); design has a clock and a swipe control. `userName` is hard-coded to `'there'` (`:84`); use the profile name. Code jumps straight to the log screen on stop (`:72-75`); design goes to S5 first. Keep screen awake while in sleep mode and dim brightness (not in design; propose).

### S5 — Wake up (`6716:4314`, 375x812) — new screen

| Element | Spec |
|---|---|
| Glows | `Glow(-40,-60,260,#D8B4D8@0.22,90)`, `Glow(57,150,260,#E2CC40@0.30,80)`, `Glow(117,210,140,#FFB3BE@0.22,50)` |
| Aura `6717:4390` | five closed, slightly irregular contours centred on (187,280), stroke `#6B5279` 1px: 125.8 @0.28, 181 @0.23, 233.4 @0.18, 281.6 @0.13, 327.6 @0.08. Export as one SVG. Optional slow breathing scale animation (1.00↔1.03, 4 s) |
| Inner light `6717:4396` | 151,244 72x72 radial: `#FFF6D6` 0 → `#F2D96A@0.90` 0.60 → `#F2D96A@0` 1.0, plus LAYER_BLUR 6 (the blur can be dropped; the gradient already fades to 0) |
| Greeting | y=436 "Good morning, Matthew" `Medium 16/auto #8E7FA6` centred |
| Clock | y=458 "07:00" `Regular 64/auto #241A2E` centred (note: Regular here but SemiBold on S4; see blockers) |
| Summary pill | 120,546 hug 135x32 `#FFFFFF@0.70` stroke `#E6E0EA`/1 r999 pad 7/14 gap 8; dot 6 `#E2CC40`; "7h 50m · Restful" `Medium 13/auto #6B5279`. Quality word is shown only after the check-in, so before S6 show duration only |
| Body | y=586 "Take one slow breath before you get up." `Regular 14/auto #736B66` centred |
| CTA | 24,650 primary "I’m up" (no icon) → saves start/end, stops sound, → S6 |
| Snooze | 24,716 327x40 text button "Snooze 9 min" `SemiBold 15/auto #8E7FA6` |

Gaps: no route. The ringing alarm is a native module (`lib/alarms.ts:16-35`, iOS 26+ only) and the notification snooze bursts were retired (`lib/alarms.ts:34`), so "Snooze 9 min" has no implementation. See §6.

### S6 — How did you sleep (`6716:4345`, 375x812)

| Element | Spec |
|---|---|
| Glows | `Glow(-60,-40,280,#D8B4D8@0.25,90)`, `Glow(200,40,220,#7FC6F1@0.18,90)`, `Glow(97.5,180,180,#E2CC40@0.22,60)` |
| Header | "Sleep check-in" `SemiBold 15/auto #4E3A5E` |
| Title | 24,120 "How did you sleep?" `SemiBold 28/34 #241A2E`; 24,158 "A quick note helps Glow AI spot patterns." `Regular 14/auto #736B66` |
| Moon scale | five moons along an arc, see §4.3. Value 1–5 maps directly to `sleep.quality` |
| Quality label | y=346 "Restful" `SemiBold 24/auto #6B5279` centred; y=380 "Woke up once, felt okay after." `Regular 13/auto #736B66` centred. The second line is generated from awakenings, so it needs an awakenings input that the design does not show (see blockers) |
| Factors | label 24,426 "What played a part?" `Bold 12/auto #8E7FA6`. Chips (foundations Tag, h34, pad 8/14, wrap, gap 8 both ways): Caffeine, Screen time, Stress / Exercise, Late meal, Noise / Wind down, Nap. Selected: `#F1ECF5` stroke `#6B5279`/1.5 text `#6B5279`; default: `#FFFFFF` stroke `#E6E0EA`/1 text `Medium 13 #4E3A5E` |
| Note | 24,600 327x56 `#FFFFFF` stroke `#E6E0EA`/1 r20; placeholder "Add a note (optional)" `Regular 14/auto #A6A09B` at 16,18. Single line that grows |
| CTA | 24,698 primary with check icon, "Save" → S7 for that entry |

Gaps vs code (`app/(tabs)/sleep/log.tsx`): code uses five numbered square buttons in brown `#8B6B47` (`:115-140`, old palette), a duration input (`:149-175`) and an AI tip (`:213`). Design has no duration input because duration comes from sleep mode; manual entry from history still needs a duration/time input (keep it, styled as S2 tiles, shown only when not coming from S5). Factors have no storage. Quality labels for 1, 2, 3 and 5 are not in the design; `lib/sleep-utils.ts:3` has `getQualityLabel`, which must be re-worded to the new tone (proposed: 1 "Rough", 2 "Restless", 3 "Okay", 4 "Restful", 5 "Deep rest" — needs design sign-off).

### S7 — Last night (`6716:4411`, 375x1000)

| Element | Spec |
|---|---|
| Night block | rect 0,0 375x372 `#241A2E`; Star field `6716:4413` (35 stars); `Glow(88,20,200,#D8B4D8@0.18,70)` |
| Header | "Last night" `SemiBold 15/auto #FFFFFF`; back button white@0.60. For older entries use the weekday/date instead of "Last night" |
| Date line | y=112 "Tue, 27 Oct · 23:05 – 06:55" `Regular 13/auto #FFFFFF@0.60` centred |
| Duration | y=132 "7h 50m" `Regular 56/auto #FFFFFF` centred |
| Goal line | y=204 "Restful · 92% of your goal" `Regular 14/auto #E2CC40` centred |
| Stage chart | 24,236 327x112 hypnogram, see §4.5. Axis labels y=352 `Regular 11/auto #FFFFFF@0.50`: "23:00" x=24, "02:00" x=124, "04:00" x=224, "07:00" x=324 |
| Sheet | rect 0,388 375x612 `#F7F4F2` (no radius) |
| Stages list | label 24,412 "Sleep stages" `Bold 12/auto #8E7FA6`. Three rows 56 apart (y=440, 496, 552): dot 10 at x=24 (Deep `#6B5279`, REM `#8E7FA6`, Light `#D8B4D8`); name 44 `Medium 15/auto #241A2E`; value right-aligned to x=351 `SemiBold 15/auto #4E3A5E`; track 44,(y+28) 307x4 `#E6E0EA` r2; fill width = stage minutes / total minutes × 307 in the dot colour. Copy: Deep 1h 40m, REM 1h 55m, Light 4h 15m |
| Glow AI note | 24,618 327x112 `#FFFFFF` r24 (clip). `Glow(-30,-30,120,#D8B4D8@0.30,40)` inside the card; Orb 16,16 28x28 radial `#FFF6D6`→`#6B5279`; "Glow AI" 54,20 `Bold 12/auto #6B5279`; body 16,54 295w `Regular 14/20 #4E3A5E` "You fell asleep 20 min faster on nights with a wind down. Want to keep it going tonight?" |
| CTAs | 24,760 primary "See sleep insights" → S8; 24,828 327x56 outline (stroke `#6B5279@0.50`/1.5 r999, text `SemiBold 16/auto #6B5279`) "How did you sleep?" → S6 for this entry. Hide the outline button once the entry has a quality |

Gaps vs code (`app/(tabs)/sleep/[id].tsx`): code shows a hero with "You slept for", bedtime/wake tiles, emoji quality (`:367-384`), awakenings, notes and a "Got it, thanks" button (`:416`). The design drops notes and awakenings display (notes still need a place; propose a row under the stages list) and the delete action (`:218`, keep as a header overflow action). No stage data exists. No sleep goal exists, so "% of your goal" has no source.

### S8 — Sleep insights (`6716:4508`, 375x1000)

| Element | Spec |
|---|---|
| Glows | `Glow(-60,-40,280,#D8B4D8@0.25,90)`, `Glow(200,40,220,#E2CC40@0.15,90)` |
| Period control `6716:4529` | 24,112 327x40 `#FFFFFF` stroke `#E6E0EA`/1 r999. Active pill 4,4 105x32 `#F1ECF5` stroke `#6B5279`/1.5 r999. Labels 105w centred at y=11: active `SemiBold 13/auto #6B5279`, inactive `Medium 13/auto #736B66`. Week / Month / Year. Same component as the Help Center tabs (P10) and the journal/mood period control if one exists; build once in foundations as `SegmentedControl` |
| Average | 24,176 "Average" `Bold 12/auto #8E7FA6`; 24,194 "7h 24m" `Regular 40/auto #241A2E`; "+32 min vs last week" right-aligned to x=351, y=212 `Medium 13/auto #6B5279` |
| Trend chart | 24,256 327x150, see §4.6. "Goal 8h" 300,262 `Regular 11/auto #8E7FA6`. Day labels y=414 `Regular 11/auto #736B66`, left x = 32 + 50·i |
| What helps | label 24,448 "What helps your sleep" `Bold 12/auto #8E7FA6`; card 24,472 327x112 `#FFFFFF` r24; rows at y=18 and y=74: dot 8 at 18 (`#E2CC40`), name 38 `Medium 15/auto #241A2E`, impact right-aligned to x=311 `Regular 13/auto #736B66`; divider 18,56 291x1 `#EFEAF2`. Copy: "Wind down" "+25 min", "Exercise" "+18 min" |
| What gets in the way | label 24,608; card 24,632, same layout with dots `#8E7FA6`. Copy: "Screen time" "−30 min", "Late caffeine" "−22 min" (uses U+2212 minus) |
| Ask chip | 24,768 327x52 `#F1ECF5` stroke `#6B5279`/1.5 r999; orb 16,14 24 radial `#FFF6D6`→`#6B5279`; "Ask Glow AI how to sleep better" 50,16 `SemiBold 15/auto #6B5279` |
| Legal note | 24,840 Legal/Note "Sleep data is an estimate from your phone, not a medical assessment." |

Gaps vs code (`app/(tabs)/sleep/insights.tsx`): code has periods 1D/1W/1M/1Y/All (`:290-297`), a bar chart with max 10h (`:206-221`), an irregularity metric (`:240-252`), a stage breakdown computed as fixed fractions of average duration (`:415-437`: 0.65, 0.25, 0.10 — fabricated) and an AI suggestions list from `hooks/useSleepInsights.ts`. Design replaces all of these with Week/Month/Year, a line chart against an 8h goal, and factor impacts. Remove the fabricated breakdown. For Month and Year the chart needs aggregation (Month: 4–5 weekly averages or 30 daily points; Year: 12 monthly averages) — not designed, see blockers.

---

## 3. Profile, Settings and Help screens

### 3.0 Shared patterns in this section (build once)

- **Screen shell**: background `#F7F4F2`; `Glow(-70,-50,280,#D8B4D8@0.22,90)` plus a second glow at `200,40` size 220 blur 90 in `#E2CC40@0.15`, `#7FC6F1@0.15–0.18` or `#D8B4D8@0.20` (per screen, listed below). Back button 24,54. Centred header title y=66 `SemiBold 15/auto #4E3A5E`.
- **Section label**: `Urbanist Bold 12/auto #8E7FA6`, x=24, 24px above its card.
- **Settings group card**: `#FFFFFF` r24, width 327, gap between label+card blocks 28.
- **Settings row** (`SettingsRow`):
  - Single line, 60h: optional icon bubble 16,12 36x36 `#F1ECF5` r18 with Icon/Line 20 (`#6B5279`); title at x=64 (or x=20 with no icon), y=20, `Medium 15/auto #241A2E`; value right-aligned to x=285 `Regular 13/auto #736B66`; chevron-right 18 at 293,21.
  - Two line, 76h: bubble at 16,20; title y=14; subtitle y=36, width 190, `Regular 12/16 #736B66`, wraps to 2 lines.
  - Trailing Toggle (foundations) at 265,16 (60h) or 265,24 (76h). Toggle off colour here is `#E1DAE6` (see blockers).
  - Divider 1px `#EFEAF2` at the row bottom, inset to x=64 (with icon) or x=20 (without), right inset 16.
  - Destructive variant: bubble `#FBEDEE`, icon and title `#B4505A`.
- **Large title** (P2, P10): 24,116 `SemiBold 28/auto #241A2E`.
- **Hero aura**: concentric contour SVGs with a gold glow and radial "inner light" (P1, P3, P11, P13, P14). Contours are static SVG exports; the inner light is an SVG radial gradient.
- **Search field** (P8, P10): 327x48 `#FFFFFF` stroke `#E6E0EA`/1 r24; search icon 18 at 16,15 stroke `#8E7FA6`/1.5; placeholder 44,14 `Regular 14/auto #A6A09B`.
- **Field** (P3, P14): label `Bold 12 #8E7FA6`, field 327x52 `#FFFFFF` stroke `#E6E0EA`/1 r16, text 16,16 `Regular 15/auto #241A2E`; focused stroke `#6B5279`/1.5. Radius is 16 here but 26 in the profile-setup flow; foundations must pick one.

### P1 — Profile (`6719:4387`, 375x909, tab screen)

| Element | Spec |
|---|---|
| Glows | `Glow(-70,-50,300,#D8B4D8@0.25,90)`, `Glow(190,60,240,#E2CC40@0.18,90)`, avatar glow `Glow(127,110,120,#E2CC40@0.28,40)` |
| Header | "Profile" (no back button, tab root) |
| Settings button | 307,54 44x44 `#FFFFFF@0.70` stroke `#E6E0EA`/1 r22 with a "sliders" icon 20 (drawn ad hoc, not in the icon set) → P2 |
| Aura `6719:4415` | 63.5,46 248x248; 4 contours 117.4/148.2/176.6/201.6, stroke `#6B5279` @0.26/0.20/0.14/0.08 1px |
| Avatar | 139.5,122 96x96 circle, linear gradient `#D8B4D8` → `#6B5279`; initial "M" `Regular 34/auto #FFFFFF` centred. If a photo exists, show it clipped to the circle |
| Edit badge | 209,190 30x30 `#FFFFFF` stroke `#E6E0EA`/1 r15, Icon/Line note 16 (should be a pencil/edit icon) → P3 |
| Name | y=244 "Matthew Hill" `SemiBold 24/auto #241A2E` centred; y=281 "With Inner Glow since Oct 2026" `Regular 13/auto #736B66` |
| Plan pill | 119.5,317 hug 86x26 `#F1ECF5` r999 pad 6/12 gap 6; dot 6 `#8E7FA6`; "Free plan" `SemiBold 12/auto #6B5279`. "Try Pro" 217.5,322 `SemiBold 12/auto #B39A1E` → paywall. Pro users: pill "Pro" and no "Try Pro" |
| Stats card | 24,355 327x84 `#FFFFFF` r24; three 109w columns; value y=16 `Regular 26/auto #241A2E`; label y=50 `Regular 12/auto #736B66`; dividers 1x40 `#EFEAF2` at x=109 and 218, y=22. "12" day streak, "48" check-ins, "320" mindful min |
| Inner glow card | 24,451 159x150 `#FFFFFF` r24; `Glow(30,40,100,#E2CC40@0.30,30)`; "Inner glow" 16,16 `Bold 12 #8E7FA6`; ring 45.5,40 68x68 (track stroke 4 `#6B5279@0.12`, progress `#6B5279` from 12 o'clock clockwise, 72% = 259.2°, thickness 3.4 — use stroke 4, radius 32); "72" centred y=58 `Regular 26/auto #241A2E`; "+4 this week" 16,122 `Regular 12/auto #6B5279` |
| Mood card | 192,451 159x150 `#FFFFFF` r24; "Mood this week" `Bold 12 #8E7FA6`; "Mostly calm" 16,38 `SemiBold 18/auto #241A2E`; 7 bars 10w r5 bottom-aligned at y=124, x = 16 + 18.5·i, heights 30,42,24,48,45,54,51 (max ≈ 54 → scale to the mood range), gradient `#E2CC40` (top) → `#8E7FA6@0.60` (bottom); day letters y=128 `Regular 10/auto #A6A09B` |
| Menu card | 24,613 327x180, rows: My plan (crown, value "Free") → P9; Settings (sliders) → P2; Help Center (chat) → P10 |
| Tab bar | y=817 Active=Profile |

Gaps vs code (`app/(tabs)/profile/index.tsx`): code shows email in the header (`:126-128`), a hero card with goal and routine (`:149-193`), a settings list including Community, Notifications, Manage categories, Help, Language modal and 2FA (`:41-90`, `:195-280`), a support list with hard-coded English labels (`:283-286`), sign out (`:318-340`) and a version footer with emoji (`:342-348`). All of these move: settings rows to P2, sign out to P2 Account, version to P2 footer. Community and Manage categories have no slot in the design (see blockers). `app/(tabs)/profile/overview.tsx` (score snapshot) is superseded by the stats and cards here.

### P2 — Settings (`6719:4516`, 375x1318)

Shell glow 1 only. Large title "Settings". Groups (label y / card y):

| Group | Rows (icon, value) → target |
|---|---|
| General (178/202) | Personal information (user) → P3 · Notifications (bell, "On") → P4 · Language (globe, ad hoc, "English") → P8 · Appearance (eye, "Light") → no design |
| Your plan (470/494) | Plan card 327x96 `#FFFFFF` r24 with `Glow(200,-40,160,#E2CC40@0.30,50)` and `Glow(240,20,100,#D8B4D8@0.30,40)` inside; "Free plan" 20,18 `SemiBold 17/auto #241A2E`; "3 Glow AI chats a day\nCore practices" 20,42 `Regular 13/auto #736B66`; button 227,30 84x36 `#6B5279` r18 "See plans" `SemiBold 13/auto #FFFFFF` → paywall (01-onboarding-auth.md) |
| Privacy & security (618/642) | Security (lock, "Face ID") → P5 · Glow AI & your data (bot) → P6 · Connected apps (health, "1") → P7 |
| Support (850/874) | Help Center (chat) → P10 · Send feedback (star) → P12 · Terms, privacy & disclaimer (note) → `app/(utils)/legal.tsx` |
| Account (1082/1106) | Log out (logout icon, ad hoc, no chevron) → confirm then `supabase.auth.signOut` · Delete account (destructive, trash icon ad hoc) → P14 |
| Footer | y=1238 "Inner Glow 1.0.0" `Regular 12/auto #A6A09B` centred, from `expo-application` / `Constants.expoConfig.version` |

Gaps: route does not exist (`app/(legacy)/settings.tsx` redirects to `profile/categories`, and `settingsPage.*` keys in `i18n/locales/en/translation.ts:1054` describe section visibility, not settings). Appearance has no backing; the app follows the OS via `hooks/use-color-scheme.ts` (re-export of RN `useColorScheme`). The values "On", "Face ID", "1" must be computed (notification permission, app-lock state, connected count).

### P3 — Personal information (`6719:4677`, 375x1001)

Shell glows `#D8B4D8@0.22` and `#7FC6F1@0.15`. Aura `6719:4698` 93.5,78 188x188 (3 contours 97.6/124.2/148.6 @0.22/0.16/0.10). Avatar 145.5,130 84x84 gradient as P1, "M" `Regular 30`. "Change photo" y=228 `SemiBold 14/auto #6B5279` centred.

Fields (label y / field y): Full name "Matthew Hill" (273/297) · What should we call you? "Matt" (369/393, shown focused) · Email "matthew@email.com" (465/489) · Date of birth "14 March 1992" with a trailing icon 18 at 293,17 (uses `note`; should be calendar) (561/585) · Country "Cyprus" with chevron-down (657/681). Then label 753 "What you’d like help with" and multi-select chips from y=777, wrap, gap 8: Less stress (selected), Better sleep (selected), Steadier mood / Focus, Self-kindness (selected). CTA 24,887 primary "Save changes".

Gaps vs code (`app/(tabs)/profile/edit.tsx`, `hooks/useProfile.ts:23-125`): code edits name, primary goal (single choice) and check-in routine (`:167-200`). `profiles` has `name`, `intention`, `routine`, `selected_issues` only. Missing: nickname, date of birth, country, avatar. Email change needs a Supabase `auth.updateUser({ email })` flow with confirmation. The help-with chips map best to `selected_issues` (multi) — the option set must match `lib/profile-choices.ts`. Routine is not in the design (it moves to P4 Mood check-in time).

### P4 — Notifications (`6720:4507`, 375x1162)

Second glow `Glow(220,40,200,#E2CC40@0.15,90)`. Title 24,116 300w "Gentle nudges, only when they help." `SemiBold 24/30 #241A2E`.

| Group (label/card) | Rows (two-line 76h, icon, subtitle, toggle state in mock) |
|---|---|
| Reminders (204/228, 327x304) | Mood check-in (heart) "Every day at 20:00" on · Mindful moment (meditate) "Every day at 08:30" on · Wind down (moon) "30 min before bedtime" on · Journal prompt (journal) "Sundays" off |
| From Glow AI (560/584, 327x152) | Weekly insights (sparkle) "A short summary of your week" on · Pattern alerts (chart) "When something changes in your mood or sleep" off |
| Quiet hours (764/788, 327x128) | "Pause all notifications" 20,18 `Medium 15` + toggle 261,14; From/To tiles 20,58 and 167,58, each 140x52 `#F1ECF5` r16; label 14,8 `Bold 11/auto #8E7FA6`; time 14,24 `SemiBold 17/auto #6B5279` ("22:30", "07:30"); tap opens time picker |
| Delivery (944/968, 327x120) | Sound (bell) on · Vibration (activity) off (single-line 60h rows with toggles) |

Tapping a reminder row (not the toggle) should open a time picker; the design does not show this (see blockers).

Gaps: reminder keys exist in `lib/notifications.ts` (`daily_checkin`, `journal_reminder`, `sleep_winddown`, `mindful_breaks`, `stress_alert`, `weekly_summary`) with on/off stored locally (`loadReminderPreferences`/`setReminderEnabled`), and the UI is in `app/(tabs)/notifications/index.tsx`. Missing: per-reminder times, "Pattern alerts" (no trigger exists; `stress_alert` is the nearest), quiet hours, sound and vibration preferences. Wind down here must share state with S2's toggle.

### P5 — Security (`6720:4617`, 375x821)

Second glow `#7FC6F1@0.15` at 200,60. `Glow(127,96,120,#E2CC40@0.28,40)`. Shield art `6720:4639` 87.5,96 200x140 (3 nested shield outlines `#6B5279` @0.90/1.5, @0.35/1, @0.15/1; gold sparkle 28 `#F2D96A`; halo 48 `#E2CC40@0.25`) — static SVG. "Your space stays yours" y=260 `SemiBold 22/auto #241A2E` centred; "Lock the app and keep your account safe." y=294 `Regular 14/auto #736B66`.

App lock (339/363): Face ID (lock) "Ask for Face ID when the app opens" on · Hide previews (eye) "Notifications won’t show what you wrote" on. Account (543/567, rows without icons): Change password → existing reset flow · Two-step verification "Off" → `app/(auth)/two-factor-setup.tsx` · Active sessions "2 devices" → no design.

Gaps: `expo-local-authentication` is not installed; no app-lock gate exists. "Face ID" label must become "Touch ID"/"Biometrics" by device type (Android has no Face ID). Hide previews has no implementation (needs generic notification bodies). Active sessions has no backend (Supabase does not list sessions to clients; would need an edge function with the admin API). Change password for signed-in users needs a new screen (only forgot/reset exist).

### P6 — Glow AI & your data (`6720:4692`, 375x912)

Second glow `#7FC6F1@0.18`. Hero: `Glow(127,100,120,#D8B4D8@0.35,36)`, `Glow(157,120,80,#E2CC40@0.35,24)`, orb 159.5,132 56x56 radial `#FFF6D6`→`#6B5279`, Icon/Line sparkle 22 centred on it. Title 40,212 295w "You decide what Glow AI remembers" `SemiBold 22/28` centred; body 40,276 295w "Your chats are private. We never sell your data or use it for ads." `Regular 14/20 #736B66` centred.

Personalisation (344/368, rows without icons): Remember past chats "Glow AI uses past chats to give better support" on · Use mood & sleep data "Helps Glow AI notice patterns" on · Use journal entries "Off by default — your journal stays just yours" off. Your data (624/648): Download my data (note icon; should be download) → export · Clear chat history (chat) → confirm, then `useChat().clearHistory` (`hooks/useChat.ts:108`). Legal notes at y=788 "Glow AI is not a doctor or therapist and can’t diagnose or treat. In an emergency, contact local emergency services." and y=826 "Read how we handle your data in the Privacy policy." ("Privacy policy" should be a link).

Gaps vs code (`app/(utils)/ai-privacy.tsx`, `lib/ai-privacy.ts:9-16`): a single allow/deny AI permission exists. The three granular toggles need storage and must be honoured by `supabase/functions/chat` (which context it loads). There is no data export endpoint.

### P7 — Connected apps (`6720:4774`, 375x812)

Second glow `#E2CC40@0.15`. Title 24,116 310w "Bring in data that helps you understand yourself." `SemiBold 22/28`. 2x2 tiles 160x164 `#FFFFFF` r24 at (24,196), (191,196), (24,372), (191,372): icon bubble 16,16 44x44 `#F1ECF5` r22 with icon 22; name 16,72 `SemiBold 15/auto #241A2E`; detail 16,94 `Regular 12/auto #736B66`; button 16,118 h30 r15. Connected state: card stroke `#6B5279`/1.5, `Glow(60,-30,120,#E2CC40@0.25,40)`, button 96w `#F1ECF5` "Connected" `SemiBold 12 #6B5279`. Not connected: button 80w `#6B5279` "Connect" `SemiBold 12 #FFFFFF`. Tiles: Apple Health "Sleep, steps, heart rate" (connected) · Smart watch "Sleep & heart rate" · Sleep tracker "Sleep stages" · Calendar "Notice busy days" (uses note icon; should be calendar). Legal note y=556 "You can disconnect any app at any time. Inner Glow only reads the data you choose."

Gaps: nothing exists. No HealthKit / Health Connect library, no calendar library. "Smart watch" and "Sleep tracker" are not concrete integrations (on iOS both arrive via Apple Health). Recommend shipping Apple Health (iOS) and Health Connect (Android) only, and hiding the other tiles until defined.

### P8 — Language (`6720:4839`, 375x910)

Search field 24,112 "Search languages". Current (188/212): single row 327x60 `#F1ECF5` stroke `#6B5279`/1.5 r24, "English (UK)" `Medium 15`, radio on (22 `#6B5279` with 8 `#FFFFFF` dot) at 289,19. All languages (300/324, 327x440): English (US) (60h) · Greek "Beta" · Russian "Beta" · Deutsch "German" · Français "French" · Español "Spanish" (76h rows, subtitle `Regular 12/16 #736B66`); radio off 22 stroke `#CFC6D6`/1.5. CTA 24,796 primary "Save".

Gaps vs code: languages are `en` and `el` only (`i18n/index.ts:10-13`, locales folder has `en`, `el`). The current modal applies on tap (`profile/index.tsx:370-410`); design uses select + Save. Render the list from `SUPPORTED_LANGUAGES`; do not ship languages without a locale.

### P9 — My plan (`6722:4679`, 375x888)

Glows `#D8B4D8@0.25` and `#E2CC40@0.20`.

- Current plan card 24,112 327x176 `#FFFFFF` r28 with `Glow(190,-50,180,#D8B4D8@0.30,50)`: "Current plan" 20,20 `Bold 12 #8E7FA6`; "Free" 20,40 `SemiBold 26/auto #241A2E`; "Glow AI chats today" 20,90 `Regular 13 #736B66`; "2 of 3" right-aligned to 307 `SemiBold 13 #6B5279`; track 20,116 287x6 `#EFEAF2` r3; fill (used/limit × 287) gradient `#E2CC40`→`#8E7FA6` r3; "Resets at midnight" 20,138 `Regular 12 #A6A09B`.
- Pro card 24,300 327x340 `#FFFFFF` stroke `#6B5279`/1.5 r28, glows `Glow(180,-60,200,#E2CC40@0.30,60)` and `Glow(230,10,120,#FFB3BE@0.22,40)`; PRO badge 20,20 52x24 `#6B5279` r12 "PRO" `Bold 12 #FFFFFF`; "Glow a little brighter" 20,58 `SemiBold 22`; four benefit rows at y=104/140/176/212 (check bubble 24 `#F1ECF5` r12 with check 14; text x=54 `Regular 14/auto #4E3A5E`): "Unlimited Glow AI conversations", "Full sleep & mood insights", "All practices and soundscapes", "Weekly reflection from Glow AI"; price 20,262 "From €4.99 / month, billed yearly" `Regular 13 #736B66`; button 20,284 287x40 `#6B5279` r20 "See Pro plans" `SemiBold 14 #FFFFFF` → paywall.
- Group 24,652 327x120: Restore purchases → `lib/revenuecat.ts:141` · Manage subscription "App Store" → `lib/billing-management.ts:4`.
- Legal note y=792 "Subscriptions renew automatically. Cancel any time in your App Store settings."
- Pro users: hide the Pro card and show plan name, renewal date and "Manage subscription".

Gaps: no daily chat limit exists anywhere (not in `supabase/functions/chat/index.ts`, not in `hooks/useSubscription.ts`), so "2 of 3 … Resets at midnight" has no source. The price must come from RevenueCat offerings (`lib/purchase-products.ts`), not be hard-coded. "App Store" must read "Google Play" on Android.

### P10 — Help Center (`6722:4755`, 375x1026)

Second glow `#7FC6F1@0.15`. Large title "How can we help?". Search 24,174 "Search questions". Tabs 24,234 327x44 (SegmentedControl, r22, active pill 158x36 r18, labels 14: active `SemiBold #6B5279`, inactive `Medium #736B66`): FAQ / Contact us (Contact us = P11).

Filter chips y=294, h30–32, pad 7/14, gap 8, horizontally scrollable (row runs to x=370): "All" active (fill `#6B5279`, text `Medium 13 #FFFFFF`), Glow AI, Privacy, Plans, Sleep (default chip). Note that this active chip style (solid fill) differs from every other selected chip in the area (tint + outline).

FAQ accordion: open item 24,350 327x176 `#FFFFFF` stroke `#6B5279`/1.5 r24 with `Glow(220,-40,140,#E2CC40@0.22,40)`; question 20,18 `SemiBold 15/auto #241A2E`; chevron-up 18 at 289,19; answer 20,50 287w `Regular 14/20 #4E3A5E`. Closed items 327x58 `#FFFFFF` r20, gap 12, question 20,19 `Medium 14/auto #241A2E`, chevron-down at 289,20. Content: "Is Glow AI a therapist?" / "No. Glow AI is a supportive companion that helps you reflect and notice patterns. It can’t diagnose or treat, and it isn’t a replacement for a doctor, therapist or emergency help."; then "How is my Inner glow score calculated?", "Who can see my journal and chats?", "How do I cancel Pro?", "Can I use Inner Glow offline?", "How do I change my reminders?" (answers not designed).

"Still need help" card 24,888 327x64 `#F1ECF5` r20: "Still need help?" `SemiBold 15`; "Write to our team" `Regular 13 #736B66`; chevron → P11.

Gaps: `app/(utils)/help-center.tsx` is a 38-line page with three links. FAQ content, categories and search do not exist; answers for five questions need copy.

### P11 — Contact us (`6722:4837`, 375x927)

Same header "Help Center"; tabs at y=112 with Contact us active (no large title or search on this tab). Hero: `Glow(117,176,140,#E2CC40@0.28,44)`, `Glow(77,196,120,#D8B4D8@0.25,44)`, Aura `6722:4863` 91.5,152 192x192 (4 contours 62.4/92.4/120.6/145.8 @0.26/0.20/0.14/0.08), inner light 161.5,222 52x52 radial as S5. "We’re here to help" y=340 `SemiBold 24/auto` centred; 48,377 279w "Real people read every message. We usually reply within a day." `Regular 14/20 #736B66` centred.

Group 24,441 327x228 (76h rows, chevrons at 293,29): Message our team (chat) "Replies in the app, usually same day" · Email us (mail, ad hoc) "support@innerglow.app" → `mailto:` · Report a problem (activity) "Something not working as it should".

Urgent card 24,681 327x132 `#FFFFFF` stroke `#FFB3BE`/1.5 r24, `Glow(230,-40,140,#FFB3BE@0.25,40)`; "Need help right now?" 20,18 `SemiBold 16`; 20,42 287w "Our team can’t respond to emergencies. If you’re not safe, please reach out now." `Regular 13/18 #736B66`; button 20,84 150x32 `#F1ECF5` stroke `#6B5279`/1 r16 "Get support now" `SemiBold 13 #6B5279` → `app/(utils)/resources.tsx`. Legal note y=833 "Inner Glow is a wellbeing app, not a medical service."

Gaps vs code (`app/(utils)/support.tsx`, `supabase/migrations/20261016_support_requests.sql`): a one-shot email+message form exists (message must be 20–5000 chars). "Replies in the app" implies a conversation thread with staff replies, which does not exist (no reply table, no inbox). Proposed: "Message our team" opens the existing form for now and the subtitle says "We reply by email". "Report a problem" can reuse the same form with a category plus `client-diagnostics`. `resources.tsx` is US-centric (988); it should be locale-aware.

### P12 — Send feedback (`6723:4733`, 375x867)

Second glow `#E2CC40@0.15`. Title 24,116 300w "How is Inner Glow feeling for you?" `SemiBold 24/30`.

Rating: five 59x59 circles at x=24, 91, 158, 225, 292, y=200, `#FFFFFF` stroke `#E6E0EA`/1. Each holds a centred orb that grows with the score: 12, 19, 26, 33, 40 px, radial `#FFF6D6` → `#D8B4D8` at opacity 0.50/0.60/0.70/–/0.90 (the fourth is shown selected in the mock; use 0.80 for its unselected state). Selected: circle `#F1ECF5` stroke `#6B5279`/1.5, orb radial `#FFF6D6` → `#F2D96A` with shadow 0,0,12 `#E2CC40@0.50`. End labels y=271 "Not great" (left, x=24) and "Lovely" (right-aligned to 351), `Regular 12 #736B66`.

"What could be better?" y=313, chips (multi): Glow AI (selected), Practices, Sleep, Journal / Design, Speed (selected), Something broke / Other. "Tell us more" y=485; text area 24,509 327x140 `#FFFFFF` stroke `#6B5279`/1.5 (focused) r20, text 16,16 `Regular 15/21 #241A2E`, counter "58 / 500" right-aligned at y=112 `Regular 11 #A6A09B`. Row 24,661 327x60 `#FFFFFF` r20 "Include device info" + toggle. CTA 24,753 primary "Send feedback" → P13.

Gaps: no feedback screen, table or function. `support_requests` requires an email and 20+ characters, so it does not fit. See §6.

### P13 — Feedback sent (`6723:4798`, 375x812)

No back button, no header. `Glow(57,170,260,#E2CC40@0.28,80)`, `Glow(107,220,160,#D8B4D8@0.30,50)`, Aura `6723:4816` 43.5,156 288x288 (5 contours 89.8/128.2/164.6/197.6/228.6 @0.26/0.20/0.14/0.08/0.04), inner light 147.5,260 80x80. "Thank you, Matt" y=450 `SemiBold 28/auto` centred (nickname); 48,492 279w "Your note went straight to our team. It really does shape what we build next." `Regular 15/22 #736B66` centred. CTA 24,698 primary "Back to Settings" → pop to P2.

### P14 — Delete account (`6723:4831`, 375x1005)

Glows `Glow(-70,-50,280,#FFB3BE@0.18,90)`, `Glow(200,40,220,#D8B4D8@0.20,90)`. Aura `6723:4852` 101.5,90 172x172, 3 contours in `#B4505A` @0.22/0.16/0.10; inner light 159.5,148 56x56 radial `#FFF6D6` → `#FFB3BE@0.90` 0.6 → `#FFB3BE@0` 1.0. "Before you go" y=250 `SemiBold 26/auto` centred; 40,289 295w "Deleting your account is permanent. This will remove:" `Regular 14/20 #736B66` centred.

Card 24,349 327x212 `#FFFFFF` r24, four rows 48 apart from y=16: bubble 36 `#FBEDEE` r18 with icon 20 (heart, journal, chat, moon); text x=64 `Medium 14/auto #241A2E`: "Mood check-ins and score history", "Every journal entry", "Your Glow AI conversations", "Sleep and mindful data". Alternative card 24,573 327x76 `#F1ECF5` r20: "Want a copy first?" `SemiBold 15`; "Download my data" `SemiBold 13 #6B5279`; chevron → data export. "Type DELETE to confirm" 24,669; field 24,693 (P3 field style). Destructive button 24,777 327x56 `#B4505A` r999 "Delete my account" `SemiBold 16/auto #FFFFFF` (disabled until the field equals the localised confirm word). Text button 24,845 327x48 "Keep my account" `SemiBold 15/auto #6B5279` → back. Legal note y=909 "If you have Pro, cancel it in App Store settings — deleting the account doesn’t stop billing."

Gaps vs code (`app/(utils)/delete-account.tsx`): the `delete-account` function and the "DELETE" confirmation already exist (`:34`), as does the App Store subscriptions link (`:82`). Restyle only, plus the data export dependency. The confirm word must stay "DELETE" for the server check, so the label should say so in every language.

---

## 4. Charts and generative art — geometry and build decision

Decision rule: anything driven by user data is drawn live with `react-native-svg` from data. Decorative art that never changes is exported once as a static SVG and rendered with `SvgXml` (no `react-native-svg-transformer` is installed, so ship SVG strings in `.ts` files or install the transformer in the foundations task). Glows stay in Skia.

### 4.1 Star field — static data, live render (S1, S3, S4, S7)

Four frames: `6712:4208` (375x380, 26 stars), `6712:4405` (375x540, 30), `6712:4503` (375x740, 35), `6716:4413` (375x372, 35). Every star is a white dot: either 1.6px or 2.8px diameter, fill opacity between 0.20 and 0.69. The opacity sequences of the four frames match from the first star onward, so they appear to be one field cropped to different heights (confirm positions after export).

Build: export `6712:4503` (the largest) once, extract each star's `cx, cy, r, opacity` into a `STARS` array, and render `<StarField height={…} />` with `react-native-svg` `<Circle>`s clipped to the given height. Optional twinkle: animate 6–8 random stars' opacity between 0.2 and 0.7 over 3–5 s with Reanimated (installed). Live render (not a static file) because of the crop heights and the optional twinkle.

### 4.2 24-hour sleep-window dial with handles — live SVG (S2)

- Centre (187.5, 310). Track: full ring, outer radius 104, inner radius 89.44 (Figma innerRadius 0.86), so ring width 14.56 and centreline radius 96.7. Fill `#6B5279@0.10`.
- Angle convention: 00:00 at 12 o'clock, clockwise, 15° per hour (0.25° per minute). In Figma the window arc runs from 255° to 375° measured clockwise from 3 o'clock, which is 23:00 → 07:00.
- Window: ring segment from bedtime angle to wake angle (wrap across midnight), same radii, filled with an angular gradient `#8E7FA6` at the bedtime end → `#E2CC40` at the wake end. `react-native-svg` has no conic gradient, so draw the window as segments of 2° each, each filled with the colour interpolated along the sweep (or as a stroked path with `strokeWidth=14.56` split into segments). Round caps are not used in Figma (flat ends).
- Handles: 30x30 circles `#FFFFFF`, centred on the centreline (r 96.7) at each end. Bedtime handle stroke `#6B5279`/2 with Icon/Line moon 16; wake handle stroke `#C9A92A`/2 with Icon/Line star 16. Check: 23:00 → (162.5, 216.6) and 07:00 → (280.9, 335.0), which match the Figma nodes.
- Interaction: drag each handle along the ring with `react-native-gesture-handler` (installed); convert the touch angle to minutes, snap to 5 minutes, haptic tick each hour (`expo-haptics`). Dragging inside the band moves both handles together. Centre label = wake − bed (wrapped) as "8h 00m". Minimum window 3h, maximum 12h (propose).
- Glow behind: `Glow(62.5,185,250,#D8B4D8@0.40,50)`.
- No hour ticks or numerals are drawn in the design.

### 4.3 Moon quality scale — live SVG (S6)

Five buttons on an arc. Centres: 1 (57.5,330), 2 (95.6,261.1), 3 (187.5,232.5), 4 (279.4,261.1) selected, 5 (317.5,330). Unselected: 36x36 `#FFFFFF` stroke `#E6E0EA`/1; crescent = base circle 21.6 at (7.2,7.2) in `#8E7FA6` at opacity 0.35/0.45/0.55/–/0.75 minus a cutter circle 21.6 offset at y=4.3 and x = 11.5/15.8/20.2/–/28.8 (the moon fills as the score rises). Selected: 56x56 `#FFF6D6` stroke `#6B5279`/1.5, base 33.6 `#F2D96A`, cutter 33.6 at (38.1,6.7).

The Figma cutter is a circle painted in the background colour. Build it with an SVG `<Mask>` so the crescent is a true cut-out. The selected state is drawn at the position of the tapped moon: the button grows from 36 to 56 around the same centre (animate 200 ms). The five centres are symmetric about x=187.5, so the selected moon in the mock sits on the same arc.

### 4.4 "This week" bar chart — live SVG (S1)

Inside card 327x180: 7 bars, 28 wide, x = 24 + 42·i, track 28x96 `#F5F1F7` r14 from y=52 to 148, value bar bottom-aligned at y=148, height = min(hours, 9) / 9 × 96 (derived from the mock: average bar 74.8px ↔ 7h05), r14, linear gradient `#8E7FA6` (top) → `#D8B4D8` (bottom). Day letters y=154 28w centred `Medium 11/140% #A6A09B`. Days without data show the track only. Week starts Monday per design; follow locale.

### 4.5 Sleep stage hypnogram — live SVG (S7)

Frame 24,236 327x112. Four levels at frame y = 24 (Awake), 48 (REM), 72 (Light), 96 (Deep). x maps time linearly from sleep start (x=0) to end (x=327). The curve is a smooth step: for each transition from (x0,y0) to (x1,y1) use `C (x0+x1)/2,y0 (x0+x1)/2,y1 x1,y1`. Line stroke `#E2CC40@0.80` width 1.5, no fill. Area: same path closed down to y=112, filled with a vertical linear gradient `#D8B4D8@0.55` (top) → `#7FC6F1@0.05` (bottom). Figma path for reference (relative to frame, y offset 24): `M0 24 C15 24 15 48 30 48 C45 48 45 72 60 72 C72.5 72 72.5 48 85 48 C97.5 48 97.5 24 110 24 C125 24 125 0 140 0 C152.5 0 152.5 48 165 48 C180 48 180 72 195 72 C207.5 72 207.5 48 220 48 C235 48 235 0 250 0 C262.5 0 262.5 24 275 24 C287.5 24 287.5 48 300 48 C313.5 48 313.5 24 327 24`.

The mock is a smooth wave with every segment the same width, so it is illustrative only. With real data, hold each stage flat for its duration and use a fixed-width transition (e.g. 6px) between stages. Axis labels must be positioned by their real time on the same linear scale; the mock spaces 23:00, 02:00, 04:00, 07:00 evenly even though the gaps are 3h, 2h and 3h.

### 4.6 Weekly trend line vs goal — live SVG (S8)

Frame 24,256 327x150. Points at frame x = 12 + 50·i (i = 0..6). Y scale: 8h goal at y=32 and 5h at y=150, so 39.33 px per hour and y = 150 − (hours − 5) × 39.33, clamped to [0,150]. (Check: the mock points give an average of 7h20, close to the shown 7h24.) Goal line: dashed 4/4, `#8E7FA6@0.30`, 1px, full width at y = scale(goal). Line: polyline (straight segments, not curved) width 2.5, horizontal linear gradient `#8E7FA6` → `#E2CC40`. Area under the line to y=150: vertical gradient `#D8B4D8@0.45` → `#D8B4D8@0`. Points: 6px `#FFFFFF` stroke `#6B5279`/1.5; the latest or selected point is 10px filled `#6B5279`. Missing nights break the line. "Goal 8h" label at 300,262 follows the goal line.

### 4.7 Profile ring and mood bars — live SVG (P1)

Inner glow ring: see P1 (radius 32, stroke 4, start at 12 o'clock, clockwise, `strokeDasharray`). Mood bars: see P1. Both from data.

### 4.8 Static SVG art (export once)

Wake-up aura `6717:4390`, Profile aura `6719:4415`, Personal info aura `6719:4698`, Contact aura `6722:4863`, Feedback-sent aura `6723:4816`, Delete aura `6723:4852`, Moon `6712:4235`, Security shield `6720:4639`. Radial "inner light" and orb fills are simple enough to write as `<RadialGradient>` in code rather than export.

---

## 5. Asset table

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| `6712:4208` / `6712:4405` / `6712:4503` / `6716:4413` | Stars | S1, S3, S4, S7 | SVG (data) | 375x380/540/740/372 | Export `6712:4503`, convert to `STARS` array; live `<StarField>` with optional twinkle (§4.1) |
| `6712:4235` (`6712:4540`) | Moon | S1 (72), S4 (96) | SVG | 72x72, 96x96 | One crescent path `#F3E9F3`, scale by prop |
| `6712:4357`, `6712:4358`, `6712:4359`, `6712:4362` | 24h dial, window, handles | S2 | SVG (live) | 208x208 | Build from §4.2; no export |
| `6717:4390` | Aura (5 contours) | S5 | SVG | 375x560 frame, art ≈ 328x328 | Static; optional breathing animation |
| `6717:4396` | Inner light | S5 | SVG gradient | 72x72 | RadialGradient `#FFF6D6`→`#F2D96A@0.9`→0 |
| `6716:4369`–`6716:4383` | Moon scale | S6 | SVG (live) | 36/56 | Mask-based crescents (§4.3) |
| `6716:4471` | Sleep stages chart | S7 | SVG (live) | 327x112 | §4.5 |
| `6716:4497`, `6716:4575`, `6720:4715` | Glow AI orb | S7, S8, P6 | SVG gradient | 28 / 24 / 56 | RadialGradient `#FFF6D6`→`#6B5279`; shared `<GlowOrb size>` |
| `6712:4272` | This-week bars | S1 | SVG (live) | 327x180 | §4.4 |
| `6716:4537` | Trend chart | S8 | SVG (live) | 327x150 | §4.6 |
| `6719:4415` | Profile aura | P1 | SVG | 248x248 | Static |
| `6719:4421` | Avatar | P1, P3 | SVG gradient / Raster | 96, 84 | Gradient initial circle; user photo is raster (remote URL) when present |
| `6719:4445`/`6719:4446` | Inner glow ring | P1 | SVG (live) | 68x68 | 72% arc |
| `6719:4452`–`6719:4458` | Mood bars | P1 | SVG (live) | 10w | Gradient `#E2CC40`→`#8E7FA6@0.6` |
| `6719:4698` | Aura (3) | P3 | SVG | 188x188 | Static |
| `6720:4639` | Shield | P5 | SVG | 200x140 | Static |
| `6722:4863` + `6722:4868` | Aura + inner light | P11 | SVG | 192x192 / 52 | Static aura; light in code |
| `6723:4755`–`6723:4764` | Rating orbs | P12 | SVG gradient | 59 cells, orbs 12–40 | Code; selected gets shadow |
| `6723:4816` + `6723:4822` | Aura (5) + light | P13 | SVG | 288x288 / 80 | Static aura |
| `6723:4852` + `6723:4856` | Red aura + light | P14 | SVG | 172x172 / 56 | Static aura `#B4505A` |
| Glows (all screens) | Glow | all | Glow (Skia) | various | As listed per screen: colour, opacity, size, position, blur |
| — | Icon/Line: star, bell, moon, check, music, leaf, note, crown, chat, user, eye, lock, bot, health, heart, meditate, journal, sparkle, chart, activity, home, user | all | Icon | 14–22 | Main ids: star `6598:1801`, bell `6609:2484`, moon `6598:1792`, check `6598:1837`, music `6598:1856`, leaf `6598:1785`, note `6609:2494`, crown `6598:1844`, chat `6598:1798`, user `6604:2067`, eye `6598:1810`, lock `6598:1841`, bot `6598:1806`, health `6598:1825`, heart `6598:1781`, meditate `6598:1789`, journal `6598:1795`, sparkle `6598:1814`, chart `6598:1859`, activity `6598:1817` |
| — | Icon/Arrow: back, forward, chevron-right/up/down | all | Icon | 16–22 | `6589:1632`, `6589:1637`, `6589:1657`, `6589:1662`, `6589:1667` |
| `6719:4407`, `6719:4561`, `6719:4657`, `6719:4665`, `6720:4860`, `6722:4884` | Ad-hoc icons: sliders, globe, log-out, delete, search, mail | P1, P2, P8, P10, P11 | Icon (missing) | 18–20 | Drawn inline, not in the icon set. Foundations must add `settings`/`sliders`, `globe`, `logout`, `trash`, `search`, `mail`, plus `calendar`, `download`, `edit` (currently substituted by `note`) |

No raster images are used in this area except a user-uploaded avatar.

---

## 6. Backend and data gaps

Sleep:
1. **Schedule storage.** `SleepScheduleState` lives only in AsyncStorage (`hooks/useSleep.ts:43-98`). It is lost on reinstall and invisible to Glow AI and insights. Add `sleep_schedules` (user_id PK, bed_minute, wake_minute, days smallint[], wind_down_enabled, wind_down_offset_min default 30, alarm_enabled, sound_key, stop_after_min, updated_at) and keep AsyncStorage as cache.
2. **Wind-down reminder** is scheduled locally with a fixed 30 min (`lib/notifications.ts:7`, `:110-177`) and is separate from the `sleep_winddown` reminder preference (`lib/notifications.ts` reminder map). These are two systems for one setting; merge them.
3. **Wind-down activity + stop timer.** No model for the chosen activity, and `lib/soundscape.ts` has no stop-after timer or fade-out. Add `stopAfter(minutes)` with a 30 s fade. Sound must keep playing with the screen locked (needs `expo-audio` background audio mode in app config).
4. **Sleep mode, swipe to wake, alarm, snooze.** Sleep mode is local state (`sleepModeStartISO`). The ringing alarm is a native module that works only on iOS 26+ (`lib/alarms.ts:16-35`); Android and older iOS have no alarm. Notification snooze bursts were retired (`lib/alarms.ts:34`). "Snooze 9 min" needs either a native snooze call or a one-off local notification at +9 min. Wake detection exists (`lib/wakeDetection.ts`, `hooks/useSleepDetection.ts`) and should open S5.
5. **Sleep log factors.** `sleep` has `start_iso, end_iso, quality, awakenings, duration, notes` only. Add `factors text[]` (keys: caffeine, screen_time, stress, exercise, late_meal, noise, wind_down, nap) and `source text` (manual | sleep_mode | health). `wind_down` should be set automatically when sleep mode started from S3.
6. **Sleep stages.** There is no source. Code fabricates stages in two places (`app/(tabs)/sleep/index.tsx:275-287`, `app/(tabs)/sleep/insights.tsx:415-437`). Stages can only come from Apple Health / Health Connect. Add `sleep_stages` (sleep_id, stage enum awake|rem|light|deep, start, end) filled from Health, and hide the stage UI (S1 Deep tile, S7 chart and list) when absent; S7 then shows a duration bar instead.
7. **Insights factor impacts.** "+25 min" style impacts need factors (gap 5) and a computation: mean sleep duration (or time-to-sleep) on nights with the factor minus nights without, over the selected period, shown only with ≥3 nights in each group. Add to `supabase/functions/sleep-insights` or compute client-side. "Fell asleep 20 min faster" needs sleep latency, which is not captured anywhere.
8. **Sleep goal.** "92% of your goal", "Goal 8h", "best this month" need a goal. Propose goal = schedule window length (8h default) stored in `sleep_schedules`.

Profile and settings:
9. **Profile fields.** Missing nickname, date_of_birth, country, avatar_url (+ storage bucket and `expo-image-picker`, not installed). Email change needs an auth flow.
10. **Profile stats.** Streak exists (`hooks/useFreudScore.ts:37`). Check-in count and mindful minutes need counting queries. "Inner glow" score = Freud score (rename in UI only); "+4 this week" needs the previous week's score. "Mostly calm" needs a weekly mood summary label.
11. **Notifications.** Per-reminder times, pattern alerts, quiet hours, sound and vibration have no storage or scheduling logic. Preferences are local only; move to a `notification_prefs` table if they should survive reinstall.
12. **Security.** App lock needs `expo-local-authentication` and a lock gate in `app/_layout.tsx`. Hide previews needs generic notification content. Active sessions has no backend. Signed-in change password has no screen.
13. **Glow AI data controls.** Only a single AI permission exists (`lib/ai-privacy.ts:9-16`). Add `ai_prefs` (remember_chats, use_mood_sleep, use_journal default false) and enforce in `supabase/functions/chat`. Data export ("Download my data", used in P6 and P14) needs an edge function that builds a JSON/ZIP and emails or shares it.
14. **Connected apps.** No HealthKit/Health Connect or calendar libraries; config plugin and permissions copy needed.
15. **Languages.** Only `en` and `el` exist.
16. **Appearance.** No user override of light/dark; the design shows only light mode.
17. **Plan usage.** No free-tier chat quota ("3 Glow AI chats a day", "2 of 3", "Resets at midnight"); needs server enforcement in the chat function plus a usage endpoint, or the copy must change.
18. **Help Center.** FAQ content, categories and search do not exist; answers for five questions are not written.
19. **Contact.** In-app replies have no thread model. Only email-reply support requests exist.
20. **Feedback.** Add `feedback` (user_id, rating 1–5, areas text[], message ≤500, device_info jsonb nullable, created_at) and a `submit-feedback` function with rate limiting like `submit_support_request`.

Settings rows with no backing data today: Appearance, Connected apps count, Security "Face ID", Active sessions, Two-step "Off" (exists but needs a status read), Notifications "On" (needs permission read), plan usage.

---

## 7. Proposed tasks

1. Export the sleep and profile static art (moon `6712:4235`, wake aura `6717:4390`, auras `6719:4415`, `6719:4698`, `6722:4863`, `6723:4816`, `6723:4852`, shield `6720:4639`) as SVG strings and add a `STARS` data array from `6712:4503` (doc §4.1, §4.8).
2. Build shared sleep visuals: `StarField`, `Moon`, `GlowOrb`, `InnerLight` and `AuraArt` components in react-native-svg (doc §4.1, §4.8, S5).
3. Add `sleep_schedules` table and migrate `useSleep` schedule from AsyncStorage to Supabase with local cache, merging the wind-down reminder with the `sleep_winddown` preference (doc §6 items 1–2, 8).
4. Add `factors` and `source` columns to `sleep` and the `sleep_stages` table, and remove the fabricated stage splits in `sleep/index.tsx:275-287` and `sleep/insights.tsx:415-437` (doc §6 items 5–6).
5. Rebuild Sleep home (S1) with the night hero, stat tiles, This-week bar chart, Tonight card and Start wind down CTA (doc S1, §4.4).
6. Build the 24-hour sleep-window dial with draggable handles and rebuild Bedtime schedule (S2) with time tiles, repeat days and wind-down toggle (doc S2, §4.2).
7. Add a soundscape stop-after timer with fade-out and background audio, and build the Wind down screen (S3) (doc S3, §6 item 3).
8. Rebuild Sleep mode (S4) with live clock, alarm pill and swipe-to-wake control (doc S4).
9. Build the Wake up screen (S5) with aura, "I’m up" and a 9-minute snooze via the alarm module or a one-off notification (doc S5, §6 item 4).
10. Rebuild the sleep check-in (S6) with the moon quality scale, factor chips and note, keeping a duration input for manual entries (doc S6, §4.3).
11. Rebuild the sleep entry detail as Last night (S7) with the hypnogram (stages only when available), stages list, Glow AI note and CTAs (doc S7, §4.5).
12. Rebuild Sleep insights (S8) with a Week/Month/Year SegmentedControl, trend line vs goal and factor impact cards, computing impacts in `sleep-insights` (doc S8, §4.6, §6 item 7).
13. Build shared settings primitives `SettingsGroup`, `SettingsRow` (icon, value, chevron, toggle, two-line, destructive), `SectionLabel` and `SearchField` (doc §3.0).
14. Rebuild the Profile tab (P1) with aura avatar, plan pill, stats, Inner glow ring and mood bars, and move settings items out (doc P1, §4.7, §6 item 10).
15. Build the Settings screen (P2) at `profile/settings`, including log out and version footer, and point the legacy `settings` redirect at it (doc P2).
16. Add nickname, date of birth, country and avatar to `profiles` with image upload, and rebuild Personal information (P3) (doc P3, §6 item 9).
17. Build the Notifications settings screen (P4) with per-reminder times, quiet hours and delivery toggles backed by a preferences store (doc P4, §6 item 11).
18. Add biometric app lock with `expo-local-authentication`, hide-previews notifications and a signed-in change-password screen, and build Security (P5) (doc P5, §6 item 12).
19. Add granular Glow AI data preferences enforced in the chat function and rebuild Glow AI & your data (P6) (doc P6, §6 item 13).
20. Add a data export edge function and wire "Download my data" in P6 and P14 (doc §6 item 13).
21. Integrate Apple Health / Health Connect for sleep import and build Connected apps (P7) (doc P7, §6 items 6, 14).
22. Rebuild the Language screen (P8) from `SUPPORTED_LANGUAGES` with select-and-save (doc P8).
23. Build My plan (P9) with RevenueCat pricing, restore and manage subscription, and add free-tier chat usage tracking or drop the usage meter (doc P9, §6 item 17).
24. Build the Help Center FAQ (P10) with search, category chips and accordion, with FAQ copy in i18n (doc P10, §6 item 18).
25. Rebuild Contact us (P11) on the existing support form, with email link, report-a-problem and urgent support card (doc P11, §6 item 19).
26. Add a `feedback` table and `submit-feedback` function, and build Send feedback (P12) and Feedback sent (P13) (doc P12, P13, §6 item 20).
27. Restyle Delete account (P14) on the existing `delete-account` function with the data export link (doc P14).

---

## 8. Blockers and design questions

- **Toggle off colour conflict.** This area uses `#E1DAE6`; the profile-setup flow uses `#E8E0D5`. Divider is `#EFEAF2` here and `#F0EBE5` in profile setup. Chip/day outline is `#E6E0EA` and `#E8E0D5` on the same S2 screen. Field radius is 16 here and 26 in profile setup. Foundations must choose one of each.
- **Typography drift.** Sleep S5–S8 and all Profile screens use `auto` line height while S1–S4 use 140%. Large numbers switch between SemiBold (S1 52, S4 64) and Regular (S5 64, S7 56, S8 40, P1 26). Header title is 14 on S2/S3 and 15 elsewhere.
- **New colours not seen elsewhere:** `#B39A1E` ("Try Pro"), `#C9A92A` (wake handle stroke), `#B4505A` and `#FBEDEE` (destructive), `#FFB3BE` (urgent/pink glows), `#CFC6D6` (radio off), `#F5F1F7` (bar track), `#E1DAE6`. Confirm they are tokens.
- **Copy and data inconsistencies in the mock.** S7 "92% of your goal" for 7h50 of 8h should be 98%. S1 says 23:10 → 07:00 while S7 says 23:05 – 06:55 for the same night. S7 says "Woke up 1×" in S1 but the hypnogram reaches Awake twice. S7 axis labels are evenly spaced for uneven time gaps. Help Center uses US "Center" while other copy is UK English ("Personalisation"). P8 lists Greek and Russian by English name with "Beta" but others by native name.
- **Missing states and copy.** Quality labels for moons 1, 2, 3 and 5; how awakenings are entered on S6 (the subtitle "Woke up once" needs it); FAQ answers for five questions; Month and Year chart layouts on S8; Appearance and Active sessions destination screens; reminder time editing on P4; empty states for S1, S7, S8 with no data; Pro-user versions of P1, P2 and P9; Android wording for Face ID and App Store.
- **No slot in the new IA for:** Community entry (currently on Profile), Manage categories (`profile/categories`), Blocked users, and the wake alarm toggle that exists in the current schedule screen.
- **Placeholder icons.** `note` is used for edit, date of birth, calendar and download. Six icons are drawn ad hoc and are missing from the icon set (asset table).
- **Section label** "Profile & Help" on the Figma canvas is white on a light background and is nearly invisible.
- No Figma call failures.
