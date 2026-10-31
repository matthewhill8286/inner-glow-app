# 01 · Onboarding & Auth — design handoff

Figma file `hxqo1m7R2VfbGfwoTMOfnT`, page `1001:11456` (Main - Light Mode). All screens are 375×812 with corner radius 40 (device mock only, do not render). Coordinates below are relative to the screen's top-left unless stated otherwise. Typography is written as `Urbanist <Style> <size>/<line-height> ls<letter-spacing> <colour>`, where `auto` means Urbanist's default line height.

Shared items are owned by the foundations doc (`00-foundations.md`) and are only referenced here: colour and type tokens, Urbanist loading, `Button` (Primary lg, Primary Icon), `Button Icon FAB`, `Input Text`, `Top Nav`, `Tag` (outlined lg), `Legal/Note`, the icon SVG set, the Skia glow renderer, and status bar / home indicator handling.

## 1. Section overview

| Section | Screen id | Name in Figma | Proposed route |
|---|---|---|---|
| Splash & Loading `4002:13749` | `4002:13753` | Splash | `app/index.tsx` + `app/(onboarding)/splash-loading.tsx` stage 1 |
| | `4002:13762` | Loading · Quote | `splash-loading.tsx` stage 2 |
| | `4002:13757` | Loading · Progress | `splash-loading.tsx` stage 3 |
| Welcome Screen `4002:13781` | `4002:13785` | Welcome Screen (landing) | `app/(onboarding)/welcome.tsx` index 0 |
| | `6674:2972` | Before we begin · Consent | new: `app/(onboarding)/consent.tsx` |
| | `4002:13888` | Step One | `welcome.tsx` carousel 1/5 |
| | `4002:13978` | Step Two | carousel 2/5 |
| | `4002:14038` | Step Three | carousel 3/5 |
| | `4002:14225` | Step Four | carousel 4/5 |
| | `4002:14319` | Step Five | carousel 5/5 |
| | `6600:2039` | Paywall · Free trial (canonical paywall) | new shared `components/Paywall.tsx`, mounted by `app/(utils)/trial-upgrade.tsx` |
| Sign In & Sign Up `4002:14426` | `4002:14430` | Sign in | `app/(auth)/sign-in.tsx` |
| | `4002:14458` | Sign up | `app/(auth)/sign-up.tsx` |
| | `4002:14476` | Forgot password | `app/(auth)/forgot-password.tsx` |
| | `6015:1261` | Check your inbox (modal) | `forgot-password.tsx` modal |

Intended flow from the frame order: Splash → Quote → Progress → Welcome landing → Consent → Steps 1–5 → Paywall → Sign up. "Already have an account? Sign In." on the landing goes to Sign in. Current code goes `index` → `splash-loading` → `welcome` (6 slides) → `sign-up` → `assessment` (`app/(onboarding)/welcome.tsx:57-64`, `app/(auth)/sign-up.tsx:66`). Reset-password and two-factor screens have no Figma counterpart in these sections and keep their current layout restyled with tokens.

### The logo mark (one parametric component)

Every "Logo mark" frame is the same three-vector construction scaled to a frame size `S`. Build one `LogoMark` SVG component with props `size`, `ringColor`, `coreColor`.

| Layer | Geometry (relative to S) | Fill / stroke |
|---|---|---|
| Halo disc | diameter 0.6S, offset 0.2S | `#E2CC40` @ 0.22 |
| Core disc | diameter 0.3S, offset 0.35S | `#E2CC40` (lockup variant: `#8E7FA6`) |
| Ring | diameter 0.72S, offset 0.14S, centre-aligned stroke 0.05S | `#6B5279` on light, `#FFFDF8` on the dark splash |

Instances in this area: splash `6645:3205` (S=120, ring `#FFFDF8` 6), quote cue `6645:3209` (S=48), progress `6647:3207` (S=80, stroke 4), welcome landing `6650:3203` (S=110, stroke 5.5), consent `6674:2990` (S=64), paywall `6655:3246` (S=72), auth lockup `6575:1665` / `6575:1671` (S=36, core `#8E7FA6`, stroke 2). The vectors are plain circles, so draw them with `<Circle>` instead of exporting paths.

## 2. Screens

### 2.1 Splash `4002:13753`

Background `#241A2E`. Status bar and home indicator are the white ("Is Black=True" variant renders light glyphs on the dark background).

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Night glow | `6643:3205` | x −22.5, y 150, 420×420 | Glow `#6B5279` @ 0.90, blur 80 |
| Warm glow | `6643:3206` | x 47.5, y 220, 280×280 | Glow `#E2CC40` @ 0.30, blur 70 |
| Hairline ring | `6643:3210` | x 80.5, y 253, 214×214 | 1px stroke `#FFFFFF` @ 0.07, no fill |
| Hairline ring | `6643:3211` | x 105.5, y 278, 164×164 | 1px stroke `#FFFFFF` @ 0.07 |
| Logo mark | `6645:3205` | x 127.5, y 300, 120×120 | ring `#FFFDF8` stroke 6 (centre 187.5, 360) |
| Wordmark | `6643:3241` | y 560, full width, centred | "inner glow" — `Urbanist SemiBold 34/auto ls-2% #FFFDF8` |
| Tagline | `6643:3242` | y 606, centred | "FEEL IT FROM WITHIN" — `Urbanist Bold 11/auto ls24% #FFFFFF@0.55` |

All rings and glows share the centre point (187.5, 360).

Gaps vs code:
- `app/(onboarding)/splash-loading.tsx:179-183` uses `#F6F4F2` / `#7C8063` / `#9A7A4D` stage backgrounds. Design uses `#241A2E`, `#F7F4F2`, `#F7F4F2`.
- `splash-loading.tsx:135-142` renders only `t('splash.logo')` = "INNERGLOW" at 14px `#141414`. Design needs the glows, rings, logo mark, the lowercase wordmark and the tagline. The tagline has no i18n key.
- `splash-loading.tsx:123-124, 162-177, 226-245` adds a grain overlay that is not in the design. Remove it.
- `app/index.tsx:80-89` shows a `#6f6660` screen with a white spinner. Change it to `#241A2E` with no spinner, so the hand-off to the splash does not flash.
- `app.json:41-51` native splash uses `splash-icon.png` on `#FAF7F0`. Set `backgroundColor` to `#241A2E` and replace the image with the logo mark (ring `#FFFDF8`) so the native splash matches the first JS frame.

### 2.2 Loading · Quote `4002:13762`

Background `#F7F4F2`, dark status bar glyphs.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Glow | `6643:3260` | x −70, y 40, 320×320 | Glow `#E2CC40` @ 0.42, blur 90 |
| Hairline ring | `6643:3264` | x 59, y 159, 74×74 | 1px stroke `#6B5279` @ 0.30 |
| Logo mark | `6645:3209` | x 72, y 172, 48×48 | ring `#6B5279` stroke 2.4 (concentric with the hairline ring) |
| Cue label | `6643:3267` | x 150, y 182 | "BREATHE IN" — `Urbanist Bold 11/auto ls20% #4E3A5E@0.70` |
| Cue body | `6643:3268` | x 150, y 200 | "while we get things ready" — `Urbanist Regular 13/auto #736B66` |
| Quote | `6643:3269` | x 32, y 330, w 311 | "“Let everything happen to you: beauty and terror. Just keep going. No feeling is final.”" — `Urbanist SemiBold 30/128% (38.4) #241A2E`, left aligned, natural wrapping |
| Author | `6643:3270` | x 32, y 560 | "— RAINER MARIA RILKE" — `Urbanist Bold 12/auto ls14% #4E3A5E@0.75` |
| Progress track | `6643:3271` | x 127.5, y 716, 120×3, r 2 | `#6B5279` @ 0.12 |
| Progress fill | `6643:3272` | same origin, 54×3 (45%), r 2 | linear left→right `#E2CC40` → `#8E7FA6` |

Interaction: the logo mark and hairline should breathe (scale about 1.0 → 1.08 over a 4 s in/out cycle) in sync with the "BREATHE IN" cue. The progress fill grows across the stage duration. Motion is not specified in Figma, so these values are a proposal.

Gaps vs code:
- `splash-loading.tsx:144-152` centres a 20/28 white quote on olive. Design is left-aligned 30/38.4 dark on cream at x 32.
- `i18n/locales/en/translation.ts:4-5` hard-codes line breaks and drops the colon ("happen to you\nbeauty and terror"). Replace with the single-line string above and let it wrap.
- No breathing cue, logo, hairline or progress bar exists. New i18n keys are needed for "BREATHE IN" and "while we get things ready".
- Stage timing `splash-loading.tsx:35-36` (1.1 s splash, 2.2 s quote) is acceptable but the quote stage should run long enough to read; 3.5 s is suggested.

### 2.3 Loading · Progress `4002:13757`

Background `#F7F4F2`.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Glow | `6647:3203` | x 37.5, y 230, 300×300 | Glow `#E2CC40` @ 0.28, blur 80 |
| Ring track | `6647:3204` | x 113.5, y 306, 148×148 | Full ring, inner radius 96% → stroke ≈ 3px, `#8E7FA6` @ 0.20 |
| Ring progress | `6647:3205` | same box | Arc from −90° (12 o'clock) clockwise to 169.2° = 72%, stroke ≈ 3px, `#6B5279`, butt caps |
| Progress head | `6647:3206` | 10×10, centred on the arc end | `#E2CC40` with drop shadow 0,0 blur 8 spread 2 `#E2CC40` @ 0.80 |
| Logo mark | `6647:3207` | x 147.5, y 340, 80×80 | ring `#6B5279` stroke 4 |
| Percent | `6647:3211` | y 482, centred | "72%" — `Urbanist SemiBold 20/auto #4E3A5E` |
| Caption | `6647:3212` | y 510, centred | "Preparing your space" — `Urbanist Medium 14/auto #736B66` |

Build the ring with react-native-svg: `<Circle r={72.5} strokeWidth={3} strokeDasharray>` rotated −90°, and position the head with `cos/sin` of the current angle. The head's glow is a small Skia glow or an SVG radial gradient.

Gaps vs code:
- `splash-loading.tsx:154-160` shows only "NN%" in white 16px on brown. There is no ring, head, logo, glow or caption. "Preparing your space" needs an i18n key.
- The progress curve logic at `splash-loading.tsx:44-112` can stay and should drive the ring angle, the head position and the percent text.

### 2.4 Welcome landing `4002:13785`

Background `#F7F4F2`. Illustration frame `6638:2886` is 375×380 at the top.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Glow | `6638:2887` | x 27.5, y 50, 320×320 | Glow `#E2CC40` @ 0.42, blur 90 |
| Glow (warm) | `6638:2888` | x 157.5, y 160, 200×200 | Glow `#E8A65C` @ 0.18, blur 80 |
| Hairline | `6638:2889` | x 37.5, y 60, 300×300 | 1px stroke `#6B5279` @ 0.08 |
| Hairline | `6638:2890` | x 62.5, y 85, 250×250 | 1px stroke `#6B5279` @ 0.12 |
| Hairline | `6638:2891` | x 87.5, y 110, 200×200 | 1px stroke `#6B5279` @ 0.16 |
| Logo mark | `6650:3203` | x 132.5, y 155, 110×110 | ring `#6B5279` stroke 5.5 (all rings centred at 187.5, 210) |
| Content stack | `4002:13788` | x 16, y 383.5, w 343; vertical, gap 30 (title block → button gap 32) | |
| Title | `4002:13793` | centred | "Welcome to InnerGlow!" — `Urbanist SemiBold 30/38 ls-4% #4E3A5E` |
| Body | `4002:13794` | 16 below title, w 327 | "Your AI companion for mental wellbeing. Supportive conversations, thoughtful guidance, anytime, anywhere." — `Urbanist Medium 14/auto ls-0.5% #736B66`, centred. The Figma text uses U+2028 line separators to force three lines; render as normal wrapping. |
| Get Started | `4002:13886` | 180×56 hug, centred, 32 below body | Button Primary Icon: fill `#6B5279`, pill, padding 16/24, "Get Started" `Urbanist SemiBold 18 ls-0.4% #FFFFFF` + forward arrow 24 with the yellow glow dot, gap 12 |
| Sign-in line | `4002:13887` | y 696 (screen), centred | "Already have an account? " `Urbanist Bold 14 ls-0.2% #736B66` + "Sign In." same style in `#838264` (see blockers: old palette) |

Interaction: "Get Started" → Consent. "Sign In." → `/(auth)/sign-in`.

### 2.5 Before we begin · Consent `6674:2972`

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Glow | `6674:2973` | x 37.5, y 0, 300×300 | Glow `#E2CC40` @ 0.35, blur 80 |
| Glow | `6674:2974` | x 160, y 90, 200×200 | Glow `#D8B4D8` @ 0.30, blur 80 |
| Logo mark | `6674:2990` | x 155.5, y 104, 64×64 | ring stroke 3.2 |
| Title | `6674:2994` | x 24, y 196, w 327 | "Before we begin" — `Urbanist SemiBold 26/140% #241A2E`, centred |
| Subtitle | `6674:2995` | x 44, y 238, w 287 | "So you know exactly what INNER GLOW is, and what it isn’t." — `Urbanist Regular 14/140% #736B66`, centred |
| Bullet dots | `6674:2996/2999/3002` | x 28, y 335 / 411 / 505, 10×10 | `#E2CC40` + shadow 0,0 blur 8 spread 2 `#E2CC40` @ 0.70 |
| Bullet titles | `6674:2997/3000/3003` | x 50, y 330 / 406 / 500, w 301 | `Urbanist SemiBold 15/140% #241A2E` |
| Bullet bodies | `6674:2998/3001/3004` | x 50, 22 below title, w 301 | `Urbanist Regular 13/140% #736B66` |
| Agree card | `6674:3005` | x 24, y 616, 327×52, r 18 | `#FFFFFF`; checkbox 22×22 r 6 at (16,15), checked fill `#6B5279` with white 1.5 tick; label at x 48: "I understand and agree to the " `Urbanist Regular 13 #241A2E` + "Terms of Use" / "Privacy Policy" `SemiBold 13 #6B5279` (links) |
| CTA | `6674:3010` | x 24, y 690, 327×56, pill | `#6B5279`, "I understand" `Urbanist SemiBold 16 #FFFFFF` |

Bullet copy, verbatim:
1. "Wellbeing support, not medical care" / "INNER GLOW doesn’t diagnose or treat any condition and isn’t a substitute for a doctor or therapist."
2. "Not for emergencies" / "If you’re in danger or thinking about harming yourself, contact your local emergency services right away."
3. "Your data stays yours" / "Your check-ins and journal are private. You can export or delete them any time."

Interaction: the CTA is disabled until the checkbox is ticked (no disabled state is drawn; use the foundations disabled button). Terms / Privacy open `/(utils)/legal?policy=terms|privacy` as `components/LegalLinks.tsx:19` does today. On confirm, store `{ version, acceptedAt }` locally and write it to the backend after sign-up (see backend gaps).

### 2.6 Carousel Steps One–Five (`4002:13888`, `4002:13978`, `4002:14038`, `4002:14225`, `4002:14319`)

Shared chrome for all five steps:

| Element | Position / size | Spec |
|---|---|---|
| Illustration area | 0,0, 375×480 | Per-step artwork below (glows render beyond 480 and are not clipped in Figma) |
| Step tag | centred, y 60, height 40 | Tag lg Outlined: 1px `#241A2E` border, radius 32, padding 8/14, `Urbanist SemiBold 16/auto ls-0.3% #241A2E`. Copy "Step One" … "Step Five" |
| Bottom block | frame at y 472 (Step One: 466), 375×340 | no fill (radius 40 is cosmetic) |
| Step track | x 128.5, y 544.5 (screen), 120×3, r 2 | `#6B5279` @ 0.12 |
| Step fill | same origin, width 24 / 48 / 72 / 96 / 120 | linear left→right `#E2CC40` → `#8E7FA6`, r 2 |
| Title | x 17, y 574 (screen), w 343, two lines max | `Urbanist SemiBold 30/38 ls-1% #4E3A5E`, centred |
| Next FAB | 80×80 circle, centred, y 674 (screen) | `Button Icon FAB` xl Primary: `#6B5279`, forward arrow 24 with yellow glow dot |

Step One's bottom block sits 6px higher than the others (track y 538.5, title y 568, FAB y 668). Treat this as a Figma inconsistency and use the Steps Two–Five values for all five.

Titles verbatim: "Gently personalised support, just for you" / "Notice How You’re Feeling" / "Talk, Reflect, and Unwind" / "Moments of Calm and Clarity" / "Support When You Need It". There is no body copy, no back button and no skip on these frames. Swiping left/right should also page. FAB on Step Five → Paywall.

Step-specific artwork (all coordinates inside the 375×480 illustration frame):

**Step One — topographic "aura contours"** `6638:2895`
- Glow `6638:2896`: x 22.5, y 90, 330×330, `#E2CC40` @ 0.40, blur 90.
- Glow `6638:2897`: x 7.5, y 105, 180×180, `#7FC6F1` @ 0.15, blur 80.
- SVG group `6638:2898` "Aura contours" (375×480): 11 closed organic VECTOR paths `6638:2899`…`6638:2909`, 1px stroke `#6B5279`, no fill. Opacity steps from 0.28 (innermost `2899`, 96×88 at 139.5,210.8) down by 0.02 per ring to 0.08 (outermost `2909`, 351×340 at 7,72.3). Export the group as one SVG. If the contours should drift, keep each path separate and animate a small rotate/scale per ring.
- Core `6638:2910`: x 149.5, y 217, 76×76 circle `#F7F3EF` with outer glow shadow 0,0 blur 40 spread 10 `#E2CC40` @ 0.55.
- Inner light `6638:2911`: x 170.5, y 238, 34×34, `#E2CC40` @ 0.90, layer blur 8 (glow).

**Step Two — gradient "mood slider"** `6638:2912`
- Glow `6638:2913`: x 27.5, y 90, 320×320, `#E2CC40` @ 0.18, blur 90.
- Spectrum bar `6638:2914`: x 22.5, y 215, 330×70, radius 35, linear left→right: `#FFB3BE`@0.90 at 0, `#D8B4D8`@0.90 at 0.28, `#EFE6DA`@0.90 at 0.50, `#E2CC40`@0.95 at 0.72, `#7FC6F1`@0.90 at 1. It has a layer blur of 26, so it is a soft gradient glow, not a crisp bar. Render it in Skia as a rounded rect with a linear gradient shader plus `<Blur blur={13}/>`.
- Marker `6638:2915`: x 258, y 175, 1.5×150, `#6B5279` @ 0.60 (SVG rect).
- Thumb `6638:2916`: x 243.8, y 235, 30×30, `#FFFDF8` with shadow 0,0 blur 40 spread 10 `#E2CC40` @ 0.55.
- Ticks `6638:2917`…`6638:2927`: 11 rects 1px wide at y 320, `#6B5279` @ 0.30, at x 40, 69.5, 99, 128.5, 158, 187.5, 217, 246.5, 276, 305.5, 335. Ticks at x 40, 187.5 and 335 are 14 tall, the rest 8 tall (SVG).

**Step Three — overlapping circles ("You" + "Glow AI")** `6638:2928`
- Glow "You" `6638:2929`: x 35, y 135, 230×230, `#D8B4D8` @ 0.55, blur 50.
- Glow "Glow AI" `6638:2930`: x 113, y 135, 230×230, `#E2CC40` @ 0.55, blur 50.
- Overlap light `6638:2931`: x 134, y 195, 110×110, `#FFFDF8` @ 0.85, blur 30.
- Hairlines `6638:2932` (x 55) and `6638:2933` (x 133): y 155, 190×190, 1px `#6B5279` @ 0.22 (SVG circles).
- Core `6638:2934`: x 178, y 239, 22×22, `#FFFDF8` + shadow 0,0 blur 40 spread 10 `#E2CC40` @ 0.55.

**Step Four — sunrise** `6638:2935`
- Sky `6638:2936`: full 375×480 rect, linear top→bottom `#EAF2F5` 0 → `#F5E9D9` 0.70 → `#F7F4F2` 1 (SVG `LinearGradient`).
- Sun halo `6638:2937`: x 27.5, y 170, 320×320, `#E2CC40` @ 0.50, blur 70 (glow).
- Sun `6638:2938`: x 122.5, y 295, 130×130 ellipse cut to the top half (arc 180°–360°), linear top→bottom `#F6E6A0` → `#E9B66E` (SVG path + gradient).
- Horizon `6638:2939`: x 0, y 360, 375×1, `#6B5279` @ 0.35.
- Hairline arcs `6638:2940` (x 57.5, y 230, 260×260, `#6B5279`@0.12) and `6638:2941` (x 87.5, y 260, 200×200, `#6B5279`@0.16): top half only, 1px (SVG arcs).
- Reflection `6638:2942`: x 122.5, y 362, 130×60, linear top→bottom `#E2CC40`@0.45 → `#E2CC40`@0, layer blur 8 (Skia, or SVG gradient without blur as an acceptable fallback).

**Step Five — constellation** `6638:2943`
- Glow `6638:2944`: x 17.5, y 75, 340×340, `#E2CC40` @ 0.30, blur 90.
- SVG group `6638:2945` "Network": 16 straight VECTOR lines `6638:2946`…`6638:2961`, 1px `#6B5279` @ 0.22. Export as one SVG.
- Core `6638:2962`: x 167.5, y 225, 40×40, `#FFFDF8` + shadow 0,0 blur 40 spread 10 `#E2CC40` @ 0.55.
- 12 stars, each a halo (glow `#E2CC40` @ 0.45, blur 8) plus a point (`#FFFDF8` fill, 1px `#E2CC40`@0.90 stroke, SVG):
  - Small (halo 24, point 8) at halo origin: `6638:2963/64` (83.5,163), `2965/66` (55.5,263), `2969/70` (221.5,337), `2971/72` (293.5,273), `2975/76` (195.5,115), `2977/78` (135.5,203), `2981/82` (25.5,203), `2983/84` (325.5,213).
  - Large (halo 36, point 12): `2967/68` (119.5,323), `2973/74` (265.5,151), `2979/80` (221.5,213), `2985/86` (159.5,287).
  - Suggested motion: points twinkle (opacity 0.6 → 1, staggered).

Gaps vs code (landing + carousel):
- `components/Welcome.tsx:100` background `#FAF9F5`; design `#F7F4F2`.
- `components/Welcome.tsx:45-60` renders a brand row (GlowMark sunrise icon, "INNER GLOW" wordmark, "n / 5" counter, back arrow). None of this is in the design. Replace with the centred Step tag at y 60.
- `components/Welcome.tsx:61-65` renders eyebrow + 36/44 title + subtitle above the artwork. Design puts artwork on top (0–480) and a 30/38 title below it, with no subtitle on steps.
- `components/Welcome.tsx:69-74` dot pager (5px dots, `#526651`). Design uses the 120×3 gradient track.
- `components/Welcome.tsx:75-86` full-width 54px green button "Next"/"Get Started" with space-between layout. Design uses an 80×80 `#6B5279` FAB on steps and a 180×56 hug button on the landing.
- `components/Welcome.tsx:93` renders the medical disclaimer under every slide. Design moves this content to the Consent screen.
- `components/Welcome.tsx:107-171` all colours are the old green palette (`#526651`, `#28392B`, `#354D38`, …).
- `components/WelcomeArtwork.tsx:5-106` draws six green line illustrations (sunrise mark, notebook, chat bubbles, chart, book, circles). Replace entirely with the five artworks above plus the landing illustration.
- `app/(onboarding)/welcome.tsx:11-17` `HIGHLIGHT_COLORS` are old palette and the design has no highlighted keywords. Delete them and `buildTitleSegments`.
- `app/(onboarding)/welcome.tsx:46` builds 6 slides; design has landing + 5 steps, with Consent between landing and Step One and Paywall after Step Five.
- `app/(onboarding)/welcome.tsx:61-62` writes `onboarding:seen:v1` and goes to sign-up. Move the write to after the paywall (or its close) and route to sign-up from there.
- `i18n/locales/en/translation.ts:118-157` welcome copy is entirely different from the design and needs replacing (landing title/body, step tags, step titles, consent copy).
- Consent screen has no code counterpart.

### 2.7 Paywall · Free trial `6600:2039` — CANONICAL PAYWALL

This frame is the single paywall spec. Other areas reuse it and change only the copy listed in 2.7.1.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Glow | `6655:3240` | x 37.5, y 0, 300×300 | Glow `#E2CC40` @ 0.38, blur 80 |
| Glow | `6655:3241` | x 160, y 90, 200×200 | Glow `#D8B4D8` @ 0.30, blur 80 |
| Close | `6655:3242` | x 319, y 54, 40×40, r 20 | `#FFFFFF` @ 0.80, `Icon/Arrow` type=close 20×20 (`6589:1672`) centred. Hit area 44. |
| Logo mark | `6655:3246` | x 151.5, y 112, 72×72 | ring stroke 3.6 |
| Title | `6655:3250` | x 24, y 212, w 327 | "Try Pro free for 7 days" — `Urbanist SemiBold 30/auto #241A2E`, centred |
| Subtitle | `6655:3251` | x 44, y 256, w 287 | "Everything unlocked. Cancel anytime." — `Urbanist Regular 15/145% #736B66`, centred |
| Feature list | `6655:3252` | x 56, y 330, w 263; vertical gap 14 | Rows: 24×24 check badge (circle `#E2CC40` @ 0.35, `Icon/Line` type=check 14×14 `6598:1837` centred) + 12 gap + label `Urbanist Medium 15/auto #241A2E` |
| Plan card — Yearly (selected) | `6655:3268` | x 24, y 486, 327×68, r 22 | `#FFFFFF`, 2px border `#6B5279` |
| Plan card — Monthly | `6655:3276` | x 24, y 564, 327×68, r 22 (10 gap) | `#FFFFFF`, 1px border `#E8E0D5` |
| CTA | `6655:3281` | x 24, y 666, 327×58, pill | `#6B5279`, "Start my free week" `Urbanist SemiBold 17/auto #FFFFFF` |
| Fine print | `6655:3283` | x 0, y 740, 375×28 (wrap with 24 side padding) | "Auto-renews unless cancelled 24h before the period ends · Restore purchase" — `Urbanist Medium 12/auto #A6A09B`, centred. "Restore purchase" must be tappable (Apple requirement). |

Feature labels: "Unlimited chats with Glow AI", "Every practice and sleep sound", "Deeper insights and a weekly plan".

Plan card internals (relative to the card):

| Element | Yearly | Monthly |
|---|---|---|
| Radio ring | x 18, y 23, 22×22, 2px `#6B5279` | x 18, y 23, 22×22, 2px `#D6CCC0` |
| Radio dot | x 23, y 28, 12×12 `#6B5279` | none |
| Plan name | x 52, y 14: "Yearly" `Urbanist SemiBold 16/auto #241A2E` | "Monthly" same style |
| Sub line | x 52, y 38: "7 days free, then €59.99/year" `Urbanist Regular 13/auto #736B66` | "€9.99/month" same style |
| Price | right-aligned at x 309 (16 from right), y 32: "€4.99/mo" `Urbanist SemiBold 16/auto #241A2E` | right-aligned, vertically centred (y 24): "€9.99/mo" |
| Save badge | x 244, y 10, 65×17 hug, pill `#E2CC40`, padding 2/8: "Save 50%" `Urbanist Bold 11/auto #241A2E` | none |

Behaviour:
- Selecting a card moves the 2px `#6B5279` border and radio dot to it; unselected cards use 1px `#E8E0D5` and the `#D6CCC0` ring. Yearly is selected by default.
- Prices, per-month equivalent, trial length and the "Save N%" figure must come from RevenueCat `product.priceString`, `pricePerMonthString` and `introPrice`, never hard-coded. Compute the saving as `1 − yearlyPerMonth / monthly` and hide the badge if the result is under 10%.
- When Monthly is selected the CTA should read "Subscribe" (or similar) because Monthly has no trial in the design. This label is not drawn and needs design sign-off.
- If the user is not eligible for the intro offer (`checkTrialOrIntroDiscountEligibility`), swap the title and CTA to the non-trial copy and drop "7 days free, then" from the sub line.
- Close dismisses; in onboarding it continues to sign-up.

#### 2.7.1 Paywall variants (copy-only differences)

Other area docs own the exact copy of their variant. Each variant passes `title`, `subtitle`, `features[3]` and `ctaLabel` into the same `Paywall` component; layout, plan cards, badge, CTA style and fine print do not change.

| Variant | Owner doc | Entry point in code |
|---|---|---|
| Onboarding "Try Pro free for 7 days" (this frame) | 01 | after Step Five |
| Assessment "Your plan is ready" | assessment doc | after `app/(onboarding)/assessment-summary.tsx` |
| Home "Your glow, fully lit" | home doc | `app/(tabs)/home.tsx:332` |
| Mindful "Unlock every practice" | mindful doc | locked practice tap |
| Glow AI free-limit | Glow AI doc | `app/(tabs)/chat/index.tsx:94`, `app/(tabs)/chat/[issueKey].tsx:286, 342, 570` |

Gaps vs code (paywall):
- `app/(utils)/trial-upgrade.tsx:45-48` defines Monthly €10 and Lifetime €72 with "Most Popular" / "Best Value" badges. Design is Yearly (with 7-day trial) €59.99 and Monthly €9.99, with a single "Save 50%" badge.
- `trial-upgrade.tsx:51-56` features use emoji and different copy; design uses three check rows with the copy above.
- `trial-upgrade.tsx:121-139, 334-362` starts a separate server-side, non-renewing AI trial (`supabase.rpc('start_free_trial')`, `supabase/migrations/20261013_submission_billing.sql:7`). Design's trial is a store intro offer on the yearly subscription that auto-renews. These two models conflict (see blockers).
- `trial-upgrade.tsx:365-410` renders plan tabs with `#8B6B47` brown fills; design uses white cards with radio selection and `#6B5279` border.
- `trial-upgrade.tsx:295-303` "Premium" hero badge and `t('auth.premiumTitle')` "InnerGlow Premium". Design uses the logo mark and "Try Pro free for 7 days".
- `lib/purchase-products.ts:1-13` and `lib/revenuecat.ts:37-40` only know `monthly` and `lifetime`. There is no yearly product, no `$rc_annual` package and no intro-offer handling.
- `app/(utils)/_layout.tsx:3` lists `trial-upgrade` in `PRIVATE_SCREENS`, so it needs a session. The onboarding paywall appears before sign-up, so it either needs an anonymous RevenueCat user (aliased after sign-up) or the paywall must move to after sign-up.
- `i18n/locales/en/translation.ts:212-235` holds the old plan copy (`monthlyPlanPrice: '10€/mo'`, `lifetimePlanPrice: '72€'`). Replace with paywall keys.

### 2.8 Sign in `4002:14430`

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Glow | `6581:1605` | x 37, y −20, 300×300 | Glow `#E2CC40` @ 0.22, blur 90 |
| Lockup | `6571:1639` | x 122, y 70, 132×36, horizontal gap 8 | Logo mark S=36 (core `#8E7FA6`, ring stroke 2) + "inner glow" `Urbanist SemiBold 20/auto ls-3% #4E3A5E` |
| Content stack | `4002:14436` | x 16, y 150, w 343, vertical gap 48 | |
| Title | `4002:14437` | centred | "Welcome back" — `Urbanist SemiBold 30/38 ls-1% #4E3A5E` |
| Form | `4002:14438` | vertical gap 24 | |
| Email field | `4002:14439` | 343×76 | `Input Text` labelled. Label "Email Address" `Urbanist SemiBold 14 ls-0.2% #4E3A5E`, 8 gap; field 51 tall, `#FFFFFF`, pill, padding 16. Focused state drawn: 1px `#6B5279` border + 4px spread ring `#6B5279` @ 0.18. Value text `Urbanist SemiBold 16 ls-0.3%` (`#736B66` drawn; typed value should use the primary text token). |
| Password field | `4002:14440` | 343×81 | Label "Password"; field 56 tall, `#FFFFFF`, no border (default state); placeholder "Enter your password..."; trailing eye `Solid/54 anatomy eye` 24 (`4002:12944`) toggles visibility |
| Sign In button | `4002:14441` | 343×56 | Button Primary lg with icon: "Sign In" `Urbanist SemiBold 18 ls-0.4% #FFFFFF` + forward arrow 24, gap 12 |
| Social row | `4002:14442` | centred, 184×56, gap 8 | Three 56×56 circles, 1px `#C9C7C5` border, no fill. Glyphs `#6B5279`: Facebook `4002:14445` (11.8×21.9), Google `4002:14449` (18.5×18.9), Instagram `4002:14453` (23.9×23.9) |
| Footer | `4002:14455` | centred, vertical gap 8 | "Don’t have an account? " `Urbanist Bold 14 ls-0.2% #736B66` + "Sign Up." `#838264` (underlined in render); "Forgot Password" `Urbanist Bold 14 ls-0.2% #8E7FA6`, underlined |

Gaps vs code:
- `app/(auth)/sign-in.tsx:23-33` local palette (`#a07b55`, `#96784E`, `#828a6a`, `#f2ece6`) is old. Use tokens.
- `sign-in.tsx:104-145` olive 72px circle with a `psychology` icon, "Welcome Back" (capital B, `translation.ts:183`) and a subtitle. Design has the lockup at y 70, "Welcome back", and no subtitle.
- `sign-in.tsx:148-248` wraps the form in a white card (radius 32). Design has no card; fields are white pills on the page.
- `sign-in.tsx:185, 311-319` labels are uppercase 12px "EMAIL" / "PASSWORD". Design is "Email Address" / "Password" in 14 SemiBold sentence case.
- `sign-in.tsx:186-203` leading mail/lock icons and `#f2ece6` input fill. Design has no leading icons and white fields.
- `sign-in.tsx:233-247` "Forgot password?" right-aligned under the password field. Design puts "Forgot Password" in the footer under the sign-up line.
- `sign-in.tsx:251-282` button reads "Continue" (`auth.continue`) in brown with no arrow. Design "Sign In" + arrow in `#6B5279`.
- No social sign-in row exists, and `package.json` has no OAuth packages (see backend gaps).
- `translation.ts:181` placeholder `you@email.com`; design "Enter your email..." / "Enter your password...".

### 2.9 Sign up `4002:14458`

Same glow (`6581:1607`) and lockup (`6575:1670`) as Sign in. Content stack `4002:14464` at x 16, y 150, gap 40.

| Element | Node | Spec |
|---|---|---|
| Title | `4002:14465` | "Create your space" — `Urbanist SemiBold 30/38 ls-1% #4E3A5E`, centred |
| Fields (gap 24) | `4002:14469`, `4002:14472`, `4002:14473` | "Email Address" / "Enter your email..." (drawn focused); "Password" / "Enter your password..." + eye; "Password Confirmation" / "Confirm your password..." + eye |
| Button | `4002:14474` | "Sign Up" + forward arrow, 24 below the fields |
| Sign-in line | `4002:14475` | "Already have an account? " `#736B66` + "Sign In." `#838264`, Bold 14 ls-0.2%, centred, 40 below the button |
| Legal note | `6674:3014` | `Legal/Note` at x 24, y 742, w 327: 14px info icon + 8 gap + "By creating an account you agree to our Terms of Use and Privacy Policy. INNER GLOW offers wellbeing support, not medical care." `Urbanist Regular 11/140% #8A8296`. Terms / Privacy should be links. |

There are no social buttons on Sign up.

Gaps vs code:
- `app/(auth)/sign-up.tsx:173-190` has a "Your Name" field that the design does not have. Either drop it (profile setup collects the name later) or confirm with design.
- `sign-up.tsx:213-252` has one password field and a hint "At least 6 characters". Design has Password + Password Confirmation with no hint. Add the confirm field with a mismatch error.
- `sign-up.tsx:107-132` olive heart circle, "Create Your Account", subtitle. Design: lockup + "Create your space".
- `sign-up.tsx:285` button "Create account"; design "Sign Up" + arrow.
- `sign-up.tsx:290` uses `LegalLinks` (two underlined links). Design uses the `Legal/Note` component pinned near the bottom.
- `sign-up.tsx:66` routes to `/(onboarding)/assessment`. It should also persist the consent record captured in 2.5.
- Same palette, card, label and icon gaps as Sign in (`sign-up.tsx:22-32, 136-253, 319-344`).

### 2.10 Forgot password `4002:14476`

| Element | Node | Spec |
|---|---|---|
| Glow | `6581:1609` | x 37, y −100, 300×300, `#E2CC40` @ 0.15, blur 90 |
| Content stack | `4002:14479` | x 16, y 68, w 343, vertical gap 32 |
| Back | `4002:14481` | `Top Nav` Icon Left Only: 48×48 circle, 1px `#736B66` border, back arrow 24 (`6589:1632`) |
| Title | `4002:14483` | 24 below nav: "Forgot Password" `Urbanist SemiBold 30/38 ls-1% #4E3A5E`, left |
| Subtitle | `4002:14484` | 12 below: "Where should we send your reset code?" `Urbanist Medium 16/160% ls-0.3% #736B66` |
| Contact options | `4002:14485` | vertical gap 8; `Forgot Password Card` (`4002:13141`) 343×38 pill, padding 10 |
| — Email (selected) | `4002:14487` | `#FFFFFF`, 1px `#8E7FA6` border, 4px spread ring `#9BB068` @ 0.25 (old palette, see blockers). Text "Email  ·  h•••@gmail.com" `Urbanist SemiBold 15 ls-0.5% #4E3A5E` |
| — Phone | `4002:14488` | `#FFFFFF`, shadow 0,8 blur 16 `#4B3425` @ 0.05. Text "Phone  ·  •••• •••• 11" `Urbanist Medium 15 ls-0.5% #4E3A5E` |
| Send code | `4002:14489` | Button Primary lg 343×56, "Send code" with no icon |

Gaps vs code:
- `app/(auth)/forgot-password.tsx:104-300` asks for an email, then a method (email link / recovery code / authenticator). Design asks the user to pick Email or Phone and sends a 6-digit code.
- The design shows a masked email and phone, which presumes the account is already known. The screen has no email input, so the entry point must pass the email from Sign in (see blockers).
- `forgot-password.tsx:153` calls `resetPasswordForEmail` with a magic link redirect. Design expects a 6-digit code.
- Title copy matches (`translation.ts:191`); subtitle `translation.ts:192` differs.
- `forgot-password.tsx:665-707` pins the CTA to the bottom with a `lock-open` icon; design places "Send code" 32 below the options with no icon.

### 2.11 Check your inbox modal `6015:1261`

Drawn over the Forgot password screen.

| Element | Node | Spec |
|---|---|---|
| Scrim | `6015:1313` | full screen `#3F3C36`, blend MULTIPLY at 100%. In RN use `rgba(63,60,54,0.85)` as the closest normal-blend equivalent (verify visually). |
| Card | `6015:1314` | x 18, y 301.5 (vertically centred), 340×209, `#FFFFFF`, r 40, padding 16. Shadow stack `#4B3425`: 0,14 b31 @0.10; 0,57 b57 @0.09; 0,128 b77 @0.05; 0,228 b91 @0.01. In RN use the foundations "modal" elevation token. |
| Title | `6015:1317` | "Check your inbox" `Urbanist SemiBold 24/auto ls-0.8% #4E3A5E`, left |
| Body | `6015:1318` | 12 below: "We sent a 6-digit code to h•••@gmail.com. Didn’t get it? Send it again." `Urbanist Regular 15/160% ls-0.4% #736B66` |
| Resend | `6015:1319` | 32 below: Button Primary lg 308×56 "Resend code" |
| Close FAB | `6015:1320` | x 155.5, y 716, 64×64 white circle, shadow 0,8 b16 `#4B3425`@0.05, close icon 24 (`6589:1672`) |
| Home indicator | `6015:1328` | white variant over the scrim |

Interaction: Resend triggers the send again with a cooldown (suggest 30 s; not drawn). Close dismisses the modal. There is no drawn screen for entering the 6-digit code; see blockers.

Gaps vs code:
- `forgot-password.tsx:712-910` is a bottom-anchored full-screen sheet on `rgba(30,26,24,0.95)` with a top-left back arrow, an icon illustration and two buttons ("Re-Send Reset Link", "Back to sign in"). Design is a centred card with one button and a bottom close FAB.
- Copy `translation.ts:204-207` ("We've Sent a Reset Link") differs from the design.

## 3. Asset table

Glows are rendered in code with the Skia glow renderer from the foundations doc; they are data, not files. Blur in the table is the Figma layer blur radius (Skia `blur = radius / 2`).

| node id | name | screen | kind | size | notes |
|---|---|---|---|---|---|
| `6645:3205` (+ all "Logo mark" frames listed in §1) | Logo mark | all | SVG (component) | S | Three circles; build `LogoMark` with `<Circle>`; ring/core colour props |
| `6643:3205` | Night glow | Splash | Glow | 420 | `#6B5279`@0.90, blur 80, at (−22.5,150) |
| `6643:3206` | Warm glow | Splash | Glow | 280 | `#E2CC40`@0.30, blur 70 |
| `6643:3210`, `6643:3211` | Hairline rings | Splash | SVG | 214, 164 | 1px `#FFFFFF`@0.07 circles |
| `6643:3260` | Glow | Quote | Glow | 320 | `#E2CC40`@0.42, blur 90, at (−70,40) |
| `6643:3264` | Hairline | Quote | SVG | 74 | 1px `#6B5279`@0.30; animate with breath |
| `6643:3271` / `6643:3272` | Progress track / fill | Quote | Gradient (SVG) | 120×3 | fill linear L→R `#E2CC40`→`#8E7FA6` |
| `6647:3203` | Glow | Progress | Glow | 300 | `#E2CC40`@0.28, blur 80 |
| `6647:3204` / `6647:3205` | Progress ring track / arc | Progress | SVG (animated) | 148 | 3px stroke; track `#8E7FA6`@0.20, arc `#6B5279` |
| `6647:3206` | Progress head | Progress | SVG + small glow | 10 | `#E2CC40` + glow blur 8 spread 2 @0.80 |
| `6638:2887` | Glow | Welcome landing | Glow | 320 | `#E2CC40`@0.42, blur 90 |
| `6638:2888` | Glow | Welcome landing | Glow | 200 | `#E8A65C`@0.18, blur 80 |
| `6638:2889`–`6638:2891` | Hairlines | Welcome landing | SVG | 300/250/200 | 1px `#6B5279` @0.08/0.12/0.16 |
| `6674:2973`, `6674:2974` | Glows | Consent | Glow | 300, 200 | `#E2CC40`@0.35 b80; `#D8B4D8`@0.30 b80 |
| `6674:2996` etc. | Bullet dots | Consent | SVG + glow | 10 | `#E2CC40` + glow b8 s2 @0.70 |
| `6638:2896`, `6638:2897` | Glows | Step One | Glow | 330, 180 | `#E2CC40`@0.40 b90; `#7FC6F1`@0.15 b80 |
| `6638:2898` | Aura contours (11 paths `6638:2899`–`2909`) | Step One | SVG (export group) | 375×480 | 1px `#6B5279`, opacity 0.28→0.08 inner→outer |
| `6638:2910` | Core | Step One | SVG + glow | 76 | `#F7F3EF` disc + glow `#E2CC40`@0.55 b40 s10 |
| `6638:2911` | Inner light | Step One | Glow | 34 | `#E2CC40`@0.90, blur 8 |
| `6638:2913` | Glow | Step Two | Glow | 320 | `#E2CC40`@0.18, blur 90 |
| `6638:2914` | Spectrum | Step Two | Gradient + blur (Skia) | 330×70 | 5-stop linear L→R, r 35, blur 26 |
| `6638:2915` | Marker | Step Two | SVG | 1.5×150 | `#6B5279`@0.60 |
| `6638:2916` | Thumb | Step Two | SVG + glow | 30 | `#FFFDF8` + glow `#E2CC40`@0.55 b40 s10 |
| `6638:2917`–`6638:2927` | Ticks | Step Two | SVG | 1×8 / 1×14 | `#6B5279`@0.30 |
| `6638:2929`, `6638:2930` | "You", "Glow AI" | Step Three | Glow | 230 | `#D8B4D8`@0.55 b50; `#E2CC40`@0.55 b50 |
| `6638:2931` | Overlap light | Step Three | Glow | 110 | `#FFFDF8`@0.85, blur 30 |
| `6638:2932`, `6638:2933` | Hairlines | Step Three | SVG | 190 | 1px `#6B5279`@0.22 |
| `6638:2934` | Core | Step Three | SVG + glow | 22 | `#FFFDF8` + glow `#E2CC40`@0.55 b40 s10 |
| `6638:2936` | Sky | Step Four | Gradient (SVG) | 375×480 | linear T→B `#EAF2F5`→`#F5E9D9`@0.7→`#F7F4F2` |
| `6638:2937` | Sun halo | Step Four | Glow | 320 | `#E2CC40`@0.50, blur 70 |
| `6638:2938` | Sun | Step Four | SVG + gradient | 130 (half disc) | linear T→B `#F6E6A0`→`#E9B66E` |
| `6638:2939` | Horizon | Step Four | SVG | 375×1 | `#6B5279`@0.35 |
| `6638:2940`, `6638:2941` | Hairline arcs | Step Four | SVG | 260, 200 (top halves) | 1px `#6B5279` @0.12 / 0.16 |
| `6638:2942` | Reflection | Step Four | Gradient + blur | 130×60 | linear T→B `#E2CC40`@0.45→@0, blur 8 |
| `6638:2944` | Glow | Step Five | Glow | 340 | `#E2CC40`@0.30, blur 90 |
| `6638:2945` | Network (16 lines `6638:2946`–`2961`) | Step Five | SVG (export group) | 375×480 | 1px `#6B5279`@0.22 |
| `6638:2962` | Core | Step Five | SVG + glow | 40 | `#FFFDF8` + glow `#E2CC40`@0.55 b40 s10 |
| `6638:2963`…`6638:2985` (odd) | Star halos ×12 | Step Five | Glow | 24 / 36 | `#E2CC40`@0.45, blur 8 |
| `6638:2964`…`6638:2986` (even) | Star points ×12 | Step Five | SVG | 8 / 12 | `#FFFDF8`, 1px `#E2CC40`@0.90 |
| `6651:3205`–`6651:3214` | Step track + fills | Steps 1–5 | Gradient (SVG) | 120×3 | fill L→R `#E2CC40`→`#8E7FA6` |
| `6655:3240`, `6655:3241` | Glows | Paywall | Glow | 300, 200 | `#E2CC40`@0.38 b80; `#D8B4D8`@0.30 b80 |
| `6581:1605/1607` | Glow | Sign in / Sign up | Glow | 300 | `#E2CC40`@0.22, blur 90, at (37,−20) |
| `6581:1609/1611` | Glow | Forgot / modal | Glow | 300 | `#E2CC40`@0.15, blur 90, at (37,−100) |
| `4002:14445` | Facebook glyph | Sign in | SVG | 11.8×21.9 | `#6B5279`; export path |
| `4002:14449` | Google glyph | Sign in | SVG | 18.5×18.9 | `#6B5279` monochrome; check Google brand rules (they require the multicolour "G") |
| `4002:14453` | Instagram glyph | Sign in | SVG | 23.9 | `#6B5279`; export path |
| `6589:1637` | Icon/Arrow forward (with glow dot) | Landing, steps, auth buttons | Icon | 24 | foundations icon set |
| `6589:1632` | Icon/Arrow back | Forgot | Icon | 24 | foundations icon set |
| `6589:1672` | Icon/Arrow close | Paywall, modal | Icon | 20 / 24 | foundations icon set |
| `6598:1837` | Icon/Line check | Paywall | Icon | 14 | foundations icon set |
| `4002:12944` | Solid/54 anatomy eye | Sign in / up | Icon | 24 | foundations icon set; needs an "eye-off" pair |

No raster assets are used in these sections.

## 4. Backend and product gaps

- **OAuth (Facebook, Google, Instagram).** No OAuth packages or `signInWithOAuth` calls exist. Supabase supports Google and Facebook providers; Instagram is not a Supabase auth provider (Instagram Basic Display login was retired), so it needs replacing, most likely with Sign in with Apple, which App Store rule 4.8 requires anyway when third-party logins are offered.
- **Phone / SMS reset.** No SMS provider is configured and no phone number is stored on profiles. Supabase phone OTP needs Twilio or similar plus a `phone` on the user.
- **6-digit email code reset.** Current flow is a magic link (`forgot-password.tsx:153`). Supabase can send `{{ .Token }}` in the recovery email template and verify with `verifyOtp({ email, token, type: 'recovery' })`, then route to `reset-password.tsx`. This needs the email template change and a code-entry screen.
- **Consent persistence.** No consent table or column exists in `supabase/migrations`. Add `user_consents (user_id, document, version, accepted_at)` or `profiles.terms_accepted_at/terms_version`, capture locally pre-auth, write after sign-up.
- **Yearly product with 7-day intro trial.** Needs `innerglow_premium_yearly` (P1Y) with a 7-day free intro offer in App Store Connect / Play Console, a `$rc_annual` package in the RevenueCat `default` offering, and `PRODUCT_IDS.yearly` / `PLAN_TO_PACKAGE.yearly` in `lib/purchase-products.ts` and `lib/revenuecat.ts`. Monthly price moves from €10 to €9.99. Decide whether Lifetime survives.

## 5. Proposed tasks

1. Build the `LogoMark` SVG component and the three-stage splash (Splash, Loading · Quote, Loading · Progress) in `splash-loading.tsx`, align `app/index.tsx` and the `app.json` native splash to `#241A2E`, and remove the grain overlay (01 §2.1–2.3).
2. Rebuild the Welcome landing screen with its glow/hairline illustration, new copy and the hug "Get Started" button (01 §2.4).
3. Add the "Before we begin" consent screen with the agree checkbox, gated CTA and local consent capture (01 §2.5).
4. Rebuild the welcome carousel chrome for Steps One–Five: Step tag, gradient step track, 30/38 title, 80px FAB, swipe paging and new i18n copy; delete the old slides and highlight colours (01 §2.6).
5. Export the Step One aura contours (`6638:2898`) and Step Five network (`6638:2945`) as SVG and build the five carousel artworks (contours, gradient slider, overlapping circles, sunrise, constellation) from SVG primitives plus glow data (01 §2.6, §3).
6. Build the shared `Paywall` component from the canonical "Try Pro free for 7 days" frame (plan cards, Save badge, feature rows, CTA, fine print with Restore) with a copy-variant API, and mount it in `trial-upgrade.tsx` and after Step Five (01 §2.7).
7. Add the yearly subscription with a 7-day intro offer to the stores, RevenueCat and `lib/purchase-products.ts` / `lib/revenuecat.ts`, read prices, savings and trial eligibility from RevenueCat, and retire the server-side `start_free_trial` path for the paywall (01 §2.7, §4).
8. Restyle Sign in to the design: lockup, "Welcome back", white pill fields with labels, "Sign In" + arrow, footer links, social row placeholder (01 §2.8).
9. Restyle Sign up to the design: "Create your space", email + password + confirmation fields, "Sign Up" + arrow, `Legal/Note`, remove the name field, and persist the consent record after sign-up (01 §2.9, §2.5).
10. Add Google and Facebook OAuth (and Sign in with Apple in place of Instagram) via Supabase and wire the Sign in social row (01 §2.8, §4).
11. Replace the forgot-password flow with the contact-picker screen, 6-digit email code via the Supabase recovery template, the "Check your inbox" centred modal, and a code-entry step that routes to `reset-password.tsx` (01 §2.10–2.11, §4).
12. Add SMS reset (phone on profile, Supabase phone OTP provider) behind the Phone option, or hide that option until it exists (01 §2.10, §4).
13. Add a `user_consents` migration (or profile columns) and write the onboarding consent version and timestamp on sign-up (01 §2.5, §4).
14. Replace all splash, welcome, consent, paywall and auth copy in `i18n/locales/en/translation.ts` with the verbatim design strings (01 §2).

## 6. Blockers and design issues

- **Old-palette leftovers in Figma:** `#838264` (olive) on "Sign In." / "Sign Up." links (`4002:13887`, `4002:14456`, `4002:14475`); `#9BB068` @ 0.25 green focus ring on the selected reset card (`4002:14487`); `#4B3425` brown in modal and card shadows (`6015:1314`, `6015:1320`, `4002:14488`). Suggest `#6B5279` for the links, `#6B5279`@0.18 for the focus ring (matching the input focus ring) and a neutral or `#241A2E` shadow.
- **Copy artefacts:** "Notice How You’re Feeling" ends with a U+2028 line separator (`4002:14027`); "Talk, Reflect, and Unwind" ends with a newline (`4002:14220`); the landing body uses U+2028 to force breaks (`4002:13794`). Step titles mix Title Case ("Notice How You’re Feeling") with sentence case ("Gently personalised support, just for you"). Brand name appears as "InnerGlow", "INNER GLOW" and "inner glow" on different screens. "Forgot Password" and "Sign In." / "Sign Up." carry inconsistent capitalisation and trailing periods.
- **Layer hygiene:** layer names are left over from the freud UI kit ("Welcome to the ultimate freud UI Kit", "Sign In To freud ai", "Personalize Your Men…"). The `Legal/Note` text layer is named "INNER GLOW supports your wellbeing…" but contains different copy. Each step has an empty `Progress Bar` instance (`4002:13972` etc.) that renders nothing. Step Three's bottom frame (`4002:14217`) is offset 2px right and is 373 wide.
- **Flow ambiguity:** the paywall sits before sign-up but the current paywall route needs a session and purchases are tied to the user. Product must decide between an anonymous RevenueCat purchase that is aliased at sign-up, or moving the onboarding paywall after sign-up.
- **Trial model conflict:** the design's store intro trial auto-renews; the current app trial is a free, non-renewing, server-side AI trial with copy saying it "does not automatically renew". Product must choose one.
- **Forgot password data source:** the design shows a masked email and phone with no input, which requires knowing the account. It is unclear whether the email is passed from Sign in or entered on a missing step. There is also no design for the 6-digit code-entry screen or the new-password screen.
- **Monthly CTA label and non-eligible trial copy** are not drawn.
- **Instagram login** is not supported by Supabase, and the monochrome Google glyph conflicts with Google's sign-in branding rules.
- **Figma transport note:** `use_figma` responses containing raw U+2028 characters failed to parse; output had to be ASCII-escaped. Other audit agents extracting text with line separators will hit the same error.
