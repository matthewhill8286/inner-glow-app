# 09 — New screens: Glow AI states, Sleep Month/Year, Mood explained, empty states

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456`. All 14 screens sit inside the section "New screens — to place" (`6786:4878`), grouped under sub-sections named "06 · Home & Glow score", "07 · Mood", "08 · Journal", "09 · Glow AI" and "11 · Sleep". Coordinates are points relative to the 375-wide screen frame. Typography is written as `Urbanist Weight size/line-height colour`; every text node here uses `auto` line height and 0 letter spacing, so only size and colour are given.

This document only describes what is new or different from the existing handoff docs:

- `05-glow-ai-search-errors.md` (Glow AI home, conversation, voice listening, orb, bubbles, practice card).
- `06-sleep-profile-settings.md` §S8 and §4.6 (Sleep insights week view).
- `04-journal-mood.md` §A, §B3, §M1 and §M6 (mood scale, mood home, mood history calendar).
- `03-home-notifications.md` §2.1 to §2.3 (Home, Glow/Freud score, score history).

Foundations are built. This doc refers to the real components: `AppButton` and `IconFab` (`components/ui/AppButton.tsx`), `IconButton`, `TitlePill`, `StepTag` and `TopNav` (`components/ui/IconButton.tsx`), `AppField` (`components/ui/AppField.tsx`), `Chip`, `MetaChip` and `Tag` (`components/ui/Chip.tsx`), `Toggle`, `SegmentedControl`, `LegalNote` and friends (`components/ui/controls.tsx`), `GlowField`, `Glow`, `GlowOrb` and `MiniGlowOrb` (`components/glow/Glow.tsx`), `GlowTabBar` (`components/navigation/GlowTabBar.tsx`), `Icon` and `iconData.ts`, and the tokens in `constants/theme.ts` and `constants/typography.ts`.

Renders are in the session scratchpad at `figma/shots/new/<node-id>.png`.

## 1. Overview

| Screen id | Name | Size | Sub-section | Code route |
|---|---|---|---|---|
| 6787:5189 | Glow AI · Conversation history | 375x812 | 09 · Glow AI | `app/(tabs)/chat/history.tsx` |
| 6787:5301 | Glow AI · Sending | 375x900 | 09 · Glow AI | `app/(tabs)/chat/[issueKey].tsx` |
| 6787:5388 | Glow AI · Voice · Thinking | 375x812 | 09 · Glow AI | none (voice mode is not built) |
| 6787:5420 | Glow AI · Voice · Paused | 375x812 | 09 · Glow AI | none |
| 6787:8807 | Glow AI · No talks yet | 375x812 | 09 · Glow AI | `app/(tabs)/chat/history.tsx:82-110` (empty list) |
| 6787:7123 | Sleep insights · Month | 375x1000 | 11 · Sleep | `app/(tabs)/sleep/insights.tsx` |
| 6787:7263 | Sleep insights · Year | 375x1000 | 11 · Sleep | `app/(tabs)/sleep/insights.tsx` |
| 6787:8705 | Sleep · No data yet | 375x812 | 11 · Sleep | `app/(tabs)/sleep/index.tsx` (no empty branch) |
| 6787:8520 | Home · First day | 375x812 | 06 · Home & Glow score | `app/(tabs)/home.tsx` (no first-day branch) |
| 6787:8760 | Glow score · History empty | 375x812 | 06 · Home & Glow score | `app/(tabs)/freud-score/index.tsx:786-800` |
| 6787:8576 | Journal · Empty | 375x812 | 08 · Journal | `app/(tabs)/journal/index.tsx:447-480` |
| 6787:8631 | Mood · History empty | 375x812 | 07 · Mood | `app/(tabs)/mood/history.tsx:241-268` |
| 6787:9184 | Mood · This week explained | 375x812 | 07 · Mood | `app/(tabs)/mood/index.tsx:297-394` (week card) |
| 6787:9281 | Mood · Day details | 375x814 | 07 · Mood | `app/(tabs)/mood/[id].tsx` (full page today; design is a sheet) |

All screens: background `#F7F4F2`, status bar `System/Status Bar : Content=Dark` (6746:4411), home indicator `System/Home Indicator` (6746:4444). Both are handled by foundations.

## 2. New shared pieces in these screens

These are library components that appeared in the file since the earlier audits. Each is used on two or more screens here.

### 2.1 Nav Bar (`Nav Bar : Theme=Light`, 6753:4165)

- Frame 327x44 at (24,54), horizontal, gap 8.
- Back button (`Back Button : Theme=Light`, 6746:4449): 44x44, fill `#FFFFFF`, stroke 1 `#CFC6D6`, radius 22, `Icon/Arrow back` 22 (6589:1632) at (11,11).
- Title: 223 wide, centred, `Urbanist SemiBold 15 #4E3A5E`.
- Right slot: empty 44x44 frame that keeps the title centred.
- Used on 6787:5189, 7123, 7263, 8631, 8760, 8807, 9281.
- The chat header (5301, 5388, 5420) uses the same Back Button instance without the title layout.

Code: `IconButton` has no white-filled variant with a `#CFC6D6` stroke. Its `outline` variant draws a transparent 1.5 `#6B5279` ring, and `TopNav` uses a 48 button with a left-aligned SemiBold 20 title. Add a `NavBar` (centred title, 44 back, 44 right slot) and an `IconButton` variant `variant="nav"` (white fill, 1 `#CFC6D6` stroke). `#CFC6D6` is not in `palette`; add it as `borderSoft` (it is also the grabber colour in §2.6 and the empty-day stroke in §3.14).

### 2.2 List Row, grouped (`List Row`, Style=Grouped)

Two variants: `Trailing=Value` (6746:4487) and `Trailing=Chevron` (6746:4458).

- Group container: 327 wide, fill `#FFFFFF`, radius 24, no padding, rows stacked with gap 0.
- Row: 327x60, horizontal, padding 12/16, gap 12, centred vertically.
- Icon disc 36x36, fill `#F1ECF5` (`palette.selected`), radius 18, `Icon/Line` 20 at (8,8). Icon colour is the default `#6B5279`.
- Text column, gap 2: label `Urbanist Medium 15 #241A2E`; optional supporting text `Urbanist Regular 12 #736B66`. When there is no supporting text the label is centred in the row.
- Trailing value: `Urbanist Regular 13 #736B66`, right aligned to x=311.
- Trailing chevron: `Icon/Arrow chevron-right` 18 (6589:1657) at (293,21).
- Divider on every row except the first: 247x1 `#EFEAF2` (`palette.surfaceLilac`) at (64,0), so it starts under the label, not under the icon.

Code: no list row component exists. `components/ConversationRow.tsx` is a bordered card. Add `components/ui/ListRow.tsx` with a `ListGroup` wrapper.

### 2.3 Search Field (6753:4157)

- 327x48, fill `#F5F1F7` (`palette.surfaceLilacSoft`), stroke 1 `#E6E0EA` (`palette.borderLilac`), radius 24, padding 0/16, gap 10.
- Search glyph 20x20, stroke 1.5 `#8E7FA6`. It is an inline vector (`Icon / search`), not an `Icon/Line` instance.
- Placeholder `Urbanist Regular 14 #A6A09B`.

This is a different look from the search header in `05` §4.1 (white, 219 wide, focus ring). `AppField` is a 56 white pill and does not match. Add a `SearchField` component, and add `line/search` to the icon set (see §5).

### 2.4 Empty state (identical block on six screens)

Frame "Empty" 327x292, vertical, padding 40 top and 8 bottom, gap 12, centred.

- Illustration 160x160:
  - Glow ellipse 128x128 at (16,16), colour per screen at 0.35, LAYER_BLUR 40 (Skia).
  - "Aura" frame 160x160 with five concentric wobbly contours, stroke 1 `#6B5279` at opacity 0.30, 0.25, 0.20, 0.15 and 0.10 from inside out. Sizes 41.2, 67, 91, 112.4 and 131.6. This is static vector art; export one SVG.
  - Core 22x22 at (69,69), radial gradient `#FFF6D6` (0) → `#F2D96B` (1). `#F2D96B` is one step off the `gold` token `#F2D96A`; use the token.
- Title at y=212, centred: `Urbanist SemiBold 22 #241A2E` (`Type.titleMd`).
- Body at y=250, 327 wide, centred, two lines: `Urbanist Regular 14 #736B66` (`Type.bodySm`).

Glow colour per screen:

| Screen | Glow colour | Title | Body |
|---|---|---|---|
| Home · First day | `#E2CC40` | Your glow starts today | Do your first check-in and we’ll start building your Glow score. It takes about a minute. |
| Journal · Empty | `#D8B4D8` | Your sky is still empty | Each entry becomes a star. Write a few lines or just say it out loud. |
| Mood · History empty | `#FFB3BE` | No check-ins yet | Log how you feel once a day and your month will fill with colour. |
| Sleep · No data yet | `#7FC6F1` | Let’s learn how you sleep | Connect Apple Health to bring in sleep from your watch, or log your nights by hand. |
| Glow score · History empty | `#E2CC40` | Your history will show here | After 3 days of check-ins you’ll see how your Glow score changes and why. |
| Glow AI · No talks yet | `#D8B4D8` | No talks yet | Whatever’s on your mind, Glow AI is here to listen without judgement. |

Code: `components/ui/StatusState.tsx` is the only shared state component and is an error/retry block. Add `components/ui/EmptyState.tsx` with props `glowColor`, `title`, `body` and an optional `children` slot for the action. Remove the emoji and `MaterialIcons` empty states listed in §3.

### 2.5 Tag (`Tag : Style=Default`, 6753:4146)

- Height 22, fill `#F1ECF5`, radius 999, padding 4/10, gap 4.
- Text `Urbanist SemiBold 12 #6B5279`.
- Used read-only for the mood factors in §3.14.

Code: the existing `Tag` in `Chip.tsx` is h24, padding 8, Bold 12 `#4E3A5E`, with a remove button. `MetaChip variant="meta"` is h22 with padding 10 but has fill `#E8E0D5` and text `#4E3A5E`. Neither matches. Add a `variant="soft"` to `MetaChip` (fill `palette.selected`, text `palette.plum`, `Type.caption`).

### 2.6 Bottom sheet (Mood · Day details)

- Overlay 375 x full height, `#241A2E@0.45` (matches `palette.overlay`).
- Sheet: full width, fill `#F7F4F2`, top radius 32 (bottom 0), padding 12/24/40/24, gap 16, content centred.
- Grabber 40x4, `#CFC6D6`, radius 2.

This differs from the crisis sheet in `04` §C (top radius 36, grabber 40x5 `#D6CCC0` radius 3). Build one `BottomSheet` with these values and pass the radius if the crisis sheet must keep 36.

### 2.7 Button variants used

- `Button : Type=Primary, Size=L` (6746:4319): 327x56, `#6B5279`, label `SemiBold 16 #FFFFFF`. This is `AppButton variant="primary" size="md"`.
- `Button : Type=Ghost, Size=L` (6746:4323): 327x56, no fill, label `SemiBold 16 #6B5279`. `AppButton variant="ghost"` has a `#F1ECF5` fill and `variant="text"` is 48 high with a 15 label. Use `variant="text"` with `style={{ height: 56 }}` and `textStyle={{ fontSize: 16 }}`, or add a `size` option to the text variant.
- Bottom CTAs on Nav Bar screens (8631, 8760, 8807, 9281) sit in an "Actions" frame at y=674 (y=676 on 9281), padding 0/24. With the 34 home indicator this leaves 48 above the bottom edge.

## 3. Screens

### 3.1 Glow AI · Conversation history [6787:5189]

Opened from "See all" on the Glow AI home (`05` §3.1 item 8). No tab bar.

1. Glows: `#D8B4D8@0.25` 280 at (-70,-50) blur 90; `#7FC6F1@0.15` 220 at (200,40) blur 90.
2. Nav Bar (§2.1), title "Your talks".
3. Content from y=116, padding 0/24, gap 24:
   - Search Field (§2.3) at y=116, placeholder "Search your talks".
   - Group "This week" at y=188: label `Urbanist Bold 12 #8E7FA6`, then the list group 10 below. Three `Trailing=Value` rows:
     - chat icon, "Morning overwhelm" / "Box breathing helped a little" / "Today".
     - moon icon, "Can’t switch off at night" / "A wind-down plan for 23:00" / "Tue".
     - heart icon, "Talking to Anna" / "How to keep it gentle" / "Sun".
   - Group "Earlier" at y=416, same layout:
     - chat icon, "Deadline stress" / "Breaking it into small steps" / "12 Oct".
     - leaf icon, "Feeling flat" / "Noticing small good moments" / "8 Oct".
     - sparkle icon, "First chat" / "Getting to know Glow AI" / "2 Oct".
   - Legal note (`LegalNote`) at y=644: "Talks are private to you. Delete any talk by swiping left."

Interaction:

- Grouping: "This week" holds talks from the current Monday-start week; "Earlier" holds the rest. Dates inside this week show "Today" or the short weekday; older dates show "d MMM".
- The icon is a topic icon, not the mood icon used on the Glow AI home rows (`05` §3.1). The mapping from talk to icon is not designed. Proposal: derive it from the summary topic (anxiety → chat, sleep → moon, relationships → heart, low mood → leaf, first/onboarding talk → sparkle).
- Row tap opens the conversation. Swipe left reveals delete, which needs a confirm alert.
- Search filters on title and summary as the user types. A "no matches" state is not designed; reuse the empty state with title "No talks found".

Gaps vs code (`app/(tabs)/chat/history.tsx`):

- Header is `ScreenHeader` with "Conversation history" and a subtitle (lines 45-50). Replace with Nav Bar "Your talks".
- Search is `AppField` with a label "Search conversations" and placeholder "Search by conversation, coach or topic" (lines 51-58). Replace with Search Field "Search your talks" and no label.
- Rows are `ConversationRow` bordered cards with persona and topic (lines 111-126, `components/ConversationRow.tsx`). Replace with grouped List Rows, sectioned by week.
- The empty state (lines 82-110) becomes §3.5.
- There is no swipe-to-delete. Only per-conversation clear exists in the conversation screen (`05` §3.3).
- Data: talk title, one-line summary and topic icon are not stored (see §6).

### 3.2 Glow AI · Sending [6787:5301], 375x900

Same layout as the Conversation screen in `05` §3.3. Only the differences are listed.

1. Corner glows: `#E2CC40@0.28` 280 at (-50,-20) blur 80 and `#D8B4D8@0.25` 220 at (180,60) blur 80. `05` §1 had 0.22 and 0.28.
2. Header: back button is now the Nav Bar back (white, `#CFC6D6` stroke). The mini orb outer layer is `#E2CC40` at full opacity (`05` §2.1 and `MiniGlowOrb` use 0.50). Status "● Here for you" is `Urbanist Medium 11 #8E7FA6` (was `#838264`).
3. Message list from y=118. Rows are 13 apart (`05` said 10). The day stamp is 13 above the first bubble. The two message blocks are 17 apart.
4. Practice card: glow is `#7FC6F1@0.18` (was 0.40). The eyebrow is `Urbanist Medium 10 #8E7FA6` (was Bold). Padding 16/16/10/16, gap 5. The Start pill is 66x24.
5. New: **delivery receipt** under the latest user bubble. "Sent · 08:44", `Urbanist Medium 11 #A6A09B`, right-aligned to x=351, 4 below the bubble. Show it only on the latest user message.
6. New: **typing bubble** 68x36 at x=24, fill `#FFFFFF`, radii TL 22 / TR 22 / BR 22 / BL 6 (same tail as the AI bubble), padding 14/16, gap 6. Three dots 8x8 `#8E7FA6` at opacity 1.0, 0.6 and 0.3. This replaces the `05` §2.4 spec (59x31, 7 px `#6B5279` dots, gap 5, radius 18).
7. New: caption "Glow AI is typing…" 4 below the typing bubble, left at x=24, `Urbanist Medium 11 #A6A09B`.
8. Composer at y=777 (pinned), unchanged from `05` §2.3. It shows the mic button because the field is empty after sending.

Interaction: on send, the user bubble appears at once. The receipt "Sent · HH:mm" appears when the message is saved. The typing bubble and caption show until the reply arrives. A failed send keeps the existing retry block.

Gaps vs code (`app/(tabs)/chat/[issueKey].tsx`):

- `components/TypingBubble.tsx:12-24` uses 8 px `#aaa` dots with gap 6, a single active dot and no pill. Restyle to item 6 and cycle the opacity ramp.
- The typing row draws a persona avatar (lines 548-553). Remove it and add the caption.
- Per-message times are drawn inside every bubble (lines 96-101). Replace with the day stamp (`05`) and this single receipt.
- There is no "saved" state per message. `saveMessages` resolves before `sendChatToAI` (lines 309-311), so the receipt can be set after that await.
- `MiniGlowOrb` draws the outer layer at 0.5 (`components/glow/Glow.tsx:123`). Figma now draws it at 1.0. Confirm before changing (see §8).

### 3.3 Glow AI · Voice · Thinking [6787:5388]

Same layout as Voice mode in `05` §3.4. Differences:

1. Header status "● Thinking…" `Urbanist Medium 11 #8E7FA6`. Back button is the Nav Bar back.
2. Orb (S=266, centre 187.5,340) at reduced opacity. The geometry matches `GlowOrb` exactly; only the opacities change:

| Layer | Listening (`05`) | Thinking / Paused |
|---|---|---|
| Outer `#D8B4D8`, blur 56 | 0.50 | 0.25 |
| Blue `#7FC6F1`, blur 42 | 0.35 | 0.18 |
| Yellow `#E2CC40`, blur 30.8 | 0.60 | 0.28 |
| Core `#FFF6D6`, blur 14 | 0.95 | 1.00 |

3. Ripple rings 300, 250 and 200 at the same centre, stroke 1 `#6B5279`, drawn at full opacity and not animated (Listening uses 0.10, 0.16 and 0.24).
4. Transcript "“I think the hardest part is the mornings…”" in a 295 box at (40,540), centred, `Urbanist SemiBold 18 #241A2E`. Listening uses Medium 18/150%. This shows the user's last utterance while Glow AI prepares a reply.
5. Controls are unchanged: Mute 56 at (68,662), End 72 at (151.5,654), Text 56 at (251,662), labels at y=732 `Urbanist Medium 12 #736B66`.

### 3.4 Glow AI · Voice · Paused [6787:5420]

Same as Thinking, with:

- Status "● Muted · tap to talk".
- Line "Glow AI is waiting for you." `Urbanist SemiBold 18 #241A2E`, centred at y=540.
- Mute button shows `Icon/Line mic-off` 22.4 (6764:5036), and its label reads "Unmute".
- The controls row moves up to y=632 because the text is one line. This looks unintended; keep the controls pinned at y=654 in every voice state.

Interaction: tapping the mute button toggles Listening ↔ Paused. Tapping the orb or the status line in Paused also unmutes ("tap to talk"). Thinking starts when the user stops speaking and ends when the reply audio starts (then back to Listening).

Gaps vs code (both voice screens): nothing exists. `05` §3.4 lists the backend gaps (no streaming STT, no TTS). `expo-audio` is installed. `GlowOrb` needs an `intensity` or `dimmed` prop so Thinking/Paused can halve the opacities, and `breathing={false}` should be used while paused. `line/mic-off` is missing from `iconData.ts`.

### 3.5 Glow AI · No talks yet [6787:8807]

The empty state of §3.1.

- Glows `#E2CC40@0.15` 220 at (200,40) blur 90; `#D8B4D8@0.25` 280 at (-70,-50) blur 90.
- Nav Bar "Your talks".
- Empty state (§2.4) with content top at y=116. The Search Field is not shown when there are no talks.
- "Start talking" primary button at (24,674). It opens the new chat screen (`05` §3.2).

Gap: `chat/history.tsx:82-110` shows "Your conversations will appear here" and an outline "Start a conversation" button inline under the search field. Replace with this layout. When a search returns nothing, keep a separate "no matches" message (not designed).

### 3.6 Sleep insights · Month [6787:7123], 375x1000

Same structure as S8 (`06` §S8). Differences:

1. Glows: `#D8B4D8@0.25` 280 at (-60,-40) blur 90 and `#E2CC40@0.28` 220 at (200,40) blur 90. S8 has the yellow at 0.15.
2. Nav Bar "Sleep insights" (S8 had its own header; now the shared Nav Bar).
3. Period control at (24,112), 327x44, fill `#FFFFFF`, stroke 1 `#E6E0EA`, radius 999, padding 4, gap 4. Segments 102–105 x 34, radius 999. Active "Month": fill `#F1ECF5`, stroke 1.5 `#6B5279`, `Urbanist SemiBold 14 #6B5279`. Inactive: `Urbanist Medium 14 #736B66`. S8 drew this at 40/32 with 13 pt labels, so the week screen should be updated to match.
4. Average at (24,177): "Average" `Urbanist Bold 12 #8E7FA6`; "7h 18m" `Urbanist Regular 40 #241A2E` at y=195; delta "+12 min vs September" `Urbanist Medium 13 #6B5279`, right-aligned to x=351, y=211. The comparison is against the previous calendar month.
5. **Bar chart** (replaces the week line chart for this period) in frame (24,257) 327x150:
   - Goal line: dashed 4/4, 1 px, `#8E7FA6@0.30`, full width at chart y=32. Label "Goal 8h" at chart (276,6), `Urbanist Regular 11 #8E7FA6`.
   - One bar per night: width 6, radius 3, pitch 10.5, first bar left at chart x=8.3. Bar bottom at chart y=140.
   - Bar top y = 150 − (hours − 5) × 39.33, the same scale as the S8 line (8 h at y=32). Clamp the top to [0,134] so a short night still shows a 6 pt bar.
   - Fill: vertical linear gradient, `#E2CC40` at the top → `#8E7FA6@0.50` at the bottom.
   - Nights with no data draw no bar.
   - Mock: 30 bars. Their tops give an average of about 7h 22m, close to the shown 7h 18m.
6. Axis labels at chart y=158: "1", "8", "15", "22", "30", `Urbanist Regular 11 #736B66`. In Figma they are spaced evenly with space-between, so "30" sits near bar 25. Centre each label under its bar instead: x = 8.3 + 10.5 × (day − 1) + 3. Show the last label as the last day of the month (31 for October).
7. "What helps your sleep" (label y=449, card y=471), "What gets in the way" (label y=604, card y=626): identical to S8, including copy and values.
8. Ask chip at (24,759), 327x55 (S8: 52), padding 14/56/14/16, gap 10. Orb 24 radial `#FFF6D6` → `#6B5279` at (17.5,15.5); text at x=51.5 `Urbanist SemiBold 15 #6B5279`.
9. Legal note at (24,828), two lines: "Sleep data is an estimate from your phone, not a medical assessment."

### 3.7 Sleep insights · Year [6787:7263], 375x1000

Same as Month with:

- Active segment "Year" (217,5) 105x34.
- "7h 05m" and "+20 min vs 2025" (previous calendar year).
- Bar chart with 12 bars, one per month: width 14, radius 7, pitch 26.25, first bar left at chart x=12.1. Same scale, gradient, bottom and goal line. Each bar is the monthly average of nights with data.
- Axis labels "J F M A M J J A S O N D" at chart y=158, `Urbanist Regular 11 #736B66`, each in a 26.3 slot starting at x=6. These line up with the bar centres (19.1 + 26.25 × i).
- The mock bar heights are a copy of the first 12 Month bars, and November and December have bars although the mock date is 30–31 October. Future months must draw no bar.

Gaps vs code (`app/(tabs)/sleep/insights.tsx`), in addition to `06` §S8:

- Periods are `'1 Day' | '1 Week' | '1 Month' | '1 Year' | 'All Time'` (line 49). Use Week / Month / Year only.
- The chart always plots the last 7 entries whatever the period (`filteredEntries.slice(0, 7)`, lines 206-219) on a 10 h max (line 221). Month needs one bar per night of the calendar month and Year needs 12 monthly averages.
- The period filter is a rolling 30 or 365 days (lines 193-204). Design compares calendar month vs previous month and calendar year vs previous year.
- `SegmentedControl` (`components/ui/controls.tsx:96-125`) is 56/48 with `bodyStrong` 16 labels in `#241A2E`/`#4E3A5E`. Add a `size="sm"` (44 track, 34 segments, 14 pt labels, active `#6B5279` SemiBold, inactive `#736B66` Medium, 1 px `#E6E0EA` track stroke).
- The "What helps" and "What gets in the way" values are identical across Week, Month and Year in the mock. Confirm they should be computed per period (see §8).

### 3.8 Sleep · No data yet [6787:8705]

Shown on the Sleep tab screen when the user has no sleep entries. The tab bar shows Home active (Sleep is not a tab).

1. Glows: `#7FC6F1@0.15` 220 at (200,40) blur 90; `#D8B4D8@0.25` 280 at (-70,-50) blur 90.
2. Title "Sleep" at (24,70), `Urbanist SemiBold 30 #241A2E` (`Type.titleXl`). There is no back button and no right-side button.
3. Empty state (§2.4) at y=130.
4. List group at (24,446), two `Trailing=Chevron` rows:
   - `Icon/Line health` (6598:1825), "Connect Apple Health" / "Sleep, heart rate, steps". Opens the Health permission flow.
   - `Icon/Line moon`, "Log sleep manually" / "Takes 20 seconds each morning". Opens `/(tabs)/sleep/log`.
5. `GlowTabBar`, Active=Home, at y=720.

Gaps vs code (`app/(tabs)/sleep/index.tsx`):

- There is no empty branch. With no entries, `computeSleepStats` returns zeros and the label "No Data" (lines 32-34) and the full dashboard still renders.
- There is no HealthKit or Health Connect integration in the project. On Android the row should read "Connect Health Connect" or be hidden (not designed).
- The header uses `t('sleepHome.title')` plus a subtitle (lines 313-319). Design has the title only.

### 3.9 Home · First day [6787:8520]

Shown on Home before the first check-in.

1. Glows: `#E2CC40@0.15` 220 at (200,40) blur 90; `#D8B4D8@0.25` 280 at (-70,-50) blur 90. The regular Home uses `#E2CC40@0.25` and `#7FC6F1@0.20` (`03` §2.1).
2. Greeting "Good morning, Matthew" at (24,70), one line, `Urbanist SemiBold 26 #241A2E` (`Type.titleLg`). Use `getGreeting` and the profile first name.
3. Empty state (§2.4) at y=125, yellow glow.
4. "Do my first check-in" primary button at (24,441). It opens the mood check-in (`04` §M2).
5. `GlowTabBar`, Active=Home.

There is no avatar, search button, bell, Glow AI input or Free plan card on this screen. See §8 for whether that is intended.

Gaps vs code (`app/(tabs)/home.tsx`): there is no first-day branch. The screen always renders the dashboard with a 0 score (line 109) and the emoji `MoodFlow` placeholder (lines 573-585). Condition: show this state when the user has no mood check-ins and no Glow score records.

### 3.10 Glow score · History empty [6787:8760]

Empty state of Score history (`03` §2.3). No tab bar.

- Glows as §3.9.
- Nav Bar "Glow score". The earlier screens call this "Freud Score"; these screens rename it to "Glow score" (see §7).
- Empty state (§2.4) at y=116, yellow glow.
- "Check in now" primary button at (24,674). It opens the mood check-in.

Rule from the copy: the history appears after 3 days of check-ins. Show this state while the user has fewer than 3 distinct check-in days.

Gaps vs code: `app/(tabs)/freud-score/index.tsx:786-800` shows a 📊 emoji and `t('freudScore.noHistory')` inside the score screen. There is no dedicated history route yet (`03` §2.3). The 3-day rule does not exist.

### 3.11 Journal · Empty [6787:8576]

1. Glows: `#E2CC40@0.15` 220 at (200,40) blur 90; `#D8B4D8@0.25` 280 at (-70,-50) blur 90.
2. Title "Journal" at (24,70), `Urbanist SemiBold 30 #241A2E`. J1 (`04`) has it at y=60 with Search and Stats buttons; this state has no buttons.
3. Empty state (§2.4) at y=130, lilac glow.
4. "Write my first entry" primary button at (24,446). It opens `/journal/new`. The body mentions speaking, but there is no Speak action; see §8.
5. `GlowTabBar`, Active=Journal.

Gap: `app/(tabs)/journal/index.tsx:447-480` renders a bordered card with a `MaterialIcons` "edit-note" icon, `t('journalHome.noJournalsYet')` and `t('journalHome.startWriting')` under the rest of the dashboard. Replace the whole screen body with this state when the user has no entries.

### 3.12 Mood · History empty [6787:8631]

- Glows as §3.11.
- Nav Bar "Mood history".
- Empty state (§2.4) at y=116, rose glow. The calendar, legend and summary card from `04` §M6 are hidden.
- "Log my mood" primary button at (24,674). It opens the mood check-in.

Gap: `app/(tabs)/mood/history.tsx:241-268` shows a 🌙 emoji, "No mood entries yet" and "Start tracking your mood to see your history here." in a shadowed card. Replace with this layout.

### 3.13 Mood · This week explained [6787:9184]

This is the Mood home (`04` §M1) with a legend and an explanation added to the week card. Differences only:

1. Corner glows: `#E2CC40@0.28` 280 at (-50,-20) blur 80; `#D8B4D8@0.25` 220 at (180,60) blur 80.
2. Mood orb (`04` §B3 home variant): glows `#E2CC40@0.28` 240 at (67.5,100) blur 46 and `#7FC6F1@0.18` 150 at (162.5,165) blur 36; six aura contours (frame 6787:9193, stroke `#6B5279` at 0.32, 0.27, 0.22, 0.16, 0.11 and 0.06); `Icon/Mood happy` 56 at (159.5,192).
3. "Good" at y=327 `Urbanist SemiBold 26` (M1: 28). "Today · logged 08:40" at y=366. The Glow AI pill at (95,394).
4. **This week card** at (24,434), 327x239 (M1: 170):
   - Header, tracks, faces and day letters as M1.
   - Bar fills are solid mood colours with LAYER_BLUR 2. M1 specified `@0.85`.
   - Okay is drawn in `#E6E0EA` (M1 mock: `#E8DFD2`).
   - New legend at card (16,174), gap 10. Each item is an 8x8 dot plus `Urbanist Medium 11 #736B66`, gap 4: Tense `#FFB3BE`, Low `#D8B4D8`, Okay `#DDD3E8`, Good `#E2CC40`, Great `#7FC6F1`. The Okay legend dot `#DDD3E8` does not match the Okay bar `#E6E0EA`.
   - New caption at card (16,195), 295 wide, two lines, `Urbanist Regular 12 #736B66`: "Colour shows the mood you logged. Taller bars mean you felt it more strongly. Tap a day to see details."
5. "Log my mood" primary button at (24,700).
6. `GlowTabBar`, Active=Home, at y=720. The button (y=700 to 756) is covered by the tab bar and its raised Glow AI button. In code, place the CTA in the scroll content above the tab bar inset.

Interaction: tapping a day column opens the Day details sheet (§3.14) for that day. Empty days are not tappable.

Gaps vs code (`app/(tabs)/mood/index.tsx`): the "Mood Timeline / Last 7 days" block (lines 297-394) is replaced by the M1 bars plus this legend and caption. There is no tap-through from a day today.

### 3.14 Mood · Day details [6787:9281], 375x814

A bottom sheet (§2.6) over the Mood history calendar (`04` §M6). Opened by tapping a day on the calendar or the week card.

Underlying calendar differences from M6:

- The calendar card has a 2 px `#6B5279` stroke in this frame. It is not in M6 and is probably a selection highlight drawn on the whole card by mistake; see §8.
- Okay days use `#E6E0EA` (M6: `#E8DFD2`). The legend Okay dot is also `#E6E0EA`, but the mood-mix bar uses `#DDD3E8`.
- Today (30) is `Urbanist Medium 10 #6B5279` (M6: Bold). Day 31 is a 24 circle with stroke 1.2 `#CFC6D6` (M6: `#D6CCC0`).
- The tapped day (23) has no selected marker.

Sheet at y=301, 375x513:

1. Grabber at (167.5,12).
2. Head at y=32, centred, gap 6:
   - Mood orb 56x56, radial gradient `#FFF6D6` (centre) → mood colour (edge); here Good `#E2CC40`. This is a small flat orb, not the Skia orb.
   - Mood word "Good" `Urbanist SemiBold 22 #241A2E`.
   - "Fri, 23 Oct · logged 20:14" `Urbanist Regular 13 #736B66`.
3. Factor tags at y=158, centred row, gap 8, Tag (§2.5): "Exercise", "Friends", "Sleep". Hide the row when there are no factors.
4. Note card at (24,196) 327x69, fill `#FFFFFF`, radius 20, padding 16, gap 6:
   - "Your note" `Urbanist Bold 12 #8E7FA6`.
   - "Long walk with Anna, slept well for once." `Urbanist Regular 14 #4E3A5E`.
   - Hide the card when there is no note.
5. List group at (24,281), two `Trailing=Chevron` rows without supporting text:
   - `journal` icon, "Open journal entry". Opens the linked entry. Hide when there is none.
   - `sparkle` icon, "Talk about this day with Glow AI". Opens a new chat seeded with the day's mood, factors and note.
6. "Close" ghost button at (24,417).

Gaps vs code:

- `app/(tabs)/mood/history.tsx:295` pushes to `/(tabs)/mood/[id]`, a 725-line full page (`app/(tabs)/mood/[id].tsx`). Replace with this sheet. Keep the route only if something else deep-links to it.
- Factor tags and a linked journal entry do not exist in data. `04` §M4 already records that `mood_logs` has energy and stress but no factors, and that the note does not create a journal entry.
- Several logs on one day: the sheet shows one log. The rule (latest or average) is still open (`04` §M6).

## 4. Asset table

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| 6787:8542 | Aura (empty-state contours) | 8520, 8576, 8631, 8705, 8760, 8807 | SVG | 160x160 | Five strokes `#6B5279` at 0.30–0.10. Export once; identical in all six screens (also 6787:8598, 8664, 8727, 8793, 8840). |
| 6787:8541 | Empty-state glow | 8520 | Glow | 128 at (16,16) in illustration | `#E2CC40@0.35` blur 40. Other screens: 8597 `#D8B4D8`, 8663 `#FFB3BE`, 8726 `#7FC6F1`, 8792 `#E2CC40`, 8839 `#D8B4D8`, all 0.35 blur 40. |
| 6787:8548 | Empty-state core | all six | Code (SVG radial) | 22 | `#FFF6D6` → `#F2D96A`. Draw with react-native-svg `RadialGradient`. |
| 6787:9193 | Aura contours (mood orb) | 9184 | SVG | 375x812 frame, art ~218x200 | Six strokes `#6B5279` 0.32–0.06. Same art as `04` §B3; reuse that export if it matches. |
| 6787:9191, 9192 | Mood orb glows | 9184 | Glow | 240, 150 | `#E2CC40@0.28` blur 46; `#7FC6F1@0.18` blur 36. |
| 6787:9419 | Day details orb | 9281 | Code (SVG radial) | 56 | `#FFF6D6` → mood colour. |
| 6787:7227 | Month bar chart | 7123 | Code (live SVG) | 327x150 | §3.6. Gradient `#E2CC40` → `#8E7FA6@0.50`. |
| 6787:7367 | Year bar chart | 7263 | Code (live SVG) | 327x150 | §3.7. |
| 6787:7190 / 7330 | Ask chip orb | 7123, 7263 | Code (SVG radial) | 24 | `#FFF6D6` → `#6B5279`, as S8. |
| 6787:5396–5399 | Voice orb, dimmed | 5388 (also 5428–5431 on 5420) | Glow | 266 / 182 / 154 / 86.8 | `GlowOrb` geometry with the opacities in §3.3. |
| 6787:5416–5418 | Ripple rings | 5388 (also 5448–5450) | Code (SVG circles) | 300 / 250 / 200 | Stroke 1 `#6B5279`, static in these states. |
| 6787:5327 | Practice card glow | 5301 | Glow | 120 at (150,-30) | `#7FC6F1@0.18` blur 26, clipped by the card. |
| 6787:5332 | Play triangle | 5301 | Icon (inline vector) | 10x10 | White. Not in the icon set; add `line/play`. |
| 6787:5307, 5308 | Mini orb | 5301, 5388, 5420 | Glow | 40 / 22 | `#E2CC40@1.0` blur 8; `#FFF6D6` blur 3. |
| corner glows | per screen | all | Glow | 280 / 220 | Values in each screen section. |
| I6753:4157 `Icon / search` | Search glyph | 5189 | Icon (inline vector) | 20 | Stroke 1.5 `#8E7FA6`. Add `line/search`. |
| 6764:5036 | Icon/Line mic-off | 5420 | Icon | 22.4 | **Missing from `iconData.ts`.** |
| 6598:1798, 1792, 1781, 1785, 1814 | Icon/Line chat, moon, heart, leaf, sparkle | 5189, 9281 | Icon | 20 | Present (`line/chat`, `line/moon`, `line/heart`, `line/leaf`, `line/sparkle`). |
| 6598:1825, 1795, 1848, 1859 | Icon/Line health, journal, mic, chart | 8705, 9281, 5301, 9184 | Icon | 20–22.4 | Present. |
| 6589:1632, 1652, 1657, 1672 | Icon/Arrow back, chevron-left, chevron-right, close | several | Icon | 18–28.8 | Present. |
| 6598:1722, 1728, 1739, 1763 | Icon/Mood happy, very-happy, neutral, sad | 9184 | Icon | 18 / 56 | Present. |
| 6604:2063, 6598:1789, 6604:2067 | Tab icons home, meditate, user | tab bar screens | Icon | 24 | Present; owned by `GlowTabBar`. |

There are no raster images on these screens.

Icons the screens need that `iconData.ts` lacks: `line/mic-off` (6764:5036), `line/search` (inline vector in Search Field 6753:4157), `line/play` (inline vector 6787:5332).

## 5. Backend and data gaps

- Glow AI history: per-talk title, one-line summary, topic icon key and last-activity date. A summary step after each talk (the `05` §6 summary endpoint) can fill these. Delete a single talk from the list (swipe).
- Chat send: a per-message "saved" timestamp for the receipt. The local save already resolves before the AI call.
- Voice: streaming speech-to-text, TTS and a mute state (as `05` §3.4). Thinking and Paused are client states once that exists.
- Sleep Month/Year: calendar-period aggregation (nightly series for a month, monthly averages for a year), previous-period delta, and factor impacts per period. Apple Health / Health Connect import does not exist; it needs a native module, a permission flow and a sync into the sleep table.
- Home first day and Glow score history: a "has any check-in" flag and a count of distinct check-in days (3-day threshold).
- Mood day details: factor tags on `mood_logs`, an optional `journal_entry_id` link, and the logged time. `addMoodCheckIn` still requires energy and stress (`04` §M4).

## 6. Proposed tasks

1. Add `line/mic-off`, `line/search` and `line/play` to `components/icons/iconData.ts` from 6764:5036, the Search Field glyph (6753:4157) and vector 6787:5332 (09 §4).
2. Add the shared `NavBar`, `ListRow`/`ListGroup`, `SearchField`, soft `MetaChip`, `BottomSheet` and a 56-high text button size, plus the `#CFC6D6` token, to `components/ui` (09 §2.1–§2.7).
3. Export the empty-state aura SVG (6787:8542) and build `components/ui/EmptyState.tsx` with the per-screen glow colour (09 §2.4, §4).
4. Restyle the Glow AI conversation history screen as "Your talks" with search, weekly groups, grouped rows, swipe-to-delete and the No talks yet empty state (09 §3.1, §3.5).
5. Add the sending states to the chat screen: restyled typing bubble with caption, "Sent · HH:mm" receipt on the latest user message, and remove per-bubble times and typing avatar (09 §3.2).
6. Add Thinking and Paused states to the Glow AI voice screen, with a dimmed `GlowOrb` prop, static rings, the mic-off/Unmute toggle and pinned controls, as part of the voice mode build (09 §3.3, §3.4).
7. Rebuild Sleep insights periods as Week / Month / Year with calendar-period aggregation, the Month and Year bar charts, previous-period deltas and the compact `SegmentedControl` size (09 §3.6, §3.7).
8. Add the Sleep "No data yet" state with Connect Apple Health and Log sleep manually rows (09 §3.8).
9. Add Apple Health (and Health Connect) sleep import behind the "Connect Apple Health" row (09 §3.8, §5).
10. Add the Home first-day state shown before the first check-in (09 §3.9).
11. Add the Glow score history empty state with the 3-check-in-day rule, and rename "Freud score" to "Glow score" in user-facing copy (09 §3.10).
12. Replace the Journal and Mood history empty states with the shared empty state and their CTAs (09 §3.11, §3.12).
13. Add the legend and explanation to the Mood "This week" card and make each day open its details (09 §3.13).
14. Replace the mood entry page with the Day details bottom sheet on Mood history and the week card, including factor tags, note, journal link and Glow AI link (09 §3.14).
15. Add mood factor tags and a journal-entry link to `mood_logs` and the check-in save (09 §5).

## 7. Answers to open questions

Items in `99-open-questions.md` that these screens resolve, fully or partly:

- §3 "conversation history ("See all")" — **Resolved** by Glow AI · Conversation history (6787:5189) and its empty state (6787:8807).
- §3 "loading/sending states" — **Partly resolved.** Sending (6787:5301) defines the typing bubble, caption and sent receipt. A conversation loading state is still not designed.
- §3 "voice recording states" — **Partly resolved.** Thinking (6787:5388) and Paused/muted (6787:5420) are added to Listening. An error or "couldn't hear you" state is still missing.
- §3 "empty states throughout" — **Partly resolved.** Home, Journal, Mood history, Sleep, Glow score history and Glow AI talks now have empty states. Search "no matches" in Your talks, favourites, mindful history and others are still missing.
- §3 "Month/Year sleep charts" — **Resolved** (6787:7123, 6787:7263), as bar charts rather than the week line chart.
- §3 Icons missing: "mic-off" — **Resolved in Figma** (`Icon/Line mic-off` 6764:5036) but not yet in `iconData.ts`. "search" — still an inline vector, not an icon component. "send" and "play" are still missing; the practice card's play glyph is an inline vector.
- §1 Old-palette leftovers: "`#838264` link/status colour" — **Resolved for the chat header**: the status line is now `#8E7FA6`.
- §1 "divider `#F0EBE5` vs `#EFEAF2`" — **Resolved in favour of `#EFEAF2`** for list rows and sleep cards on these screens.
- §1 "Back button comes in 44, 48 and 50" — **Partly resolved.** Every new screen uses the 44 `Back Button` component (6746:4449), but it is a new style: white fill with a 1 px `#CFC6D6` stroke. This also replaces the "`#736B66` vs `#6B5279`" back ring question with a third value.
- §1 "Confirm `#CFC6D6` for radio off and checkbox off" — **Supported.** `#CFC6D6` is now the back-button stroke, sheet grabber and empty-day stroke, so it is a de facto token. Radio and checkbox off states are still not drawn.
- §1 "The tag fill is still old-palette brown" — **Resolved.** The new `Tag : Style=Default` (6753:4146) uses `#F1ECF5` with `#6B5279` SemiBold 12 text (code currently uses `#4E3A5E` text).
- §1 "the header title is 14 on S2/S3 and 15 elsewhere" — **Resolved in favour of 15**: the Nav Bar component title is SemiBold 15 `#4E3A5E`.
- §4 **Product** "Is there still a Mood tab?" — **Resolved: no.** Mood screens with a tab bar (6787:9184) show Home active, which matches the current `href: null` in `app/(tabs)/_layout.tsx:43`.
- §1 "Pick one value each: … Okay mood colour `#EFE6DA` vs `#E8DFD2`" — **Not resolved; worse.** The new mood screens use `#E6E0EA` for bars, calendar and one legend, and `#DDD3E8` for the other legend and the mood-mix bar.

Left unresolved by these screens:

- §3 Sending: no send icon is drawn on the composer when text is entered; the composer still shows the mic.
- §4 **Product** score labels and colour rule: the screens rename "Freud score" to "Glow score" but do not settle "Healthy" vs "Mentally stable".
- §1 "Journal-active tab icon is `#4E3A5E`, others `#6B5279`" — Journal · Empty still draws the active label in `#6B5279` while Home active uses `#4E3A5E`.
- §1 "No disabled, pressed or error states for buttons and inputs" — still not drawn.
- §1 "AI check-in bubble radii are mixed" — not touched.

## 8. Blockers and design questions

- **Overlap:** on Mood · This week explained (6787:9184) the "Log my mood" button (y=700–756) sits under the tab bar (y=720) and its raised Glow AI button.
- **Okay colour:** three values on the new mood screens (`#E6E0EA`, `#DDD3E8`) plus the two older ones. Pick one.
- **Calendar stroke:** the Day details calendar card (6787:9295) has a 2 px `#6B5279` stroke that M6 does not have, and the tapped day has no selected marker. Is the stroke intended?
- **Voice controls shift:** the controls row moves up 22 pt between Thinking and Paused. Assumed unintended.
- **Voice rings:** Thinking/Paused draw the ripple rings at full opacity, which reads heavier than Listening. Confirm.
- **Mini orb opacity:** the chat header mini orb outer layer is now `#E2CC40` at 1.0; `05` and `MiniGlowOrb` use 0.5.
- **Placeholder data:** Year bars copy the first 12 Month bars and include November and December in the future. Month shows 30 bars and the axis ends at 30 for October (31 days). Month axis labels are spaced evenly instead of under their days. "What helps" values are identical across all three periods.
- **Week card copy:** "Taller bars mean you felt it more strongly" does not match the data. Bar height encodes the mood score (Tense shortest, Great tallest), not intensity. Suggest "Taller bars mean a brighter mood."
- **Home first day:** no avatar, search, bell, Glow AI input or Free plan card. Is the reduced header intended for first day only?
- **Journal empty:** the body says "or just say it out loud" but there is only a Write button. Add a Speak secondary action, or change the copy.
- **Copy mismatch:** "Talking to Anna" has the summary "How to keep it gentle" in history and "How to keep good days going" on the Glow AI home (`05`).
- **Sleep on Android:** "Connect Apple Health" has no Android wording (Health Connect).
- **Rename:** "Glow score" replaces "Freud score" in these screens. Code, i18n and `03` still say Freud. Confirm the rename is final before the copy task.
- **Process:** the raw extraction dumps were not saved as separate files under `figma/specs/`; all values needed are in this document. No Figma call failed.
