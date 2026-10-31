# 03 — Home, Mental Health Score and Smart Notifications

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` (Main - Light Mode). All positions are in points on a 375-wide frame, relative to the screen unless a parent is named. Typography is written as `Family Weight size/lineHeight ls<letterSpacing> #colour`; `auto` means the font's default line height.

Shared foundations are specified in the foundations doc (`00-foundations.md`) and are only referenced here: colour and type tokens, Urbanist loading, Button, Tag (chip), Top Nav back button, Legal note, Tab bar, icon SVG set, Skia glow renderer and status bar handling. The paywall is specified in `01-onboarding-auth.md`; only the differences for "Your glow, fully lit" are listed here.

Reference renders: `scratchpad/figma/shots/home/screen-<id>.png` and `scratchpad/figma/shots/notif/screen-<id>.png`. Chart geometry dumps: `scratchpad/figma/specs/home-geometry.txt` and `scratchpad/figma/specs/notifications-geometry.txt`.

## 1. Section overview

### Home & Mental Health Score — section `6565:1491` (4582×2079)

| Screen id | Name | Size | Code today |
|---|---|---|---|
| `6709:4319` | 1. Home · Free | 375×1028 | `app/(tabs)/home.tsx` (complete redesign) |
| `6710:4161` | 1b. Home · Pro | 375×936 | `app/(tabs)/home.tsx` (same screen, Pro state) |
| `6566:1506` | 2. Freud Score | 375×812 | `app/(tabs)/freud-score/index.tsx` |
| `6566:1599` | 3. Score History | 375×1054 | none (list lives inside `freud-score/index.tsx:743-860`) |
| `6566:1657` | 4. Insights | 375×1165 | none (`hooks/useMoodInsights.ts` gives text insights only) |
| `6567:1558` | 5. AI Suggestions — "Your plan for today" | 375×812 | `app/(tabs)/freud-score/ai-suggestions.tsx` |
| `6567:1619` | 6. Suggested Items — "Suggested for you" | 375×812 | `app/(tabs)/freud-score/ai-suggestion-category.tsx` |
| `6567:1659` | 7. Suggestions Completed — "You did it" | 375×812 | completion modal in `ai-suggestions.tsx:270-300` and `ai-suggestion-category.tsx:60-100` |
| `6600:1966` | 8. Paywall · Go Pro — "Your glow, fully lit" | 375×812 | `app/(utils)/trial-upgrade.tsx` (canonical spec in 01) |
| `6565:1493` | 1. Home (previous) | 375×1516 | Ignored by instruction. |

### Smart Notifications — section `4002:15075` (3265×1515)

| Screen id | Name | Size | Code today |
|---|---|---|---|
| `6629:2828` | Notifications — "Your day, in light" | 375×1016 | `app/(tabs)/notifications/index.tsx` |
| `6623:2936` | Moment · Glow rising | 375×812 | none (closest: `notifications/detail.tsx`) |
| `6623:2989` | Moment · Journal constellation | 375×812 | none |
| `6623:3083` | Moment · Glow AI check-in | 375×812 | none |
| `6628:2774` | Moment · Calm wave | 375×812 | none |
| `6628:2822` | Moment · Sunset reminder | 375×812 | none |
| `6628:2866` | Moment · Night sleep | 375×812 | none |

Proposed routes: keep `/(tabs)/home`; add `/(tabs)/freud-score/history` and `/(tabs)/freud-score/insights`; rework `ai-suggestions` (plan) and `ai-suggestion-category` (suggested items); add `/(tabs)/freud-score/completed`; add `/(moments)/[type]` as a full-screen modal stack for the six moments, opened from push taps and from feed rows.

## 2. Screens — Home & Mental Health Score

### 2.1 Home · Free `6709:4319` and Home · Pro `6710:4161`

Background `#F7F4F2`. The screen scrolls; the tab bar is fixed.

| Element | Spec |
|---|---|
| Background glows | Glow `6709:4320` `#E2CC40@0.25` 260×260 at (-50,0) blur 90. Glow `6709:4321` `#7FC6F1@0.20` 240×240 at (180,40) blur 90. |
| Avatar | `6709:4326` circle 44×44 at (20,60), IMAGE fill (user photo). |
| Greeting | "Good morning," at (74,62) `Urbanist Regular 13/auto #736B66`. Name "Matthew" at (74,78) `Urbanist SemiBold 22/auto #241A2E`. |
| Pro badge (Pro only) | `6710:4346` at (172,82) 48×18, fill `#E2CC40`, radius 999, padding 2/8/2/6, gap 3. Contains `Icon/Line crown` 12×12 and "PRO" `Urbanist Bold 10/auto #241A2E`. |
| Search button | `6709:4466` 44×44 at (259,60), stroke `#6B5279` 1, radius 22, search icon 20×20 stroke `#6B5279` 1.5. |
| Bell button | `6709:4322` 44×44 at (311,60), stroke `#6B5279` 1, radius 25 (use 22), bell icon 24×24 stroke 1.5. No unread badge is drawn. |
| Mood check-in card | `6709:4392` 343×150 at (16,124), white, radius 28. "How are you feeling?" (20,18) `Urbanist SemiBold 16/auto #241A2E`. Date "Fri, 30 Oct" (269,21) `Urbanist Medium 12/auto #A6A09B`. `Icon/Mood happy` 26×26 at (20,50). Mood word "Good" (54,48) `Urbanist SemiBold 22/auto #6B5279`. "Slide to adjust" (121,56) `Urbanist Regular 12/auto #A6A09B`. Below this sits the shared mood slider (foundations), with "Tense"/"Great" end labels `Urbanist Medium 11/auto #A6A09B` at y=124. |
| Glow AI input | `6709:4408` 343×60 at (16,290), white, radius 30. AI bubble 44×44 `#8E7FA6` r22 at (8,8) with sparkle icon 22. Placeholder "Ask Glow AI anything…" (64,20) `Urbanist Regular 15/auto #A6A09B`. Mic button 44×44 `#6B5279` r22 at (291,8), mic icon 20 white. Free only: chip "3 left" `6710:4148` at (242,19.5) 41×21, fill `#F1ECF5`, r999, padding 3/8, text `Urbanist SemiBold 11/140% #6B5279`. |
| Section header | "Your inner glow today" (22,402) `Urbanist Medium 18/auto #241A2E`. More icon 24×24 at (329,400), three dots `#241A2E`. |
| Inner glow card | `6709:4417` 343×212 at (16,438), white, r28. Glows: `#E2CC40@0.35` 170 at (9,21) blur 40; `#D8B4D8@0.35` 110 at (79,81) blur 30; inner light `#F2D96A@0.85` 64 at (62,74) blur 16. Aura contours (SVG, section 4). Score "80" centred at x=94, y=80, `Urbanist SemiBold 32/auto #4E3A5E`. Label "Healthy" y=116 `Urbanist Medium 11/auto #736B66`, centred. |
| Legend (inside card) | Vertical stack at (188,26), gap 12, four rows 31 tall, padding-x 8, gap 8. Each row: glow dot 14×14 (outer 16 `colour@0.60` blur 5 + inner 8 solid), label `Urbanist Medium 11/auto #A6A09B`, value `Urbanist SemiBold 15/auto #241A2E`, then `Icon/Arrow up|down` 16×16 at x=134. Rows: Freud score `#E2CC40` "80" up; Mood `#7FC6F1` "Good" up; Sleep `#D8B4D8` "6h 40m" down; Stress `#FFB3BE` "Low" down. |
| For you today | Header "For you today" (24,676) `Urbanist SemiBold 16/140% #241A2E`. Link "All practices" (279,678) `Urbanist SemiBold 13/140% #8E7FA6`. |
| Practice cards | Two cards 167×112 r24 white at (16,708) and (192,708). Cover 155×58 r18 `#FBF8F5` at (6,6). Breathing cover: glow `#7FC6F1@0.55` 120 blur 24, four concentric ring strokes `#6B5279` at 0.50/0.35/0.25/0.15 (28/44/60/76 diameters), centre glow `#F2D96A@0.90` 16 blur 4. Sleep cover: linear `#E6DDEE → #F3E6EE`, glow `#D8B4D8@0.70` 110 blur 20, moon `#6B5279@0.75`, horizon 1px `#6B5279@0.30` at y=46.4. Play button 26×26 `#6B5279` r13 at (123,6). Title (14,70) `Urbanist SemiBold 15/auto #241A2E`. Meta (14,90) `Urbanist Regular 11/auto #A6A09B`: "1–3 min · Calm practice", "5–10 min · Wind down". |
| Free plan card (Free only) | `6710:4150` 343×76 at (16,836), white, r24. Glow `#E2CC40@0.30` 120 at (-30,-20) blur 30. Icon circle 40×40 `#E2CC40@0.30` r20 at (16,18) with crown 20. "Free plan" (68,16) `Urbanist SemiBold 15/140% #241A2E`. "3 of 10 AI chats left this week" (68,38) `Urbanist Regular 12/140% #736B66`. Progress track 120×4 `#E8E0D5` r2 at (68,60), fill `#6B5279` width = used/limit × 120 (84 = 7 of 10 used). "Try Pro" pill (258,20) 69×36 `#6B5279` r999, padding 9/14, `Urbanist SemiBold 13/140% #FFFFFF`. |
| Tab bar | `Nav/Tab Bar : Active=Home` (`6604:2068`) at y=936 (Free) / y=844 (Pro). Tabs: Home, Practices, Glow AI (centre raised button), Journal, Profile. Owned by foundations. |

Interaction notes: the mood card's slider writes a mood check-in (debounced) and updates the mood word and icon live. The Glow AI input opens chat; the mic opens chat with recording. The inner glow card opens Freud Score; the more icon opens a menu (no design; propose "Score history" and "Insights"). "Try Pro" opens the paywall. The Pro variant is identical except the Pro badge, no "3 left" chip and no Free plan card.

Gaps vs code (`app/(tabs)/home.tsx`):
- The whole layout differs. The top bar with a date and bell (`233-265`), the "Hi, {name}!" greeting with trial and mood badges (`268-297`), the search bar (`300-308`), `WellbeingScoreCard` (`311`), `HorizontalActionList` (`327`), the trial-expired banner (`330-341`), the "For today" card (`343-364`), the Mindful Tracker list (`366-471`) and the community card (`473-485`) are all absent from the design and must be removed or moved.
- Old palette constants `BROWN #8B6B47`, `SAGE #5B7A53`, `CREAM` (`35-37`) and `MOOD_META` emoji colours (`40-46`) must go.
- Missing: avatar image (the profile has no avatar field; `hooks/useProfile.ts` exposes no `avatar_url`), the circular search and bell buttons, the inline mood check-in card, the Glow AI input with chat quota chip, the inner glow aura card with four-metric legend and trend arrows, "For you today" practice cards and the Free plan card.
- The greeting must read "Good morning," + name on two lines; `getGreeting` (`48-53`) is reusable.
- Trend arrows need yesterday-vs-today comparison per metric. Freud score, mood, sleep and stress values already exist via `useFreudScore`, `useMood`, `useSleep` and `useStress`.
- The status word "Healthy" under the score does not exist in `FreudLabel` (`lib/freudScore.ts:13-23`); the Freud Score screen shows "Mentally stable" for the same 80. See blockers.
- `WellbeingScoreCard.tsx` and `ScoreCard.tsx` become unused on Home; `MoodCheckInModal.tsx` (emoji colours `#EF4444…`, lines 14-18) is replaced by the inline slider.
- The bell has no unread indicator in the design; the code shows an orange badge (`259-263`). Keep a small dot only if foundations specifies one.
- "3 of 10 AI chats left this week" needs a backend weekly quota (see section 6).

### 2.2 Freud Score `6566:1506`

| Element | Spec |
|---|---|
| Glows | `#E2CC40@0.40` 300 at (37.5,62) blur 80; `#D8B4D8@0.30` 200 at (167.5,142) blur 70. |
| Aura contours | `6659:3213` 375×460 at (0,0), 8 strokes (SVG asset). |
| Top nav | Back button 50×50 at (25,51), stroke `#6B5279` 1.5, r25. Tag (lg, outlined) "Freud Score" 112×40 centred at y=60, stroke `#8E7FA6`, text `Urbanist SemiBold 16/auto ls-0.3% #8E7FA6`. |
| Score ring | Diameter 176 at (99.5,124) (centre 187.5,212). Track `#6B5279@0.15`, value `#6B5279`, thickness 3 (inner radius ratio 0.965). Value arc starts at 12 o'clock and sweeps clockwise `score × 3.6°` (80 → 288°). Knob 16×16 white with `#E2CC40` 4 stroke, centred on the arc end. |
| Score | "80" centred at y=164, `Urbanist SemiBold 64/auto #4E3A5E`. "out of 100" y=240 `Urbanist Medium 13/auto #736B66`. |
| Status | "Mentally stable" full width at y=332, `Urbanist SemiBold 24/auto #4E3A5E`, centred. |
| Chips | Row at (54,370), gap 8. Chip "Normal range": white, r999, padding 6/12/6/10, gap 6, `Icon/Mood happy` 16, `Urbanist SemiBold 12/auto #241A2E`. Chip "Ask Glow AI why": white, stroke `#6B5279@0.40` 1, padding 6/14/6/12, sparkle 16, `Urbanist SemiBold 12/auto #6B5279`. |
| History header | "Score history" (24,410) `Urbanist SemiBold 20/auto #4E3A5E`. "See all" (302,415) `Urbanist Bold 14/auto #8E7FA6`. |
| History rows | Stack at (16,446), gap 10, three rows 343×62, white, r999, padding 8/12/8/8, gap 14. Date pill 46×46 `#F5F5F4` r999: "OCT" `Urbanist Regular 10/auto #A6A09B`, day `Urbanist SemiBold 16/auto #44403B`. Title `Urbanist SemiBold 16/auto #4E3A5E`, sub `Urbanist Regular 12/auto #A6A09B`, gap 2. Ring 44×44 (track `#E8E0D5`, thickness 4.4, value arc as above), value `Urbanist Bold 13/auto #241A2E` centred. Rows: OCT 30 "Anxious, depressed" / "Do 25 min breathing" / 65 `#6B5279`; OCT 29 "Very happy" / "No recommendation" / 95 `#8E7FA6`; OCT 28 "Neutral" / "Keep it up!" / 72 `#E2CC40`. |
| Legal note | At (24,668), 327 wide: "Your Freud score is for self-reflection only. It is not a medical assessment or diagnosis." |
| Tab bar | `Nav/Tab Bar : Active=Home` at y=719. |

Gaps vs code (`app/(tabs)/freud-score/index.tsx`):
- `ScreenHeader` with title, subtitle and filter button (`606-640`) becomes back button + "Freud Score" tag.
- `BigScoreRing` (`56-180`) is 200 px with a 12 px stroke and 40 tick marks; the design is 176 px, 3 px stroke, knob, no ticks, and sits over aura art and glows.
- Missing status chips, the "Ask Glow AI why" entry (should open chat seeded with the score context) and the legal note.
- The metric breakdown grid (`709-740`), chart/list toggle (`747-783`), `ScoreChart` (`256-370`) and `FilterModal` (`372-520`) are not in this design; the chart moves to Insights and the list moves to Score History.
- Ring colour per row is not `getFreudColor` (`lib/freudScore.ts:85-91`, old greens/ambers); the design picks from `#6B5279`, `#8E7FA6`, `#E2CC40`, `#7FC6F1`. A score-band → colour rule is not given in Figma (see blockers).
- Row title is a mood label ("Anxious, depressed") and the subtitle is a recommendation; `FreudScoreRecord` only has `score`, `label`, `breakdown`, `source`.
- The tab bar is visible on this screen, so the route stays inside `(tabs)`.

### 2.3 Score History `6566:1599`

| Element | Spec |
|---|---|
| Glows | `#7FC6F1@0.20` 240 at (180,30) blur 90; `#E2CC40@0.25` 260 at (-50,0) blur 90. |
| Top nav | Back button (25,51); tag "Freud Score" at y=56. |
| Title | "Score history" (24,122) `Urbanist SemiBold 30/auto #4E3A5E`. Subtitle (24,162) 300 wide "See how your score changes and what helped along the way." `Urbanist Regular 14/145% #736B66`. |
| Period pills | Row at (24,216), gap 8, height 35, padding 8/16, r999, stroke `#8E7FA6` 1. Inactive text `Urbanist Medium 14/auto #8E7FA6`; active fill `#8E7FA6`, `Urbanist Bold 14/auto #FFFFFF`. Labels 1W, 1M (active), 3M, 1Y. |
| Filter button | 38×38 white r19 at (313,214), `Icon/Line filter` 20. |
| Summary card | 327×162 at (24,268), white, r28. "October" (20,16) `Urbanist Medium 13/auto #A6A09B`. Delta pill (185,13) 122×20, `#8E7FA6@0.15`, r999, padding 3/10/3/8, gap 4, up arrow 14, "6 vs September" `Urbanist Bold 12/auto #8E7FA6`. Three stats at x=20/123/226, y=44: value `Urbanist SemiBold 30/auto #4E3A5E`, label at y=84 `Urbanist Medium 12/auto #736B66` (Average 76, Best 95, Lowest 58). Dividers 1×40 `#E8E0D5` at x=109 and x=212, y=50. Range bar (section 4.2) at (20,118). |
| Action chips | Row at (24,446), gap 8, chips 38 tall, white, r999, padding 10/14/10/12, gap 6, icon 18, `Urbanist SemiBold 13/auto #241A2E`: "Add note" (note), "Export" (share), "Reminder" (bell). |
| Group labels | "THIS WEEK" (24,506), "LAST WEEK" (24,820), `Urbanist Bold 13/auto #A6A09B`. |
| Entry cards | 327×86, white, r24, gap 10 (y=532, 628, 724, 846). Date tile 46×54 `#F5F5F4` r16 at (14,16): "OCT" `Urbanist Medium 10/auto #A6A09B`, day `Urbanist SemiBold 18/auto #44403B`, centred. Mood icon 18 at (72,16), mood title (96,15) `Urbanist SemiBold 15/auto #4E3A5E`. Note (72,40) `Urbanist Regular 12/auto #736B66`. Tags row (72,58) gap 4: tag `#E8E0D5` r999, padding 2/8, `Urbanist SemiBold 10/auto #4E3A5E`. Ring 46×46 at (267,20), thickness 4.6, value `Urbanist Bold 14/auto #241A2E`. Entries: 30 Anxious (crying) "Racing thoughts before work" [Breathing 25m] 65; 29 Very happy (very-happy) "Long walk and a good talk" [Walk][Social] 95; 28 Neutral (neutral) "Slept 6h, busy day" [Sleep 6h] 72; 24 Good (happy) "Evening wind-down helped" [Sleep sounds] 81. |
| CTA | 327×56 at (24,948), `#6B5279`, r999, gap 10: plus icon 20 + "Check in now" `Urbanist SemiBold 16/auto #FFFFFF`. |

Interaction notes: period pills re-query the summary and list. "Add note" attaches a note and tags to today's score. "Export" shares a CSV/PDF of the period. "Reminder" opens daily check-in reminder settings (reuse `setReminderEnabled` in `lib/notifications.ts:357`). "Check in now" opens the mood check-in. This screen has no tab bar.

Gaps vs code: there is no dedicated screen. `freud-score/index.tsx` filters only week/month/all (`filteredHistory`, `570-584`) and shows score, label and trend. Missing: 3M/1Y periods, summary (average/best/lowest, delta vs previous period), range bar, week grouping, mood icon, note, tags, Export, Add note and Reminder actions. Backend gap: `freud_scores` has no `note`, `tags` or `mood` (see section 6).

### 2.4 Insights `6566:1657`

| Element | Spec |
|---|---|
| Glows, top nav | As Score History. Tag "Insights" 82×40 at (146.5,56); its stroke is `#F2F5F9` in Figma (see blockers; use `#8E7FA6`). |
| Title | "Your insights" (24,122) `Urbanist SemiBold 30/auto #4E3A5E`. Subtitle "What shaped your Freud score this month, and what to do next." `Urbanist Regular 14/145% #736B66`, 300 wide. |
| Period pills | As Score History, at (24,216). |
| Score trend card | 327×236 at (24,268), white, r28. "FREUD SCORE" (20,18) `Urbanist Bold 11/auto #A6A09B`. "76" (20,34) `Urbanist SemiBold 34/auto #4E3A5E`, "average" (66,52) `Urbanist Medium 13/auto #736B66`. Delta pill as Score History at (185,20). Chart 287×104 at (20,96) (section 4.3). Axis labels at y=206: "1 Oct" `Urbanist Medium 11/auto #A6A09B` left; "Today · 87" `Urbanist Bold 11/auto #4E3A5E` right-aligned at x=302. |
| What helps | 327×172 at (24,520), white, r28. "What helps" (20,18) `Urbanist SemiBold 16/auto #4E3A5E`. Rows at y=52/92/132: icon bubble 30×30 `#8E7FA6@0.18` r15 with 16 icon (leaf, activity, moon); label (60, +6) `Urbanist SemiBold 14/auto #241A2E`; bar track 80×6 `#F0EBE5` r3 at x=196; fill `#8E7FA6` width = 10 × impact (max 80); value at x=284 `Urbanist Bold 14/auto #8E7FA6`. Rows: Breathing practice +8, Walks outside +6, 7h+ sleep +5. |
| What pulls it down | 327×132 at (24,704). Same layout with bubble `#E89A7A@0.18`, fill `#E89A7A`, value `#C9744F`. Rows: Short sleep −7 (moon), Late-night scrolling −4 (chat). Use the true minus sign "−". |
| Mood mix | 327×140 at (24,848). "Mood mix" `Urbanist SemiBold 16/auto #4E3A5E`; "31 check-ins" (226,21) `Urbanist Medium 12/auto #A6A09B`. Bar 287×18 r9 at (20,50) (section 4.4). Legend wrap row at (20,82), gap 12 (row gap 8): mood icon 16 + `Urbanist SemiBold 12/auto #241A2E`: "Good 45%" (happy), "Okay 30%" (neutral), "Low 17%" (sad), "Tense 8%" (angry). |
| Legal note | At (24,1007): "Insights are based on your own check-ins and are not medical advice." |
| CTA | 327×56 at (24,1058) `#6B5279` r999: sparkle 20 + "Get AI suggestions" `Urbanist SemiBold 16/auto #FFFFFF`. Opens "Your plan for today". |

Gaps vs code: there is no Insights screen. `useMoodInsights` / `supabase/functions/mood-insights` return free-text insights with old-palette colours (`#5B8A5A`, `#E8985A`, `#7B6DC9`, `#8B6B47`; function prompt line 89), not numeric factor impacts. The trend chart can be built from `freud_scores` history. Mood mix can be computed client-side from mood check-ins, but the app's five moods (awful/low/neutral/good/great) need a mapping to four buckets (see blockers).

### 2.5 AI Suggestions — "Your plan for today" `6567:1558`

| Element | Spec |
|---|---|
| Glows | `#E2CC40@0.22` 260 at (-50,0) blur 90; `#D8B4D8@0.25` 240 at (180,30) blur 90. |
| Top nav | Back button 50×50 at (25,51) (Figma uses a `Button Icon FAB` with a forward arrow rotated 180°; build with the shared back button). Tag "AI Suggestions" 133×40 at (121,60). |
| Title | "Your plan for today" full width y=126, `Urbanist SemiBold 30/auto #4E3A5E`, centred. Subtitle (40,168) 295 wide "Small steps, picked for your Freud score of 80." `Urbanist Regular 15/150% #736B66`, centred. |
| AI badge | (123,222) 114×22, `#8E7FA6`, r999, padding 4/10, "AI · 4 suggestions" `Urbanist Bold 12/auto #FFFFFF`. Centre it horizontally. |
| Suggestion rows | Stack at (16,268), gap 12, rows 343×80, white, r28, padding 14/16/14/12, gap 14. Icon circle 52×52 `#8E7FA6@0.14` with 28 icon. Title `Urbanist SemiBold 16/auto #4E3A5E`, sub `Urbanist Regular 12/auto #A6A09B`, gap 3. Chevron-right 20 at right. Rows: Mindfulness activities / "Breathing, relax · 25–30 min" (meditate); Physical activities / "Jogging, swimming · 1 h" (activity); Social connection / "Family time, coffee · 1.5 h" (users); Professional support / "Therapist check-in · 30 min" (health). |
| CTA | "Start my plan" 327×56 at (24,690), `#6B5279`, r999, `Urbanist SemiBold 16/auto #FFFFFF`. |

Gaps vs code (`ai-suggestions.tsx`): the hero, sort toggles (`428-490`), per-category cards (`525-545`), "Why mindful" article and reduce-stress/improve-health blocks (`570-615`) differ. The design is a flat list of the four categories (`AISuggestion.category` already has exactly these four) with an aggregated duration per category, an AI count badge and a "Start my plan" CTA. "Start my plan" needs defined behaviour (proposal: open the first pending category). The Pro gate in code (`552`, `router.push('/trial-upgrade')`) should open the "Your glow, fully lit" paywall.

### 2.6 Suggested Items — "Suggested for you" `6567:1619`

| Element | Spec |
|---|---|
| Glows | `#7FC6F1@0.20` 260 at (-40,40) blur 90; `#00545D@0.14` 240 at (170,120) blur 90 (old palette, see blockers; use `#D8B4D8`). |
| Top nav | Back button; tag = category name ("Mindfulness") 114×40 at y=60. |
| Title | "Suggested for you" centred at y=126, `Urbanist SemiBold 30/auto #4E3A5E`. |
| Item cards | Two cards 166×206, white, r28, at (16,186) and (193,186). Cover 150×124 `#FBF8F5` r20 at (8,8). Title (14,144) `Urbanist SemiBold 16/auto #4E3A5E`; meta (14,166) `Urbanist Regular 12/auto #A6A09B`. Calm sounds cover: glow `#D8B4D8@0.45` 140 blur 30 + six sound-wave strokes `#6B5279` at 0.35→0.10 (SVG). Wind down cover: linear `#E6E1EE → #F6E7D2`, sun halo `#E2CC40@0.55` 130 blur 26, half-disc 60 `#F0C77A`, horizon 1px `#6B5279@0.35` at y=96.7. Copy: "Calm sounds" / "Sound · 8 min"; "Wind down" / "Sleep · 10 min". |
| Article card | 343×220 at (16,410), white, r28. Tag "Read · 3 min" `#E8E0D5` r999 padding 3/10, `Urbanist Medium 11/auto #4E3A5E`. Title (20,50) "Why should we be mindful?" `Urbanist SemiBold 20/auto #4E3A5E`. Body (20,84) 303 wide `Urbanist Regular 14/150% #736B66`: "Mindfulness trains us to be fully present in the moment, reducing stress and helping us regulate emotional waves naturally — one breath at a time." Link pill "Read article →" outlined `#8E7FA6` 1, r999, padding 8/16, `Urbanist Bold 14/auto #8E7FA6`. |
| CTA | "Mark as done" 327×56 at (24,690), `#6B5279`. |

Gaps vs code (`ai-suggestion-category.tsx`): the code shows pending/completed counts (`410-430`), stats (`440-470`), a suggestion list with per-item complete buttons (`478-560`) and "Generate more" (`534`). The design shows two content items (sound and sleep practice), one article and a single "Mark as done" that completes the category's suggestion. Content items need a mapping from category to practices/sounds (`lib/search-catalogue.ts` or the mindful catalogue). The article body exists as `aiSuggestions.whyMindfulBody` but the copy differs.

### 2.7 Suggestions Completed — "You did it" `6567:1659`

| Element | Spec |
|---|---|
| Glows | `#7FC6F1@0.22` 280 at (-20,16) blur 90; `#E2CC40@0.45` 300 at (60,66) blur 80. |
| Aura | `6659:3222` 375×520 at (0,-44), 8 strokes (SVG). |
| Close | 40×40 white r20 at (319,54), close icon 22. |
| Ring | 184 at (95.5,114), thickness 3.7 (inner 0.96). Track `#6B5279@0.15`. Previous score arc `#6B5279` from −90° sweeping `old × 3.6°` (80 → to 198°). Gain arc `#E2CC40` from there sweeping `delta × 3.6°` (8 → 198°…226.8°). Knob 16 white with 4 `#E2CC40` stroke at the end of the gain arc. Animate the gain arc from 0 to delta on mount. |
| Score | "88" centred at y=156 `Urbanist SemiBold 64/auto #4E3A5E`. Delta pill (146,230) 83×22 `#8E7FA6` r999, padding 4/12/4/10, up arrow 14 + "8 points" `Urbanist Bold 12/auto #FFFFFF`. |
| Title | "You did it, Matthew!" centred at y=384 `Urbanist SemiBold 30/auto #4E3A5E`. Subtitle (40,426) "Your Freud score went from 80 to 88.\nTiny steps add up." `Urbanist Regular 15/145% #736B66` centred. |
| Stats | Row at (15,500), gap 8, white chips 36 tall r999 padding 10/14/10/12 gap 6, icon 16, `Urbanist SemiBold 13/auto #241A2E`: "4 of 4 done" (check), "52 min" (meditate), "12-day streak" (flame). |
| Up next | 327×76 at (24,566), white, r24. Bubble 44×44 `#D8B4D8@0.45` r22 with moon 22. "Up next tonight" (72,18) `Urbanist Medium 12/auto #A6A09B`. "Wind down · 10 min" (72,36) `Urbanist SemiBold 15/auto #4E3A5E`. Chevron 20 at (291,28). |
| CTA | "Go to Score Tracker" + forward arrow 20, 327×56 at (24,668), `#6B5279`. Link "Share my progress" y=738 `Urbanist Bold 14/auto #8E7FA6` centred. |

Gaps vs code: today this is a small modal (`ai-suggestions.tsx:270-300`, "Suggestion completed" + "Great, thanks"). The full-screen celebration, two-tone ring, stats (minutes from `logActivityCompletion`, streak from `getActivityStats` in `lib/suggestionEngine.ts:347-430`), "Up next" and share are missing. "Score Tracker" is not a named screen; route it to Score History.

### 2.8 Paywall "Your glow, fully lit" `6600:1966` — differences only

Compared with the canonical paywall in `01-onboarding-auth.md`:
- Glows: `#E2CC40@0.38` 300 at (37.5,0) blur 80 and `#D8B4D8@0.30` 200 at (160,90) blur 80.
- Close button 40×40 `#FFFFFF@0.80` r20 at (319,54).
- Logo mark 72×72 at (151.5,112): halo disc 43.2 `#E2CC40@0.22`, core 21.6 `#E2CC40`, ring 51.8 stroke `#6B5279` 3.6.
- Title "Your glow, fully lit" `Urbanist SemiBold 30/auto #241A2E` (note `#241A2E`, not `#4E3A5E`). Subtitle "Get more from INNER GLOW, every day." `Urbanist Regular 15/145% #736B66`.
- Feature list at (56,330), gap 14: check bubble 24 `#E2CC40@0.35` r12 + `Urbanist Medium 15/auto #241A2E`: "Unlimited chats with Glow AI", "Every practice and sleep sound", "Deeper insights and a weekly plan".
- Plans: Yearly (selected) 327×68 r22 stroke `#6B5279` 2, "7 days free, then €59.99/year", price "€4.99/mo", tag "Save 50%" `#E2CC40` `Urbanist Bold 11/auto #241A2E`. Monthly stroke `#E8E0D5` 1, radio stroke `#D6CCC0` 2, "€9.99/month", "€9.99/mo".
- CTA "Start 7 days free" 327×58 (one point taller than other CTAs) `Urbanist SemiBold 17/auto`.
- Footer "Auto-renews unless cancelled 24h before the period ends · Restore purchase" `Urbanist Medium 12/auto #A6A09B`, centred, two lines; "Restore purchase" should be a tappable span.
- Code gap: `lib/purchase-products.ts:2-3` defines monthly and lifetime products only; this design sells yearly and monthly.

## 3. Screens — Smart Notifications

### 3.1 Notifications — "Your day, in light" `6629:2828`

| Element | Spec |
|---|---|
| Glows | `#7FC6F1@0.20` 240 at (180,30) blur 90; `#E2CC40@0.25` 260 at (-50,0) blur 90. |
| Top nav | Back button (25,51). Settings button 50×50 white r25 at (300,51) with filter icon 22 (opens notification settings). |
| Title | "Your day, in light" (24,122) `Urbanist SemiBold 30/auto #4E3A5E`. Subtitle (24,162) "3 highlights and 4 updates since this morning." `Urbanist Regular 14/auto #736B66`. |
| Highlights carousel | Horizontal scroller at y=200, height 190, content inset 24, cards 150×180 r26, gap 12, clipped. Score card: white, glow `#E2CC40@0.50` 140 at (10,-20) blur 30, light beam 26×90 at (62,36) r13 vertical `#E2CC40@0.90→0` blur 6, core 50 white at (50,22) shadow 0/0/16/4 `#E2CC40@0.60`, "88" `Urbanist SemiBold 20/auto #4E3A5E`. Journal card: white, glow `#7FC6F1@0.35` 120 at (40,10) blur 30, 6×5 dot grid (section 4.6). Sleep card: `#2B2622`, glow `#D8B4D8@0.40` 110 at (60,0) blur 30, 12 stars 2×2 `#FFFFFF@0.50`, moon `#F3E9F3` 44×44 at (90,22). Card labels at (16,122): value `Urbanist SemiBold 18/auto` (`#4E3A5E`, white on sleep), caption (16,146) `Urbanist Medium 12/auto #736B66` (`#FFFFFF@0.60` on sleep). Copy: "+8 score" / "Glow rising"; "21/30" / "Journal days"; "7h 50m" / "Best night". Each card opens its moment. |
| Group labels | "TODAY" (24,414), "YESTERDAY" (24,736), `Urbanist Bold 12/auto ls6% #A6A09B`. |
| Timeline | Rail 2×522 at (33,434) r1, vertical gradient `#E2CC40@0.60 → #E8E0D5@0.40`. Node per row: halo 24×24 `colour@0.60` blur 6, dot 10×10, centred on x=34, aligned to the card's first line. |
| Update cards | x=56, width 295, r22, padding 16. Today cards are white; yesterday cards are transparent with stroke `#E8E0D5` 1. Icon 18 at (16,16), title (42,14) `Urbanist SemiBold 15/auto #4E3A5E`, time right-aligned at x=279 `Urbanist Medium 11/auto #A6A09B`, body (16,42) `Urbanist Regular 12/auto #736B66`. Optional action pill (16,64) 26 tall `#6B5279` r999 padding 6/12, gap 4, `Urbanist Bold 12/auto #FFFFFF` + forward arrow 14. Card height 102 with action, 76 without; vertical gap 12. |
| Rows | Today: Glow AI is ready (sparkle, node `#D8B4D8`, 09:40, "Your 08:30 check-in moved to now.", action "Open chat"); Box breathing done (check, `#8E7FA6`, 08:10, "4 minutes. Your calmest start this week."); Sleep summary (moon, `#7FC6F1`, 07:00, "7h 50m, best night this month."). Yesterday: Evening reflection (journal, `#E2CC40`, 21:00, "You skipped yesterday. 3 minutes tonight?", action "Write now"); Stress went down (leaf, `#FFB3BE`, 14:20, "From tense to calm by mid-afternoon."). |

Interaction notes: tapping a card marks it read and opens its moment or route. Action pills deep-link directly. Read and unread are not distinguished visually beyond today/yesterday styling; confirm with design whether unread needs a marker.

Gaps vs code (`app/(tabs)/notifications/index.tsx`):
- Header "Notifications" with unread count and mark-all/clear button (`~245-290`) becomes "Your day, in light" + dynamic subtitle + settings button.
- The Recent/Settings segmented tabs with emoji labels and `BROWN` fill (`~280-292`) are removed; settings moves behind the top-right button (separate screen or sheet; no design given).
- Missing highlights carousel, timeline rail and nodes, action pills, and the outlined style for older items.
- `NOTIF_TYPE_META` (`lib/notificationStore.ts:40-80`) uses emoji and per-type colours; the design uses line icons and the five glow colours.
- `notifications/detail.tsx` (generic detail with `DETAIL_CONFIGS`, `25-60`) is replaced by the six moments.
- The subtitle counts "highlights" vs "updates", which the store does not distinguish (see section 6).

### 3.2 Shared moment chrome

All six moments: full-screen modal, no tab bar. Close button 44×44 `#FFFFFF@0.80` r22 at (307,54) with close icon 22 (night: `#FFFFFF@0.12`). Primary CTA 327×56 at (24,672) r999 `#6B5279`, `Urbanist SemiBold 16/auto #FFFFFF`. Secondary text link centred at y=742, `Urbanist Bold 14/auto #8E7FA6`. Body copy `Urbanist Regular 15/145% #736B66`, 327 wide at x=24.

### 3.3 Glow rising `6623:2936`

- Glows `#E2CC40@0.40` 300 at (37,40) blur 90 and `#7FC6F1@0.18` 220 at (200,260) blur 90.
- Scale (section 4.7): labels "90" y=173, "85" y=323, "80" y=473 at x=72 `Urbanist Bold 11/auto #A6A09B`.
- Light beam 72×330 at (151.5,150) r36, vertical `#E2CC40@0.90→0`, blur 14. Core 110 white at (132.5,118), shadow 0/0/40/10 `#E2CC40@0.60`, "88" `Urbanist SemiBold 48/auto #4E3A5E`. Previous "80" at y=440 `Urbanist SemiBold 30/auto #4E3A5E@0.30`, "September" y=478 `Urbanist Medium 11/auto #A6A09B`.
- Delta pill (252,170) 114×24 `#8E7FA6` r999 padding 5/12/5/10: up 14 + "+8 this month" `Urbanist Bold 12/auto #FFFFFF`.
- Title "Your glow is rising" (24,540) `Urbanist SemiBold 28/auto #4E3A5E`. Body "Your Freud score climbed from 80 to 88. Breathing and earlier nights helped most."
- CTA "See what helped" (→ Insights). Link "Share my progress".

### 3.4 Journal constellation `6623:2989`

- Glows `#7FC6F1@0.25` 300 at (-40,120) and `#E2CC40@0.25` 240 at (170,260), blur 90.
- Eyebrow "OCTOBER" (24,118) `Urbanist Bold 12/auto ls10% #A6A09B`. Title "21 of 30 days" (24,136) `Urbanist SemiBold 40/auto #4E3A5E`.
- Constellation grid and polyline (section 4.6).
- Legend (24,478), gap 16: Written (10 dot `#E2CC40`), Today (10 ring `#6B5279` 1.5), Open (10 ring `#D6CCC0` 1.5), labels `Urbanist Medium 12/auto #736B66`.
- Title "Your constellation is almost complete" (24,536) `Urbanist SemiBold 22/120% #4E3A5E`. Body "2 more entries and you beat last month. Tonight takes 3 minutes."
- CTA "Write tonight’s entry" (→ journal new entry). Link "Remind me at 21:00" (schedules a one-off local notification).

### 3.5 Glow AI check-in `6623:3083`

- Glows `#D8B4D8@0.35` 280 at (-60,30) and `#7FC6F1@0.30` 240 at (170,120), blur 90.
- Orb: lilac `#D8B4D8@0.70` 120 at (127.5,104) blur 24; sky `#7FC6F1@0.70` 90 at (152,128) blur 20; core 64 white at (155.5,132) shadow 0/0/24/6 `#D8B4D8@0.70`; sparkle 30 centred.
- Status pill (97,248) 181×24 `#FFFFFF@0.85` r999 padding 5/12/5/10 gap 6: dot 8 `#8E7FA6` + "Glow AI · check-in at 08:30" `Urbanist Bold 12/auto #241A2E`.
- AI bubbles white, padding 12/16, asymmetric radius (Figma mixed; use 22 with a 6 top-left corner per the chat bubble in the AI chat doc), `Urbanist Regular 15/140% #241A2E`: "Morning, Matthew. Our check-in starts at 08:30." (24,300, 282 wide) and "Want to start with how you slept?" (24,374). Typing bubble (24,427) 59×31 r18 with dots 7×7 `#6B5279` at 1.0/0.6/0.3 (reuse `components/TypingBubble.tsx`).
- "Quick reply" (24,520) `Urbanist Bold 12/auto ls4% #A6A09B`. Wrapping chips (24,544) gap 8, 37 tall r999 padding 10/16, `Urbanist Bold 14/auto`: "I’m ready" (fill `#6B5279`, white text), "Remind me in 10 min" and "Skip today" (white, `#4E3A5E`).
- Legal note (24,656): "Glow AI is an AI companion, not a therapist, and can’t help in an emergency."
- Reply input 327×56 white r28 at (24,690): placeholder "Reply to Glow AI…" `Urbanist Regular 15/auto #A6A09B`; mic 44 `#6B5279` r22 at (277,6).

### 3.6 Calm wave `6628:2774`

- Glows `#FFB3BE@0.35` 260 at (-60,180) and `#7FC6F1@0.35` 240 at (190,200), blur 90.
- Eyebrow "TODAY · 09:00 → 14:20" `Urbanist Bold 12/auto ls6% #A6A09B`. Title "From tense\nto calm" `Urbanist SemiBold 40/105% #4E3A5E`.
- Stress wave (section 4.8). Labels "Tense · 7" (24,250) `Urbanist Bold 12/auto #C9744F`; "Calm · 3" (307,356) `Urbanist Bold 12/auto #3E8FC4`.
- Stats row (24,440), three tiles 103.6×66 white r22 padding 12/16 gap 2: value `Urbanist SemiBold 22/auto #4E3A5E`, caption `Urbanist Medium 12/auto #736B66`: "−4" stress level, "3" calm breaks, "5h" to settle.
- Body (24,552) "Your body is settling. The breathing break at 11:40 made the biggest difference."
- CTA "See my stress level" (→ `/(tabs)/stress`). Link "Not now" (dismiss).

### 3.7 Sunset reminder `6628:2822`

- Background vertical gradient `#D9ECF7` 0 → `#F6E7D2` 0.50 → `#F7F4F2` 0.62 → `#F7F4F2` 1 (react-native-svg rect).
- Time "19:00" y=126 `Urbanist SemiBold 16/auto ls6% #4E3A5E` centred. Title "Time to slow down" y=150 `Urbanist SemiBold 32/auto #4E3A5E` centred. Body centred (44,196) 287 wide "Your 10-minute grounding before dinner. The day can wait."
- Sunset scene (section 4.9).
- Practice chip (82,530) 211×32 `#FFFFFF@0.85` r999 padding 8/14/8/12 gap 6: meditate 16 + "Grounding · 10 min · voice on" `Urbanist SemiBold 13/auto #241A2E`.
- CTA "Start now" at y=606; secondary outlined button "Snooze 30 min" at y=672, stroke `#6B5279` 1.5, `Urbanist SemiBold 16/auto #4E3A5E`; link "Change reminder time".

### 3.8 Night sleep `6628:2866`

- Background `#2B2622`. Moon halo `#D8B4D8@0.35` 260 at (150,40) blur 80. Star field and moon (SVG, section 5).
- Eyebrow "LAST NIGHT · 23:10 → 07:00" (24,196) `Urbanist Bold 12/auto ls6% #FFFFFF@0.60`. Value "7h 50m" (24,216) `Urbanist SemiBold 56/auto #FFFFFF`.
- Badge (24,290) 154×24 `#E2CC40` r999 padding 5/12/5/10: star 14 + "Best night this month" `Urbanist Bold 12/auto #2B2622`.
- Sleep stage chart (section 4.10) at y=360. Axis "23:10" (24,518) and "07:00" right at x=351, `Urbanist Medium 11/auto #FFFFFF@0.50`.
- Stage tiles (24,548) three 103.6×58 `#FFFFFF@0.08` r20 padding 10/14 gap 2: value `Urbanist SemiBold 18/auto #FFFFFF`, caption `Urbanist Medium 12/auto #FFFFFF@0.60`: "1h 40m" Deep, "2h 05m" REM, "1×" Woke up.
- CTA "See my sleep" fill `#F3E9F3`, text `#2B2622`. Link "Not now" `#FFFFFF@0.70`.

Gaps vs code for all moments: no routes, no full-screen modal stack, and no push payload that selects a moment. `app/_layout.tsx:237-254` only routes on `data.route`; it needs a `moment` key mapped to `/(moments)/[type]` with params. `components/SoundPulse.tsx` and `TypingBubble.tsx` can be reused.

## 4. Chart and generative-art geometry, with build decision

| # | Item | Decision | Geometry |
|---|---|---|---|
| 4.1 | Score rings (Freud 176, Completed 184, list 44/46) | Live, react-native-svg `<Circle>` with `strokeDasharray`, rotated −90°. One `ScoreRing` component with props `size`, `thickness`, `value`, `prevValue?`, `trackColor`, `color`, `gainColor`, `knob`. | Track/value as in 2.2, 2.7 and 2.3. Thickness = r × (1 − innerRatio): 176 → 3.1, 184 → 3.7, 44 → 4.4, 46 → 4.6. Sweep = value × 3.6°, starting at 12 o'clock, clockwise. Knob centre = (cx + r_mid·cos θ, cy + r_mid·sin θ). Butt caps (Figma arcs). |
| 4.2 | Score history range bar | Live, react-native-svg (`<LinearGradient>` rect + markers). Layer blur 6 is dropped or approximated with Skia `<Blur>` if foundations ships Skia. | Bar 287×14 r7. Stops `#FFB3BE@.95`/0, `#D8B4D8@.95`/0.35, `#E2CC40@.95`/0.60, `#7FC6F1@.95`/1. Value→x: `x = 20 + 287 × (v − 50) / 50` (clamp domain [50,100]; widen the domain to min(lowest−5, 50) if the period's lowest is under 50). Min/max markers 1×20 `#6B5279@0.5` from y=115; avg marker 2×30 `#6B5279@0.9` from y=110 plus 12 knob white stroke `#6B5279` 2 at y=119. Labels centred under each marker at y=138. |
| 4.3 | Insights line chart | Live, react-native-svg `<Polyline>` + `<Path>` area + `<Line strokeDasharray="4 4">`. | Frame 287×104. Points evenly spaced: `x_i = i × 287/(n−1)` (n=20 in mock, x step 15.1). `y = 212.8 − 2.218 × score` in frame units (76 → 44.2, 87 → 19.8), so derive per period: map [min−2, max+2] to [77.6, 17.6]. Line `#6B5279` 2.5 round caps/joins. Area to y=102 with vertical gradient `#E2CC40@0.45 → @0`. Avg dashed `#A6A09B` 1, dash 4/4, label "avg 76" right-aligned above it. End dot 10 white, stroke `#E2CC40` 3, centred on the last point. Mock points are in `specs/home-geometry.txt`. |
| 4.4 | Mood mix bar | Live, react-native-svg gradient rect (hard-ish stops). | 287×18 r9. Build stops cumulatively from proportions with a 0.05 soft blend between segments: Good `#7FC6F1`, Okay `#E8E0D5`, Low `#D8B4D8`, Tense `#FFB3BE`, all @0.95. Mock 45/30/17/8 gives stops 0–0.45, 0.50–0.75, 0.80–0.92, 0.95–1. Blur 5 optional (Skia). |
| 4.5 | Impact bars | Live, plain Views. | Track 80×6 `#F0EBE5` r3; fill width = min(80, 10 × |impact|); positive `#8E7FA6`, negative `#E89A7A`. |
| 4.6 | Journal constellation (moment) and journal mini-grid (feed card) | Live, react-native-svg from journal entries per day of the month. | Moment: 6 columns × 5 rows, column centres x = 77.5 + 44·c, row centres y = 236 + 48·r, day d at index d−1. Written: dot 12 `#E2CC40` + halo 28 `#E2CC40@0.55` blur 8 (Skia glow or a radial-gradient circle). Open: ring 10, stroke `#D6CCC0` 1.5. Today: ring 10, stroke `#6B5279` 2. Polyline `#E2CC40@0.55` 1.5 joins written days in date order. Feed card: 6×5 grid, pitch 20×18, origin (26,26) centres, written dot 8, open ring 6 stroke 1, no lines. |
| 4.7 | Glow rising scale | Live, Views. | 30 px per point. Major tick 18×2 `#6B5279@0.5` every 5 points with label; minor 10×2 `#6B5279@0.25`. Range = [prev − 0, prev + 10] rounded to 5. Beam height spans from previous to current value; core sits at the current value. In Figma the core is centred near 90 rather than 88; treat the mock as decorative and place by value. |
| 4.8 | Calm wave (stress) | Live, generated in code with react-native-svg `<Polyline>` and a horizontal `<LinearGradient>` stroke. Not a static asset because start/end levels and the settle point change. | Frame 375×160 at y=250; wave band y 35.9–127.8. Stroke 4, round caps, gradient `#E8828F` 0 → `#C9A0C9` 0.55 → `#5FAFE0` 1. Samples every 3.1 px. Left of the settle point (x≈240 = settle time) use pseudo-random amplitude scaled by stress level (7 → ±46); right of it a sine with amplitude ±12 and period ≈ 90 px. Tense dot 12 `#E8828F` + halo 26 `#FFB3BE@0.7` at the first peak; calm dot 14 `#5FAFE0` + halo 30 `#7FC6F1@0.8` at x≈335. Seed the noise from the date so it is stable. |
| 4.9 | Sunset scene | Static SVG asset (`6628:2823`–`6628:2831` minus the halo) plus a Skia glow for the halo. | Ripples are top half-ellipses 300/240/180 stroke white 1.5 at 0.25/0.35/0.50; sun half-disc 140 gradient `#F3DD6B → #E8A65C`; horizon 375×2 `#6B5279@0.35` at y=470; reflections 2 px `#E2CC40@0.5`. Halo `#E2CC40@0.55` 260 blur 60. |
| 4.10 | Sleep stage chart | Live, react-native-svg `<Path>` built from depth samples with a smooth cubic (control points at 1/3 and 2/3 of each 25 px step, flat tangents). Fall back to the static asset `6628:2924` until stage data exists. | Frame 375×150; area origin y=22.5, height 127.5. 16 samples every 25 px: 102, 57.4, 12.8, 38.3, 76.5, 19.1, 0, 51, 89.3, 31.9, 6.4, 63.8, 82.9, 44.6, 70.1, 102 (0 = top). Fill vertical `#D8B4D8@0.90 → #7FC6F1@0.15`. The mock is a decorative "mountain" curve, not a hypnogram; map light/REM/deep to depth if stage data arrives. |
| 4.11 | Aura contours (Home card, Freud Score, Completed) | Static SVG assets. Optionally wrap in an Animated view for a slow breathing scale (1.00↔1.03, 6 s). | Home: 9 closed polylines, stroke `#6B5279` 1 at opacities 0.28→0.05 (`6709:4420`). Freud Score: 8 strokes in 375×460 (`6659:3213`). Completed: 8 strokes in 375×520 (`6659:3222`). |
| 4.12 | Star fields (night moment and feed sleep card) | Static SVG (`6628:2868`; feed card stars are 12 ellipses in `6629:2897`). | 46 stars, 1.8 or 3.2 px, white 0.25–0.83. Optional twinkle animation would need primitives instead of a file. |

## 5. Asset table

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| `6709:4326` | Avatar | Home | Raster | 44×44 | User photo from profile (remote URL); fallback initial. |
| `6709:4420` | Aura contours | Home | SVG | 343×212 | 9 strokes; place inside inner glow card. |
| `6709:4320` / `6709:4321` | Page glows | Home | Glow | 260 / 240 | `#E2CC40@0.25` blur 90; `#7FC6F1@0.20` blur 90. |
| `6709:4418` / `6709:4419` / `6709:4430` | Card glows | Home | Glow | 170 / 110 / 64 | `#E2CC40@0.35` b40; `#D8B4D8@0.35` b30; `#F2D96A@0.85` b16. |
| `6709:4398` | Mood slider glow | Home | Glow | 120×70 | `#E2CC40@0.35` b24 (owned by mood slider foundation). |
| `6709:4435…4459` | Legend glow dots | Home | Glow | 16 | Colour@0.60 b5 behind 8 px dot (small; a radial gradient circle in SVG is acceptable). |
| `6709:4539` | Breath rings cover | Home | SVG | 155×58 | 4 ring strokes; plus glows `6709:4538` `#7FC6F1@0.55` b24 and `6709:4544` `#F2D96A@0.90` b4. |
| `6709:4551` | Sleep cover | Home | SVG | 155×58 | Gradient rect + moon + horizon; glow `6709:4553` `#D8B4D8@0.70` b20. |
| `6710:4151` | Free plan glow | Home Free | Glow | 120 | `#E2CC40@0.30` b30. |
| `6659:3213` | Aura contours | Freud Score | SVG | 375×460 | 8 strokes. |
| `6659:3211` / `6659:3212` | Glows | Freud Score | Glow | 300 / 200 | `#E2CC40@0.40` b80; `#D8B4D8@0.30` b70. |
| `6610:2479` / `6610:2480` | Glows | Score History | Glow | 240 / 260 | `#7FC6F1@0.20`, `#E2CC40@0.25`, b90. |
| `6611:2503` / `6611:2504` | Glows | Insights | Glow | 240 / 260 | Same as Score History. |
| `6662:3190` / `6662:3191` | Glows | AI Suggestions | Glow | 240 / 260 | `#D8B4D8@0.25`, `#E2CC40@0.22`, b90. |
| `6596:1726` / `6596:1725` | Glows | Suggested Items | Glow | 260 / 240 | `#7FC6F1@0.20`; `#00545D@0.14` (replace colour). |
| `6660:3207` | Sound lines cover | Suggested Items | SVG | 150×124 | 6 wave strokes; glow `6660:3206` `#D8B4D8@0.45` b30. |
| `6660:3214` | Wind down cover | Suggested Items | SVG | 150×124 | Gradient, half sun, horizon; halo `6660:3216` `#E2CC40@0.55` b26. |
| `6659:3222` | Aura contours | Completed | SVG | 375×520 | 8 strokes. |
| `6605:2458` / `6605:2459` | Glows | Completed | Glow | 280 / 300 | `#7FC6F1@0.22` b90; `#E2CC40@0.45` b80. |
| `6655:3202` | Logo mark | Paywall | SVG | 72×72 | Same mark as onboarding paywall; reuse if identical. |
| `6655:3196` / `6655:3197` | Glows | Paywall | Glow | 300 / 200 | `#E2CC40@0.38` b80; `#D8B4D8@0.30` b80. |
| `6629:2829` / `6629:2830` | Glows | Feed | Glow | 240 / 260 | `#7FC6F1@0.20`, `#E2CC40@0.25`, b90. |
| `6629:2857`, `6629:2858`, `6629:2859` | Score highlight art | Feed | Glow + code | 140 / 26×90 / 50 | Glow b30, beam gradient b6, core with shadow. |
| `6629:2864` | Journal highlight glow | Feed | Glow | 120 | `#7FC6F1@0.35` b30. |
| `6629:2897` stars + `6629:2974` moon | Sleep highlight art | Feed | SVG | 150×180 | Stars and crescent; glow `6629:2898` `#D8B4D8@0.40` b30. |
| `6629:2916…2961` | Timeline node halos | Feed | Glow | 24 | Colour@0.60 b6. |
| `6623:2937` / `6623:2938` / `6623:2939` / `6623:2940` | Glow rising art | Glow rising | Glow + code | 300 / 220 / 72×330 / 110 | Beam blur 14; core shadow 40/10. |
| `6623:2996…3043` | Constellation halos | Constellation | Glow | 28 | `#E2CC40@0.55` b8; dots/lines are live SVG. |
| `6623:2990` / `6623:2991` | Glows | Constellation | Glow | 300 / 240 | `#7FC6F1@0.25`, `#E2CC40@0.25`, b90. |
| `6623:3084…3088` | Orb | AI check-in | Glow | 280 / 240 / 120 / 90 / 64 | Lilac and sky orbs b24/b20; white core with shadow. |
| `6628:2775` / `6628:2776` / `6628:2781` / `6628:2783` | Glows and dot halos | Calm wave | Glow | 260 / 240 / 26 / 30 | Wave itself is live SVG. |
| `6628:2824`–`6628:2831` | Sunset scene | Sunset | SVG | 375×~300 | Ripples, sun, horizon, reflections; halo `6628:2823` `#E2CC40@0.55` b60 is a Glow. |
| `6628:2868` | Star field | Night sleep | SVG | 375×460 | 46 stars. |
| `6629:2972` | Moon | Night sleep | SVG | 90×90 | Crescent `#F3E9F3`; halo `6628:2867` `#D8B4D8@0.35` b80 is a Glow. |
| `6628:2924` | Sleep stage area | Night sleep | SVG (fallback) | 375×127.5 | Live path preferred (4.10). |
| Icons | `Icon/Line`: bell, search, more, mic, sparkle, crown, meditate, journal, user, home, filter, note, share, plus, leaf, activity, moon, chat, users, health, check, flame, star (main ids `6598:1814` sparkle, `6598:1848` mic, `6598:1844` crown, `6598:1789` meditate, `6598:1795` journal, `6604:2063` home, `6604:2067` user, `6609:2481` filter, `6609:2494` note, `6609:2487` share, `6609:2484` bell, `6609:2490` plus, `6598:1785` leaf, `6598:1817` activity, `6598:1792` moon, `6598:1798` chat, `6598:1821` users, `6598:1825` health, `6598:1837` check, `6598:1834` flame, `6598:1801` star). `Icon/Arrow`: up `6589:1642`, down `6589:1647`, back `6589:1632`, forward `6589:1637`, chevron-right `6589:1657`, close `6589:1672`. `Icon/Mood`: happy `6598:1722`, very-happy `6598:1728`, neutral `6598:1739`, sad `6598:1763`, crying `6598:1770`, angry `6598:1777`. | all | Icon | 12–30 | Owned by the foundations icon set. Home header search/bell/more/play are raw vectors in Figma; map them to the set. |

## 6. Backend and data gaps

1. **AI chat weekly quota.** Home Free shows "3 left" and "3 of 10 AI chats left this week". `supabase/functions/chat/index.ts` has no usage limit and `hooks/useSubscription.ts` exposes no quota. Needed: a `chat_usage` table (or counter on `subscriptions`) keyed by ISO week, server-side enforcement in the chat function for non-Pro users, a 429-style error the client maps to the paywall, and a `remaining`/`limit` read for Home.
2. **`freud_scores` notes, tags and mood.** History rows show a mood label and icon, a free-text note and tags; Freud Score rows show a recommendation subtitle. `FreudScoreRecord` (`lib/freudScore.ts:40-47`) has none of these. Needed columns: `note text`, `tags text[]`, `mood text`, `recommendation text`. The table DDL is not in `supabase/migrations` (only subscriptions, community, support and recovery codes are), so the migration must start by capturing the current schema.
3. **Period aggregates.** Average, best, lowest and delta vs the previous period for 1W/1M/3M/1Y. Client-side from history is fine for 1W/1M; 3M/1Y needs a paged or aggregated query (RPC).
4. **Insights factor impacts.** "What helps" (+8/+6/+5) and "What pulls it down" (−7/−4) need numeric attribution per factor. `mood-insights` returns text only. Needed: an `insights-factors` edge function (or extend `mood-insights`) that correlates activity logs (`activity_logs` via `logActivityCompletion`), sleep duration, journal and screen-time-like tags with score change and returns `{factor, icon, impact}`. "Late-night scrolling" has no data source in the app.
5. **Mood mix.** Computable client-side from `useMood` check-ins; needs an agreed mapping of five moods to Good/Okay/Low/Tense.
6. **Notification moment types.** `NotificationType` (`lib/notificationStore.ts:8-21`) lacks `glow_rising`, `journal_constellation`, `ai_checkin`, `calm_wave`, `sunset_reminder`, `night_sleep`, and has no `kind: 'highlight' | 'update'`, `action {label, route}` or `moment` payload. The store is local AsyncStorage only, so server-generated moments (score rising, best night, stress settled) need either a `notifications` table with push sending or client-side generators that run on data refresh.
7. **Actions and snooze.** "Snooze 30 min", "Remind me in 10 min", "Remind me at 21:00", "Change reminder time" and "Skip today" need expo-notifications categories (`setNotificationCategoryAsync`) with action buttons, a response handler in `app/_layout.tsx` that reschedules, and a settings field for the evening grounding time. `lib/notifications.ts` has no categories today.
8. **Glow AI scheduled check-in.** "Our check-in starts at 08:30" implies a scheduled check-in time per user and an AI-initiated opening message. There is no such setting or seeded-conversation API.
9. **Intraday stress series.** Calm wave needs time-stamped stress readings and a "calm breaks" count; the app has only per-check-in stress (0–10) and `stressKit.level`.
10. **Sleep stages.** Deep/REM minutes and "best night this month" need stage data; `lib/types.ts` sleep entries carry only duration, quality and `awakenings`.
11. **Avatar.** No avatar field or upload in profile.
12. **Plan products.** Yearly + monthly in design versus monthly + lifetime in `lib/purchase-products.ts`.

## 7. Proposed tasks

1. Rebuild Home (Free and Pro states) per 03 §2.1: header with avatar, search and bell, inline mood check-in card, Glow AI input, "Your inner glow today" card with legend and trend arrows, "For you today" practice cards and Free plan card, and remove the legacy trackers.
2. Build a shared `ScoreRing` component (react-native-svg, value + gain arc + knob) per 03 §4.1 and use it on Freud Score, Score History and Completed.
3. Restyle the Freud Score screen per 03 §2.2 with the 176 ring over aura art, status chips, "Ask Glow AI why", three-row history and legal note, and move the chart and filters out.
4. Add the Score History screen (`/(tabs)/freud-score/history`) per 03 §2.3 with period pills, summary card, range bar (§4.2), action chips, grouped entries and "Check in now".
5. Add the Insights screen (`/(tabs)/freud-score/insights`) per 03 §2.4 with the live line chart (§4.3), impact bars (§4.5), mood mix bar (§4.4) and "Get AI suggestions".
6. Rework "Your plan for today" (`ai-suggestions.tsx`) per 03 §2.5 as a four-category list with the AI badge and "Start my plan".
7. Rework "Suggested for you" (`ai-suggestion-category.tsx`) per 03 §2.6 with two content cards, the article card and "Mark as done".
8. Add the "You did it" completion screen per 03 §2.7 with the animated two-tone ring, stats, "Up next" and share, replacing the completion modals.
9. Apply the "Your glow, fully lit" paywall differences per 03 §2.8 on top of the canonical paywall from 01.
10. Rebuild the notifications feed "Your day, in light" per 03 §3.1 with highlights carousel, timeline rail, action pills and a settings entry point.
11. Add the moments modal stack (`/(moments)/[type]`) with shared chrome per 03 §3.2 and route push taps and feed rows to it from `app/_layout.tsx`.
12. Build the Glow rising and Journal constellation moments per 03 §3.3–3.4 with the live scale (§4.7) and constellation (§4.6).
13. Build the Glow AI check-in moment per 03 §3.5 with orb, bubbles, quick replies and reply input.
14. Build the Calm wave moment per 03 §3.6 with the generated stress wave (§4.8).
15. Build the Sunset reminder moment per 03 §3.7 with the sunset SVG scene, Start now and Snooze.
16. Build the Night sleep moment per 03 §3.8 with star field, moon and the sleep stage chart (§4.10).
17. Export the area SVG assets listed in 03 §5 (aura contours ×3, practice covers ×4, logo mark, feed sleep card art, sunset scene, star field, moon, sleep stage fallback) and register the glow data for the Skia renderer.
18. Add the AI chat weekly quota (table, enforcement in `supabase/functions/chat`, remaining-count read) per 03 §6.1 and wire Home's "3 left" chip and Free plan card.
19. Add `note`, `tags`, `mood` and `recommendation` to `freud_scores` with a captured-schema migration and the "Add note" flow per 03 §6.2.
20. Add an insights-factors edge function returning numeric factor impacts and period aggregates per 03 §6.3–6.4.
21. Extend the notification model with moment types, highlight/update kind, actions and a server or client generator per 03 §6.6.
22. Add notification action categories and snooze/reschedule handling (Snooze 30 min, Remind me in 10 min, Remind me at 21:00, Skip today, Change reminder time) per 03 §6.7.

## 8. Blockers and design questions

- The feed's journal mini-grid shows 18 filled dots but the label says "21/30"; the constellation moment correctly shows 21.
- Suggested Items uses glow `#00545D@0.14` (old teal palette).
- The Insights tag stroke is `#F2F5F9`, unlike `#8E7FA6` on the other tags.
- The same score 80 is labelled "Healthy" on Home and "Mentally stable" on Freud Score; neither "Healthy" nor the mood-style row titles ("Anxious, depressed") map to `FreudLabel`. A label taxonomy and a score-band → ring-colour rule are needed.
- The delta pills read "6 vs September" with an up arrow but no sign, while the Glow rising moment reads "+8 this month".
- "Go to Score Tracker" names a screen that does not exist; assumed to be Score History.
- "Start my plan" and the Home "more" menu have no defined behaviour.
- The Glow rising core is placed near 90 on the scale although the value is 88.
- Mood mix needs a five-to-four mood mapping.
- Notification settings have no design now that the Settings tab is removed.
- AI check-in bubble radii are "mixed" in Figma; assumed to match the AI chat bubble.
- Paywall plans (yearly/monthly, EUR) do not match the configured products (monthly/lifetime).
- The foundations doc file name is assumed to be `00-foundations.md`.
