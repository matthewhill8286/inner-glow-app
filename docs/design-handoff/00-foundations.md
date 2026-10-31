# 00 — Foundations (tokens, type, effects, shared components, icons, logo, asset pipeline)

Source: Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` "Main - Light Mode". Palette in use is option **B "Dusk Plum"** (`6640:3234`: `#4E3A5E · #8E7FA6 · #241A2E`).

Scope: aggregate scan (read-only `use_figma` scripts that walk every visible node, stopping at icon instances) of the 15 ready sections:

| Section | Id | Section | Id |
|---|---|---|---|
| Splash & Loading | `4002:13749` | Mental Health Journal | `4002:15069` |
| Welcome Screen | `4002:13781` | Mood Tracker | `4002:15067` |
| Sign In & Sign Up | `4002:14426` | AI Therapy Chatbot | `4002:15079` |
| Home & Mental Health Score | `6565:1491` | Search Screen | `4002:15085` |
| Smart Notifications | `4002:15075` | Sleep Quality | `4002:15071` |
| Mental Health Assessment | `4002:14604` | Profile Settings & Help Center | `4002:15083` |
| Profile Setup & Completion | `4002:15061` | Mindful Hours — Flow | `6614:2030` |
| Error & Other Utilities | `4002:15087` | | |

Reference frames: Logo `6572:1591`, Icons — Arrows `6586:1604`, Palette options `6640:2857`. Screenshots: `scratchpad/figma/shots/foundations-icons-arrows.png`, `foundations-logo.png`. Raw aggregation output: `scratchpad/figma/specs/foundations-1.txt`.

Important context for implementers: most library **main components** (Button `4002:11881`, Input Text `4002:12759`, Tag Master `4002:12372`, Top Nav `4002:13105`, Button Icon FAB `4002:12313`, Progress Bar `4002:12125`, status bar `4002:11841`, Monotone/* and Solid/* icons) are **still in the old brown/olive palette and ExtraBold weight** (`#4F3422`, `#9BB168`, Urbanist ExtraBold). The screens override them per instance. The specs below are taken from the **on-screen instances**, not the main components. Treat the main components as structure only.

---

## 1. Colour tokens

### 1.1 Solid colours actually used (counts = node paints across the 15 sections)

Text fills:

| Hex | Count | Sections | Role |
|---|---|---|---|
| `#241A2E` | 457 | 14 | Ink: primary body text, selected-option text, dark headings |
| `#4E3A5E` | 400 | 12 | Plum-deep: screen titles, card titles, active tab label, input label |
| `#736B66` | 373 | 15 | Muted text: body secondary, input value/placeholder, unselected chip text |
| `#A6A09B` | 281 | 12 | Subtle text: timestamps, inactive tab label + icon |
| `#FFFFFF` | 194 | 15 | On-primary text |
| `#8E7FA6` | 166 | 13 | Lavender: links ("See all", "Skip", "Forgot Password"), header title pill, eyebrow text |
| `#6B5279` | 108 | 11 | Plum: selected chip text, text buttons |
| `#8A8296` | 17 | 8 | Legal/Note text |
| `#FFFFFF@0.85/0.60/0.50` | 60 | 2–3 | Text on dark/hero (Sleep, Mindful player) |
| `#44403B` | 30 | 4 | **Old palette** body text (dates, journal entry text) |
| `#926247` | 14 | 1 | **Old palette** step tag text "1 of 14" (Assessment) |
| `#3F3C36` | 10 | 2 | **Old palette** ("I am Male/Female") |
| `#C9744F` | 4 | 3 | Off-palette warning text ("−4", "Tense · 7", "Delete all conversations") |
| `#838264` | 4 | 1 | **Old palette** "Status" text |
| `#D6C2B8` | 4 | 1 | **Old palette** ruler numbers (Assessment weight) |
| `#2B2622` | 2 | 1 | **Old palette** (Notification "Night sleep" moment) |
| `#B4505A` | 1 | 1 | Danger text |
| `#3E8FC4`, `#B39A1E`, `#E2CC40` | 1–2 | 1 | One-off accent text |

Shape fills / strokes:

| Hex | Count | Role |
|---|---|---|
| `#FFFFFF` | 444 fills | Card / input / chip surface, tab bar |
| `#6B5279` | 181 fills, 130 strokes @1.5, 36 @1, 29 @2 | **Primary**: button fill, toggle on, checkbox, back-button ring (1.5), selected outline (1.5), icon strokes, progress arc |
| `#F7F4F2` | 148 fills | **Screen background**; FAB-in-card fill; Glow AI button ring (stroke 5) |
| `#F1ECF5` | 126 fills | **Selected fill** (chips, options, segmented tab, soft button) |
| `#E8E0D5` | 87 fills, 48 strokes @1 | Border / chip-neutral fill / toggle off / divider |
| `#8E7FA6` | 52 fills, 98 strokes @1 | Lavender: speed pill selected fill + outline, toggle on (alt) |
| `#F0EBE5` | 55 | Warm sand surface (cards in Home/Mindful) |
| `#E6E0EA` | 39 strokes | Lilac border (Sleep factor chips) |
| `#EFEAF2` | 34 | Lilac surface |
| `#F5F1F7` | 21 | Lilac surface (lighter) |
| `#F3E9F3` | 3+4 | Soft button fill |
| `#E1DAE6` | 4 | Toggle off (alt) |
| `#E2CC40` | 87 ellipse fills, 10 shapes | **Mustard**: glow core, accent dots, step tag on paywall |
| `#E2CC40@0.30/0.35` | 41 | Mustard tint backgrounds |
| `#6B5279@0.05…0.35` | ~350 vector strokes | Thin plum line-art (contours, aura rings) — per-area SVGs |
| `#FFFFFF@0.08…0.92` | many | Glass surfaces on hero screens (Close button `#FFFFFF@0.80`) |
| `#B4505A` | 1 | Danger button fill |
| `#E89A7A`, `#00545D@0.18`, `#7FC6F1@0.35` | few | One-off category tints |

Glow colours (ellipses with LAYER_BLUR; full list in §3.2): `#E2CC40` mustard, `#D8B4D8` lilac, `#7FC6F1` sky, `#FFB3BE` rose, `#FFF6D6` cream, `#F2D96A` gold, `#E8DFD2` sand, `#8E7FA6` lavender, plus single uses `#E8A65C`, `#F2A98A`, `#B6BBE2`, `#9AC0E9`, the rainbow set `#D1B5DA #E1B4D2 #EDB3CA #F9B3C2 #FDB4B4 #F9B5A1 #F5B78E #F1BA7B #ECC067 #E7C654` (one 300px @0.14 each, a "spectrum" screen), and `#00545D@0.14` (old teal).

### 1.2 Gradients

| Use | Stops | Where |
|---|---|---|
| Glow AI tab button | RADIAL `#8E7FA6` 0 → `#6B5279` 1 | Nav/Tab Bar (17 instances, 6 sections) |
| Step progress (3px bars) | LINEAR `#E2CC40` 0 → `#8E7FA6` 1 | Assessment / Profile Setup step bars, 6px "Fill" bar |
| Chart bars (vertical) | LINEAR `#8E7FA6@1` → `#6B5279@0.70` (4px wide, many heights); also `#B98FC0@1→@0.70`, `#8E7FA6@1→@0.70` | Mood / Sleep charts |
| Chart bars (10px) | LINEAR `#E2CC40` → `#8E7FA6@0.60` | Sleep |
| Chart bars (28px) | LINEAR `#8E7FA6` → `#D8B4D8` | Mood |
| Mood spectrum | LINEAR `#FFB3BE@.95/0` `#D8B4D8@.95/.27` `#EFE6DA@.95/.50` `#E2CC40@.95/.73` `#7FC6F1@.95/1` + layer blur 5 | Mood (303×20/18), variants with blur 4–26 |
| Orb / inner light | RADIAL `#FFF6D6` → `#6B5279` (orb 24–56) ; `#FFF6D6` → `#F2D96A@.9/.6` → `#F2D96A@0/1` (inner light 52–80) ; `#FFF6D6` → `#D8B4D8@.5–.9` | AI / Mood / Splash |
| Avatar | LINEAR `#D8B4D8` → `#6B5279` | Profile (84, 96) |
| Area under chart | LINEAR `#E2CC40@.45` → `#E2CC40@0`; `#D8B4D8@.45→0`; `#D8B4D8@.55` → `#7FC6F1@.05` | Home / Sleep / Mood |
| Sky backgrounds | `#EAF2F5` → `#F5E9D9@.7` → `#F7F4F2`; `#D9ECF7` → `#F6E7D2@.5` → `#F7F4F2@.62` (375×812) | Notification "Sunset" moments |
| Sun | `#F6E6A0` → `#E9B66E`; `#F3DD6B` → `#E8A65C` | Notifications |
| Sleep window ring | ANGULAR `#8E7FA6` → `#E2CC40` | Sleep |
| Ring strokes | `#E8828F` → `#C9A0C9@.55` → `#5FAFE0`; `#8E7FA6` → `#E2CC40` | Mood / Home |
| Cover shade | LINEAR `#403B36@0` → `#403B36@0.45` (**old warm dark**) | Mindful covers `6617:2725…2853` |
| Timeline | `#E2CC40@.6` → `#E8E0D5@.4` (2×522) | Journal |
| Card tints | `#E6DDEE` → `#F3E6EE`; `#E6E1EE` → `#F6E7D2` | Home |
| **Old** chart bars | `#5B6B3C` → `#8E7FA6@.70` | `6186:3940/3958/3959/3977/3978/3979` |

### 1.3 Proposed token map (`constants/theme.ts`)

```ts
export const palette = {
  ink: '#241A2E',          // text.primary
  plumDeep: '#4E3A5E',     // text.heading, tab label active
  plum: '#6B5279',         // primary, icon stroke, outline-selected
  lavender: '#8E7FA6',     // accent, link, title pill
  lavenderSoft: '#D8B4D8', // glow, chart end
  textMuted: '#736B66',
  textSubtle: '#A6A09B',
  textLegal: '#8A8296',
  bg: '#F7F4F2',           // screen background
  surface: '#FFFFFF',
  surfaceSand: '#F0EBE5',
  surfaceLilac: '#EFEAF2',
  surfaceLilacSoft: '#F5F1F7',
  selected: '#F1ECF5',     // selected fill
  softButton: '#F3E9F3',
  border: '#E8E0D5',       // also chip-neutral fill, toggle off
  borderLilac: '#E6E0EA',
  toggleOffAlt: '#E1DAE6',
  mustard: '#E2CC40',      // glow core, accent dot
  gold: '#F2D96A',
  cream: '#FFF6D6',
  sky: '#7FC6F1',
  rose: '#FFB3BE',
  sand: '#E8DFD2',
  danger: '#B4505A',
  white: '#FFFFFF',
} as const;
// Semantic: text.primary=ink, text.heading=plumDeep, text.secondary=textMuted, text.tertiary=textSubtle,
// text.link=lavender, text.onPrimary=white, action.primary=plum, action.selectedFill=selected,
// action.selectedBorder=plum (1.5), border.default=border (1), focus.ring=rgba(107,82,121,0.18)
// glow: { mustard, lilac: lavenderSoft, sky, rose, cream, gold, sand, lavender }
// gradient: { glowButton: radial [lavender, plum], progress: [mustard, lavender], moodSpectrum: [...] }
```

Dark mode: no dark designs exist. Recommend `userInterfaceStyle: "light"` until dark screens are designed (see §7).

### 1.4 Old brown/olive leftovers (fix in Figma or override in code)

| Old colour | Where (node ids) | Replace with |
|---|---|---|
| `#E8DDD9` fill + `#926247` text | Assessment Top Nav step tag "1 of N" (`I4002:14611;615:7828` and 13 more), Tag Master xs "Aspirin" chips `4002:14880/14881`, frame `6037:2333` | `#F1ECF5` fill, `#6B5279` text |
| `#E8DDD9` stroke w4, `#D6C2B8` stroke w8/text | Assessment ruler "Helper" ticks `4002:14661/14665/14670/14680/14685`, numbers `4002:14691–14694` | `#E8E0D5` / `#A6A09B` |
| `#4B3425` drop shadows (63 nodes) | Card shadow `0,8,16 @5%` on Assessment options, Forgot Password Card, FAB `6015:1320`; 5-layer shadow on 2 sections | ink `#241A2E` at same alpha |
| `#96784F` shadow | Nav/Tab Bar main component bar `6604:2069` (+ all 5 variants, 21 instances) | `#6B5279@0.10` |
| `#9BB068` focus ring `0,0,0,4 @25%` | `4002:14487`, `4002:14982`, `4002:14675`, `6671:3174`, `6575:2059`, `6190:4475`, `6175:2027`, `6185:3123`, `6177:2909`, `6175:1368`, `6170:2255`, `6015:1271` | `#6B5279@0.18` |
| `#FE814B` ring | Tab Single `6037:2317` | `#6B5279@0.18` |
| `#3F3C36` text/fills | "I am Male/Female" `6175:1370/1761/1892/2032/2162/2292`, `6671:3176/3296`, rects `6015:1313`, `6186:4159`, `6185:3156`, `6575:2154` | `#241A2E` |
| `#44403B` text (30) | dates `6610:2549…2607`, `6566:1532…1554`; journal text `6682:3401/3416`, `6681:3413`, `6689:3612`, `6695:3616` | `#241A2E` |
| `#838264` text | "Status" `6699:3751/3834/3899`, `6701:3913` | `#8E7FA6` |
| `#F5F5F4` fills | Date frames `6566:1530/1541/1552`, `6610:2547…2605`, rects `6614:2300…2312` | `#F1ECF5` or `#F0EBE5` |
| `#FBF8F5` fills | Mindful "Cover" frames `6660:3205/3214`, `6666:3199…3266`, `6709:4537/4551`, `6710:4259/4273` | `#F0EBE5` |
| `#F3EFED` fills | `6186:3605…3641`, `6190:4181…4217`, "Mindful Hours" `6103:1267`, `6575:1786` | `#F0EBE5` |
| `#F2F5EB` fills | Tag Master `4002:14985/14986/14987` (Assessment symptoms) | `#F1ECF5` |
| `#E1E1E0`, `#C9C7C5` | `6037:2316`; Sign In frames `4002:14443/14447/14451` (stroke) | `#E8E0D5` |
| `#5B6B3C` gradient start | chart bars `6186:3940/3958/3959/3977/3978/3979` | `#8E7FA6` |
| `#403B36` shade | Mindful cover shades `6617:2725/2757/2789/2821/2853` | `#241A2E` at same alpha |
| `#2B2622` | Notification "Night sleep" `6628:2866`, `6629:2897`, texts `6628:2922/2938` | `#241A2E` |
| `#00545D` (old teal) | App icon dark bg `6572:1601`, glow `6596:1725`, icon bg `6565:1569` | decision needed (see blockers) |
| `#C9744F` | `6611:2586/2593`, `6628:2785`, `6701:4024` | `#B4505A` (danger) |

Not present on ready screens: `#96784E` and `rgba(155,176,104,x)` as fills (only as the `#9BB068` ring above and in the Palette options reference frame). The local paint styles "Muted olive" `#838264`, "Primary CTA" `#96784E`, "Text (primary)" `#112917` and the Gray/Blue/Teal/Red/Cyan/Purple ramps are leftovers and are not used by ready screens.

---

## 2. Typography

All live text is **Urbanist**, except 20 nodes in **Inter** (Regular 18/28 ls-0.4 ×16, Bold 20/32 ×2, Medium 12/16 ×2) in one section — flagged as a mistake.

### 2.1 Combos used (top entries; `auto` = Figma auto line height ≈ 1.2×; ls in %)

| Count | Style | Typical use |
|---|---|---|
| 139 | Medium 11/auto ls0 | tab labels (inactive), meta |
| 96 | SemiBold 15/auto | list titles |
| 83 | Bold 12/auto | badges |
| 82 | SemiBold 12/auto | chips, meta chip |
| 78 | SemiBold 16/auto | full-width CTA label, row titles |
| 75 | Medium 13/auto | secondary rows |
| 74 | Regular 12/auto | captions |
| 68 | SemiBold 16/auto ls-0.3% | input value, tag lg, segmented |
| 67 | Medium 15/auto | body |
| 53 | SemiBold 18/auto | card headings |
| 50 / 49 | SemiBold 16/140%, 15/140% | card titles |
| 46 | Medium 13/140% | chip default |
| 44 | **SemiBold 30/38 ls-1%** | screen titles |
| 44 | SemiBold 13/140% | chip selected |
| 41 | Bold 11/auto | tab label active, eyebrows |
| 40 | SemiBold 14/auto | input label (ls-0.2%), links |
| 34 | Regular 14/auto, SemiBold 14/140% | body small |
| 29 | SemiBold 18/auto ls-0.4% | button lg label |
| 27 | Medium 16/160% ls-0.3% | paragraph (option descriptions) |
| 24 | SemiBold 26/auto | section titles |
| 20 | SemiBold 30/auto | titles (no fixed lh) |
| 18 | SemiBold 20/auto ls-0.5% | Top Nav title |
| 17 | Regular 11/140% | Legal/Note |
| 17 | SemiBold 28/140% | big numbers |
| 7 / 3 / 2 | SemiBold 40, 56, 64 | score / timer numerals |

(Bold 96/140% ×8, SemiBold 96/100% ×5, SemiBold 128 are canvas section headings, not app UI.)

### 2.2 Text styles

Local text styles: 59, almost all **Plus Jakarta Sans** (unused on ready screens), plus "Heading sm/ExtraBold" (Urbanist SemiBold 30/38 ls-4%, used 1×), "teeext" (Urbanist Bold 20 ls-0.5%), "text 2 mid" (Urbanist Medium 14 ls-0.5%, used 1×). Ready screens use **remote library** Urbanist styles on only ~73 text nodes (of ~3,000): Paragraph/md (Medium 16/160%) 27×, Text sm/Bold 18×, Text lg/SemiBold 8×, Text md/SemiBold 6×, Text xs/Bold 4×, Paragraph/lg 4×, Text sm/SemiBold 3×, Heading sm/SemiBold 1×, Heading md/SemiBold 1×. No local variables exist. Conclusion: the file is not style-driven; the scale below is derived from usage.

### 2.3 Proposed type scale (`constants/typography.ts`)

RN `letterSpacing` is in px: `size × pct / 100`. Line heights in px.

| Token | Family (expo-google-fonts) | Size | Line height | Letter spacing | Use |
|---|---|---|---|---|---|
| `display` | Urbanist_600SemiBold | 40 | 48 | 0 | score numerals (56/64 for hero numbers: same family, lh 1.0) |
| `titleXl` | Urbanist_600SemiBold | 30 | 38 | −0.3 | screen titles |
| `titleLg` | Urbanist_600SemiBold | 26 | 32 | 0 | section heroes |
| `titleMd` | Urbanist_600SemiBold | 22 | 28 | 0 | modal titles |
| `titleSm` | Urbanist_600SemiBold | 20 | 25 | −0.1 | Top Nav title |
| `headline` | Urbanist_600SemiBold | 18 | 22 | −0.07 | card heading, button lg |
| `bodyStrong` | Urbanist_600SemiBold | 16 | 22 | −0.05 | CTA label, input value, row title |
| `bodyLg` | Urbanist_500Medium | 16 | 25.6 | −0.05 | paragraph (160%) |
| `body` | Urbanist_500Medium | 15 | 21 | 0 | body text (Regular variant for long copy: lh 145% = 21.75) |
| `bodySm` | Urbanist_400Regular | 14 | 20 | 0 | secondary body |
| `label` | Urbanist_600SemiBold | 14 | 17 | −0.03 | input label, links (Bold for "Forgot Password") |
| `chip` | Urbanist_500Medium / 600SemiBold | 13 | 18 | 0 | chip default / selected |
| `caption` | Urbanist_600SemiBold | 12 | 16 | 0 | meta chip, badges (Bold 12 variant) |
| `micro` | Urbanist_500Medium | 11 | 13 | 0 | tab label inactive (Bold when active) |
| `eyebrow` | Urbanist_700Bold | 11–12 | 14 | +0.66 to +2.6 (6–24%) | uppercase overlines |
| `legal` | Urbanist_400Regular | 11 | 15.4 | 0 | Legal/Note |

Weights needed: 400, 500, 600, 700. ExtraBold 800 is only in the stale main components and is not needed.

---

## 3. Effects

### 3.1 Drop shadows (exact)

| Token | Figma value | Uses | RN (0.81 `boxShadow` string) |
|---|---|---|---|
| `shadow.card` | `0 8 16 0 #4B3425@0.05` (recolour to `#241A2E`) | 25 (option cards, Forgot Password Card, white FAB) | `'0px 8px 16px 0px rgba(36,26,46,0.05)'` |
| `shadow.tabBar` | `0 -4 24 0 #96784F@0.10` (recolour) | 21 | `'0px -4px 24px 0px rgba(107,82,121,0.10)'` |
| `shadow.glowButton` | `0 0 18 2 #E2CC40@0.55` + `0 6 14 0 #6B5279@0.30` | 21 (tab Glow AI button) | `'0px 0px 18px 2px rgba(226,204,64,0.55), 0px 6px 14px 0px rgba(107,82,121,0.30)'` |
| `shadow.soft` | `0 6 18 0 #6B5278@0.08` | 3 | `'0px 6px 18px 0px rgba(107,82,121,0.08)'` |
| `focus.ring` | `0 0 0 4 #6B5279@0.18` (also @0.12) | 6 | `'0px 0px 0px 4px rgba(107,82,121,0.18)'` |
| `halo.sm` | `0 0 14 3 #E2CC40@0.80` / `0 0 8 2 #E2CC40@0.70–0.80` | 9 | glow on small dots (mood/score knobs) |
| `halo.lg` | `0 0 40 10 #E2CC40@0.55–0.60`, `0 0 24 6 #D8B4D8@0.70`, `0 0 14 3 #FFB3BE@0.90` | 7 | glowing orbs |
| `shadow.dark` | `0 4 14 0 #000@0.18` | 6 | media cards on dark |
| Layered "realistic" | `#4B3425` @ `0,14,31/.10`, `0,57,57/.09`, `0,128,77/.05`, `0,228,91/.01`, `0,356,100/0` | 5 (2 sections) | collapse to `shadow.card` |

Local effect styles (15) are all leftovers ("Chart Indicator …", "Input Selected … 4px", "Card Shadow Blue/Black", "hhjhj" = `#9BB068` ring) and are not used by ready screens.

iOS-only fallback if `boxShadow` is not used: `shadowColor`, `shadowOffset {x,y}`, `shadowOpacity = alpha`, `shadowRadius = blur / 2`. Spread is not supported by the legacy props.

### 3.2 Glow recipe

Glows are **ELLIPSE + solid fill at low opacity + LAYER_BLUR**, never files. Observed bands:

| Band | Diameter | Blur radius | Opacity | Colours | Typical placement |
|---|---|---|---|---|---|
| Ambient | 200–340 | 80–90 | 0.14–0.45 | mustard, lilac, sky, rose, lavender | 1–3 per screen behind header/hero, partially off-screen |
| Mid | 70–260 | 18–60 | 0.25–0.70 | mustard, lilac, sky, rose, cream | behind rings, orbs, score |
| Accent | 16–64 | 2–16 | 0.45–0.95 | mustard, gold `#F2D96A`, cream `#FFF6D6` | dots, knobs, tab active glow (36 @0.30 blur 10) |
| Light beam | 26–72 × 90–330 rect | 6–14 | linear mustard @0.9 → 0 | mustard | Mindful/Home moments |

Most common instances: `#E2CC40@0.30` 36×36 blur 10 (tab active glow, 20×), `#E2CC40@0.18` 220 blur 90 (19×), `#D8B4D8@0.28` 220 blur 80 (16×), `#7FC6F1@0.30` 240 blur 90 (9×), `#E2CC40@0.25` 260 blur 90 (8×). Scaled "orb" families keep blur ≈ 0.2–0.26 × diameter (e.g. 99/19.8, 154/30.8, 266/56).

### 3.3 Rendering glows in RN (`@shopify/react-native-skia`)

- Skia `<Blur blur={σ}>` takes a Gaussian sigma; Figma layer-blur radius ≈ 2σ, so **σ = radius / 2**.
- The canvas must extend at least `radius` (safer: `1.5 × radius`) beyond the ellipse on every side, or the blur is clipped.
- Draw all glows of a screen inside **one** absolutely positioned `<Canvas pointerEvents="none">` behind content (one GPU surface per screen, not per glow).

```tsx
// components/glow/Glow.tsx
export type GlowSpec = {
  color: string;      // token, e.g. palette.mustard
  opacity: number;    // 0..1 (Figma paint opacity)
  x: number; y: number;      // top-left of the ellipse in screen coords (Figma x/y relative to the 375 frame)
  width: number; height?: number; // ellipse size (height defaults to width)
  blur: number;       // Figma LAYER_BLUR radius
};
export function GlowField({ glows, style }: { glows: GlowSpec[]; style?: ViewStyle }) {
  // <Canvas style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
  //   {glows.map(g => (
  //     <Oval key=… x={g.x} y={g.y} width={g.width} height={g.height ?? g.width}
  //           color={g.color} opacity={g.opacity}>
  //       <Blur blur={g.blur / 2} />
  //     </Oval>))}
  // </Canvas>
}
export function Glow(props: GlowSpec & { style?: ViewStyle }) // single glow, own padded Canvas, for use inside components (tab active glow, knobs)
```

Optional `animated` prop (Reanimated shared value on opacity/scale) for breathing/pulse effects in Mindful and Splash. Horizontal positions are designed for a 375pt frame; scale x by `windowWidth / 375` and keep y as designed.

---

## 4. Shared components (specs from on-screen instances)

Spacing frame: screens are 375×812; horizontal gutter **24** (content 327) on most redesigned screens, **16** (content 343) on Sign In / Assessment component-based screens. Status bar 44, home indicator 34.

### 4.1 Button — main set `4002:11881`
| Variant | Spec | Seen in |
|---|---|---|
| Primary (component) | h56, radius full, fill `#6B5279`, padding 16/24, label SemiBold **18** ls −0.4% `#FFFFFF`; with icon: gap 12, Icon/Arrow `forward` 24 (`6589:1637`) right | Welcome, Sign In, Assessment, Mindful (24) — `4002:13886` |
| Primary (frame, full width 327) | h56, radius 999, fill `#6B5279`, label SemiBold **16** ls0 `#FFFFFF` centred | 12 sections (63) — `6674:3010` |
| Primary tall | h58, SemiBold 17 `#FFFFFF` | 4 — `6655:3281` |
| Soft | h56, fill `#F3E9F3`, SemiBold 16 `#241A2E` | Sleep `6712:4496`, Notif `6628:2937` |
| Outline | h56, transparent or `#FFFFFF`, stroke 1.5 `#6B5279` (or @0.50), SemiBold 16 `#6B5279`/`#4E3A5E` | AI `6699:3665`, Notif `6628:2842`, Sleep `6716:4504` |
| Selected option (Yes/No) | h56, fill `#F1ECF5`, stroke 1.5 `#6B5279`, SemiBold 18 `#241A2E`; unselected fill `#FFFFFF` text `#4E3A5E` | Assessment `4002:14809/14810` |
| Ghost / tertiary | h56 fill `#F1ECF5` no stroke, SemiBold 18 `#6B5279` ("Prefer to skip, thanks") | Assessment `4002:14631` |
| Text button | h48, no fill, SemiBold 15 `#6B5279` | Settings `6723:4887` |
| Danger | h56 fill `#B4505A`, SemiBold 16 `#FFFFFF` | Settings `6723:4885` |
| Text link | Bold 14 `#8E7FA6` ("See all"), SemiBold 14 `#8E7FA6` ("Skip"), Bold 14 ls −0.2% `#8E7FA6` underline ("Forgot Password"), prefix Bold 14 `#736B66` ("Already have an account? ") | Sign In, Home, Journal, AI, Profile Setup |
| Icon FAB — main set `4002:12313` | circle; xl 80 fill `#6B5279` + Icon/Arrow forward 24 (Sign In `4002:13974`); lg 64 fill `#FFFFFF` + `shadow.card` + close 24 (`6015:1320`); sm 48 fill `#F7F4F2` as icon well in cards | Sign In, Assessment |

Inconsistency: CTA label 16 (63×) vs 18 (24×, component instances) vs 17 (4×). Recommend `size="lg"` 18 for in-flow component buttons and default 16 for full-width bottom CTAs, or pick one (see blockers).

### 4.2 Back / close buttons (inconsistent sizes)
| Variant | Spec | Sections |
|---|---|---|
| Back 44 | 44×44 circle, no fill, stroke 1.5 `#6B5279`, Icon/Arrow `back` **22**, at x24 y54 (y58 Search) | Profile Setup, Error, Journal, Mood, AI, Sleep, Settings, Search (41 nodes) — `6676:3035` |
| Back 44 white | same, stroke `#FFFFFF` | Sleep (dark) |
| Back 50 | 50×50, stroke 1.5 `#6B5279`, icon **24** at 13, at x25 y51 | Home, Notifications, Mindful (26) — `6566:1755` |
| Back 48 (Top Nav) | 48×48 circle, stroke **1** `#6B5279` (Assessment) or `#736B66` (Sign In), icon 24 at 12 | Assessment, Sign In — `I4002:14611;615:7824` |
| Close 40 | 40×40, fill `#FFFFFF@0.80` (or `#FFFFFF`), Icon/Arrow `close` 20–22, at x319 y54 | Welcome, Home, Assessment, Journal, Mindful |
| Close 44 | 44×44, fill `#FFFFFF@0.80` (`@0.12` on dark), close 22, at x307 y54 | Notifications, Mood, AI |

Recommendation: one `IconButton` with `size: 44 | 48 | 50` (default 44, icon 22; 50 → icon 24), `variant: 'outline' | 'glass'`, `tone: 'plum' | 'white'`, hit slop to 48.

### 4.3 Header title pill ("Tag Master" lg Outlined, set `4002:12372`, variant `4002:12379`)
h40, radius 32, padding 8/14, stroke 1 `#8E7FA6`, no fill, label SemiBold 16 ls −0.3% `#8E7FA6`, horizontally centred, top y56 (Home, Mindful; 26 instances) or y60. Welcome uses ink variant: stroke and text `#241A2E` ("Step One", `4002:13975`). Sits on the same row as the back button (back 50 at y51 → centre y76 = pill centre).

### 4.4 Top Nav (set `4002:13105`; Assessment, Sign In)
343×48 row, gap 12: back container 48 (above) → title SemiBold 20 ls −0.5% `#4E3A5E` (fills) → step tag (Tag Master sm: h28, radius 32, padding 6/10, label Bold 14 ls −0.2%; currently old `#E8DDD9`/`#926247` → use `#F1ECF5`/`#6B5279`). Variant "Icon Left Only" = back container only. In Mindful two Top Nav instances (`219×24`, `265×24`, fill `#4E3A5E`) are misused as something else — ignore.

### 4.5 Nav / Tab Bar (set `6604:2177`; variants Home `6604:2068`, Practices `6604:2090`, Glow AI `6604:2112`, Journal `6604:2133`, Profile `6604:2155`)
- Frame 375×92 placed at y719 (overlaps the 34 home-indicator zone). Bar = rect y22, 375×70, fill `#FFFFFF`, top corners radius 32 (bottom square), `shadow.tabBar`.
- 5 slots of 75: Home, Practices, **Glow AI (centre)**, Journal, Profile. Icons Icon/Line 24 (`home 6604:2063`, `meditate 6598:1789`, `journal 6598:1795`, `user 6604:2067`) at y32, centred in slot. Labels at y60, slot-wide, centred, Urbanist 11: active **Bold `#4E3A5E`**, inactive **Medium `#A6A09B`**; icon stroke active `#6B5279` (Journal variant uses `#4E3A5E`, inconsistency), inactive `#A6A09B`.
- Active glow: ellipse 36×36 `#E2CC40@0.30`, LAYER_BLUR 10, centred on the active icon (x = slot centre − 18, y26).
- Centre button: 60×60 circle at x157.5, **y−6** (rises 28 above bar top), RADIAL `#8E7FA6`→`#6B5279`, stroke 5 `#F7F4F2` (outside ring), `shadow.glowButton`, Icon/Line `sparkle` 26 at 17,17 stroked `#FFFFFF` 1.7 with mustard accent. Label "Glow AI" under it at y60 (Bold `#4E3A5E` when active).
- Instances: Home (6), Practices (12, Mindful), Glow AI, Journal, Profile (1 each).

### 4.6 Input Text (set `4002:12759`; `4002:12774` start icon, `4002:12760` start & end)
Column gap 8: label SemiBold 14 ls −0.2% `#4E3A5E`; field h56 (one instance 51), radius full, fill `#FFFFFF`, padding 16, value/placeholder SemiBold 16 ls −0.3% `#736B66` (no separate placeholder colour). Focused (`4002:14439`): stroke 1 `#6B5279` + `focus.ring`. End icon: eye 24 (`Solid/54 anatomy eye 4002:12944`, old colour). Start icon hidden on screens. No error state is designed.

### 4.7 "Helper" (`4002:13618`, `4002:13619`)
Despite the name, these are **ruler tick lines** for the Assessment weight/age pickers (0-width lines, stroke 4 `#E1E1E0` / 8 `#C9C7C5`, overridden to old `#E8DDD9`/`#D6C2B8`). There is no helper-text component. Owned by the Assessment doc.

### 4.8 Legal / Note (`6674:2966`, 17 instances, 8 sections)
Row 327 wide, gap 8, align top: info icon 14×14 (circle + i, stroke 1.05 `#8E7FA6`, dot fill `#8E7FA6`) → text Urbanist Regular 11/140% `#8A8296`, 305 wide: "INNER GLOW supports your wellbeing. It is not a medical service and does not replace professional care." (2 lines, height 30).

### 4.9 Chips / tags / pills
| Kind | Spec | Example |
|---|---|---|
| Filter chip | h36, radius 999, padding 8/14, gap 6; default fill `#FFFFFF`, stroke 1 `#E8E0D5`, Medium 13/140% `#736B66`; selected fill `#F1ECF5`, stroke 1.5 `#6B5279`, SemiBold 13/140% `#6B5279` | Search `6703:3950` / `6703:4106` |
| Option pill | h42, padding 10/18, Medium 14/140% `#736B66` / selected SemiBold 14 `#6B5279`, same fills/strokes | Profile Setup `6676:3104` / `6676:3108` |
| Factor chip | h34, stroke 1 `#E6E0EA` default | Sleep |
| Meta chip | h22, padding 4/10, fill `#E8E0D5`, SemiBold 12 `#4E3A5E` ("4 min") | Mindful `6615:2295` |
| Info chip | h29, padding 6/14/6/12, gap 6, fill `#F1ECF5`, Icon/Line 14 + SemiBold 12/140% `#6B5279` | Error `6679:3145` |
| Speed pill (single-select) | h30, padding 6/12, gap 6 between pills; selected fill+stroke `#8E7FA6` Bold 13 `#FFFFFF`; default stroke 1 `#8E7FA6` Medium 13 `#8E7FA6` | Mindful `6615:2304` |
| Go Pro chip | h37, fill `#6B5279`, padding 10/12/10/10, gap 6, crown 16 + Bold 14 `#FFFFFF` | Home `6601:2045` |
| Tag xs (removable) | h24, radius 32, padding 4/8, gap 4, Bold 12 ls −0.2% + close 16 | Assessment `4002:14880` (old fill) |

### 4.10 Toggle (no component; frames)
46×28, radius 14, knob 22 `#FFFFFF` at x3 (off) / x21 (on). On fill `#6B5279` (17×) **or** `#8E7FA6` (13×); off fill `#E8E0D5` (6×) **or** `#E1DAE6` (4×). Recommend on `#6B5279`, off `#E8E0D5`. Examples `6677:3125` (on), `6615:3386` (off).

### 4.11 Radio / checkbox
- Option-card radio: Monotone/71 radio empty `4002:13177` and Monotone/72 radio filled `4002:13652`, Solid/71 `4002:13695`, Solid/72 `4002:13179` (24, old `#4F3422` glyphs). Replace with a drawn radio: 22 ring stroke 1.5 `#6B5279`, dot 12 `#6B5279` (paywall reference `6640:3371/3372`).
- Checkbox: 22×22, radius 6, fill `#6B5279`, check 14 stroke 1.5 `#FFFFFF` (`6674:3006`).
- Selectable card (Assessment Goal/Medications/Distress, sets `4002:13162`, `4002:13688`, `4002:13635`): h56 radius full or radius 32 for tall card; default fill `#FFFFFF` + `shadow.card`; selected fill `#F1ECF5` + stroke 1.5 `#6B5279`, text `#241A2E`.

### 4.12 Progress
- Step progress (onboarding header): rects h3 radius 2, width = step × (120/total) (24/48/72/96/120 for 5 steps; 30/60/90/120 for 4), LINEAR `#E2CC40` → `#8E7FA6`.
- Linear bar: Progress Bar Atom sm 104×6 fill `#6B5279` (`6037:2334`); "Fill" 191×6 gradient mustard → lavender; Progress Bar 180×8 (`4002:13972`, main still `#F2F5EB` track / `#9BB168` fill — needs recolour: track `#E8E0D5`, fill `#6B5279`).
- Ring: 148 ring, track `#8E7FA6@0.20`, arc `#6B5279`, head dot 10 `#E2CC40` (Splash loading).

### 4.13 Segmented control (Tab Group Text `4002:13561`, Tab Single `4002:13585`)
Container h56, fill `#FFFFFF`, radius 32, padding 4; segments h48 equal width, radius full, padding 8/16; selected fill `#F1ECF5` + stroke 1.5 `#6B5279`, SemiBold 16 ls −0.3% `#241A2E`; unselected no fill, `#4E3A5E` (`4002:14654`, kg/lbs). Small variant Tab Single sm 43×32 fill `#8E7FA6` SemiBold 12 `#FFFFFF` (`6037:2317`, old `#FE814B` ring).

### 4.14 Status bar and home indicator
- Status bar `iPhone X (or newer)` 375×44 (`4002:11842`): glyphs overridden to `#6B5279`/`#241A2E` on light screens, `#FFFFFF` on dark (Splash night, Notification moments, Sleep). Implement with `expo-status-bar` `style="dark"` default and `style="light"` on dark screens. Do not draw it.
- Home indicator 375×34 (`4002:11873`, bar 134×5 at 121,21): `#6B5279` (light), `#FFFFFF@0.50–0.60` (dark). System-drawn; do not draw it.
- Safe areas: design top inset 44 → first row (back button) at y51–54, i.e. `insets.top + 7…10`. Bottom inset 34 → bottom CTA sits at y≈722–734 (`insets.bottom + 44…56` from bottom) on screens without the tab bar.

---

## 5. Icon set

All main components 24×24. Stroke icons use round caps/joins. Export each as SVG from the main component id; convert `#6B5279` → `currentColor` and `#E2CC40` → an `accent` prop.

### 5.1 Icon/Arrow (set `6589:1685`, stroke 1.8 `#6B5279` + mustard "Glow dot") — 11 variants
`back 6589:1632`, `forward 6589:1637`, `up 6589:1642`, `down 6589:1647`, `chevron-left 6589:1652`, `chevron-right 6589:1657`, `chevron-up 6589:1662`, `chevron-down 6589:1667`, `close 6589:1672`, `replay 6589:1678`, `forward-10 6589:1684`.
Used on ready screens at 12–40 (mostly 22/24; chevron-right 18/20; forward 40 ×21 in one section).

**Glow arrow build:** two vectors in a 24 box. "Arrow" = open path stroke `#6B5279` 1.8, round caps and joins (back: 9.5×9 at 5.5,7.5). "Glow dot" = filled circle Ø3.8 `#E2CC40` placed at the tail end of the shaft (back: at 17.1,10.1 i.e. right of the shaft; forward: at 6.9,13.9 left of it; close: Ø4.2 in the centre at 9.9,9.9). No blur — the "glow" is just the mustard dot.

### 5.2 Icon/Line (set `6598:1860`, stroke 1.6, accent dot on bot/sparkle/confetti) — 29 variants
`heart 6598:1781`, `leaf 6598:1785`, `meditate 6598:1789`, `moon 6598:1792`, `journal 6598:1795`, `chat 6598:1798`, `star 6598:1801`, `bot 6598:1806`, `eye 6598:1810`, `sparkle 6598:1814`, `activity 6598:1817`, `users 6598:1821`, `health 6598:1825`, `confetti 6598:1831`, `flame 6598:1834`, `check 6598:1837`, `lock 6598:1841`, `crown 6598:1844`, `mic 6598:1848`, `infinity 6598:1851`, `music 6598:1856`, `chart 6598:1859`, `home 6604:2063`, `user 6604:2067`, `filter 6609:2481`, `bell 6609:2484`, `share 6609:2487`, `plus 6609:2490`, `note 6609:2494`.
Unused on ready screens: confetti, infinity (export anyway). Used sizes 12–48 (sparkle up to 48).

### 5.3 Icon/Mood (set `6598:1778`, stroke 1.6 + filled features `#6B5279`; crying adds `#7FC6F1` tear) — 10 variants
`happy 6598:1722`, `very-happy 6598:1728`, `excited 6598:1733`, `neutral 6598:1739`, `thinking 6598:1745`, `confused 6598:1751`, `surprised 6598:1757`, `sad 6598:1763`, `crying 6598:1770`, `angry 6598:1777`. Used 16–56.

### 5.4 Arrow/Soft and Arrow/Sketch (reference, 48×48, stroke 3.6)
Soft: back `6586:1613`, forward `6586:1620`, up `6586:1627`, down `6586:1634`, chevron-left `6586:1640`, chevron-right `6586:1646`, close `6586:1652`, replay `6586:1659`, forward-10 `6586:1666`.
Sketch: back `6586:1748`, forward `6586:1755`, up `6586:1762`, down `6586:1769`, chevron-left `6586:1775`, chevron-right `6586:1781`, close `6586:1787`, replay `6586:1794`, forward-10 `6586:1801`.
**No ready screen uses them** (instance scan found 0). Export only if the design adopts them later.

### 5.5 Legacy Monotone/* and Solid/* used by ready screens (old `#4F3422`, 24×24)
`Monotone/11 search 4002:13685` (16), `Monotone/71 radio empty 4002:13177`, `Monotone/72 radio filled 4002:13652`, `Solid/17 document 4002:13697`, `Solid/54 anatomy eye 4002:12944`, `Solid/71 radio empty 4002:13695`, `Solid/72 radio filled 4002:13179`, `Solid/76 microphone 4002:13701`. Recommend redrawing radio as code (§4.11) and adding `search`, `document`, `eye-solid`, `mic-solid` to the set recoloured to currentColor (or ask design for Icon/Line equivalents: Icon/Line has `eye` and `mic`).

---

## 6. Logo (`6572:1591`, concept "A — Halo")

Mark = 3 concentric shapes: halo disc `#E2CC40@0.22` (60% of box), core disc `#E2CC40` (30%), ring stroke `#6B5279` (72% of box, stroke 5% of box). Mono small marks use `#241A2E` for all three (halo @0.22).

| Asset | Node id | Size | Notes |
|---|---|---|---|
| Mark (in app icon) | `6572:1597` | 148 | ring stroke 7.4 |
| Mark (stacked) | `6572:1613` | 96 | ring 4.8 |
| Mark (horizontal) | `6572:1607` | 56 | ring 2.8 |
| Mark mono 40 | `6572:1619` | 40 | `#241A2E`, ring 2 |
| Mark mono 28 | `6572:1623` | 28 | ring 1.4 |
| Mark mono 20 | `6572:1627` | 20 | ring 1 |
| Lockup horizontal | `6572:1606` | 246×56 | mark 56 + gap 14 + "inner glow" Urbanist SemiBold 40 ls −3% `#4E3A5E` |
| Lockup stacked | `6572:1612` | 436×250 (white card) | mark 96; "INNER GLOW" Urbanist Bold 22 ls +24% `#241A2E`; "feel it from within" Regular 14 `#736B66`; export content only (no white card) |
| App icon light | `6572:1596` | 208 | fill `#FFFFFF` (canvas stroke `#E8E0D5` is not part of the icon), mark 148 at 30,30 |
| App icon dark | `6572:1601` | 208 | fill `#00545D` (old teal), ring `#F7F4F2` |

Export the mark and lockups as SVG with text **outlined** (Figma "Outline text" on export, or export from a flattened copy) so the wordmark does not depend on fonts. For app icons, export PNG at 1024×1024 (scale 4.923× from 208) without the rounded mask (iOS applies its own); Android adaptive foreground = mark centred in the 66% safe zone on transparent, background = solid colour, monochrome = mono mark.

---

## 7. Gaps vs code

| File:line | Current | Design |
|---|---|---|
| `constants/theme.ts:8-10` | `brandBrown #8B6B47`, dark `#C4A882` | primary `#6B5279` |
| `constants/theme.ts:13-15` | cream `#FAF8F5`, cream2 `#F2ECE6`, ink `#1B1A18` | bg `#F7F4F2`, ink `#241A2E` |
| `constants/theme.ts:18-26` | sage/amber/lavender `#7B6DC9`/score greens | lavender `#8E7FA6`, mustard `#E2CC40`, glow palette, danger `#B4505A` |
| `constants/theme.ts:29,41-42,62-69` | border `#E7E5DE`, muted `#676A62`/`#73766E`, inputBg cream2 | border `#E8E0D5`, muted `#736B66`, subtle `#A6A09B`, input bg `#FFFFFF`, heading `#4E3A5E`, selected `#F1ECF5` |
| `constants/theme.ts:72-74` | tab selected sage, default `#73766E` | label active `#4E3A5E` Bold, icon active `#6B5279`, inactive `#A6A09B` |
| `constants/theme.ts:81-125` | full dark palette (brown) | no dark designs; dark values are untested against new palette |
| `constants/theme.ts:131-138` | radius sm12…xxl20, pill 999 | pill 999 for buttons/inputs/chips/back buttons, 32 tags/segmented/tall cards, 22 result cards, 14 toggle, 6 checkbox |
| `constants/theme.ts:151-173` | black shadows `0/1/3`, `0/2/8`, `0/4/16` | `shadow.card`, `shadow.tabBar`, `shadow.glowButton`, `focus.ring` (§3.1) |
| `constants/typography.ts:4-9` | system font | Urbanist (400/500/600/700) |
| `constants/typography.ts:18-56` | heading 24 Bold, section 20, body 16/24 Regular, caption 13/18, label 12 ls 0.8 | scale in §2.3 (titleXl 30/38 SemiBold ls −0.3 etc.) |
| `app/_layout.tsx:32-217` | no font loading, no `SplashScreen.preventAutoHideAsync`, no `<StatusBar>`; Stack has no `contentStyle` background (line 201) | load Urbanist before first render, hide splash after fonts; `StatusBar style="dark"`; `contentStyle: { backgroundColor: '#F7F4F2' }` |
| `package.json:47` | `expo-font` present; no `@expo-google-fonts/urbanist`, no `@shopify/react-native-skia`, no `react-native-svg-transformer`/`@svgr/cli`, no `expo-linear-gradient` | add (§8) |
| `metro.config.js:1-8` | no SVG transformer | add transformer (§8) |
| `app.json:7` | `icon.png` (old artwork) | new 1024 icon from `6572:1596` |
| `app.json:9` | `userInterfaceStyle: "automatic"` | `"light"` until dark designs exist |
| `app.json:20-25` | adaptive icon bg `#FAF7F0` | `#FFFFFF` (or `#F7F4F2`), new fg/monochrome |
| `app.json:41-50` | splash image `splash-icon.png` is a 1284×2778 full-screen PNG, `imageWidth 300`, bg `#FAF7F0` (dark same) | splash = logo mark (centre) on `#F7F4F2`; see Splash doc |
| `components/ui/AppButton.tsx:36-46` | minHeight 48, padding 13/18, radius 16, border 1 | h56, padding 16/24, radius 999, no border; variants primary/soft/outline/selected/ghost/text/danger, `icon` slot, `size` lg(18)/md(16) |
| `components/ui/AppButton.tsx:55-58` | system 16 semibold | Urbanist SemiBold 16/18 ls −0.05/−0.07 |
| `components/ui/AppButton.tsx:47` | opacity 0.55 disabled / 0.8 pressed | no disabled design; keep opacity (flag) |
| `components/ui/AppField.tsx:15` | label caption `mutedText` | SemiBold 14 ls −0.2% `#4E3A5E` |
| `components/ui/AppField.tsx:23-30` | minHeight 48, padding 14/12, border 1 `#E7E5DE`, radius 16, bg card | h56, padding 16, radius 999, no border, bg `#FFFFFF`, focus stroke 1 `#6B5279` + 4px ring @0.18, start/end icon slots |
| `components/ui/AppField.tsx:27,36` | error uses `warning` colour | no error design (flag); use `danger` |
| `components/ui/AppCard.tsx:12-18` | border 1, radius 18, padding 18, black shadow | no border, radius 22 (list cards) / 32 (tall option cards), padding 16, `shadow.card` |
| `components/ui/StatusState.tsx:21-26` | uses AppCard + secondary AppButton | inherits new card/button; Error screens have their own layout (Error doc) |
| `components/ScreenHeader.tsx:37` | top margin `insets.top + 8` | `insets.top + 10` (back at y54) |
| `components/ScreenHeader.tsx:41-57` | bare 44 hit area, Feather chevron/arrow, colour `text` | 44 circle stroke 1.5 `#6B5279` + Icon/Arrow back 22 (or 50/24 on Home/Notif/Mindful) |
| `components/ScreenHeader.tsx:60-70` | left-aligned title 24 Bold next to back | either centred title pill (§4.3) or Top Nav title SemiBold 20 `#4E3A5E` (§4.4) or large title SemiBold 30/38 below the bar |
| `app/(tabs)/_layout.tsx:62-82` | floating bar inset 16, radius 20, border 1, `shadow.lg` | full-width 375 bar, no radius, no border, white, `shadow.tabBar`, raised centre button |
| `lib/screen-layout.ts:1` | `TAB_BAR_HEIGHT = 72` | bar 70 + 22 for raised button (92 frame) |
| `app/(tabs)/_layout.tsx:101-135` | tabs Home, Chat, Journal, Mood, Profile with Feather 22 | Home, Practices (→ `mindful`), Glow AI centre (→ `chat`), Journal, Profile; Icon/Line 24; Mood leaves the bar |
| `app/(tabs)/_layout.tsx:48-61,87-97` | label Medium 11 lh16, active colour sage | Medium 11 `#A6A09B` / Bold 11 `#4E3A5E`, active glow 36 @0.30 blur 10 |
| `components/AppIcon.tsx:1-166` | Feather/FontAwesome name mapping | replace with generated icon module (§5, §8); keep the alias map for migration |
| `components/LegalLinks.tsx:4` | default colour `#8B6B47` | `#8E7FA6` (and add `LegalNote` component §4.8) |
| `components/Chips.tsx` | own chip styling via `UI.radius`/`colors` | §4.9 filter chip / option pill |
| `app/(tabs)/freud-score/index.tsx`, `app/(tabs)/notifications/index.tsx`, `app/(tabs)/community/new-post.tsx` | RN `<Switch>` | custom 46×28 toggle (§4.10) |
| app + components overall | 860 hard-coded hex literals in 91 files; 158 matches of old brown/olive hexes (`#8B6B47`, `#96784E`, `#4F3422`, `#9BB068`, `#838264`, …) | migrate to tokens per screen task |

Not in code at all: Glow renderer, icon module, logo SVGs, Legal/Note, toggle, radio, segmented control, step progress, header title pill, Top Nav.

---

## 8. Asset pipeline (recommendation)

1. **Dependencies** (`npx expo install` so versions match SDK 54):
   `@expo-google-fonts/urbanist`, `@shopify/react-native-skia`; dev: `react-native-svg-transformer`, `@svgr/cli`. `react-native-svg@15.12.1` and `expo-font` are already installed. Skia and the transformer need a new dev-client build (`expo-dev-client` is present). `expo-linear-gradient` is optional (see 5).
2. **Fonts:** embed at build time with the `expo-font` config plugin in `app.json` (`["expo-font", { "fonts": ["node_modules/@expo-google-fonts/urbanist/400Regular/Urbanist_400Regular.ttf", …500Medium, …600SemiBold, …700Bold] }]`) and also call `useFonts` in `app/_layout.tsx` behind `SplashScreen.preventAutoHideAsync()` for web/Expo Go. Reference weights by family name (`fontFamily: 'Urbanist_600SemiBold'`), never by `fontWeight`, because Android does not synthesise weights for custom fonts.
3. **Icons → generated TSX components** (no runtime SVG parsing, themable): export SVGs to `assets/svg/icons/{arrow,line,mood,legacy}/<type>.svg` (kebab-case = Figma `Type` value, e.g. `arrow/chevron-right.svg`, `line/sparkle.svg`, `mood/very-happy.svg`). Run `svgr --native --typescript --icon --replace-attr-values "#6B5279=currentColor,#E2CC40={props.accent}" -d components/icons/generated assets/svg/icons` (script `npm run icons`). Expose one `components/icons/Icon.tsx`: `<Icon name="arrow/back" size={22} color={palette.plum} accent={palette.mustard} strokeWidth? />` with a typed `IconName` union. Stroke width scales with size in SVG (1.8 at 24), which matches Figma instances that scale.
4. **Illustrations and logo → `.svg` files via `react-native-svg-transformer`:** metro change:
   ```js
   const { transformer, resolver } = config;
   config.transformer = { ...transformer, babelTransformerPath: require.resolve('react-native-svg-transformer/expo') };
   config.resolver = { ...resolver, assetExts: resolver.assetExts.filter(e => e !== 'svg'), sourceExts: [...resolver.sourceExts, 'svg'] };
   ```
   (keep the existing `.env` blockList), plus `declarations.d.ts`: `declare module '*.svg' { const C: React.FC<import('react-native-svg').SvgProps>; export default C; }`. Folders: `assets/svg/logo/{mark.svg, mark-mono.svg, lockup-horizontal.svg, lockup-stacked.svg}`, `assets/svg/illustrations/<area>/<name>.svg` (each area doc lists node ids). Animated art (rings, waveforms, breathing) is built from `react-native-svg` primitives instead of files.
5. **Gradients:** shaped gradients (progress bars, rings, avatar, Glow AI button radial, chart bars, mood spectrum) use `react-native-svg` `<LinearGradient>/<RadialGradient>`, as the code already does in `app/(tabs)/freud-score/index.tsx:102`. Blurred gradients (mood spectrum with blur 5–26, light beams) render in the Skia glow canvas (`<LinearGradient>` shader + `<Blur>`). Full-screen sky backgrounds can use either Skia or `expo-linear-gradient`; adding `expo-linear-gradient` is only worth it if plain `View` gradients are needed outside a Skia canvas.
6. **Glows:** `components/glow/{Glow.tsx, GlowField.tsx}` on Skia (§3.3); glow data per screen lives as typed constants next to the screen (`glows.ts`), copied from the area docs.
7. **Rasters:** photos and thumbnails at `assets/images/<area>/<name>@2x.png/@3x.png` or remote URLs; app icon PNGs at `assets/images/app-icon/{icon-light-1024.png, adaptive-foreground.png, adaptive-background.png, adaptive-monochrome.png}`, splash mark at `assets/images/splash/mark.png` (or use the SVG-derived PNG at 3×).

---

## 9. Proposed tasks

1. Replace `constants/theme.ts` colours, radii and shadows with the Dusk Plum token map (§1.3, §3.1) and set `userInterfaceStyle` to light; keep old keys as aliases so screens compile until migrated.
2. Add Urbanist via `@expo-google-fonts/urbanist` (expo-font plugin + `useFonts` with `SplashScreen.preventAutoHideAsync` in `app/_layout.tsx`) and rewrite `constants/typography.ts` to the §2.3 scale using per-weight family names.
3. Set up the SVG pipeline: add `react-native-svg-transformer` to `metro.config.js`, `declarations.d.ts`, `@svgr/cli` with an `npm run icons` script, and the `assets/svg/` folder layout (§8).
4. Export the icon set (Icon/Arrow 11, Icon/Line 29, Icon/Mood 10, plus legacy search/document/eye/mic) from the §5 node ids, generate TSX components, and add the typed `<Icon name size color accent>` module; migrate `components/AppIcon.tsx` callers to it.
5. Export logo SVGs (mark 148/96/56, mono 40/28/20, horizontal and stacked lockups with outlined text) from `6572:1591`, and generate the 1024 app icons, Android adaptive layers and splash mark; update `app.json` icon, adaptive icon and splash (`#F7F4F2`).
6. Install `@shopify/react-native-skia` and build `Glow` and `GlowField` (σ = radius/2, padded canvas, optional breathing animation) per §3.3, with a demo of the Home header glow set.
7. Rebuild `AppButton` as the shared Button (primary/soft/outline/selected/ghost/text/danger, sizes 56/18 and 56/16, icon slot with Icon/Arrow forward) plus `IconFab` (80/64/48) per §4.1.
8. Build `IconButton` for back/close (44 default, 48, 50; outline and glass; plum and white) and the `TitlePill` and `TopNav` header pieces, then refactor `components/ScreenHeader.tsx` to use them (§4.2–4.4).
9. Rebuild `AppField` as the shared Input (label, 56 pill field, start/end icon, focus ring, error using danger) per §4.6.
10. Add `Chip` (filter, option pill, meta, info, speed pill, Go Pro) and `Tag` (sm/xs, removable) components per §4.9 and reskin `components/Chips.tsx` on top of them.
11. Add `Toggle` (46×28), `Radio`, `Checkbox`, `SelectableCard`, `SegmentedControl`, `StepProgress`, `ProgressBar` and `LegalNote` components per §4.8, §4.10–4.13, and replace RN `<Switch>` in freud-score, notifications and community new-post.
12. Rebuild the tab bar in `app/(tabs)/_layout.tsx` as a custom `tabBar` (full-width white bar, Home/Practices/Glow AI/Journal/Profile, raised radial Glow AI button with glow shadow, active mustard glow, Icon/Line icons) and update `lib/screen-layout.ts` heights (§4.5).
13. Add `expo-status-bar` handling (dark by default, light on dark screens) and a shared screen container with `#F7F4F2` background and design safe-area offsets (§4.14).
14. Restyle `AppCard`, `StatusState` and `LegalLinks` to the new tokens (card radius 22/32, `shadow.card`, link `#8E7FA6`).
15. Ask design to recolour the stale main components (Button, Input Text, Tag Master, Top Nav, FAB, Progress Bar, status bar, Monotone/Solid icons) and the §1.4 leftover nodes in Figma, and to decide the open questions in Blockers.

## 10. Blockers / open questions
- App icon dark background is old teal `#00545D`, not Dusk Plum; needs a decision (plum `#4E3A5E` or keep).
- CTA label size is inconsistent (16 vs 18 vs 17) and button height 56 vs 58.
- Back button exists in three sizes (44/22 icon, 48/24 with stroke 1, 50/24) and close in 40 and 44; Top Nav back ring is `#736B66` on Sign In and `#6B5279` elsewhere.
- Toggle on colour (`#6B5279` vs `#8E7FA6`) and off colour (`#E8E0D5` vs `#E1DAE6`) are inconsistent.
- Tab bar Journal-active variant strokes the icon `#4E3A5E` while other active icons are `#6B5279`.
- 20 text nodes use Inter instead of Urbanist (one section).
- No disabled, error, or pressed states are designed for buttons/inputs; no dark mode exists.
- "Helper" component is ruler ticks, not helper text; no helper/error text style exists.
- Main components are stale (old palette, ExtraBold); every instance carries overrides, so detaching or resetting overrides in Figma would revert screens to brown.
- Arrow/Soft and Arrow/Sketch styles are not used by any ready screen; confirm whether they replace the Glow arrows.
