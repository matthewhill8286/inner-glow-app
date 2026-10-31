# 07 · Mindful Hours (Practices)

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456`, section frame **`6614:2030` "Mindful Hours — Flow"** (3056 × 12058).
Shared specs are not repeated here. The tab bar, icon set, glow renderer, Button, Tag Master, back button, Top Nav, toggle and status-bar handling are owned by `00-foundations.md`. The paywall layout, plan cards and purchase flow are owned by `01-onboarding-auth.md`.

Notation: `x,y w×h` is relative to the screen (375 wide) unless stated. Type is `Family Weight size/lineHeight ls colour`. All copy is verbatim from Figma.

---

## 1. Overview

### 1.1 Board structure (row labels, captions and flow arrows)

The board has a title, a subtitle and labelled rows. Each step has a caption above it (Urbanist, 22 px tall) and a "Flow arrow" instance (40×40, arrow vector plus a glow dot) between consecutive screens. Arrows only point left to right inside a row. Rows titled "… other … → same player" contain extra Set-up / Video-details screens that feed into the player of the row above.

- Title `6616:2683` "Mindful Hours — Flow". Subtitle `6616:2684` "Start at the hub, then follow each practice left to right. Rows marked “other” reuse the same player…".

| Row label (node) | Board y | Steps (caption → screen id) |
|---|---|---|
| **Start · Mindful Hours** `6616:2685` | 474 | Hub → `6103:1267` · See all → `6614:2033` · History icon → `6614:2282` · Hub · alt version → `6575:1786` · Pro practice tapped → `6656:3657` (no arrow into the paywall; arrows only between the first four) |
| **Breathing** `6616:2699` | 2828 | 1 · Choose technique `6614:2433` → 2 · Set up `6615:2259` → 3 · Breathe in `6105:1305` → 4 · Breathe out `6105:1350` → Exit · End early? `6615:3608` → 5 · Complete `6160:1577` |
| **Breathing · other techniques → same player** `6616:2721` | 3824 | Set up `6615:2338` · Set up `6615:2417` · Set up `6615:2496` |
| **Relax · Body** `6616:2725` | 4910 | 1 · Body or mind? `6167:1744` → 2 · Choose practice `6173:2457` → 3 · Video details `6615:2575` → 4 · Video player `6177:2455` → 5 · Complete `6185:3092` |
| **Relax · Body · other videos → same player** `6616:2743` | 5906 | Video details `6615:2642` · Video details `6615:2709` |
| **Relax · Mind** `6616:2746` (note `6616:2747` "Videos play in the same video player as Relax · Body") | 6992 | 2 · Choose practice `6175:2019` → 3 · Video details `6615:2776` → `6615:2838` → `6615:2900` (the three captions all read "3 · Video details"; arrows between them are siblings, not a sequence) |
| **Mindfulness** `6616:2761` | 8028 | 1 · Choose practice `6186:3168` → 2 · Set up `6615:2968` → 3 · Audio player `6186:3715` → 4 · Complete `6186:3981` |
| **Mindfulness · other practices → same player** `6616:2775` | 9024 | Set up `6615:3030` · `6615:3092` · `6615:3161` · `6615:3260` |
| **Sleep** `6616:2780` | 10110 | 1 · Choose practice `6190:4171` → 2 · Set up `6615:3328` → 3 · Sleep player `6190:4357` → 4 · Complete `6575:2048` |
| **Sleep · other practices → same player** `6616:2794` | 11106 | Set up `6615:3394` · `6615:3465` · `6615:3537` |

No prototype reactions are set on any node. The navigation graph below is derived from the row structure, captions and arrows.

### 1.2 Navigation graph

```
Practices tab ─► Hub (6103:1267)
  ├─ "See all" ─────────────► All practices (6614:2033) ─ row tap ─► that practice's Set up / Video details
  ├─ history icon ──────────► Your sessions (6614:2282)
  ├─ any Pro practice (locked) ─► Paywall (6656:3657)   [no lock UI designed — see gaps]
  ├─ Breathing card ─► Breathe & reset (6614:2433) ─► Set up (4 screens) ─► Breathing player
  │                     player: Breathe in (6105:1305) ⇄ Breathe out (6105:1350)
  │                     back / leave ─► End early sheet (6615:3608): Keep going ⇒ player · End session ⇒ save partial ⇒ Hub
  │                     timer ends ─► Complete modal (6160:1577)
  ├─ Relax card ─► Release Tension (6167:1744)
  │     ├─ For your body ─► Relax your body (6173:2457) ─► Video details (6615:2575 / 2642 / 2709)
  │     └─ For your mind ─► Relax your mind (6175:2019) ─► Video details (6615:2776 / 2838 / 2900)
  │                         Video details "Play video" ─► Video player (6177:2455) ─► Complete (6185:3092)
  ├─ Mindfulness card ─► Be Present (6186:3168) ─► Set up (5 screens) ─► Audio player (6186:3715) ─► Complete (6186:3981)
  └─ Sleep card ─► Wind Down (6190:4171) ─► Set up (4 screens) ─► Sleep player (6190:4357) ─► Complete (6575:2048)
Every Complete modal: "Back to Mindful Hours" ⇒ Hub · "Reflect with Glow AI" ⇒ Glow AI chat seeded with the practice.
```

### 1.3 Screen list and route mapping

There is no Practices tab in code today. `app/(tabs)/_layout.tsx:139-141` hides `stress`, `sleep` and `mindful` (`href: null`), and the visible tabs are home/chat/journal/mood/profile. The tab bar itself is a foundations task. Proposed routes live under `app/(tabs)/mindful/`.

| Screen id | Figma name / caption | Size | Current code | Proposed route |
|---|---|---|---|---|
| `6103:1267` | Mindful Hours · Hub | 375×812 | `app/(tabs)/mindful/index.tsx` (totally different layout) | `mindful/index.tsx` |
| `6575:1786` | Mindful Hours · Hub alt | 375×812 | — | same screen; alt only moves the sheet 24 px lower (see 2.1) |
| `6614:2033` | All practices | 375×2130 (scroll) | none | `mindful/all.tsx` |
| `6614:2282` | Session history | 375×964 (scroll) | `mindful/stats.tsx` (donut + cards), `mindful/session-detail.tsx` | `mindful/history.tsx` (replaces stats) |
| `6656:3657` | Paywall · Unlock every practice | 375×812 | paywall per 01 doc | shared paywall route with `source=practice` |
| `6614:2433` | Breathing · Choose a technique | 375×812 | `app/(tabs)/stress/breathing.tsx` | `mindful/category/[category].tsx` (`breathing`) |
| `6615:2259`, `6615:2338`, `6615:2417`, `6615:2496` | Setup · Box / 4-7-8 / Coherent / Sigh | 375×812 | `mindful/new-exercise.tsx` (3-step wizard), `stress/breathing/[id].tsx` | `mindful/practice/[id].tsx` |
| `6105:1305`, `6105:1350` | Breathing player · in / out | 375×812 | `mindful/session.tsx` (dark green ring) | `mindful/play/[id].tsx` (kind `breathing`) |
| `6615:3608` | Breathing · End early? | 375×812 | none (close button quits silently, `session.tsx:239-247`) | sheet inside player |
| `6160:1577`, `6185:3092`, `6186:3981`, `6575:2048` | Complete (4 variants) | 375×812 | `mindful/completed.tsx` (full screen) | modal inside player |
| `6167:1744` | Relax · Body or mind? | 375×812 | `app/(tabs)/stress/index.tsx` (Stress Relief hub) | `mindful/category/relax.tsx` |
| `6173:2457`, `6175:2019` | Relax your body / mind lists | 375×812 (content 902 tall, scrolls) | `stress/list/[category].tsx` | `mindful/category/[category].tsx` (`relax-body`, `relax-mind`) |
| `6615:2575`, `2642`, `2709`, `2776`, `2838`, `2900` | Video · details | 375×812 | none (list goes straight to player) | `mindful/practice/[id].tsx` (kind `video`) |
| `6177:2455` | Video player | 375×812 | `stress/list/[category]/[videoId].tsx` | `mindful/play/[id].tsx` (kind `video`) |
| `6186:3168` | Mindfulness · Be Present | 375×812 | none | `mindful/category/mindfulness.tsx` |
| `6615:2968`, `3030`, `3092`, `3161`, `3260` | Setup · mindfulness ×5 | 375×812 | `new-exercise.tsx` | `mindful/practice/[id].tsx` |
| `6186:3715` | Audio player | 375×812 | `session.tsx` | `mindful/play/[id].tsx` (kind `audio`) |
| `6190:4171` | Sleep · Wind Down | 375×812 | none (sleep tab is a tracker, `sleep/index.tsx`) | `mindful/category/sleep.tsx` |
| `6615:3328`, `3394`, `3465`, `3537` | Setup · sleep ×4 | 375×812 | none | `mindful/practice/[id].tsx` |
| `6190:4357` | Sleep player | 375×812 | none (`sleep/start.tsx` is a sleep-tracking timer, not a practice player) | `mindful/play/[id].tsx` (kind `sleep`) |

Total: **40 screens** (39 phone frames + the 2130-tall All practices frame counted once). `app/(suggestion-actions)/mindful.tsx` and `stress.tsx` re-export the old hubs; repoint them to the new hub and category route.

---

## 2. Per-screen specs

Common to almost every screen: background `#F7F4F2` (hub and hub alt use `#F3EFED`), frame radius 40 (device only), status bar 44, home indicator 34 at y 778 on full-screen flows, tab bar instance at y 720 (92 tall, "Practices" active) on hub/category/video-player screens. Header patterns:

- **Header A** (hub, category lists, players): auto-layout frame at `6,25` (players `6,50`) 363×88, padding 10, holding a 48×48 circle with `stroke #736B66 1`, back arrow icon `Icon/Arrow : Type=back` (24). On players a Top Nav text "Mindful Hours" `Urbanist SemiBold 20 ls-0.5% #4E3A5E` sits to its right (Top Nav component, foundations).
- **Header B** (All practices, History, Choose technique, Set up, Video details): back button 50×50 `stroke #6B5279 1.5`, r 25 at `25,51` with the back icon at 13,13. A Tag Master (Size lg, Outlined, Text only, foundations) is centred at y 56 (h 40) with the category text `Urbanist SemiBold 16 ls-0.3% #8E7FA6`. On Set up / Video details a **Favourite** button 50×50 white r 25 sits at `300,51` with `Icon/Line : heart` 22 at 14,14.

### 2.1 Hub `6103:1267` (alt `6575:1786`)

- Glows: mustard ellipse 260 at `-40,40` `#E2CC40@0.30` blur 90; sky 240 at `170,120` `#7FC6F1@0.30` blur 90.
- "Aura contours" `6665:3173` 375×480 at 0,0: 7 concentric hand-drawn vector loops behind the ring (SVG).
- Header A. History button: 26×26 icon at `323,56` (two vectors, circle `stroke #6B5279 1` and hands `stroke 1.625`). This is a custom glyph, not an icon-set instance.
- **Hero ring** `6575:1692` 220×220 at `78,113`:
  - Track: full ring, inner radius 0.95 → **stroke 5.5**, `#E8E0D5`.
  - Value: arc from −90° (12 o'clock) clockwise to 144°, i.e. **65 %** of 360°, inner radius 0.95, `#6B5279`. Value = today's minutes ÷ daily goal.
  - Knob: 18 circle `#E2CC40` centred on the arc end (`16.5,162.4` for 65 %).
  - "3.25" `Urbanist SemiBold 56/auto #4E3A5E` centred, top y 58 (inside ring). Hours today, 2 decimals.
  - "of 5h daily goal" `Urbanist Medium 14 #736B66` centred, top y 126.
  - Delta pill 68×20 at `76,152`, `#6B5279` r 999, padding 3/10: "↑ 25 min" `Urbanist Bold 12 #FFFFFF`. Change versus yesterday.
- Section header at `24,420` (alt `24,444`), 327 wide, space-between: "Choose your practice" `Urbanist SemiBold 18 #241A2E`; "See all" `Urbanist Bold 14 #8E7FA6` (link to All practices).
- White sheet `1,456` (alt `1,480`) 373×326 `#FFFFFF` r 40, shadows `0,0,0 #4B3425@0.05`, `0,-17,38 #4B3425@0.05`, `0,-69,69 #4B3425@0.04`. The sheet runs under the tab bar.
- 2×2 **category cards** 167×112 `#FFFFFF` r 24 at `16,472` / `192,472` / `16,596` / `192,596` (alt +24 y):
  - Cover 155×58 at 6,6 `#FBF8F5` r 18, clips. Play badge 26×26 `#6B5279` r 13 at `123,6` with white play glyph 12.
  - Title at `14,70` `Urbanist SemiBold 15 #241A2E`; meta at `14,90` `Urbanist Regular 11 #A6A09B`.
  - Breathing — "1–3 min · Calm practice". Cover: glow 120 at 17.5,−31 `#7FC6F1@0.55` blur 24; "Breath rings" 4 circles 28/44/60/76 `stroke #6B5279` @0.50/0.35/0.25/0.15 centred at 77.5,29; glow dot 16 `#F2D96A@0.90` blur 4 at centre.
  - Relax — "2–6 min · Release tension". Glow 130 at 12.5,−36 `#E2CC40@0.55` blur 26; "Soft waves" 5 full-width sine strokes `#6B5279` @0.40→0.16, heights 10–30.
  - Mindfulness — "3–5 min · Stay present". Glows 120 `#8E7FA6@0.45` blur 26 and 70 `#E2CC40@0.30` blur 18; "Aura contours" 6 nested loops `#6B5279` @0.40→0.15.
  - Sleep — "5–10 min · Wind down". Background rect linear gradient `#E6DDEE → #F3E6EE`; glow 110 `#D8B4D8@0.70` blur 20; moon glyph 22 (vector 14.2×17.4 `#6B5279@0.75`) at 66.5,15; horizon line 155×1 `#6B5279@0.30` at y 46.4.
- Tab bar at y 720 (foundations).
- Interaction: tapping a card opens its category screen. The play badge has no separate action designed; treat it as the same tap target. The alt hub differs only by the 24 px shift and is not a separate route.

**Gaps vs code** (`app/(tabs)/mindful/index.tsx`):
- Whole layout differs. Code has a 180 circle "Total Hours" at `:106-141`, a "Today's Mindfulness" card with "+ New Exercise" at `:145-213`, and "Recent Sessions" list at `:216-353`. The design has the goal ring, practice grid and no session list on the hub.
- Code shows lifetime total hours (`:59-60`). The design shows today's hours against a **daily goal** (no goal is stored anywhere) and a **delta versus yesterday** (not computed).
- Right header button is a bar-chart pushing `stats` (`:79-94`). The design uses a history glyph pushing History.
- Back uses `ScreenHeader` with `backTo('/(tabs)/home')` (`:74-77`). The design has no title text on the hub.
- No "See all" and no category grid. No cover art exists in code.

### 2.2 All practices `6614:2033` (375×2130, scrolls)

- Glows: sky 240 at `180,30` `#7FC6F1@0.20` blur 90; mustard 260 at `-50,0` `#E2CC40@0.25` blur 90.
- Header B with Tag "Mindful Hours".
- "All practices" at `24,122` `Urbanist SemiBold 30/auto #4E3A5E`.
- "Find the right practice for how you feel right now." at `24,162`, w 300, `Urbanist Regular 14/145% #736B66`.
- Search field `24,210` 327×48 `#FFFFFF` r 24. Search glyph 20 at 18,14 (`stroke #A6A09B 1.33`). Placeholder "Search practices…" at x 48 `Urbanist Regular 14 #A6A09B`.
- Filter pills row at `24,272`, gap 8, row width 363 (overflows 327, so make it a horizontal scroller with 24 side insets). Pill: padding 7/14, r 999, `stroke #8E7FA6 1`. Selected: fill `#8E7FA6`, `Urbanist Bold 13 #FFFFFF`. Unselected: no fill, `Urbanist Medium 13 #8E7FA6`. Labels "All" (selected), "Breathing", "Relax", "Mindful", "Sleep".
- Sections: caps label `Urbanist Bold 12 #A6A09B` ("BREATHING" y 330, "RELAX · BODY" 686, "RELAX · MIND" 962, "MINDFULNESS" 1238, "SLEEP" 1674). The first row is 24 below the label. Rows have an 80 pitch (72 + gap 8). The next label is 20 below the last row.
- **Practice row** (reused on Choose technique and History): 327×72 `#FFFFFF` r 24.
  - Icon bubble 44 r 22 at `14,14` holds a 22 icon at 11,11. Category tints: breathing `#7FC6F1@0.35` + `leaf`; relax `#E2CC40@0.35` + `activity` (body) or `chat` (mind); mindfulness `#6B5279@0.18` + `meditate`; sleep `#D8B4D8@0.35` + `moon`.
  - Title at `70,16` `Urbanist SemiBold 15 #4E3A5E`. Meta at `70,38` `Urbanist Regular 12 #736B66`, e.g. "4 min · Focus".
  - `Icon/Arrow : chevron-right` 20 at `291,26`.
- Tab bar instance at y 2038, sticky at the bottom.
- Interaction: search filters by title/tags. Pills filter by category ("Relax" covers body + mind). A row opens Set up (breathing/mindfulness/sleep) or Video details (relax).

**Gaps vs code:** no screen exists. Search, filter and a unified catalogue are all missing.

### 2.3 Your sessions (History) `6614:2282` (375×964, scrolls)

- Glows as All practices. Header B, Tag "Mindful Hours".
- "Your sessions" `24,122` `Urbanist SemiBold 30 #4E3A5E`. "Every minute you gave yourself this week." `24,162` `Urbanist Regular 14 #736B66`.
- **Week summary card** `24,200` 327×190 `#FFFFFF` r 28:
  - Three stats. Values at y 18 `Urbanist SemiBold 26 #4E3A5E` and labels at y 52 `Urbanist Medium 12 #736B66`. Columns at x 20 / 123 / 226. "3.25h"/"Mindful time", "14"/"Sessions", "12"/"Day streak".
  - **Week bars**: 7 columns, track 26×70 `#F5F5F4` r 13 at y 86, x = 24 + 42·i (24, 66, 108, 150, 192, 234, 276). Fill 26 wide r 13, bottom-aligned (bottom y 156). Fill height = day minutes ÷ max day minutes × 70. Design sample: M 28 `#7FC6F1`, T 49 `#E2CC40`, W 38.5 `#D8B4D8`, T 70 `#8E7FA6`, F 21 `#7FC6F1`, S 56 `#E2CC40`, S 42 `#6B5279`. The colour is the category of the day's largest session (breathing `#7FC6F1`, relax `#E2CC40`, sleep `#D8B4D8`, mindfulness `#8E7FA6`). `#6B5279` on Sunday is ambiguous; treat it as today or as a mixed day and confirm with design.
  - Day letters "M T W T F S S" at y 162, 26 wide centred, `Urbanist Medium 11 #A6A09B`.
- "THIS WEEK" `24,410` `Urbanist Bold 12 #A6A09B`.
- Session rows from y 434 (pitch 80), same row as 2.2. The chevron is replaced by a **mood-after face** `Icon/Mood` 22 at `291,25`. Meta format is "{Today|Yesterday|Ddd} · HH:mm · N min". Samples: Box breathing "Today · 08:10 · 4 min" happy; Sleep Sounds "Yesterday · 23:05 · 20 min" neutral; Shoulder Release "Wed · 13:30 · 2 min" very-happy; Grounding "Tue · 19:00 · 25 min" happy; Anxiety Reset "Mon · 09:15 · 4 min" sad.
- Footnote "Mood after each session" at `226,836` `Urbanist Medium 11 #A6A09B` (right-aligned under the list).
- Tab bar at y 872.

**Gaps vs code** (`mindful/stats.tsx`, `mindful/session-detail.tsx`):
- Code shows a category donut (`stats.tsx:38-136`), 4 stat cards and a motivational message. The design shows 3 inline stats, the 7-day bar chart and a session list.
- Code buckets sessions by parsing the free-text `note` (`stats.tsx:22-36`, `index.tsx:26-34`). The design needs a real practice id and category on each session.
- Code's "this week" is the last 7×24 h (`stats.tsx:170-175`). The design is Monday–Sunday of the current week.
- There is no mood-after data in the `mindfulness` table (`types/database.types.ts:648-657`).
- `session-detail.tsx` has no design counterpart. Rows in the design have no tap affordance, so drop the detail screen or keep it reachable from a row tap (confirm).

### 2.4 Paywall `6656:3657`

Spec owned by `01-onboarding-auth.md`. Section-specific copy: title "Unlock every practice"; subtitle "All 40+ practices, free for 7 days."; features "Unlimited chats with Glow AI", "Every practice and sleep sound", "Deeper insights and a weekly plan"; CTA "Start 7 days free"; close button top right (`319,54` 40×40 white@0.80). Trigger: tapping a Pro practice anywhere (hub card, list row, Set up CTA).

### 2.5 Breathing · Choose a technique `6614:2433`

- Glows: sky 270 at `150,40` `#7FC6F1@0.30` blur 90; mustard 220 at `-60,20` `#E2CC40@0.20` blur 90.
- Header B, Tag "Mindful Hours".
- "Breathe & reset" `24,122` `Urbanist SemiBold 30 #4E3A5E`. "Pick a breathing pattern for how you want to feel." `24,162` w 300 `Urbanist Regular 14/145% #736B66`.
- 4 practice rows (2.2 style) at y 220 / 302 / 384 / 466 (pitch 82, gap 10).
- **Tip card** `24,556` 327×72 `#7FC6F1@0.18` r 24. `sparkle` icon 20 at 18,26. Text at 50,16 w 222 `Urbanist Regular 13/140% #736B66`: "Not sure? Try 4-7-8 Calm. It helps most\npeople unwind in under 5 minutes." Make the tip tappable to open 4-7-8 Calm (not designed but implied).
- Tab bar.

**Gaps vs code** (`app/(tabs)/stress/breathing.tsx`): code uses `ScreenHeader` + `t('stressBreathing.title')` and cards with a MaterialIcons "air" glyph, shadow and radius `UI.radius.xl` (`:19-87`). The catalogue is different (`data/breathingExercises.ts:12-51` has 4-7-8, Box, Equal, 4-4-4; the design has Box, 4-7-8, Coherent, Sigh reset). There is no tip card.

### 2.6 Set up (breathing ×4, mindfulness ×5, sleep ×4) — template `6615:2259`

One template; per-practice values are in the catalogue (§3).

- Glows (vary by category, both blur 90): accent 270 at `150,30` (breathing `#7FC6F1@0.30`, mindfulness `#8E7FA6@0.20`, sleep `#D8B4D8@0.30`) + mustard 220 at `-60,10` `#E2CC40@0.18`.
- Header B (Tag text = category: "Breathing", "Mindfulness", "Sleep") + Favourite.
- **Hero** `24,114` 327×176. No fill; art only (see §4).
  - Breathing hero: glow 200 at `63,-12` `#7FC6F1@0.55` blur 40; glow 140 at `150,40` `#E2CC40@0.35` blur 40; rings 150 at `88.5,13` and 110 at `108.5,33`, both `stroke #6B5279@0.20 1`; aura contours (7 vectors); inner light 46 at `140.5,65` `#F2D96A@0.85` blur 12; pattern label centred at y 80 `Urbanist Bold 12 #4E3A5E` ("4 · 4 · 4 · 4", "4 · 7 · 8", "5.5 · 5.5", "In · in · out", sleep "4 · 6").
- Title `24,304` `Urbanist SemiBold 26 #4E3A5E`.
- Meta chips row `24,342`, gap 6. Chip: padding 4/10, `#E8E0D5` r 999, `Urbanist SemiBold 12 #4E3A5E`. The three chips are duration, tag and level.
- Description `24,376` w 327 `Urbanist Regular 14/145% #736B66`.
- **Options card** `24,430` w 327 `#FFFFFF` r 28. Height: breathing 268, mindfulness 192, sleep 244.
  - Group label at x 20 `Urbanist SemiBold 13 #241A2E` ("Pace", "Duration"). The pill row is 22 below the label, gap 6. Pill: h 30, padding 6/12, r 999, `stroke #8E7FA6 1`. Selected: fill `#8E7FA6` + `Urbanist Bold 13 #FFFFFF`. Unselected: `Urbanist Medium 13 #8E7FA6`.
  - Divider 287×1 `#F0EBE5` at x 20, 12 below a pill row.
  - Picker row: label `Urbanist SemiBold 14 #241A2E` at x 20; value `Urbanist Medium 14 #736B66` right-aligned to x 283; `chevron-right` 18 at x 289. The row is 17 below the divider top.
  - Toggle row: label as above; toggle 46×28 r 14 at x 261, 4 above the label baseline row. On: `#8E7FA6` with a white 22 knob at x 21. Off: `#E8E0D5` with the knob at x 3 (foundations toggle).
  - Breathing rows (y in card): Pace 16 / pills 38 / divider 80 / Duration 92 / pills 114 / divider 156 / Sound row 174 ("Soft chime") / divider 208 / "Haptic cues" toggle 226 (on).
  - Mindfulness rows: Duration 16 / pills 38 / divider 80 / "Soundscape" row 98 ("Forest morning") / divider 132 / "Voice guidance" toggle 150 (on).
  - Sleep rows: Duration 16 / pills 38 / divider 80 / "Sound" row 98 ("Rain at night") / divider 132 / "Fade out at the end" toggle 150 (on) / divider 184 / "Voice guidance" toggle 202 (**off**).
- **CTA** `24,712` 327×56 `#6B5279` r 999, centred row gap 10: play glyph 18 (white fill and stroke 1.2) + "Start practice" `Urbanist SemiBold 16 #FFFFFF`. Use the foundations primary Button with a leading icon.
- Home indicator; no tab bar.
- Interaction: the Sound/Soundscape row opens a picker that is **not designed**. Favourite toggles the heart (filled state not designed). The CTA opens the player for the practice's kind and passes the chosen options. For a Pro practice when not entitled, the CTA opens the paywall.

**Gaps vs code** (`mindful/new-exercise.tsx`): code is a 3-step wizard (goal → time → soundscape) with a progress bar (`:57-281`), goal list `:14-20`, a ±1/±5 stepper with presets 5–30 (`:38`, `:376-603`) and soundscape list `:23-35`. The design has a single Set up per practice with fixed pill sets. Pace, haptics, voice guidance, fade-out and favourite do not exist. Copy keys `newExercise.*` will be dropped.

### 2.7 Breathing player `6105:1305` (in) / `6105:1350` (out)

- Glows: mustard 220 at `-60,30` `#E2CC40@0.30` blur 90. The sky glow node `6579:1606` has no visible fill, so it renders nothing.
- Header A at `6,50` with Top Nav "Mindful Hours".
- Content column x 16, w 343, centred:
  - Phase title y 145 "Breathe in" / "Breathe out" `Urbanist SemiBold 30/38 ls-1% #4E3A5E` centre.
  - Guidance, 12 below, `Urbanist Medium 16/160% ls-0.3% #736B66` centre. In: "Take a slow breath in through your nose." Out: "Take your time. You’re doing great."
  - **Orb** 236×236, 32 below the text block (top y ≈ 253). Layers, all centred:
    1. Outer ring 236 `stroke #6B5279@0.15 1`, no fill.
    2. Halo 172 `#D8B4D8@0.55` blur 30 (glow).
    3. Body 110 `#E2CC40@0.85` blur 18 (glow).
    4. Inner light 49.5 `#FFF6D6@0.95` blur 8 (glow).
    5. Core 48 `#E2CC40@0.80` solid.
  - Breath counter, 32 below the orb (y ≈ 521) "1 of 3 breaths" `Urbanist SemiBold 30/38 ls-1% #4E3A5E`.
- **Orb sizes per phase**: the in and out frames are geometrically identical in Figma, so the design does not specify a size change. Implement the scale animation on layers 2–5 with the 236 ring fixed. Inhale scales from 0.7 to 1.0 over the inhale seconds (ease in-out sine). Hold keeps the scale. Exhale scales from 1.0 to 0.7. This matches the current `session.tsx:139-179` behaviour. The **Hold** phase has no designed copy; see blockers.
- **Progress** at `50,600` 276 wide: elapsed "05:21" left and total "25:00" right, `Inter Regular 18/28 ls-0.4 #736B66` (Inter is a leftover; use Urbanist Regular 18/28 per foundations). Bar 12 below: track 276×8 `#6B5279@0.30` r full, fill `#6B5279` r full, width = 276 × elapsed/total (sample 59.1 = 21 %).
- **Controls** at `50,687` 276×80, centred row gap 24:
  - Replay: 56 circle `stroke #6B5279 2`, icon `Icon/Arrow : replay` 24. Restarts the current cycle (design icon has no "10").
  - Play/Pause: 80 circle `#FFFFFF` + `stroke #6B5279 2`, glyph 16.6×21.4 `#6B5279`. Pause glyph not designed; use the icon-set pause.
  - Skip: 56 circle, `Icon/Arrow : forward-10`.
- Exhale frame (`6105:1350`) lays the progress and controls out inside the same auto-layout column (48 gap); the absolute positions are identical.
- Back arrow or Android back during an active session opens the End early sheet.
- On reaching the selected duration, show the Complete modal and write the session.

**Gaps vs code** (`mindful/session.tsx`):
- Dark green phase themes `PHASE_COLORS` (`:41-46`) with a white progress ring 240/10 (`:48-49`, `:336-360`). The design is a light screen with the layered glow orb and a linear progress bar.
- Centre text shows countdown/elapsed/phase seconds (`:371-406`). The design shows phase title + guidance above the orb and a breath counter below.
- Phase dots (`:411-430`) are not in the design.
- Controls are 52/72/52 translucent white (`:440-487`). The design is 56/80/56 outlined `#6B5279`.
- Close button (`:273-286`) and soundscape chip (`:289-311`) are not in the design. Quit saves silently if >30 s (`:239-247`); the design asks first via the sheet.
- Phase durations come from goal ids (`:25-31`), not from a practice pattern. Pace (Slow/Normal/Fast) does not exist.
- No haptics; `expo-haptics ~15.0.8` is installed but not used here.
- Glows need Skia (not installed, foundations).

### 2.8 End early sheet `6615:3608`

- Background is the breathing player with the orb in a flat **paused** style: ring 236 `#EEE8F3`, 172 `#DDD3E8`, 110 `#8E7FA6`, 48 `#8E7FA6` (no blur). Use this as the paused orb state.
- Overlay 375×812 `#3F3C36@0.75`.
- Sheet `0,512` 375×300 `#FFFFFF`, top radii 40, bottom 0. Grabber 40×5 `#E8E0D5` r 3 at `167.5,12`.
- "End practice early?" `24,40` `Urbanist SemiBold 24 #4E3A5E`.
- Body `24,78` w 327 `Urbanist Regular 14/145% #736B66`: "You’ve done 2 of 5 minutes. We’ll save your progress, and you can pick it up any time." Template: "You’ve done {done} of {total} minutes…" (round down).
- "Keep going" `24,150` 327×56 `#6B5279` r 999, `Urbanist SemiBold 16 #FFFFFF` (primary Button).
- "End session" `24,216` 327×56, `stroke #6B5279 1.5` r 999, `Urbanist SemiBold 16 #4E3A5E` (outline Button).
- Behaviour: opening the sheet pauses the timer, audio and haptics. Keep going resumes. End session saves a partial session (`completed=false`) and returns to the Hub. "Pick it up any time" implies resume support; see backend gaps.
- Apply the same sheet to the audio, sleep and video players (design shows it only for breathing).

### 2.9 Complete modal — `6160:1577` (breathing), `6185:3092` (relax), `6186:3981` (mindfulness), `6575:2048` (sleep)

- Background: the finished player. Overlay `#3F3C36@0.82` (MULTIPLY blend on the breathing variant; use plain alpha).
- Card at `18,286.5` (sleep `15,294`), 340 wide, height hugs (232; sleep 261). `#FFFFFF` r 40, padding 16, shadows `0,14,31 #4B3425@0.10`, `0,57,57 @0.09`, `0,128,77 @0.05`, `0,228,91 @0.01`.
- Inner column 308, gap 32:
  - Title `Urbanist SemiBold 24/auto ls-0.8% #4E3A5E` centre. Variants: "Breathing complete.", "Practice complete.", "Grounding complete." (use "{practice title} complete."), "Winding Down complete."
  - Subtitle 12 below `Urbanist Medium 18/160% ls-0.4% #736B66` centre. "You’re doing great." or, for sleep, "If you’re already resting, we’ll keep things quiet from here."
  - Buttons column gap 8: Button Primary lg 308×56 r 1000 "Back to Mindful Hours" `Urbanist SemiBold 18 ls-0.4% #FFFFFF` (foundations). Below it, centred chip "Reflect with Glow AI" 168×34 `#F1ECF5` + `stroke #6B5279@0.40 1` r 999, padding 8/14/8/12, gap 6: `sparkle` 16 + `Urbanist SemiBold 13 #6B5279`.
- The breathing variant's player background shows "3 of 3 breaths" and a fully filled bar (track `#6B5279`).
- Sleep: when the sleep timer finishes with fade-out on, do not play any completion sound or haptic, and keep the screen dim.

**Gaps vs code** (`mindful/completed.tsx`): full-screen page with a 120 success circle (`:55-80`), fake "focus score"/"stress level" gains computed from minutes (`:33-35`, `:160-245`) and an "another exercise" button (`:301-324`). The design is a modal with no scores. There is **no mood-after capture** in the design, yet History shows a mood face per session; see blockers.

### 2.10 Relax · Release Tension (body or mind) `6167:1744`

- Glow `#FFB3BE@0.30` 230 at `180,110` blur 90 (same on all Relax screens).
- Header A (back only, no title).
- Column x 16 from y 133, w 343, gap 59:
  - "Release Tension" `Urbanist SemiBold 30/38 ls-1% #4E3A5E` centre. Sub 16 below: "Ease your body and quiet your thoughts with soft, calming practices." `Urbanist Medium 16/160% ls-0.3% #736B66` centre.
  - Two choice cards 343×152 r 32, padding 16, gap 16, clip content:
    - "For your body" (shown selected): `#FFFFFF`, `stroke #6B5279 1`, shadow `0,0,0 spread 4 #9BB068@0.25` (old green palette; use `#E2CC40@0.35` or the foundations focus ring). Art: glow 182.4 at `131.8,-15.2` `#E2CC40@0.50` blur 40; glow 91.2 at `245.9,0` `#FFB3BE@0.30` blur 30; 6 soft-wave strokes 343 wide (heights 12→42, `#6B5279` @0.38→0.13) centred at y ≈ 83. Title at 16,16 `Urbanist SemiBold 16 ls-0.3% #3F3C36`; meta at 16,45 "2–6 min • Stretch & release" `Urbanist Medium 12/160% ls-0.4% #736B66`.
    - "For your mind": `#FFFFFF`, no stroke, shadow `0,8,16 #4B3425@0.05`. Art: glow 182.4 at `142,-15.2` `#8E7FA6@0.40` blur 40; glow 91.2 at `228.8,15.2` `#7FC6F1@0.30` blur 30; aura contours (7 vectors); inner light 20 at `223.2,66` `#F2D96A@0.90` blur 6.7. Meta "2–5 min • Quiet thoughts".
  - Caption 27 below the cards: "Choose what feels right for you today." `Urbanist Medium 16/160% ls-0.3% #736B66` centre.
- Tab bar.
- Interaction: tap a card to open its list. The stroke/shadow shows the pressed or last-used card.

**Gaps vs code** (`app/(tabs)/stress/index.tsx`): code is a "Stress Relief" hub (`:117`) with a hero suggestion, tool grid, two horizontal video rails (`:222-330`), last exercise and a link to mindful (`:375`). None of it matches. The `stress/plan.tsx` and `stress/grounding.tsx` routes have no counterpart in this section.

### 2.11 Relax your body `6173:2457` / Relax your mind `6175:2019`

- Header A. Column from y 112, gap 59. Title "Relax your body" / "Relax your mind" (30/38). Sub "Gentle movement to release tension and feel more comfortable." / "Gentle practices to slow down your thoughts and feel more grounded." (16/160%).
- Video cards (gap 20) 343×187 `#FFFFFF` `stroke #6B5279 1` r 32, padding 16, clip. The first card carries the green spread-4 shadow (old palette).
  - Text row at 16,16, w 309: title `Urbanist SemiBold 16 ls-0.3% #3F3C36`; subtitle below `Urbanist Medium 12/160% ls-0.4% #736B66` (w 210, wraps to 2 lines on some); right meta "2–6 min • Body" / "2–6 min • Mind" `Urbanist Medium 12/160%` right-aligned.
  - **Thumbnail** raster 343×148 at y 63, full-bleed to the card edges (ignores padding), clipped by the r 32 card (bottom corners round, top square). Scale mode FILL.
- Content is 902 tall, so the list scrolls under the tab bar (add bottom inset 92 + 16).

**Gaps vs code** (`stress/list/[category].tsx`): code lists `STRESS_VIDEOS` filtered by `body|mind` with a generic card. The data (`data/stressVideos.ts:10-67`) has 8 third-party YouTube ids with different titles. No thumbnails are stored (`thumbnail?` is optional and unused).

### 2.12 Video details `6615:2575` (template; also `2642`, `2709`, `2776`, `2838`, `2900`)

- Glows: mustard 270 at `150,30` `#E2CC40@0.30` + mustard 220 at `-60,10` `#E2CC40@0.18`, both blur 90.
- Header B, Tag "Relax · Body" or "Relax · Mind", + Favourite.
- **Hero** `24,114` 327×176 r 28, clip, fill `#F1EBE4` under the raster image (FILL).
  - Shade gradient top→bottom `#403B36@0` → `#403B36@0.45`.
  - Play button 60 `#FFFFFF@0.92` r 30 at `133.5,58`, shadow `0,4,14 #000000@0.18`, play glyph 24 `#6B5279` (stroke 1.6).
  - "Video" badge `14,14` `#FFFFFF@0.92` r 999, padding 4/10, gap 5: video glyph 14×10 `#6B5279` + `Urbanist Bold 11 #4E3A5E`.
  - Duration badge bottom-right at `276,142` `#3F3C36@0.75` r 8, padding 3/8, `Urbanist Bold 12 #FFFFFF` ("2:15").
  - `6615:2900` Grounding Practice uses vector aura art instead of a photo (inconsistent; see blockers).
- Title, chips (first chip "{m:ss} video"), description: same as Set up.
- **About card** `24,430` 327×242 `#FFFFFF` r 28:
  - "What you’ll do" `20,18` `Urbanist Bold 13 #241A2E`.
  - 3 steps at y 44 / 78 / 112. Number disc 24 `#E2CC40@0.30` r 12 with `Urbanist Bold 12 #4E3A5E` centred. Text at x 56 `Urbanist Regular 14 #44403B` (old stone grey; use `#4E3A5E` or the foundations body token).
  - Divider `20,150` 287×1 `#F0EBE5`. "Good for" `20,164` Bold 13; chips at `96,161` gap 6 (meta-chip style).
  - Divider y 198. "Source" `20,212` Bold 13; value right-aligned ending at 307 `Urbanist Regular 13 #736B66` "YouTube · INNER GLOW channel".
- CTA `24,712` "Play video" (play glyph 18 + label, same as Set up CTA).

**Gaps vs code:** there is no details screen; the list opens the player directly. Steps, good-for tags, durations and the channel source are not in data.

### 2.13 Video player `6177:2455`

- Glow `#FFB3BE@0.30`. Header A (back only).
- Column y 112, gap 14: title "Shoulder Release" 30/38; meta "2 min • Body " `Urbanist Medium 16/160% ls-0.3% #736B66` (trailing space in Figma); instruction "Follow along gently. Stop anytime you need."
- **Player card** `15,295` 343×212 `#FFFFFF` `stroke #6B5279 1` r 32, clip, shadow spread 4 `#9BB068@0.25` (old palette). It is filled by the video (raster placeholder `6177:3038`).
  - Overlay control pill `18,145` (in card) 308×48 `#FFFFFF` r full, shadows `0,4,6,-4 #000@0.10` and `0,10,15,-3 #000@0.10`.
  - Time "02:00" at 12,16 `Inter Medium 12/16 #4E3A5E` (use Urbanist).
  - Scrubber at x 69, y 22: 140×4, track `#E5E7EB`, fill `#8E7FA6` (sample 75.5 = 54 %).
  - Play/pause 35×32 `#6B5279` r full at x 218, white glyph 8.2×11.2.
  - Fullscreen 35×32 `#F3F4F6` r full at x 261, 4 corner strokes `#6B5279` (14 box).
- "[ Beginner ]  [ No equipment ]" at `13,520` is placeholder bracket text. Render it as two meta chips centred.
- "Move slowly. Keep your breathing soft." at `16,578` `Urbanist Medium 16/160% #736B66` centre.
- Tab bar visible.
- Behaviour: the session is complete when the video ends (or the user has watched ≥ 90 % and leaves), which opens Complete `6185:3092`. Leaving earlier opens the End early sheet.

**Gaps vs code** (`stress/list/[category]/[videoId].tsx`): `react-native-youtube-iframe` full-width 16:9 black box (`:73-80`, `:99-104`) plus a random quote card (`:82-91`). There is no custom control pill, no time tracking and **no session logging** (`useMindfulness` is not called). Use YouTube iframe with `controls=0` and drive the pill via the player ref; this needs the INNER GLOW channel video ids.

### 2.14 Mindfulness · Be Present `6186:3168` (and Sleep · Wind Down `6190:4171`)

- White sheet `1,461` 373×351 r 40 (hub shadows). Glows: `#8E7FA6@0.10` 260 at `-40,40` and `#7FC6F1@0.30` 240 at `170,120` (sleep: `#D8B4D8@0.30` and `#7FC6F1@0.30`), blur 90.
- Header A. Column y 112, gap 18 then 59:
  - "Be Present" / "Wind Down" 30/38. Sub: "Slow down with mindful moments, soft sounds, and gentle melodies." / "Slow down with soft sounds and gentle guides for restful sleep."
  - Illustration 343×190.
    - Mindfulness: glow 247 at `48,-28.5` `#E2CC40@0.40` blur 40; glow 152 at `155.5,29` `#8E7FA6@0.35` blur 35; aura contours 9 nested loops (`#6B5279` @0.32 → fading), centred at 171,95; inner light 26 `#F2D96A@0.90` blur 8.7.
    - Sleep "sunset": glow 209 at `67,38` `#E2CC40@0.50` blur 36; sun disc 80 `#F0C77A` at `131.5,102.5` (half hidden under the horizon); horizon line 343×1 `#6B5279@0.35` at y 142.5; two half-arcs 150×75 (`@0.15`) and 110×55 (`@0.20`) `stroke #6B5279`. The sun must be clipped at the horizon (the art frame does not clip; check the screenshot).
  - List (gap 12) of pill rows 343×56 `#F3EFED` r full, shadow `0,8,16 #4B3425@0.05`, content inset 17/9. Title `Urbanist SemiBold 16 ls-0.3% #4E3A5E`; sub `Urbanist Medium 12/160% ls-0.4% #736B66`. A right arrow (20 wide, `stroke #6B5279 2`) at x 289; use `Icon/Arrow : chevron-right` or arrow-right.
- Tab bar over the bottom of the list (the list is 328 tall from y 479; the last row ends at 807, so it scrolls).

**Gaps vs code:** no Mindfulness or Sleep-practice category screens exist.

### 2.15 Audio player `6186:3715`

- Glows: `#8E7FA6@0.10` 260 and `#7FC6F1@0.30` 240 (complete variant `#8E7FA6@0.30`).
- Header A (back only). Column y 105:
  - "Grounding" 30/38. Sub " Come back to the present moment, \ngently and safely." (leading and trailing spaces in Figma; trim them).
  - **Waveform** at x 28.5 (12.5 in column), y 253, 318×257. 40 bars, width 4, gap 4 (pitch ≈ 8.05), r full, bottom-aligned at y 510. Heights (left→right): 6.8, 19.8, 26.5, 42.6, 56.3, 81.9, 94.6, 124.3, 128.4, 139, 148.6, 133.4, 122.7, 102.8, 86, 66.7, 40.6, 22, 11.5, 7.4, 15.4, 18.4, 40.4, 60.2, 81.8, 100.6, 119, 137.6, 140, 144.5, 129, 119.8, 100.9, 81.9, 51, 44.4, 24.6, 10.5, 8.9, 10.4. Opacity steps 0.6 → 0.9 with height (0.6 for h < 23, 0.7 < 70, 0.8 < 120, else 0.9).
    - Fill: vertical linear `#8E7FA6` → `#6B5279@0.70`. The 7 shortest edge bars on `6186:3715` use `#5B6B3C` → `#8E7FA6@0.70` (olive, old palette); the complete variant fixes them to `#8E7FA6` → `#8E7FA6@0.70`. Use the fixed version.
    - Animate: bars scale with playback amplitude (or a looping idle animation), with react-native-svg `Rect`s and Reanimated.
- Progress and controls exactly as the breathing player (2.7), at y 600 and y 687.

**Gaps vs code:** no audio player. `mindful/session.tsx` plays a looping soundscape behind a breathing ring (`:122-137`). Voice guidance audio does not exist. The selected soundscape "Forest morning" has no asset (`lib/soundscape.ts:5-11` has birds, zen, rain, stream, ocean).

### 2.16 Sleep player `6190:4357`

- Glows: `#D8B4D8@0.30` 260 and `#7FC6F1@0.30` 240.
- Header A. Column y 105, gap 12:
  - "Sleep Sounds" 30/38.
  - "Voice guidance" `Urbanist Medium 16/160% #736B66` centre. Segmented control 8 below: 153×35 `#FFFFFF` r 32, padding 4. Options 72.5×27 r full, padding 8/16. Selected "ON" `#8E7FA6` + `Urbanist SemiBold 16 ls-0.3% #FFFFFF`, with ring shadow spread 4 `#9BB068@0.25` (old palette; drop it or use the accent). Unselected "OFF" `#4E3A5E`, no fill.
  - Waveform 318×280 at column y 134 (screen y 239): the same 40 heights bottom-aligned at 280, fill `#B98FC0` → `#B98FC0@0.70`.
  - Track name 32 below: "Rain at Night" `Inter Bold 20/32 ls0.1 #8E7FA6` centre (Inter leftover → Urbanist Bold 20/32). The Figma string ends with U+2028.
- Progress (total "20:00") and controls as the breathing player.
- Behaviour: fade-out lowers volume over the last 60 s (assumption). Voice guidance toggles a narration track. The screen should dim; keep-awake stays off.

**Gaps vs code:** no sleep practice player. `app/(tabs)/sleep/start.tsx` is the sleep-tracking "Start sleeping" timer (`:108-180`) and should stay separate. The hub link from `sleep/index.tsx:609` to `/(tabs)/mindful` can stay.

---

## 3. Practice catalogue (source for `data/practices.ts`)

Fields: `id` (proposed slug), `category` (`breathing | relax-body | relax-mind | mindfulness | sleep`), `kind` (`breathing | video | audio | sleep`), list duration and tag (from the list meta "N min · Tag"), chips, `level`, description, steps / good-for (video only), set-up options with **defaults in bold**, and media node ids. Icon and bubble tint come from the category (§2.2). `pro` is not marked anywhere in the design.

### 3.1 Breathing — kind `breathing`, player 2.7, Set up options Pace {**Slow**, Normal, Fast} · Sound row "Soft chime" · Haptic cues **on**

| id | Title | List meta | Chips | Pattern label → phases (in/hold/out/hold s) | Description | Duration pills (default) | Set up / hero art |
|---|---|---|---|---|---|---|---|
| `box-breathing` | Box breathing | 4 min · Focus | 4 min · Focus · Beginner | "4 · 4 · 4 · 4" → 4/4/4/4 | Breathe in, hold, out, hold for 4 counts each. Steadies your focus. | 1, **3**, 5, 10 min | `6615:2259` / aura `6665:3190` |
| `four-seven-eight` | 4-7-8 Calm | 5 min · Anxiety & sleep | 5 min · Anxiety & sleep · Beginner | "4 · 7 · 8" → 4/7/8/0 | In for 4, hold for 7, out for 8. Calms your nervous system. | 1, 3, **5**, 10 min | `6615:2338` / `6665:3199` |
| `coherent` | Coherent breathing | 6 min · Balance | 6 min · Balance · Beginner | "5.5 · 5.5" → 5.5/0/5.5/0 | Slow, even breaths at about 5.5 seconds in and out. | 1, 3, **5**, 10 min | `6615:2417` / `6665:3208` |
| `sigh-reset` | Sigh reset | 1 min · Quick stress relief | 1 min · Quick relief · Any level | "In · in · out" → 2 + 1 (double inhale) / 0 / 6 / 0 (assumed) | Two short inhales, one long exhale. Fastest way to release stress. | **1**, 3, 5, 10 min | `6615:2496` / `6665:3217` |

Pace multipliers (assumed, confirm): Slow ×1.25, Normal ×1.0, Fast ×0.8 of the phase seconds. "Breaths" in the counter = completed cycles; total cycles = floor(duration ÷ cycle length).

### 3.2 Relax · Body — kind `video`, Tag "Relax · Body", choose-card meta "2–6 min • Body", Source "YouTube · INNER GLOW channel"

| id | Title | List meta | Video length | Chips | Description | What you'll do | Good for | Choose-card subtitle | Hero (details) | Thumb (list) |
|---|---|---|---|---|---|---|---|---|---|---|
| `shoulder-release` | Shoulder Release | 2 min · Body | 2:15 | 2:15 video · Body · No equipment | Gentle rolls and stretches for tight, heavy shoulders. | 1 Roll your shoulders slowly back · 2 Open the chest with a gentle stretch · 3 Breathe out and let your arms drop | Desk work · Tight shoulders | Best if your shoulders feel tight or heavy. | `6615:2602` | `6175:1493` |
| `neck-tension-reset` | Neck Tension Reset | 4 min · Body | 4:05 | 4:05 video · Body · No equipment | Slow neck release for screen fatigue and tension headaches. | 1 Slow side tilts, left and right · 2 Gentle chin tucks · 3 Drop your shoulders on each exhale | Screen fatigue · Headaches | Great for screen fatigue, headaches. | `6615:2669` | `6175:1885` |
| `full-body-relax` | Full-Body Relax | 8 min · Body | 8:30 | 8:30 video · Body · Mat optional | Head-to-toe stretch to let go of the day. | 1 Wake up the spine · 2 Loosen hips and hamstrings · 3 Rest and breathe to finish | End of the day · Stiff body | Best if your shoulders feel tight or heavy. (copy duplicated from Shoulder Release) | `6615:2736` | `6175:2016` |

### 3.3 Relax · Mind — kind `video`, Tag "Relax · Mind", choose-card meta "2–6 min • Mind"

| id | Title | List meta | Video length | Chips | Description | What you'll do | Good for | Choose-card subtitle | Hero | Thumb |
|---|---|---|---|---|---|---|---|---|---|---|
| `quiet-thoughts` | Quiet Thoughts | 4 min · Mind | 4:20 | 4:20 video · Mind · Beginner | A guided pause for when your mind feels busy or racing. | 1 Settle into a comfortable seat · 2 Notice thoughts without judging · 3 Come back to the breath | Racing mind · Before sleep | Best if your mind feels busy or racing. | `6615:2803` | `6175:2156` |
| `anxiety-reset` | Anxiety Reset | 4 min · Mind | 3:50 | 3:50 video · Mind · Beginner | Name it, breathe, soften. For tense or worried moments. | 1 Name what you’re feeling · 2 Slow 4–6 breathing · 3 Soften your jaw and shoulders | Worry · Before a meeting | Great when you feel tense or worried. | `6615:2865` | `6175:2286` |
| `grounding-practice` | Grounding Practice | 5 min · Mind | 5:10 | 5:10 video · Mind · Beginner | Use your senses to come back to here and now. | 1 Notice 5 things you can see · 2 Feel 4 things you can touch · 3 Finish with one slow breath | Feeling distracted · Overwhelm | Helpful when you feel distracted. | vector `6615:2927` (no photo) | `6175:2416` |

Video player shows level and equipment as chips ("Beginner", "No equipment") under the card; take these from the practice record.

### 3.4 Mindfulness — kind `audio`, Tag "Mindfulness", options Duration {5, 10, 25} · Soundscape row "Forest morning" · Voice guidance **on**

| id | Title | List meta | Chips | Description | Choose-row sub | Default duration | Hero art |
|---|---|---|---|---|---|---|---|
| `grounding` | Grounding | 25 min · Be present | 25 min · Be present · All levels | Come back to the present moment, gently and safely. | 25 min • Come back to the present. | **25** | `6668:3173` (in `6615:2995`) |
| `mindful-focus` | Mindful Focus | 7 min · Settle your mind | 7 min · Focus · Beginner | Settle your attention on one thing at a time. | 7 min • Settle your mind gently. | **5** | `6668:3186` (in `6615:3057`) |
| `soothing-melodies` | Soothing Melodies | 9 min · Soundscape | 9 min · Soundscape · Any time | Soft melodies to reset between tasks. | 9 min • Calm soundscapes to reset. | **10** | `6615:3119` / aura `6665:3235` |
| `sound-therapy` | Sound Therapy | 10 min · Sound waves | 10 min · Sound waves · Headphones | Gentle low frequencies to relax body and mind. | 10 min • Relax with gentle sound waves. | **10** | `6615:3188` + waveform `6615:3191` (34 bars) / `6665:3243` |
| `deep-focus` | Deep Focus | 10 min · Concentrate | 10 min · Concentrate · Headphones | Steady background sound that helps you stay on task. | 5–10 min • Stay calm and concentrate. | **10** | `6615:3287` / `6665:3252` |

### 3.5 Sleep — kind `sleep`, Tag "Sleep", options Duration {10, 20, 45} · Sound row "Rain at night" · Fade out at the end **on** · Voice guidance **off**

| id | Title | List meta | Chips | Description | Choose-row sub | Default duration | Hero art |
|---|---|---|---|---|---|---|---|
| `sleep-sounds` | Sleep Sounds | 20 min · Rain & ocean | 20 min · Rain & ocean · Bedtime | Rain, ocean and soft night sounds to drift off. | 20 min • Rain, ocean, and soft night sounds. | **20** | `6668:3196` (in `6615:3355`): glow 158.4 `#D8B4D8@0.60` blur 30, 5 "sound lines" strokes `#6B5279@0.38→`, moon 30 |
| `quiet-mind` | Quiet Mind | 10 min · Let thoughts settle | 10 min · Let go · Bedtime | Let the thoughts of the day settle before sleep. | 10 min • Let thoughts settle gently. | **10** | `6615:3421` / `6665:3261` |
| `bedtime-breathing` | Bedtime Breathing | 6 min · Slow breaths | 6 min · Slow breaths · Bedtime | Long, slow exhales that tell your body it is time to rest. | 6 min • Slow breaths to relax your body. | **10** (6 is not an option) | `6615:3492` (pattern label "4 · 6") / `6665:3270` |
| `deep-sleep` | Deep Sleep | 25 min · Long soundscape | 25 min · Soundscape · Bedtime | A long, quiet soundscape that fades out as you fall asleep. | 25 min • Longer soundscapes to drift off. | **45** | `6615:3564` / `6665:3278` |

The Sleep choose list (`6190:4171`) also shows **Deep Focus** ("5–10 min • Stay calm and concentrate."). Treat it as a cross-listed mindfulness practice or remove it (design question).

`bedtime-breathing` should drive the breathing orb with a 4 s in / 6 s out pattern but use the sleep player chrome. That is a design question; until answered, use the sleep player with the waveform.

### 3.6 Suggested type

```ts
export type PracticeCategory = 'breathing' | 'relax-body' | 'relax-mind' | 'mindfulness' | 'sleep';
export type PracticeKind = 'breathing' | 'video' | 'audio' | 'sleep';
export interface Practice {
  id: string; title: string; category: PracticeCategory; kind: PracticeKind;
  listMinutes: number; listTag: string;            // "4 min · Focus"
  chips: [string, string, string];                  // duration · tag · level
  level: 'Beginner' | 'Any level' | 'All levels' | 'Any time' | 'Headphones' | 'Bedtime' | string;
  description: string; chooseSubtitle?: string; patternLabel?: string;
  pattern?: { inhale: number; hold: number; exhale: number; holdAfter: number; doubleInhale?: boolean };
  durations?: number[]; defaultDuration?: number;   // minutes
  options: { pace?: boolean; sound?: string; haptics?: boolean; voice?: boolean; fadeOut?: boolean };
  video?: { youtubeId: string; length: string; steps: string[]; goodFor: string[]; equipment: string };
  heroArt: string;  thumb?: string;                 // asset keys (see §4)
  pro: boolean;                                     // not in design — decide
}
```

---

## 4. Asset table

Glows are Skia data, not files (foundations renderer). Only the non-repeating ones are listed per screen family. Icons are from the shared set.

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| `6665:3173` | Aura contours (hub) | Hub | SVG | 375×480 | 7 concentric loops behind ring; static. Same art `6665:3181` on hub alt |
| `6575:1692` | Hero ring | Hub | SVG (code) | 220 | Build with react-native-svg arcs: track `#E8E0D5`, value `#6B5279`, stroke 5.5, knob 18 `#E2CC40`; animated |
| `6666:3175` | Breath rings cover | Hub card | SVG | 155×58 | 4 circles; plus glows `6666:3174` (120 `#7FC6F1@0.55` b24), `6666:3180` (16 `#F2D96A@0.90` b4) |
| `6666:3188` | Soft waves cover | Hub card | SVG | 155×58 | 5 strokes; glow `6666:3187` 130 `#E2CC40@0.55` b26 |
| `6666:3202` | Aura contours cover | Hub card | SVG | 155×58 | 6 loops; glows `6666:3200` 120 `#8E7FA6@0.45` b26, `6666:3201` 70 `#E2CC40@0.30` b18 |
| `6666:3215`–`3219` | Sleep cover | Hub card | SVG + gradient + glow | 155×58 | Gradient `#E6DDEE→#F3E6EE`, moon `6666:3217`, horizon; glow `6666:3216` 110 `#D8B4D8@0.70` b20 |
| `6666:3181` | Play badge | Hub card | Icon (code) | 26 | `#6B5279` circle + play glyph 12 |
| `6575:1777` | icon/history | Hub | SVG | 26 | Not in the icon set; add it as `history` |
| `6614:2040` | icon/search | All practices | Icon | 20 | Add `search` to icon set if missing |
| `6665:3190`, `3199`, `3208`, `3217` | Aura contours (breathing heroes) | Set up breathing | SVG | 327×176 | Same shape; one file; plus rings 150/110 and glows (data) |
| `6668:3173` | Grounding illustration | Set up · Grounding | SVG + glows | 327×176 | 8 loops + glows 211.2 `#8E7FA6@0.40` b40, 140.8 `#E2CC40@0.35` b30, inner 28 `#F2D96A@0.90` b9.3 |
| `6668:3186` | Mindful Focus illustration | Set up · Mindful Focus | SVG + glows | 327×176 | Export |
| `6615:3119`/`6665:3235` | Soothing Melodies hero | Set up | SVG + glows | 327×176 | Export |
| `6615:3191` | Waveform (34 bars) | Set up · Sound Therapy | SVG | 238×70 | Static |
| `6615:3287`/`6665:3252` | Deep Focus hero | Set up | SVG + glows | 327×176 | Export |
| `6668:3196` | Sleep Sounds illustration | Set up · Sleep Sounds | SVG + glow | 327×176 | Sound lines + moon; glow 158.4 `#D8B4D8@0.60` b30 |
| `6615:3421`, `6615:3492`, `6615:3564` (+ `6665:3261/3270/3278`) | Sleep heroes | Set up sleep | SVG + glows | 327×176 | Export each |
| `6668:3207` | Body card art | Release Tension | SVG + glows | 343×152 | 6 soft waves; glows `#E2CC40@0.50` b40, `#FFB3BE@0.30` b30 |
| `6668:3217` | Mind card art | Release Tension | SVG + glows | 343×152 | Aura contours `6668:3220`; glows `#8E7FA6@0.40` b40, `#7FC6F1@0.30` b30, inner 20 `#F2D96A@0.90` b6.7 |
| `6668:3229` | Be Present illustration | Mindfulness choose | SVG + glows | 343×190 | 9 loops `6668:3232` |
| `6668:3243` | Wind Down sunset | Sleep choose | SVG + glow | 343×190 | Sun 80 `#F0C77A`, horizon, 2 arcs; glow 209 `#E2CC40@0.50` b36 |
| `6105:1313` | Breathing orb | Breathing player | Glow + SVG ring (code) | 236 | Animated; layers in 2.7; paused variant in `6615:3618` |
| `6186:3939` | Audio waveform | Audio player | SVG (code) | 318×257 | 40 animated bars (heights in 2.15) |
| `6190:4365` | Sleep waveform | Sleep player | SVG (code) | 318×280 | Same bars, `#B98FC0` |
| `6615:2602` | Shoulder Release hero | Video details | Raster | 327×176 @2x/@3x | Image hash `56cb47…`, FILL |
| `6615:2669` | Neck Tension Reset hero | Video details | Raster | 327×176 | hash `440dfc…` |
| `6615:2736` | Full-Body Relax hero | Video details | Raster | 327×176 | hash `9b8911…` |
| `6615:2803` | Quiet Thoughts hero | Video details | Raster | 327×176 | hash `95fc99…` |
| `6615:2865` | Anxiety Reset hero | Video details | Raster | 327×176 | hash `8f4bc1…` |
| `6615:2927` | Grounding Practice hero | Video details | SVG + glows | 327×176 | Vector, not a photo (inconsistent) |
| `6175:1493`, `6175:1885`, `6175:2016` | Body list thumbs | Relax your body | Raster | 343×148 | `2016` reuses the Shoulder Release photo (`56cb…`) |
| `6175:2156`, `6175:2286`, `6175:2416` | Mind list thumbs | Relax your mind | Raster | 343×148 | `2416` reuses `56cb…` (Shoulder Release photo) |
| `6177:3038` | Player poster | Video player | Raster | 343×212 | Placeholder for the live video |
| `6656:3662` | Logo mark | Paywall | SVG | 72 | Owned by 01 |
| Glows (page) | `Glow · #…` ellipses | all | Glow | 220–270 | blur 90; colours per screen in §2 |

Icons used (shared set): `Icon/Arrow` back (`6589:1632`), chevron-right (`6589:1657`), replay (`6589:1678`), forward-10 (`6589:1684`), close (`6589:1672`); `Icon/Line` leaf (`6598:1785`), activity (`6598:1817`), chat (`6598:1798`), meditate (`6598:1789`), moon (`6598:1792`), heart (`6598:1781`), sparkle (`6598:1814`), check (`6598:1837`), home/journal/user (tab bar); `Icon/Mood` happy (`6598:1722`), neutral (`6598:1739`), very-happy (`6598:1728`), sad (`6598:1763`). Custom glyphs to add: history, search, play (12/18/24), pause, video (14×10), fullscreen.

Audio assets needed (none designed as files): "Soft chime" (breathing cue), "Forest morning" (soundscape), "Rain at night" (map to existing `assets/sounds/rain.mp3`), plus voice-guidance narration per mindfulness/sleep practice. The current set (`birds, zen, rain, stream, ocean, silence`) only covers rain.

---

## 5. Backend and data gaps

1. **`mindfulness` table** (`types/database.types.ts:648-657`) only has `seconds`, `note`, `date_iso`. Add `practice_id text`, `category text`, `kind text`, `completed boolean default true`, `mood_after smallint null` (1–5 matching `Icon/Mood`), `options jsonb` (pace, duration, sound, voice), and `planned_seconds int`. The migration is not in `supabase/migrations/` (the table was created outside it), so add one. Backfill `category` from `note` with the same rules as `stats.tsx:22-36`.
2. **Daily goal**: "of 5h daily goal" needs a per-user `mindful_daily_goal_minutes` (profile column or settings row). No UI to set it is designed.
3. **Delta vs yesterday** and **day streak**: compute client-side from sessions (streak logic exists in `stats.tsx:177-190`; move it into a selector).
4. **Favourites**: heart button on Set up / Video details needs a `practice_favourites (user_id, practice_id, created_at)` table. No favourites list is designed.
5. **Pro gating**: there is no Pro flag per practice in the design and no lock badge. `useSubscription().hasFullAccess` (`hooks/useSubscription.ts:151-187`) exists. Add `pro: boolean` to the catalogue and route locked taps to the paywall.
6. **Partial sessions / resume**: the End early copy promises "you can pick it up any time". Store `completed=false` + `elapsed_seconds`, and offer resume on Set up (not designed).
7. **Haptics**: `expo-haptics` is installed but unused in the breathing flow. Fire a light impact at each phase change when "Haptic cues" is on.
8. **Voice guidance and soundscapes**: narration files and the "Soft chime" / "Forest morning" loops do not exist. Decide on bundled versus remote (Supabase storage) audio. `lib/soundscape.ts` needs fade-in/out and volume ramp for "Fade out at the end".
9. **YouTube channel videos**: the design sources every video from "YouTube · INNER GLOW channel". `data/stressVideos.ts` holds third-party ids with different titles. Real ids for the 6 videos are needed, and thumbnails should be bundled (rasters above) or taken from `img.youtube.com`.
10. **Video completion logging**: the video player never writes a session. Log on end or ≥ 90 % watched.
11. **Mood after**: History shows mood per session, but no screen captures it. Add a 5-face row to the Complete modal (needs a design) or derive it from the next check-in (worse).
12. **i18n**: all new copy needs keys in `i18n/locales/en/translation.ts`. Remove the obsolete `newExercise`, `mindfulCompleted` and `mindfulStats` blocks (`:1407-1460`) when the screens are replaced.

---

## 6. Blockers and design questions

- **Hold phase copy is missing.** Only "Breathe in" / "Breathe out" are designed, but Box and 4-7-8 need "Hold". Proposed: "Hold" / "Stay soft and still." Confirm.
- **Orb sizes per phase are identical** in the in/out frames. The animation scale range (0.7→1.0) is an implementation assumption.
- **Durations disagree.** List meta versus default duration pill: Box 4 min vs 3 min default; Coherent 6 vs 5; Mindful Focus 7 vs 5 (no 7 option); Soothing Melodies 9 vs 10; Bedtime Breathing 6 vs 10 (no 6 option); Deep Sleep 25 vs 45. Hub card ranges ("3–5 min" Mindfulness, "5–10 min" Sleep) do not match the catalogue (7–25 and 6–25). The video choose-cards say "2–6 min" for every video.
- **Player placeholders**: breathing player shows "05:21 / 25:00" and "1 of 3 breaths" for a 3-minute practice; video player header says "2 min • Body " while the video is 2:15.
- **Copy typos**: trailing U+2028 in "Best if your mind feels busy or racing.", "Helpful when you feel distracted." and "Rain at Night"; leading/trailing spaces in the audio player subtitle; trailing space in "2 min • Body "; Full-Body Relax choose subtitle duplicates Shoulder Release's; "[ Beginner ]  [ No equipment ]" is bracket placeholder text; sleep complete title says "Winding Down complete." while the practice is "Sleep Sounds".
- **Old palette and wrong fonts**: `#9BB068@0.25` selection rings (Relax cards, video player card, sleep segmented control); `#5B6B3C` olive on audio waveform edge bars (`6186:3940` etc.); Tailwind greys `#E5E7EB`, `#F3F4F6` (video control pill), `#F5F5F4` (history bar tracks), `#44403B` (video steps); **Inter** for player times, video time and the sleep track title.
- **Grounding Practice** video uses vector art instead of a photo. Two list thumbnails reuse the Shoulder Release photo, so the real thumbnails are missing.
- **Deep Focus** appears in both the Mindfulness and Sleep lists.
- **Paywall claims "All 40+ practices"**, but the catalogue has 19. No practice is marked Pro, and there is no locked state on cards or rows.
- **History bar colour rule** is unclear (Sunday `#6B5279`). The History rows have no tap target, so the fate of `session-detail.tsx` is undecided.
- **Not designed**: sound/soundscape picker, favourite filled state, favourites list, daily-goal setting, mood-after capture, pause glyph, empty states (no sessions, search no results), loading states, End early sheet for non-breathing players.
- **Board metadata**: Relax · Mind step captions all read "3 · Video details", and the paywall has no incoming arrow. Most screen frames are still named "Mental Health Assessment" / "Mindful Hours", and text layers carry stale names ("Expression Analysis", "I am Male", "Use FA").

---

## 7. Proposed tasks

1. Add `data/practices.ts` with the 19-practice catalogue, `Practice` type and category metadata from §3 and §2.2 (tints, icons, glows), and delete `data/breathingExercises.ts` and `data/stressVideos.ts` usages once callers move (07 §3).
2. Add a Supabase migration extending `mindfulness` with `practice_id`, `category`, `kind`, `completed`, `elapsed_seconds`, `planned_seconds`, `mood_after`, `options`, backfill `category` from `note`, regenerate `types/database.types.ts`, and update `hooks/useMindfulness.ts` and `MindfulEntry` (07 §5.1).
3. Add `practice_favourites` table, a `useFavourites` hook and the Favourite heart button for Set up and Video details (07 §2.6, §5.4).
4. Add the daily mindful goal setting (profile column, default 300 min) and selectors for today's minutes, delta vs yesterday, week buckets and streak (07 §2.1, §2.3, §5.2–5.3).
5. Export mindful SVG art from Figma (hub aura, four hub card covers, breathing aura hero, Grounding / Mindful Focus / Soothing Melodies / Sound Therapy / Deep Focus heroes, four sleep heroes, Release Tension body/mind art, Be Present and Wind Down illustrations, Grounding Practice video hero) into `assets/practices/` as react-native-svg components, and record each glow as data (07 §4).
6. Export the video raster heroes and list thumbnails at @2x/@3x (`6615:2602`, `2669`, `2736`, `2803`, `2865`, `6175:1493`, `1885`, `2016`, `2156`, `2286`, `2416`) and request distinct photos for Full-Body Relax and Grounding Practice thumbnails (07 §4).
7. Source and add audio assets: "Soft chime" cue, "Forest morning" soundscape, voice-guidance narration per mindfulness and sleep practice; extend `lib/soundscape.ts` with fade-in/out and end-of-session fade (07 §4, §5.8).
8. Rebuild the Mindful Hours hub `mindful/index.tsx` with the goal ring, delta pill, history button, "Choose your practice" grid and cover art (07 §2.1).
9. Build All practices `mindful/all.tsx` with search, category pills and sectioned practice rows, plus a shared `PracticeRow` component (07 §2.2).
10. Replace `mindful/stats.tsx` with History `mindful/history.tsx`: week summary card, 7-day category bars and session rows with mood faces; decide on `session-detail.tsx` (07 §2.3).
11. Build the category screens: Breathe & reset with tip card, Release Tension body-or-mind chooser, Relax your body / mind video lists, Be Present and Wind Down lists, all from `mindful/category/[category].tsx` (07 §2.5, §2.10, §2.11, §2.14).
12. Build the Set up screen `mindful/practice/[id].tsx` for breathing, mindfulness and sleep with hero, chips, options card (pace, duration, sound row, toggles) and Start practice CTA; remove `new-exercise.tsx` (07 §2.6).
13. Build the Video details variant of `mindful/practice/[id].tsx` with hero badges, "What you'll do", "Good for", Source and Play video CTA (07 §2.12).
14. Rebuild the breathing player `mindful/play/[id].tsx` (kind breathing): glow orb animation per phase with pace, breath counter, progress bar, 56/80/56 controls, haptic cues, and the paused orb state (07 §2.7).
15. Build the audio and sleep player variants with the animated 40-bar waveform, voice-guidance segmented control, track name and fade-out (07 §2.15, §2.16).
16. Rebuild the video player with the YouTube iframe inside the bordered card, custom control pill, level/equipment chips and session logging on completion; replace `stress/list/[category]/[videoId].tsx` (07 §2.13, §5.10).
17. Add the shared End early sheet and Complete modal (four title variants, Back to Mindful Hours, Reflect with Glow AI) to all players, saving partial sessions; delete `mindful/completed.tsx` (07 §2.8, §2.9).
18. Add Pro gating: `pro` flag per practice, lock handling on hub cards, rows and Start CTA, routing to the shared paywall with the "Unlock every practice" copy (07 §2.4, §5.5).
19. Move all new Mindful Hours copy into `i18n/locales/en/translation.ts` and remove obsolete `newExercise`, `mindfulCompleted`, `mindfulStats`, `stressBreathing`, `videoDetail` keys (07 §5.12).
20. Retire the old stress practice routes (`stress/index.tsx`, `stress/breathing.tsx`, `stress/breathing/[id].tsx`, `stress/list/*`) and repoint `app/(suggestion-actions)/mindful.tsx` and `stress.tsx` to the new hub and Relax category (07 §1.3).
21. Raise the design questions in §6 with design (hold copy, duration mismatches, Pro set, mood capture, pickers, empty states, palette and Inter leftovers) before tasks 12–17 are finalised (07 §6).
