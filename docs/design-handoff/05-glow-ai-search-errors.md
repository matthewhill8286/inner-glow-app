# 05 — Glow AI, Search, Error & Utility screens

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` (Main - Light Mode). All coordinates are in points, relative to the 375-wide screen frame. Typography is written as `Family Weight size/line-height ls colour`. All text uses Urbanist with 140% line height and 0 letter spacing unless stated.

Shared items are specified elsewhere and only referenced here:

- Colour and type tokens, Button, Input, back button, Tag/chip, Legal note, Tab bar, icon set, Skia glow renderer and status bar handling are owned by `00-foundations.md`.
- The full paywall (reached from "Start 7 days free") is in `01-onboarding-auth.md`.
- The crisis sheet base component and the mood slider are in `04-journal-mood.md`. Screen 7 below only lists what differs in the chat context.

Raw extraction dumps are in the session scratchpad (`figma/specs/error-1.txt`) and in this document.

## 1. Overview

| Section | Node | Screen id | Name | Size | Code route |
|---|---|---|---|---|---|
| AI Therapy Chatbot | 4002:15079 | 6699:3629 | 1. Glow AI | 375x1000 (scrolls) | `app/(tabs)/chat/index.tsx` |
| | | 6699:3725 | 2. New chat | 375x812 | `app/(tabs)/chat/new-conversation.tsx` and the empty state in `app/(tabs)/chat/[issueKey].tsx:109-158` |
| | | 6699:3808 | 3. Conversation | 375x900 (scrolls) | `app/(tabs)/chat/[issueKey].tsx` |
| | | 6699:3875 | 4. Voice mode | 375x812 | none |
| | | 6701:3767 | 5. Session summary | 375x812 | none |
| | | 6701:3842 | 6. Free limit | 375x812 | none (alerts at `chat/index.tsx:89-96`, `[issueKey].tsx:279-289`) |
| | | 6701:3885 | 7. Support in chat (crisis sheet) | 375x812 | none |
| | | 6701:3960 | 8. Glow AI settings | 375x812 | `app/(tabs)/chat/customize.tsx` (plus `app/(utils)/ai-privacy.tsx`) |
| Search Screen | 4002:15085 | 6703:3915 | 1. Search (idle) | 375x812 | `app/(tabs)/search.tsx` |
| | | 6703:4001 | 2. Typing | 375x812 | `app/(tabs)/search.tsx` |
| | | 6703:4069 | 3. Results | 375x812 | `app/(tabs)/search.tsx` |
| | | 6703:4175 | 4. Nothing found | 375x812 | `app/(tabs)/search.tsx:260-285` |
| | | 6703:4239 | 5. Filter | 375x812 | `app/(tabs)/search.tsx:287-409` |
| Error & Other Utilities | 4002:15087 | 6679:3117 | Not found (404) | 375x812 | `app/(utils)/error.tsx` (no `app/+not-found.tsx` exists) |
| | | 6679:3154 | No connection | 375x812 | `app/(utils)/offline.tsx` |
| | | 6679:3193 | Something went wrong (500) | 375x812 | `app/(utils)/internal-error.tsx` |
| | | 6679:3236 | Maintenance | 375x812 | `app/(utils)/maintenance.tsx` |
| | | 6679:3277 | No access (private) | 375x812 | `app/(utils)/not-allowed.tsx` |

`app/(utils)/empty.tsx` has no Figma counterpart. `app/(tabs)/chat/ai-profile.tsx` and `history.tsx` have no Figma screen ("See all" on screen 1 should open a restyled history list).

All screens: background `#F7F4F2`. Most screens carry two corner background glows (Skia, see §5):

- Chat screens: `#E2CC40@0.22` 280 at (-50,-20) blur 80, and `#D8B4D8@0.28` 220 at (180,60) blur 80.
- Search screens: `#E2CC40@0.22` 260 at (-40,-30) blur 80, and `#D8B4D8@0.25` 200 at (190,50) blur 80.
- Error screens have no corner glows; they use the illustration glows only.

## 2. Shared components in this area

### 2.1 Glow orb (Skia, animated)

The Glow AI orb appears at six sizes and is perfectly parametric. Define `S` as the outer diameter. All layers are circles centred on the same point except the blue layer.

| Layer | Colour | Diameter | Centre offset | Layer blur |
|---|---|---|---|---|
| Outer | `#D8B4D8@0.50` | 1.000 S | 0,0 | 0.210 S |
| Blue | `#7FC6F1@0.35` | 0.684 S | +0.105 S, +0.053 S | 0.158 S |
| Yellow | `#E2CC40@0.60` | 0.579 S | 0,0 | 0.116 S |
| Core | `#FFF6D6@0.95` | 0.326 S | 0,0 | 0.053 S |
| Icon | `Icon/Line sparkle` (6598:1814), stroke `#6B5279`, with yellow dot | 0.179 S | 0,0 | — |

Instances: home S=209 centred (187.5,250) [6699:3651-3655]; new chat S=152 centred (187.5,250) [6699:3756-3760]; voice S=266 centred (187.5,340) [6699:3900-3904]; summary S=106.4 centred (187.5,150) [6701:3789-3793]; free limit S=171 centred (187.5,250) [6701:3864-3868].

The mini orb used in the chat header (32x32 frame) is a separate two-layer variant: `#E2CC40@0.50` 40x40 at (-4,-4) blur 8, and `#FFF6D6` 22x22 at (5,5) blur 3 [6699:3747].

Motion is not specified in Figma. A slow breathing scale (0.96 to 1.04, about 4 s) on the outer and blue layers is the suggested idle state. In voice mode the scale should follow the input level.

### 2.2 Chat header (screens 2, 3, 4, 7)

- Back button 44x44 at (24,54), transparent, stroke 1.5 `#6B5279`, radius 22, `Icon/Arrow back` 22 (6589:1632). This is the foundations back button.
- Mini orb 32x32 at (82,60).
- "Glow AI" at (122,58): `Urbanist SemiBold 15/140% #241A2E`.
- Status at (122,78): "● Here for you" (voice mode: "● Listening…"), `Urbanist Medium 11/140% #838264`. The dot is a text glyph in the same colour.
- Voice button 44x44 at (307,54), fill `#FFFFFF`, radius 22, `Icon/Line mic` 20 (6598:1848).

### 2.3 Composer (screens 2, 3)

- Pill 327x56 at x=24, fill `#FFFFFF`, radius 28, shadow `0 6 18 0 #6B5278@0.08`. On screen 2 it sits at y=682 above the legal note; on screen 3 at y=794 (bottom inset 34 + 6).
- Placeholder "Message Glow AI…" at (20,17): `Urbanist Regular 15/140% #A6A09B`.
- Action button 44x44 at (277,6), fill `#6B5279`, radius 22, `Icon/Line mic` 20 in white. The design only shows the empty state. When text is entered, swap the mic icon for a send icon in the same button.
- Legal note (foundations `Legal/Note` 6674:2966) at (24,748) on screen 2 only, copy "Glow AI is an AI companion, not a therapist."

### 2.4 Chat bubbles

| | User ("Bubble · me") | Glow AI ("Bubble · AI") |
|---|---|---|
| Fill | `#6B5279` | `#FFFFFF` |
| Stroke / shadow | none | none |
| Radius | TL 22, TR 22, BR 6, BL 22 | TL 22, TR 22, BR 22, BL 6 |
| Padding | 12 vertical, 16 horizontal | 12 vertical, 16 horizontal |
| Max width | 292 (text box 260) | 292 (text box 260) |
| Alignment | right edge at x=351 | left edge at x=24 |
| Text | `Urbanist Regular 15/140% #FFFFFF` | `Urbanist Regular 15/140% #241A2E` |

- Vertical rhythm: 10 between bubbles, 8 between an AI bubble and an attached card, 12 after a card.
- Day stamp "Today 08:42" centred at y=118: `Urbanist Medium 11/140% #A6A09B`. There are no per-message timestamps and no avatars.
- Typing indicator [6699:3856]: 59x31 at x=24, fill `#FFFFFF`, radius 18, padding 12/14, gap 5, three 7x7 dots `#6B5279` at opacity 1.0, 0.6 and 0.3. Animate by cycling the opacity order.

### 2.5 Practice card in chat [6699:3844]

- 260x92 at x=24, fill `#FFFFFF`, radius 22, clip content.
- Glow `#7FC6F1@0.40` 120x120 at (150,-30) blur 26 (Skia, clipped by the card).
- Eyebrow "BREATHING · 4 MIN" at (16,16): `Urbanist Bold 10/140% #8E7FA6`, uppercase.
- Title "Box breathing" at (16,32): `Urbanist SemiBold 16/140% #241A2E`.
- Start pill at (16,58) 66x27: fill `#6B5279`, radius 999, padding 5/12/5/10, gap 6, play triangle 10x10 (vector 6699:3850, white), "Start" `Urbanist SemiBold 12/140% #FFFFFF`.
- Tap opens the practice player for that practice id. The data must come from the chat function as a structured action (see §6).

### 2.6 Quick reply chips [6699:3860]

- Wrap row at x=24, width 327, gap 8 horizontally and vertically, starting 22 below the last bubble or typing indicator.
- Default chip: fill `#FFFFFF`, stroke 1 `#E8E0D5`, radius 999, padding 9/14, `Urbanist Medium 13/140% #736B66`, height 38.
- Selected or suggested-first chip: fill `#F1ECF5`, stroke 1.5 `#6B5279`, `Urbanist SemiBold 13/140% #6B5279`, height 39.
- Copy in the mock: "Reply to one email" (selected), "Make a to-do list", "I don’t know".
- Tapping a chip sends its text as the user message and clears the chips.

## 3. Glow AI screens

### 3.1 Screen 1 — Glow AI home [6699:3629], 375x1000 with tab bar

Top to bottom:

1. Status bar, then title "Glow AI" at (24,60): `Urbanist SemiBold 30/140% #241A2E`.
2. Round button 44x44 at (307,56), fill `#FFFFFF`, radius 22, `Icon/Line filter` 20 (6609:2481). The frame is named "Settings" and opens screen 8.
3. Glow orb S=209 centred (187.5,250).
4. "Hi Matthew, I’m here." centred at y=368: `Urbanist SemiBold 26/140% #241A2E`. Use the profile first name.
5. "Talk, vent, or think out loud. No judgement." centred at y=406: `Urbanist Regular 14/140% #736B66`.
6. Button row at (24,450), height 56, gap 10:
   - "Start talking" 210x56, fill `#6B5279`, radius 999, gap 8, `Icon/Line chat` 18 white plus `Urbanist SemiBold 16/140% #FFFFFF`. Opens screen 2.
   - "Voice" 107x56, fill `#FFFFFF`, stroke 1.5 `#6B5279`, radius 999, `Icon/Line mic` 18 plus `Urbanist SemiBold 16/140% #6B5279`. Opens screen 4.
7. Quota line centred at y=518: "Free plan · 3 of 10 chats left this week", `Urbanist Medium 12/140% #A6A09B`. Hide for Pro users.
8. "Recent talks" at (24,560) `Urbanist SemiBold 16/140% #241A2E`, and "See all" right-aligned at (309,562) `Urbanist SemiBold 14/140% #8E7FA6` which opens history.
9. Three talk rows at y=592, 678, 764 (gap 10), each 327x76, fill `#FFFFFF`, radius 22, no border:
   - Mood circle 44x44 at (16,16), fill `#8E7FA6@0.14`, radius 22, `Icon/Mood` 22 (sad 6598:1763, neutral 6598:1739, happy 6598:1722).
   - Title at (72,16): `Urbanist SemiBold 15/140% #241A2E` ("Morning overwhelm", "Can’t switch off at night", "Talking to Anna").
   - Summary at (72,40): `Urbanist Regular 12/140% #A6A09B` ("We tried box breathing together", "A wind-down plan for 23:00", "How to keep good days going").
   - Relative date right-aligned at y=18, right edge x=311: `Urbanist Medium 11/140% #A6A09B` ("Today", "Tue", "Sun").
10. Tab bar (foundations `Nav/Tab Bar`, Active=Glow AI, 6604:2112) at y=908.

Gaps vs code (`app/(tabs)/chat/index.tsx`):

- The header is a back arrow plus "Conversations" and "A little room to reflect" with history and tune buttons (lines 128-190). The design has the "Glow AI" 30 title and one settings button, with no back button because this is a tab root.
- There is no orb, greeting, subtitle or Voice button. The CTA is a single "New Conversation" button with radius `UI.radius.lg` and shadow (lines 212-227, 477-491).
- "Quick Start" chips (lines 32-37, 257-302), "My AI Team" persona grid (305-340), "Explore Topics" list (343-380) and the "Private & Secure" card (383-394) are not in the design and should be removed.
- Every action is gated by `requirePremium()` (lines 68-98). The design has a free tier with 10 chats per week and a visible quota.
- Recent conversations use `components/ConversationRow.tsx`, which renders a bordered card with title, chevron, "persona · topic", preview and "date · N messages" (lines 21-56). The design row has a mood icon, a short title, a one-line summary and a relative date, with no border and no chevron. Mood and summary need backend data (§6).
- Only 2 recent conversations are shown (line 234). The design shows 3.
- The tab is labelled with `t('tabs.chat')` and the Feather `message-circle` icon (`app/(tabs)/_layout.tsx:108-114`). The design uses the raised centre "Glow AI" tab. This is owned by the foundations tab bar task.
- Old palette colours remain: `#5B8A5A` badge (lines 368-369) and persona colours in `lib/chat.ts:45-78`.

### 3.2 Screen 2 — New chat [6699:3725]

1. Chat header (§2.2).
2. Glow orb S=152 centred (187.5,250).
3. "What’s on your mind?" centred at y=340: `Urbanist SemiBold 24/140% #241A2E`.
4. "Pick a starting point or just type." centred at y=376: `Urbanist Regular 14/140% #736B66`.
5. Four starter rows at y=420, 482, 544, 606 (gap 8), each 327x54, fill `#FFFFFF`, radius 20:
   - Leading icon 20 at (18,17), `#6B5279` stroke: activity (6598:1817), moon (6598:1792), chat (6598:1798), sparkle (6598:1814).
   - Label at (52,16): `Urbanist Medium 15/140% #241A2E`. Copy: "I feel anxious right now", "I can’t sleep", "I need to vent", "Help me reflect on my day".
   - Trailing `Icon/Arrow chevron-right` 18 at (293,18) (6589:1657).
   - Tap sends the label as the first message and transitions to screen 3.
6. Composer at y=682 and legal note at y=748 (§2.3).

Gaps vs code:

- `app/(tabs)/chat/new-conversation.tsx` is a topic and persona picker with a "limited knowledge" notice (lines 200-237, 279-327). The design has no topic or persona choice.
- The empty state in `[issueKey].tsx:109-158` is a card with the persona emoji (64 box, radius 22), "Start a conversation" and bordered suggestion rows with radius `lg`, `SemiBold 14` text and an 11 px chevron. The design uses the orb, the new title and subtitle, 54-high borderless rows with leading icons, and `Medium 15` text.
- Suggestion copy comes from `chat.suggestion1-4` and the persona/topic variants (`i18n/locales/en/translation.ts:669-…`). Replace it with the four starters above.
- The legal note is missing from the chat screen.

### 3.3 Screen 3 — Conversation [6699:3808], 375x900

1. Chat header (§2.2).
2. Day stamp at y=118 (§2.4).
3. Message list starting at y=146 with bubbles (§2.4), a practice card (§2.5), the typing indicator and quick reply chips (§2.6).
4. Composer pinned at the bottom (§2.3). There is no divider above it.

Gaps vs code (`app/(tabs)/chat/[issueKey].tsx`):

- Header: back button is a 44 square with radius 12, card fill and 1 px border (lines 456-474, 637-644). The design uses the 44 circle with a 1.5 `#6B5279` stroke and no fill. The persona emoji avatar 38x38 radius 14 (476-480, 645-651) becomes the mini orb. The title shows the topic name in `Typography.heading` 24 with the persona name below (481-486, 652-658). The design shows "Glow AI" at 15 SemiBold with the status line.
- The red "Clear conversation" header button (488-508) is replaced by the white voice button. Clearing moves to settings ("Delete all conversations") or to a long-press or overflow action.
- Bubbles: radius 20 with a 4 px tail (677-679) must become 22 with a 6 px tail. The AI bubble has a 1 px border (679) that the design does not have. The user bubble uses `persona.color` (81) and must use `#6B5279`. Max width is 78% (677) and should be 292 pt (about 89% of 327).
- Per-message timestamps inside bubbles (96-101) are replaced by one centred day stamp per day.
- The AI avatar beside each bubble and beside the typing bubble (70-76, 548-553) is removed.
- `components/TypingBubble.tsx:12-24` uses 8 px `#aaa` dots with gap 6 and a single active dot. The design uses 7 px `#6B5279` dots with gap 5 in a 59x31 white pill with radius 18 and an opacity ramp of 1, 0.6 and 0.3.
- Composer: a multiline input with radius 22 and border, plus a separate 48 send button, separated by a top border (575-616, 743-767). The design is one white pill with radius 28 and a shadow, with the 44 button inside it.
- Citations (`CitationSection`, 87-94) are not in the design. Keep them collapsed under the AI bubble or drop them; this needs a product decision.
- The practice card and quick reply chips do not exist. They need structured data from the chat function (§6).
- The non-premium `AppCard` with "View Premium plans" (562-573) is replaced by the free quota flow and screen 6.
- Loading state copy "Loading conversation..." (431-440) is not designed. Keep it, but use the orb instead of the `ActivityIndicator`.

### 3.4 Screen 4 — Voice mode [6699:3875]

1. Chat header with status "● Listening…". There are no corner background glows on this screen and no voice button on the right.
2. Glow orb S=266 centred (187.5,340).
3. Three ripple rings centred (187.5,340), stroke 1 `#6B5279`, no fill: 300 at opacity 0.10 [6699:3907], 250 at 0.16 [6699:3908], 200 at 0.24 [6699:3909]. Build them with react-native-svg `<Circle>` and animate radius and opacity outward with the input level. The `components/SoundPulse.tsx` pattern can be reused for timing, but its colours and filled discs must change.
4. Live transcript in a 295-wide box at (40,540): `Urbanist Medium 18/150% #241A2E`, centred, wrapped in curly quotes, for example "“I keep thinking I’ll mess up the presentation…”".
5. Controls row:
   - "Mute" circle 56x56 at (68,662), fill `#FFFFFF`, radius 28, `Icon/Line mic` 22.4. Label "Mute" at y=732 `Urbanist Medium 12/140% #736B66`.
   - "End" circle 72x72 at (151.5,654), fill `#6B5279`, radius 36, `Icon/Arrow close` 28.8 white (6589:1672). Label "End" at y=732.
   - "Text" circle 56x56 at (251,662), fill `#FFFFFF`, `Icon/Line chat` 22.4. Label "Text" at y=732. This returns to screen 3 with the transcript kept.
   - End opens screen 5.

Gaps vs code: there is no voice chat screen. `supabase/functions/transcribe-audio/index.ts` only does one-shot Whisper transcription of a base64 file (lines 30-86) and is used by the journal voice screen (`app/(tabs)/journal/voice.tsx:214`). There is no TTS, no streaming and no entitlement check comparable to the chat function. The Mute state needs a mic-off icon variant, which is not in the Figma icon set.

### 3.5 Screen 5 — Session summary [6701:3767]

1. Close button 44x44 at (307,54), fill `#FFFFFF@0.80`, radius 22, `Icon/Arrow close` 22.
2. Glow orb S=106.4 centred (187.5,150).
3. "Nice talking with you" centred at y=206: `Urbanist SemiBold 26/140% #241A2E`.
4. "Here’s what we covered, in 12 minutes." centred at y=244: `Urbanist Regular 14/140% #736B66`. The duration is dynamic.
5. Mood card 327x84 at (24,288), fill `#FFFFFF`, radius 24:
   - "MOOD" at (20,16) `Urbanist Bold 11/140% #8E7FA6`.
   - Row at (20,38), gap 10: "Tense" pill (fill `#FFB3BE@0.50`, radius 999, padding 5/12/5/8, gap 6, `Icon/Mood angry` 16 (6598:1777), `Urbanist SemiBold 13/140% #241A2E`), then `Icon/Arrow forward` 18 (6589:1637), then "Calmer" pill (fill `#E8DFD2@0.50`, `Icon/Mood neutral` 16).
6. Key points card 327x166 at (24,384), fill `#FFFFFF`, radius 24:
   - "WHAT CAME UP" at (20,16) `Urbanist Bold 11/140% #8E7FA6`.
   - Three bullets: dot 8x8 `#E2CC40` at x=22 and text at x=40, rows 38 apart starting at y=40, `Urbanist Regular 14/140% #241A2E`. Copy: "Morning inbox feels like pressure", "Breathing helped you slow down", "Start with one small email".
7. Reminder card 327x74 at (24,562), fill `#FFFFFF`, radius 24:
   - Icon circle 40x40 at (16,17), fill `#8E7FA6@0.14`, radius 20, `Icon/Line bell` 20 (6609:2484).
   - "Check in again at 13:00?" at (68,16) `Urbanist SemiBold 15/140% #241A2E`, and "A gentle reminder" at (68,38) `Urbanist Regular 12/140% #A6A09B`.
   - Toggle 46x28 at (265,23), on: fill `#6B5279`, radius 14, knob 22 `#FFFFFF` at x=21. Off (from screen 8): fill `#E8E0D5`, knob at x=3.
8. "Save to journal" button 327x56 at (24,662), fill `#6B5279`, radius 999, `Icon/Line journal` 18 plus `Urbanist SemiBold 16/140% #FFFFFF`.
9. "Continue talking" text link centred at y=734, `Urbanist SemiBold 14/140% #8E7FA6`.

Gaps vs code: nothing exists. This needs a summary endpoint, journal insert, and a local notification for the check-in reminder (§6). The mood pills reuse the mood scale from `04-journal-mood.md`.

### 3.6 Screen 6 — Free limit [6701:3842]

1. Close button as on screen 5.
2. Limit ring centred (187.5,250), 240x240: track ring `#6B5279@0.10` and progress arc `#6B5279`, both with ring thickness 3.6 pt (Figma arc inner radius 0.97). The progress starts at -90° (12 o'clock) and runs clockwise; 10 of 10 is a full circle. Build it with react-native-svg `<Circle strokeDasharray>` and animate on mount. [track 6701:3871, arc 6701:3872]
3. Glow orb S=171 inside the ring.
4. "You’ve used this week’s free chats" in a 327 box at (24,408), centred, two lines: `Urbanist SemiBold 24/140% #241A2E`.
5. "10 of 10 used · resets on Monday.\nYour journal and practices stay free." centred at y=478, `Urbanist Regular 14/140% #736B66`.
6. Pro card 327x84 at (24,552), fill `#FFFFFF`, stroke 1.5 `#6B5279`, radius 24:
   - "Unlimited Glow AI with Pro" at (20,18) `Urbanist SemiBold 15/140% #241A2E`.
   - "7 days free, then €4.99/mo" at (20,42) `Urbanist Regular 13/140% #736B66`. Take the price from RevenueCat, not a literal.
   - "Pro" tag at (275,18), fill `#E2CC40`, radius 999, padding 2/8, `Urbanist Bold 11/140% #241A2E`.
7. "Start 7 days free" button 327x56 at (24,662), primary. It opens the paywall from `01-onboarding-auth.md` or starts the trial purchase directly.
8. "Wait until Monday" link centred at y=734, `Urbanist SemiBold 14/140% #8E7FA6`, which closes the screen.

Gaps vs code: free users are currently blocked completely. The client shows alerts (`chat/index.tsx:89-96`, `[issueKey].tsx:279-289, 339-344`) and the server returns 403 for anyone without a subscription (`supabase/functions/_shared/auth.ts:38-71`). There is no weekly counter.

### 3.7 Screen 7 — Support in chat (crisis sheet) [6701:3885]

The background is screen 2 under an overlay `#241A2E@0.55`. The sheet geometry, handle and button styles follow the shared crisis sheet in `04-journal-mood.md`. The chat-specific values are:

- Sheet at y=342, 375x470, fill `#F7F4F2`, top radius 36. Glow `#E2CC40@0.35` 260 at (57.5,-90) blur 60. Handle 40x5 `#D6CCC0` radius 3 at y=12.
- `Icon/Line heart` 30 at (172.5,40) (6598:1781).
- "You don’t have to carry this alone" centred at y=84: `Urbanist SemiBold 22/140% #241A2E`.
- Body in a 311 box at (32,150): "It sounds like you’re carrying something really heavy. If you’re thinking about harming yourself or you’re in danger, please get help now." `Urbanist Regular 14/140% #736B66`, centred.
- "Call emergency services" primary button 327x56 at y=246. Use the region's emergency number.
- "Message someone I trust" outline button 327x52 at y=312, stroke 1.5 `#6B5279`, `Urbanist SemiBold 15 #6B5279`. There is no trusted-contact feature yet; a share sheet is the minimum fallback.
- "I’m okay, keep talking" text at y=388, `Urbanist Medium 14/140% #A6A09B`, which dismisses the sheet.

Gaps vs code: the chat function only has a prompt instruction to mention helplines (`supabase/functions/chat/index.ts:97-99`). Nothing classifies risk or returns a flag that the client can use to open this sheet.

### 3.8 Screen 8 — Glow AI settings [6701:3960]

1. Back button (24,54). Title "Glow AI settings" centred at y=66: `Urbanist SemiBold 14/140% #241A2E`.
2. "How should Glow AI talk to you?" at (24,124): `Urbanist SemiBold 13/140% #241A2E`.
3. Tone pills row at (24,150), gap 8, single select. Selected "Gentle": fill `#F1ECF5`, stroke 1.5 `#6B5279`, padding 10/18, `Urbanist SemiBold 14/140% #6B5279`, height 43. Unselected "Direct" and "Playful": fill `#FFFFFF`, stroke 1 `#E8E0D5`, `Urbanist Medium 14/140% #736B66`, height 42.
4. Options card 327x231 at (24,212), fill `#FFFFFF`, radius 24, padding 4/16, rows separated by 1 px `#F0EBE5` dividers. Each row has padding 14/0 and gap 12, an icon circle 40 `#8E7FA6@0.14` with a 20 icon, a text column (title `Urbanist SemiBold 15/140% #241A2E`, subtitle `Urbanist Regular 12/140% #A6A09B`, gap 2), and a 46x28 toggle:
   - "Remember our talks" / "Uses past chats to understand you better", sparkle icon, on.
   - "Use my journal" / "Lets Glow AI reflect on your entries", journal icon, on.
   - "Voice replies" / "Hear answers out loud", mic icon, off.
5. "Delete all conversations" row 327x56 at (24,459), fill `#FFFFFF`, radius 22, text at (20,17) `Urbanist SemiBold 15/140% #C9744F`, chevron 18 at (289,19). Confirm with a destructive alert before deleting.
6. Footnote at (24,531), 327 wide: "Your talks are private and encrypted. Glow AI never shares them." `Urbanist Regular 12/140% #A6A09B`.

Gaps vs code:

- `app/(tabs)/chat/customize.tsx` shows goals, personality themes and session frequency with emojis (lines 21-44, 128-247) and a "Save Preferences" button in `#8B6B47` (255-265). `handleSave` does not persist anything (lines 66-69).
- None of the design settings exist in data: tone, memory, journal access, voice replies.
- There is no delete-all action. Only per-conversation clear exists (`[issueKey].tsx:366-379`).
- `app/(utils)/ai-privacy.tsx` is an unstyled permission screen with a "← Back" text link (lines 37-39). It is not in the Figma. Keep it and add a row linking to it from settings, because "Use my journal" and memory both depend on AI processing permission.
- `app/(tabs)/chat/ai-profile.tsx` (persona profile) has no place in the single-Glow-AI design and can be removed with the persona work.

## 4. Search screens

### 4.1 Search header (all search screens)

- Back button 44x44 at (24,58), same as the chat back button.
- Search field 219x48 at (78,56), fill `#FFFFFF`, radius 24.
  - Focused (screens 1, 2, 3, 5): stroke 1.5 `#6B5279` plus a focus ring shadow `0 0 0 4 #6B5279@0.12`.
  - Unfocused with text (screen 4): no stroke and no ring.
  - Search glyph 20x20 at (16,14), stroke 1.5, `#A6A09B` when empty and `#6B5279` when the field has text. This is an inline vector frame "icon/search" [6703:3938], not part of the Icon set. Add it to the icon set.
  - Placeholder "Search practices, journal…" at (44,15): `Urbanist Regular 14/140% #A6A09B`. Typed value: `Urbanist Medium 14/140% #241A2E`.
  - Clear button 22x22 at (185,13), fill `#F1ECF5`, radius 11, `Icon/Arrow close` 12. Give it a 44 hit slop.
- Filter button 44x44 at (307,58), fill `#FFFFFF`, radius 22, `Icon/Line filter` 20. Opens screen 5.

### 4.2 Shared result row

327x72, fill `#FFFFFF`, radius 22, no border, rows 10 apart.

- Icon circle 44x44 at (14,14), radius 22, tinted by type at 0.30 opacity with a 20 `#6B5279` icon: sleep practice moon on `#D8B4D8`, breathing leaf on `#7FC6F1`, mindfulness meditate on `#8E7FA6`, journal entry journal on `#E2CC40`, Glow AI talk sparkle on `#8E7FA6`, insight chart on `#7FC6F1`.
- Title at (70,15): `Urbanist SemiBold 15/140% #241A2E`. The matched substring is `Urbanist Bold 15/140% #6B5279` (for example the "Sleep" part of "Sleep Sounds" and "Deep Sleep").
- Category tag at (70,40): fill `#F1ECF5`, radius 999, padding 2/8, `Urbanist SemiBold 11/140% #6B5279`. Format: "Sleep · 25 min", "Practice · 20 min", "Journal · 27 Oct", "Glow AI talk · Tue", "Insights".
- Chevron 18 at (295,27).

### 4.3 Ask Glow AI card

327x72, fill `#FFFFFF`, stroke 1 `#6B5279@0.35`, radius 22, clip content. Glow `#E2CC40@0.40` 110 at (235,-35) blur 24. AI circle 44 `#6B5279` with white sparkle 20. Title "Ask Glow AI" `Urbanist SemiBold 15/140% #241A2E` at (70,15). Subtitle at (70,38) `Urbanist Regular 12/140% #736B66`: "Tell it how you feel" when idle, or the query in curly quotes when typing. Chevron 18 at (295,27). Tap opens screen 2 with the query staged as the draft.

### 4.4 Screen 1 — Search idle [6703:3915]

1. Header (§4.1), focused and empty.
2. "Recent" at (24,134) `Urbanist SemiBold 13/140% #241A2E`, and "Clear" right-aligned at (319,134) `Urbanist SemiBold 13/140% #8E7FA6`.
3. Recent chips row at (24,160), gap 8, using the foundations default chip (`#FFFFFF`, stroke 1 `#E8E0D5`, padding 8/14, `Urbanist Medium 13/140% #736B66`, height 36): "sleep sounds", "anxiety", "box breathing".
4. "Popular right now" at (24,236), then three result rows at y=262, 344, 426: "Deep Sleep" (Sleep · 25 min), "4-7-8 Calm" (Breathing · 5 min), "Grounding" (Mindfulness · 25 min).
5. "Not sure what you need?" at (24,522), then the Ask Glow AI card at y=548.

### 4.5 Screen 2 — Typing [6703:4001]

1. Header with value "medit" and the clear button.
2. Suggestions card 327x192 at (24,120), fill `#FFFFFF`, radius 22, padding 6/0. Each row is 45 high with padding 12/16 and gap 12, a search glyph 20 in `#8E7FA6`, and text `Urbanist Medium 15/140% #241A2E` with the matched substring in `Urbanist Bold 15/140% #6B5279`. Mock rows: "Meditation for sleep", "Meditation for anxiety", "Morning meditation", "Mindful Focus" (the last has no highlight, which implies fuzzy matching).
3. Ask Glow AI card at y=328 with subtitle "“meditation for when I can’t switch off”".

### 4.6 Screen 3 — Results [6703:4069]

1. Header with value "sleep".
2. "12 results" at (24,126) `Urbanist SemiBold 13/140% #241A2E`, and "Most relevant" right-aligned at (272,126) `Urbanist Medium 13/140% #8E7FA6`. The design shows no sort icon.
3. Type tabs, a horizontal scroll at (24,156), gap 8, which overflows the right edge: "All" (selected chip style, height 37), then "Practices" (meditate 16), "Journal" (journal 16) and "Glow AI" (sparkle 16). Chips with icons have left padding 10, gap 6, and the icon at 16.
4. Result rows starting at y=208: "Sleep Sounds", "Deep Sleep", "Tired but okay · slept 6h", "Can’t switch off at night", "Sleep quality this month".

### 4.7 Screen 4 — Nothing found [6703:4175]

1. Header with value "xyzzy", unfocused.
2. Glows: `#D8B4D8@0.45` 250 at (62.5,165) blur 60, and `#E2CC40@0.30` 160 at (147.5,230) blur 50.
3. "Searching rings" illustration [6703:4211], six concentric circles centred (187.5,290), stroke 1 `#6B5279`: 32 at 0.28, 64 at 0.24, 96 at 0.20, then dashed (3,6) 128 at 0.16, 160 at 0.12 and 192 at 0.08. A search glyph 20 in `#6B5279` sits in the centre. Build it with react-native-svg circles so it can pulse.
4. "Nothing here yet" centred at y=430: `Urbanist SemiBold 26/140% #241A2E`.
5. "We couldn’t find “xyzzy”. Try another word,\nor ask Glow AI in your own words." centred at y=470, `Urbanist Regular 14/140% #736B66`.
6. Centred suggestion chips at y=540: "sleep", "anxiety", "breathing", "focus". Tap fills the query.
7. "Ask Glow AI" primary button 327x56 at (24,690) with a sparkle icon 18.

### 4.8 Screen 5 — Filter sheet [6703:4239]

The background is screen 3 under an overlay `#241A2E@0.50`.

- Sheet at y=332, 375x480, fill `#F7F4F2`, top radius 36. Handle 40x5 `#D6CCC0` radius 3 at y=12.
- "Filter results" at (24,36): `Urbanist SemiBold 22/140% #241A2E`. "Reset" right-aligned at (316,42): `Urbanist SemiBold 14/140% #8E7FA6`.
- Group label `Urbanist SemiBold 13/140% #241A2E`, with chips 24 below the label and groups about 20 apart:
  - "Show" at y=86 (multi-select, wrapping, gap 8): "Practices" (meditate), "Journal" (journal), "Glow AI talks" (sparkle), "Insights" (chart). Mock selection: Practices and Journal.
  - "Length" at y=212 (single select): "Under 5 min", "5–15 min" (selected), "15+ min".
  - "Time" at y=296 (single select): "This week", "This month" (selected), "All time".
- CTA "Show 8 results" 327x56 at (24,382), primary. The count updates live from the draft filters.
- There is no close X in the design. Dismiss by tapping the overlay or dragging down.

### 4.9 Gaps vs code (`app/(tabs)/search.tsx`, `lib/search-catalogue.ts`)

- Header: `ScreenHeader` with the title "Search" (lines 56-61) sits above a full-width field of min height 52 with radius `lg` and a 1 px border that turns `colors.tint` on focus (62-75). The design has a single row: back circle, 219-wide pill field with radius 24 and a focus ring, and a separate filter circle. The filter button is currently inside the field (103-126).
- Placeholder is "Search Inner Glow..." (`i18n/locales/en/translation.ts:1730`). The design copy is "Search practices, journal…".
- The clear button is a bare 44 box with a 19 close icon (93-102). The design uses a 22 tinted circle with a 12 icon.
- The idle state lists the entire static catalogue with "Quick Access" (188-190). The design shows recent searches, popular items and the Ask Glow AI card. Recent searches need local persistence; popular items need a source (§6).
- There is no typing suggestions state and no match highlighting.
- Category chips map to 8 catalogue sections (Sleep, Mood, Meditation, Journal, Community, Home, AI Chatbot, Resources) (`lib/search-catalogue.ts:1-9`, `search.tsx:140-174`) with radius `md` and height 44. The design uses 4 content types (All, Practices, Journal, Glow AI) with pill chips.
- Sorting toggles "Recommended" and "A-Z" with a sort icon (192-208). The design shows "Most relevant" only.
- Result rows: min height 84, radius `xl`, 1 px border, 42 icon square with radius 14 and `inputBg` fill, subtitle as caption (221-258). The design is 72 high, radius 22, no border, a 44 round tinted icon, and a category tag pill.
- The catalogue is a static list of app screens matched on translated titles (`lib/search-catalogue.ts:22-243, 245-264`). The design searches content: practices with durations, journal entries, Glow AI talks and insights. This needs a backend RPC (§6).
- Empty state: `search-off` icon 32, "No results" and the message "Unfortunately, the key you entered cannot be found 404 Error, please try another keyword or check again." (260-285; `translation.ts:1732-1734`). The design has the rings illustration, new copy that echoes the query, suggestion chips and an Ask Glow AI CTA. The current copy wrongly mentions a 404 error.
- Filter sheet: a modal with a checkbox list of the 8 categories, a close X and an "Apply filters" button with a top border (287-409). The design has 3 chip groups (Show, Length, Time), top radius 36 instead of `UI.radius.xxl`, a 40x5 handle instead of 36x4, and a CTA with a live count. Length and Time filters have no data support.

## 5. Error and utility screens

### 5.1 Shared layout (`UtilityState`)

All five screens share one layout and differ only in illustration and copy:

- Back button 44x44 at (24,54), stroke 1.5 `#6B5279`, radius 22.
- Illustration area centred around (187.5,300), about 260 square (§5.2).
- Title in a 327 box at (24,486), centred: `Urbanist SemiBold 28/140% #241A2E`.
- Subtitle in a 287 box at (44,528), centred, up to two lines: `Urbanist Regular 14/140% #736B66`.
- Status chip centred at y=596, height 29: fill `#F1ECF5`, radius 999, padding 6/14/6/12, gap 6, icon 14 in `#6B5279`, `Urbanist SemiBold 12/140% #6B5279`.
- Primary CTA 327x56 at (24,666), fill `#6B5279`, radius 999, `Urbanist SemiBold 16/140% #FFFFFF`, with no icon.
- Secondary text link centred at y=738: `Urbanist SemiBold 14/140% #8E7FA6`.

| Screen | Title | Subtitle | Chip (icon) | CTA | Secondary |
|---|---|---|---|---|---|
| 404 | We lost the path | This page drifted away. Let’s take you somewhere calm. | Error 404 (chart) | Take me home | Go back |
| Offline | You’re offline | Check your Wi-Fi or mobile data. Your journal is saved on this device. | Works offline: journal & breathing (leaf) | Try again | Open offline mode |
| 500 | A little off balance | It’s on our side, not yours. Please try again in a moment. | Error 500 (activity) | Try again | Contact support |
| Maintenance | We’re tuning the glow | A short update is in progress. We’ll be back soon. | Back in about 30 min (moon) | Notify me | Close |
| Private | This space is private | You don’t have access to this page. Sign in with the right account. | Access restricted (lock) | Sign in | Go home |

### 5.2 Illustrations

Each illustration is glow (Skia) plus vector line art (react-native-svg). Export the line art from the listed node ids; draw glows from data.

- **404, drifting path.** Glows `#E2CC40@0.38` 260 at (57.5,170) blur 60 and `#D8B4D8@0.30` 170 at (162.5,245) blur 50. Path [6679:3121] 161.8x134.3 at (187.5,280), stroke 1.5 `#6B5279@0.35`, dash 3,7, round cap. It starts at the inner light and curves down-right to the lost point. Inner light `#F2D96A@0.90` 46 at (164.5,277) blur 10. Lost point `#8E7FA6@0.60` 10 at (332.5,415) blur 2. Optional motion: animate the dash offset slowly.
- **Offline, signal arcs.** Glow `#7FC6F1@0.30` 240 at (67.5,210) blur 60. Arcs group [6679:3156]: inner arc [6679:3157] 102x28.4 solid at 0.50, middle [6679:3158] 161.5x45 dashed 10,9 at 0.30, outer [6679:3159] 221x61.5 dashed 10,9 at 0.15, all stroke 2 `#6B5279`, round cap. Dim light `#E2CC40@0.50` 30 at (172.5,325) blur 8, and point `#F2D96A@0.80` 12 at (181.5,334) blur 2.
- **500, contour blob.** Glows `#FFB3BE@0.32` 260 at (57.5,170) blur 60 and `#E2CC40@0.30` 170 at (52.5,195) blur 50. Contour group [6679:3196] of 8 closed organic paths, stroke 1 `#6B5279` at opacity 0.30, 0.26, 0.22, 0.19, 0.11, 0.08 and 0.05 (inner to outer), plus one jagged "off balance" contour [6679:3201] stroke 1.4 `#E8828F@0.70`. Inner light `#F2D96A@0.90` 34 at (170.5,283) blur 8.
- **Maintenance, moon.** Glow `#D8B4D8@0.45` 250 at (62.5,175) blur 60. Contour group [6679:3238] of 6 paths, stroke 1 `#6B5279` at 0.22, 0.18, 0.15, 0.11, 0.07 and 0.05. Crescent moon [6679:3246] 61.8x76, fill `#F2D96A`, inside frame [6679:3245] 96x96 at (139.5,250) with drop shadow `0 0 24 4 #E2CC40@0.70`. Draw that shadow as a Skia glow behind the SVG moon.
- **Private, lock ring.** Glows `#8E7FA6@0.35` 250 at (62.5,175) blur 60 and `#E2CC40@0.30` 160 at (147.5,240) blur 50. Boundary circle [6679:3280] 150 centred (187.5,300), stroke 2 `#6B5279@0.50`. Hairline circle [6679:3281] 190, stroke 1 `#6B5279@0.15`. Inner light `#F2D96A@0.85` 50 at (162.5,275) blur 12. `Icon/Line lock` 30 at (172.5,284) (6598:1841). The circles are simple enough to draw in code.

### 5.3 Gaps vs code

- There is no `app/+not-found.tsx`. Unknown routes fall through to the expo-router default. `app/(utils)/error.tsx` is named `NotFoundScreen` but is only reachable by explicit navigation (`lib/route-paths.ts:102`).
- All five screens duplicate the same layout (for example `error.tsx:19-160`):
  - Back button 40x40 with card fill, border, shadow and `arrow-back-ios` (28-49) instead of the 44 stroked circle.
  - A 200 circle `#F0E8E0` with a 90 MaterialIcon (62-74) instead of the illustration: `person-search` (error), `warning #E8985A` (internal-error:71), `wifi-off` (offline:75), `construction` (maintenance:90), `block #C45B5B` (not-allowed:71).
  - Heading 24 instead of SemiBold 28; body with line height 21.
  - Status pill in orange `#FFF3E0`/`#FFE0B2` with a ⚠️ emoji and "Status Code: 404" (101-125).
  - CTA `#8B6B47` with `UI.radius.xl`, a home icon and a shadow (132-157); there is no secondary link.
- Copy differs everywhere (`i18n/locales/en/translation.ts:1649-1679`). Current examples: "Not Found", "Whoops! Dr. F can't find this page :(", "No Internet!", "Internal Error", "Whoops! Our server seems to error :(", "Maintenance", "Not Allowed", "Hey, you don't have permission.", "Contact Admin", "Take Me Home".
- `not-allowed.tsx:100-101` opens `mailto:support@freud.ai`, which is an old brand address. The design uses "Sign in" and "Go home".
- `maintenance.tsx:18` starts a fake countdown at 9 h 12 min with no data source. The design shows "Back in about 30 min" and "Notify me", which need a maintenance flag with an ETA.
- `offline.tsx:18-20` "refresh" does `router.replace('/')`. There is no network listener (no NetInfo or expo-network in `package.json`) and no offline mode. The only entries are `app/index.tsx:71` and `components/SessionGate.tsx:57`.
- `internal-error.tsx` is not navigated to from anywhere.
- `components/ui/StatusState.tsx` (inline error card with "Try again") is used inside screens such as `chat/index.tsx:201-210` and `[issueKey].tsx:534-545`. It is not a full-screen state and has no Figma design. Keep it for inline errors.
- `app/(utils)/empty.tsx` has no design. Remove it or replace it with the search "Nothing here yet" pattern.

## 6. Backend gaps

| Gap | Current state | Needed for |
|---|---|---|
| Single Glow AI instead of personas | 4 personas in `supabase/functions/chat/index.ts:9-78` and `lib/chat.ts:6, 45-82`; conversation keys embed persona and topic (`lib/chatKeys.ts`) | All chat screens |
| Structured actions and quick replies | Function returns `{ text }` only (`supabase/functions/chat/index.ts:192`); client derives citations from text (`lib/chat.ts:29-32`) | Practice card, quick reply chips. Use JSON or tool output: `{ text, actions: [{type:'practice', id, kind, minutes}], quickReplies: string[], risk }` |
| Streaming transcription and TTS | One-shot Whisper on base64 (`transcribe-audio/index.ts:30-86`), no auth/entitlement check visible, no TTS | Voice mode, "Voice replies" setting |
| Session summary | Not present | Screen 5: title, one-line summary and mood for history rows, mood before/after, key points, duration |
| Weekly free quota | `_shared/auth.ts:38-71` returns 403 without a subscription | Free tier (10 chats per week, resets Monday), quota line, screen 6. Needs a usage table and a check in the chat function |
| Crisis classification | Prompt text only (`chat/index.ts:97-99`) | Screen 7 trigger. Return a `risk` level from a moderation or classifier pass |
| Tone, memory and journal settings | Not stored; `customize.tsx:66-69` does nothing | Screen 8; chat function must read tone, include memory summaries and journal context when enabled and permitted |
| Delete all conversations | Per-key clear only (`useChat` `clearHistory`) | Screen 8 |
| Content search RPC | Static screen catalogue (`lib/search-catalogue.ts`) | Search results across practices, journal, talks and insights, with type/length/time filters, counts, highlight ranges and popular items |
| Offline mode | No network detection | Offline screen, "Open offline mode" (journal and breathing) |
| Maintenance flag | Hard-coded countdown | Maintenance screen with ETA and "Notify me" push |
| `+not-found` route | Missing | 404 screen for unknown routes and deep links |

## 7. Asset table

| Node id | Name | Screen | Kind | Size | Notes |
|---|---|---|---|---|---|
| 6699:3651-3654 (and scaled copies listed in §2.1) | Glow orb layers | Chat 1, 2, 4, 5, 6, 7 | Glow | S = 106-266 | Parametric component §2.1; animate |
| 6699:3747 | Mini orb | Chat header | Glow | 32 | Two layers, blur 8 and 3 |
| 6699:3630/3631 | Corner glows | Chat screens | Glow | 280, 220 | Blur 80 |
| 6703:3916/3917 | Corner glows | Search screens | Glow | 260, 200 | Blur 80 |
| 6699:3845 | Practice card glow | Chat 3 | Glow | 120 | `#7FC6F1@0.40` blur 26, clipped |
| 6703:3989 | Ask Glow AI card glow | Search 1, 2 | Glow | 110 | `#E2CC40@0.40` blur 24, clipped |
| 6701:3947 | Crisis sheet glow | Chat 7 | Glow | 260 | `#E2CC40@0.35` blur 60 |
| 6699:3907-3909 | Voice ripples | Chat 4 | SVG (code) | 300/250/200 | Animated circles, stroke 1 |
| 6701:3871/3872 | Limit ring track and arc | Chat 6 | SVG (code) | 240 | Ring thickness 3.6, start -90°, animate |
| 6699:3850 | Play triangle | Chat 3 practice card | Icon | 10 | Inline vector; add `play` to icon set |
| 6703:3938 | Search glyph | Search header, suggestions, rings | Icon | 20 | Inline vector; add `search` to icon set |
| 6703:4209/4210 | Nothing-found glows | Search 4 | Glow | 250, 160 | Blur 60, 50 |
| 6703:4211 | Searching rings | Search 4 | SVG (code) | 192 | 6 circles, 3 dashed 3,6; optional pulse |
| 6679:3118/3119/3122/3123 | 404 glows, inner light, lost point | 404 | Glow | 260/170/46/10 | See §5.2 |
| 6679:3121 (frame 6679:3120) | Drifting path | 404 | SVG | 161.8x134.3 | Dashed 3,7, round cap; optional dash animation |
| 6679:3155/3160/3161 | Offline glow, dim light, point | Offline | Glow | 240/30/12 | |
| 6679:3156 (3157-3159) | Signal arcs | Offline | SVG | 221x99 group | Export group |
| 6679:3194/3195/3205 | 500 glows, inner light | 500 | Glow | 260/170/34 | |
| 6679:3196 (3197-3204) | Contour blob | 500 | SVG | about 209x185 | Export group; pink contour 3201 |
| 6679:3237 | Maintenance glow | Maintenance | Glow | 250 | |
| 6679:3238 (3239-3244) | Moon contours | Maintenance | SVG | about 234x215 | Export group |
| 6679:3246 (frame 6679:3245) | Crescent moon | Maintenance | SVG + Glow | 61.8x76 | Shadow `0 0 24 4 #E2CC40@0.70` as Skia glow |
| 6679:3278/3279/3282 | Private glows, inner light | Private | Glow | 250/160/50 | |
| 6679:3280/3281 | Lock boundary and hairline rings | Private | SVG (code) | 150/190 | Simple circles |
| 6674:2966 | Legal note info glyph | Chat 2 | Icon | 14 | Foundations `Legal/Note` |
| Icons used | Icon/Line: filter 6609:2481, sparkle 6598:1814, chat 6598:1798, mic 6598:1848, activity 6598:1817, moon 6598:1792, heart 6598:1781, bell 6609:2484, journal 6598:1795, meditate 6598:1789, leaf 6598:1785, chart 6598:1859, lock 6598:1841, home 6604:2063, user 6604:2067. Icon/Arrow: back 6589:1632, chevron-right 6589:1657, close 6589:1672, forward 6589:1637. Icon/Mood: sad 6598:1763, neutral 6598:1739, happy 6598:1722, angry 6598:1777 | All | Icon | 12-30 | Foundations icon set; also needs `mic-off`, `send`, `play`, `search` |

There are no raster images in these three sections.

## 8. Proposed tasks

1. Build the shared `GlowOrb` Skia component (parametric four-layer orb plus mini orb, idle breathing animation) per §2.1, used by Glow AI screens 1, 2, 4, 5 and 6.
2. Rebuild the Glow AI home (screen 1, §3.1) in `app/(tabs)/chat/index.tsx`: greeting, Start talking and Voice buttons, quota line and Recent talks, restyling `ConversationRow`, and remove Quick Start, AI Team, Topics and the info card.
3. Rebuild the new chat start (screen 2, §3.2), replacing `new-conversation.tsx` and the `[issueKey]` empty state with the orb, four starters, chat header (§2.2), pill composer (§2.3) and legal note.
4. Restyle the conversation screen (screen 3, §3.3) in `[issueKey].tsx`: chat header, bubble geometry (§2.4), day stamps, new `TypingBubble`, and the composer with mic/send swap.
5. Add structured `actions`, `quickReplies` and `risk` to the chat function response and render the in-chat practice card (§2.5) and quick reply chips (§2.6) in screen 3.
6. Collapse the four personas into a single Glow AI in `supabase/functions/chat/index.ts`, `lib/chat.ts` and `lib/chatKeys.ts`, migrate existing conversation keys, and remove `ai-profile.tsx`.
7. Build the voice mode screen (screen 4, §3.4) with animated orb and ripples, live transcript and Mute/End/Text controls, backed by streaming transcription and TTS edge functions with the same entitlement check as chat.
8. Build the session summary screen (screen 5, §3.5) with a `chat-summary` edge function (title, summary, mood before/after, key points, duration), Save to journal, and the check-in reminder toggle.
9. Implement the weekly free quota (10 chats per week, Monday reset) in the database and `_shared/auth.ts`, show it on screen 1, and build the Free limit screen (screen 6, §3.6) with the animated ring linking to the paywall in `01-onboarding-auth.md`.
10. Add crisis classification to the chat function and open the crisis sheet (screen 7, §3.7) from the conversation, reusing the sheet from `04-journal-mood.md`.
11. Replace `customize.tsx` with Glow AI settings (screen 8, §3.8): tone pills, memory, journal and voice toggles persisted to the profile and honoured by the chat function, Delete all conversations, and a link to `ai-privacy.tsx`.
12. Rebuild the search idle, typing and results states (search screens 1-3, §4.1-4.6) in `app/(tabs)/search.tsx`: header row, recent searches, popular items, suggestions with highlight, type tabs, result rows with highlight, and the Ask Glow AI card.
13. Add a `search_content` Supabase RPC over practices, journal entries, Glow AI talks and insights with type, length and time filters, counts, highlight ranges and popular items (§6), replacing the static `lib/search-catalogue.ts`.
14. Build the search Nothing found state and Filter sheet (search screens 4-5, §4.7-4.8) with the rings illustration, suggestion chips, Show/Length/Time groups and a live result count.
15. Create a shared `UtilityState` layout and rebuild the 404, offline, 500, maintenance and private screens (§5.1), add `app/+not-found.tsx`, and remove the old palette, the `support@freud.ai` mailto and the fake countdown.
16. Export the five error illustrations (§5.2: drifting path 6679:3121, signal arcs 6679:3156, contour blob 6679:3196, moon contours 6679:3238 with crescent 6679:3246, lock rings 6679:3280/3281) and the search rings 6703:4211 as react-native-svg components, and record their glows as Skia data.
17. Wire offline detection and an offline mode for journal and breathing, a remote maintenance flag with ETA and Notify me, and route server failures to the 500 screen (§5.3, §6).
18. Update the English translations for all Glow AI, search and utility copy in `i18n/locales/en/translation.ts` and delete the dead persona, topic, search-catalogue and old error keys.

## 9. Open questions found in the design

- The 404 chip uses the `chart` (bar chart) icon, which looks like a placeholder. A compass or map icon would fit "We lost the path" better.
- The settings button on screen 1 uses the `filter` icon although the frame is named "Settings". A settings or sliders icon may be intended.
- The voice "Mute" control uses the plain mic icon. A muted state needs a `mic-off` icon, which the Figma icon set does not contain.
- The status colour `#838264`, the destructive colour `#C9744F`, the pink `#FFB3BE` and `#E8828F`, the light yellow `#F2D96A`, the handle `#D6CCC0`, the divider `#F0EBE5` and the chip fill `#E8DFD2` should be confirmed as tokens in `00-foundations.md`.
- "Message someone I trust" assumes a trusted-contact feature that does not exist.
- The Pro price "€4.99/mo" is hard-coded in the design and must come from RevenueCat.
- The design has no screen for conversation history ("See all"), loading states, or a send-in-progress composer state.
