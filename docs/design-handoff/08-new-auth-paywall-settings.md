# 08 · New screens — password reset, paywall states, Pro plan and settings

Audit of 31 Oct 2026. This doc covers ten screens that design added to fill gaps raised in `99-open-questions.md`. It only describes what is new or different from `01-onboarding-auth.md` (sign in, forgot password, canonical paywall §2.7) and `06-sleep-profile-settings.md` (profile, settings, My plan, Security, Notifications). Build with the foundation components that already exist in code; this doc names them instead of re-specifying them.

Typography notation: `Urbanist SemiBold 30/auto #241A2E` means family, weight, size / line height, colour. Letter spacing is 0 unless stated. `auto` is Figma auto line height (about 1.2×).

## 1. Section overview

The screens were placed in the "New screens — to place" section `6786:4878`, which has since been dissolved. Each screen now lives in the area section it belongs to. All are on page `1001:11456`, file `hxqo1m7R2VfbGfwoTMOfnT`.

| Node | Name | Size | Figma section | Code route |
|---|---|---|---|---|
| `6787:4891` | Sign in · Enter code | 375×812 | 03 · Sign in & sign up `4002:14426` | none (new step after `app/(auth)/forgot-password.tsx`) |
| `6787:4945` | Sign in · New password | 375×812 | 03 | `app/(auth)/reset-password.tsx` (form) |
| `6787:5005` | Sign in · Password updated | 375×812 | 03 | `app/(auth)/reset-password.tsx:70-152` (success state) |
| `6787:5040` | Paywall · Monthly selected | 375×812 | 02 · Welcome & onboarding `4002:13781` | `app/(utils)/trial-upgrade.tsx` |
| `6787:5113` | Paywall · Trial already used | 375×812 | 02 | `app/(utils)/trial-upgrade.tsx` |
| `6787:5503` | Profile · My plan (Pro) | 375×812 | 14 · Profile, settings & help `4002:15083` | none (P9 My plan is not built; `components/PremiumAccessCard.tsx` is the nearest) |
| `6795:6236` | Settings · Accessibility | 375×812 | 14 | none |
| `6787:7485` | Settings · Active sessions | 375×812 | 14 | none |
| `6787:7567` | Settings · Edit reminder time | 375×812 | 14 | none (sheet over P4; reminders live in `app/(tabs)/notifications/index.tsx`) |
| `6787:7668` | Settings · Security (Android) | 375×821 | 14 | none (P5 is not built) |

**Settings · Appearance `6787:7395` no longer exists.** Design replaced it with Settings · Accessibility `6795:6236`, and the P2 Settings row that read "Appearance · Light" now reads "Accessibility" (`I6753:4365;6746:4463` in `6719:4516`). This doc covers Accessibility in its place, so the screen count is ten.

Renders: `scratchpad/figma/shots/new/<node-id>.png` (1:1, one file per screen). Raw extraction: `scratchpad/figma/specs/08-new-1-auth.txt`; the remaining values are recorded in the tables below.

### 1.1 These screens use a newer component library

Every screen here is built from a component library with ids `6746:*` and `6753:*`, which no earlier handoff doc mentions. It is already in the new palette and replaces several of the per-instance overrides that 00 §4 describes. Where it differs from the code components, the difference is listed once here and referenced from each screen.

| Figma main | Spec | Code today | Difference to resolve |
|---|---|---|---|
| Nav Bar · Theme=Light `6753:4165` | 327×44 at x 24, y 54, row gap 8: Back Button 44 + title 223 wide centred + 44 right slot. Title `Urbanist SemiBold 15/auto #4E3A5E`, centred. | `TopNav` in `components/ui/IconButton.tsx:72-100` | `TopNav` has a 48 back button and a left-aligned `Type.titleSm` (SemiBold 20) title. Add a centred-title variant with a 44 back button and a 44 trailing slot. |
| Back Button · Theme=Light `6746:4449` | 44×44 circle, fill `#FFFFFF`, 1px stroke `#CFC6D6`, `arrow/back` 22 | `IconButton` outline (`IconButton.tsx:10-50`) | Code outline is transparent with a 1.5 plum border. Add a `solid` variant: white fill, 1px `#CFC6D6`, plum icon. |
| Icon Button · Style=Outline `6753:4131` (close) | Same as Back Button with `arrow/close` 22, at x 317, y 52 | `IconButton` | Same `solid` variant. |
| Button · Primary, L `6746:4319` | 327×56 pill `#6B5279`, label `Urbanist SemiBold 16/auto #FFFFFF` | `AppButton variant="primary" size="md"` | Matches. |
| Button · Secondary, L `6746:4321` | 56 pill, fill `#F1ECF5`, 1.5 stroke `#6B5279`, label SemiBold 16 `#6B5279` | `AppButton variant="secondary"` (`AppButton.tsx:28`) | Code fill is white. Design fill is `#F1ECF5` (`palette.selected`). |
| Button · Ghost, L `6746:4323` | 56 high, no fill, label SemiBold 16 `#6B5279` | `AppButton variant="ghost"` / `"text"` (`AppButton.tsx:33-34`) | Code `ghost` has a `#F1ECF5` fill; code `text` is 48 high with a 15 label. Make `ghost` transparent at 56/16, or add a variant. |
| Field · State=Focus `6746:4361` / Filled `6746:4365` | 327×74, gap 8. Label `Urbanist Bold 12/auto #8E7FA6`. Box 327×52, `#FFFFFF`, r 16, padding 0/16, value `Urbanist Regular 15/auto #241A2E`. Stroke: focus 1.5 `#6B5279`, filled/default 1px `#E6E0EA`. No focus ring. | `AppField` (`components/ui/AppField.tsx`) | `AppField` is the sign-in pill field: 56 high, radius 999, SemiBold 14 `#4E3A5E` label, SemiBold 16 `#736B66` value, transparent border with a 4px focus ring. Add a `box` variant with the values on the left. This matches the field in 06 §3.0 and settles the 16 vs 26 radius question for settings forms. |
| Toggle · On `6746:4336` / Off `6746:4338` | 46×28 pill; on `#6B5279`, off `#E1DAE6`; knob 22 at x 21 (on) or 3 (off). Knob is `#FFF6D6` inside List Rows on Notifications and Security, and `#FFFFFF` on Accessibility. | `Toggle` (`components/ui/controls.tsx:9-25`) | Code off colour is `palette.border` `#E8E0D5`; design is `palette.toggleOffAlt` `#E1DAE6`. Knob colour needs one answer (see §5). |
| List Row · Trailing=Chevron `6746:4458`, Toggle `6746:4469`, Value `6746:4487` (Style=Grouped) | 327×60, row padding 12/16, gap 12. Optional icon bubble 36 `#F1ECF5` r 18 with `Icon/Line` 20. Label `Urbanist Medium 15/auto #241A2E`; supporting text `Urbanist Regular 12/auto #736B66` (wraps to two lines inside the 60 row, text block 48 high). Value `Urbanist Regular 13/auto #736B66`. Chevron `arrow/chevron-right` 18 at x 293. Toggle at x 265, y 16. Divider 247×1 `#EFEAF2` at x 64 on every row except the first. Group card `#FFFFFF` r 24, no padding. | none (06 task 13 proposes `SettingsRow`) | Two-line rows stay 60 high here, while 06 §3.0 specifies 76. Build `SettingsRow` to these values. The divider sits at x 64 even on rows without an icon; use x 16 there (see §5). |
| Tag · Style=Brand `6753:4148` | Hug × 22, pill `#6B5279`, padding 4/10, `Urbanist SemiBold 12/auto #FFFFFF` | `MetaChip` (`components/ui/Chip.tsx:74`) | No matching variant; `pro` is the 37-high Go Pro chip. Add a `brand` variant. |
| Legal/Note `6674:2966` | 14 info icon + gap 8 + `Urbanist Regular 11/auto` | `LegalNote` (`controls.tsx:163`) | On these screens the text and icon are `#8E7FA6`; code text is `palette.textLegal` `#8A8296` with 140% line height. |
| Radio (drawn in plan cards) | 22 ring, **2px** stroke; selected `#6B5279` with a 12 `#6B5279` dot; unselected `#CFC6D6` | `Radio` (`controls.tsx:28`) | Code stroke is 1.5 and the empty ring is `#8E7FA6`. |
| Section label | `Urbanist Bold 12/auto #8E7FA6` | none | Same as 06 §3.0. |

`#CFC6D6` is used for the back button stroke, filled code digits, the radio off ring and the sheet grabber, but it is not in `palette` (`constants/theme.ts:12-39`). Add it as a token (for example `borderStrong`).

### 1.2 Shared screen shell

- Background `#F7F4F2`. Status bar Dark and home indicator are the `System/*` components (`6746:4411`, `6746:4444`).
- Default glows, rendered with `GlowField` (`components/glow/Glow.tsx:31`): `{ color: '#D8B4D8', opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 }` and `{ color: '#E2CC40', opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 }`. Screens that differ list their glows.
- Content starts at y 116 with 24 side padding and a 24 vertical gap unless stated.
- Bottom CTA block ("Actions") sits at y 674, 375 wide with 24 side padding, so the 56 button bottom is at y 730 (48 above the 34 home indicator). In code, pin it to the bottom safe area with 48 bottom spacing.

## 2. Screens

### 2.1 Sign in · Enter code `6787:4891`

This is the code-entry step that 01 §2.11 said was missing. It follows "Send code" on Forgot password (01 §2.10) or the "Check your inbox" modal (01 §2.11).

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Nav Bar | `6787:4909` | 24,54 327×44 | §1.1 Nav Bar with an empty title. Back returns to Forgot password. |
| Title | `6787:4924` | 24,116 w 327 | "Check your email" — `Urbanist SemiBold 30/auto #241A2E`, left |
| Body | `6787:4925` | 24,176 w 327 (2 lines) | "We sent a 6-digit code to h•••@gmail.com. It expires in 10 minutes." — `Urbanist Regular 15/auto #736B66`. The masked address comes from the email the flow was started with. |
| Code row | `6787:4926` | 24,236 327×60, row gap 8 | Six boxes, each about 47.7×60 (flex 1), `#FFFFFF`, r 16, content centred. Digit `Urbanist Regular 26/auto #241A2E`. |
| — filled box | `6787:4927`–`4929` | | 1px stroke `#CFC6D6` |
| — active box | `6787:4930` | | 1.5 stroke `#6B5279`, caret 2×24 `#6B5279` r 1, centred |
| — empty box | `6787:4931`, `4932` | | 1px stroke `#E6E0EA` |
| Resend line | `6787:4937` | 24,320, row gap 4 | "Didn’t get it?" `Urbanist Regular 14/auto #736B66` + "Resend in 0:42" `Urbanist SemiBold 14/auto #A6A09B` (disabled countdown) |
| CTA | `6787:4940` | 24,674 327×56 | Primary "Verify code" |

Interaction:
- Build the six boxes as one hidden `TextInput` (`keyboardType="number-pad"`, `textContentType="oneTimeCode"`, `autoComplete="sms-otp"` on Android, `maxLength={6}`) with six presentational boxes, so paste and iOS code autofill work.
- When the countdown reaches zero, the label should read "Resend code" and be tappable. That enabled state is not drawn; use `#6B5279` SemiBold 14 for it. Supabase rate-limits recovery emails to one per 60 s by default, so start the countdown at 0:60.
- Auto-submit when the sixth digit is entered, and keep "Verify code" for manual retry. Verify with `supabase.auth.verifyOtp({ email, token, type: 'recovery' })`; success creates the recovery session and routes to New password.
- Wrong or expired code states are not drawn. Use the danger colour on the box strokes and a caption under the row (as `AppField` does for errors).

Gaps vs code:
- No code-entry step exists. `app/(auth)/forgot-password.tsx:153` sends a magic link with `resetPasswordForEmail(..., { redirectTo: PASSWORD_RESET_REDIRECT })`, and `app/_layout.tsx:80, 138` routes the deep link to `reset-password`.
- The Supabase recovery email template must send `{{ .Token }}` instead of the link, and the email OTP expiry must be set to 600 s to match "expires in 10 minutes" (the Supabase default is 3600 s).
- `forgot-password.tsx:41` flow steps (`select | input | sent | verified`) and the recovery-code / authenticator branches (`:165-260`) have no place in the design. 01 task 11 replaces this flow; this screen is the code step of that task.

### 2.2 Sign in · New password `6787:4945`

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Nav Bar | `6787:4963` | 24,54 | Empty title. Back returns to Enter code. |
| Title | `6787:4975` | 24,116 | "Set a new password" — `Urbanist SemiBold 30/auto #241A2E` |
| Body | `6787:4976` | 24,176 w 327 | "Make it at least 8 characters, with a number or symbol." — `Urbanist Regular 15/auto #736B66` |
| New password | `6787:4977` | 24,236 327×74 | Field (box variant, §1.1), focused. Label "New password". Value masked. |
| Confirm password | `6787:4982` | 24,334 327×74 | Field, filled. Label "Confirm password". |
| Rules | `6787:4987` | 24,432 327×64, column gap 8 | Three rows, row gap 8: `line/check` 16 (`#6B5279`) + `Urbanist Regular 13/auto #4E3A5E`: "At least 8 characters", "A number or symbol", "Passwords match" |
| CTA | `6787:5000` | 24,674 | Primary "Save new password" |

Interaction:
- Each rule shows the check when met. The unmet state is not drawn; use a 16 empty circle in `#CFC6D6` with the text in `#736B66`, and keep the CTA disabled until all three rules pass.
- No show-password eye is drawn on this design, unlike Sign in. `AppField` already supports `revealable`; keep it off unless design adds it.
- Save calls `supabase.auth.updateUser({ password })` with the recovery session, then shows Password updated.

Gaps vs code (`app/(auth)/reset-password.tsx`):
- `:20-31` local old palette (`#a07b55`, `#3E2723`, `#f2ece6`, `#5B8A5A` green). Use tokens.
- `:180-210` 44 `lock-reset` icon in a brown circle, "Set New Password" (Title Case, `translation.ts:212`) and a subtitle about 6 characters (`translation.ts:213-214`). Design has no icon, a 30 SemiBold title and the 8-character copy.
- `:230-340` fields are custom `TextInput`s with uppercase-style labels and eye toggles. Use the box Field.
- `:45` and `:413` enforce 6 characters; `translation.ts:184, 219` say 6. Design requires 8 characters plus a number or symbol. Sign up (`app/(auth)/sign-up.tsx`) and the Supabase auth password policy must change to the same rule, or a user can sign up with a password that this screen rejects.
- `:342-368` shows a single green/red "Passwords match" line. Design shows three live rules.
- `:405-446` bottom button "Update Password" with a shadow. Design: Primary "Save new password" at the bottom, no shadow.

### 2.3 Sign in · Password updated `6787:5005`

No nav bar; the user cannot go back into the reset flow.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Content | `6787:5023` | 0,250 375×222, column gap 24, centred | |
| Orb | `6787:5024` | 127.5,250 120×120 | Circle `#FFF6D6`, shadow `0 0 40 0 #E2CC40@0.45` (`boxShadow: '0px 0px 40px 0px rgba(226,204,64,0.45)'`), `line/lock` 36 `#6B5279` centred |
| Title | `6787:5028` | 24,394 | "Password updated" — `Urbanist SemiBold 30/auto #241A2E`, centred |
| Body | `6787:5029` | 24,454 | "You can sign in with your new password now." — `Urbanist Regular 15/auto #736B66`, centred |
| CTA | `6787:5030` | 24,674 | Primary "Back to sign in" |

Interaction: "Back to sign in" must call `supabase.auth.signOut()` before `router.replace('/(auth)/sign-in')`. `updateUser` leaves the recovery session signed in, so without sign-out the auth gate can send the user into the app instead of Sign in.

Gaps vs code (`reset-password.tsx:70-152`): green 100 circle with `check-circle` (`:86-100`), "Password Updated" and "…successfully changed…" copy (`translation.ts:223-225`), dark brown button reading "Sign In" with a `login` icon (`:120-150`), and no sign-out before `router.replace` (`:121`).

### 2.4 Paywall · Monthly selected `6787:5040`

This is the canonical paywall (01 §2.7) with Monthly selected. It answers the "Monthly CTA label is not drawn" item in 01 §2.7. The title is the Home variant "Your glow, fully lit"; the subtitle is the new part.

What changes when Monthly is selected:

| Element | Node | Spec |
|---|---|---|
| Subtitle | `6787:5052` | "Monthly has no free trial. Switch to yearly for 7 days free." — `Urbanist Regular 15/auto #736B66`, centred, 287 wide. Replaces the variant subtitle while Monthly is selected and the user is trial-eligible. |
| Yearly card (unselected) | `6787:5068` | 327×67, r 22, `#FFFFFF`, 1px `#E6E0EA`. Radio ring 22, 2px `#CFC6D6`. "Yearly" + "7 days free, then €59.99/year" + "Save 50%" badge + "€4.99/mo" stay. |
| Monthly card (selected) | `6787:5079` | 327×72, r 22, `#FFFFFF`, 2px `#6B5279`. Radio selected. "Monthly" + "€9.99/month · cancel any time" (`Urbanist Regular 13/auto #736B66`) + "€9.99/mo" right. |
| CTA | `6787:5087` | Primary "Subscribe · €9.99/month" |

Gaps vs code (`app/(utils)/trial-upgrade.tsx`):
- `:391-404` CTA reads "Subscribe with Apple" on iOS (or `auth.payWithCard`) for Monthly. Design: "Subscribe · {monthly price}/month".
- `:304` subtitle is fixed (`auth.premiumSubtitle`) and does not change with the selected plan.
- `:51-54` prices are hard-coded for web/Android; on iOS they come from the offering. Build the CTA and the monthly sub-line from `product.priceString`.
- The rest of the visual gaps are the ones in 01 §2.7 (brown plan tabs `:345-389`, emoji features `:58-63`, Premium hero `:295-305`).

### 2.5 Paywall · Trial already used `6787:5113`

This is the trial-ineligible state (01 §2.7 said its copy was not drawn). Yearly is selected by default.

| Element | Node | Spec |
|---|---|---|
| Title | `6787:5124` | "Welcome back to Pro" — `Urbanist SemiBold 30/auto #241A2E`, centred |
| Subtitle | `6787:5125` | "You’ve already used your free trial, so billing starts today." — `Urbanist Regular 15/auto #736B66`, centred |
| Yearly card (selected) | `6787:5141` | 327×69, 2px `#6B5279`. Sub line "€59.99 billed yearly". "Save 50%" badge and "€4.99/mo" stay. |
| Monthly card | `6787:5152` | 327×70, 1px `#E6E0EA`, radio `#CFC6D6`. Sub line "€9.99/month" (no "· cancel any time"; see §5). |
| CTA | `6787:5160` | Primary "Subscribe · €59.99/year" |

Selecting Monthly on this screen should give "Subscribe · €9.99/month" and keep the trial-used subtitle; the "Monthly has no free trial" subtitle only applies to eligible users.

Copy logic for the shared `Paywall` component (01 task 6):

| State | Title | Subtitle | Yearly sub line | Monthly sub line | CTA |
|---|---|---|---|---|---|
| Eligible, Yearly selected | variant title | variant subtitle | "7 days free, then {yearly}/year" | "{monthly}/month" | variant CTA (for example "Start my free week") |
| Eligible, Monthly selected | variant title | "Monthly has no free trial. Switch to yearly for 7 days free." | as above | "{monthly}/month · cancel any time" | "Subscribe · {monthly}/month" |
| Not eligible, either plan | "Welcome back to Pro" | "You’ve already used your free trial, so billing starts today." | "{yearly} billed yearly" | "{monthly}/month" | "Subscribe · {price}/{year or month}" |

Eligibility comes from `isYearlyTrialEligible()` (`lib/revenuecat.ts:93`). "7 days" must come from the yearly product's `introPrice` period. On web and Android the app sells through Stripe (`trial-upgrade.tsx:81-82, 87`), where `trialEligible` defaults to true; the Stripe path needs its own eligibility read (has this customer paid before) for this state to appear there.

Gaps vs code: `trial-upgrade.tsx:111` already reads eligibility, but only the CTA (`:399`) and the terms (`:241-243`) use it. Title, subtitle and plan sub-lines do not change.

#### 2.5.1 The new paywall frames differ from canonical §2.7

The two new frames use the new component library, so several values differ from `6600:2039`. Treat the new values as current and update 01 §2.7 when the Paywall component is built:

| Property | 01 §2.7 (`6600:2039`) | New frames |
|---|---|---|
| Glows | `#E2CC40`@0.38, `#D8B4D8`@0.30 | `#E2CC40`@0.28 (37.5,0 300), `#D8B4D8`@0.25 (160,90 200), blur 80 |
| Close | 40, glass `#FFFFFF`@0.80, icon 20, at 319,54 | 44 solid (white, 1px `#CFC6D6`), icon 22, at 317,52 |
| Feature check badge | `#E2CC40`@0.35 | `#E2CC40`@0.30 |
| Unselected card | 1px `#E8E0D5`, ring `#D6CCC0` | 1px `#E6E0EA`, ring `#CFC6D6` |
| Card height | 68 fixed | 67–72 hug (inconsistent; see §5). Use 68 with content centred. |
| Save badge text | Bold 11 | SemiBold 11 |
| CTA | 58 high, SemiBold 17 | 56 high, SemiBold 16 |
| Subtitle line height | 145% | auto |

Layout of the new frames: content stack at y 112, column gap 56: logo block (logo 72 + 28 + title/subtitle stack, gap 8) → features at x 56 (gap 14) → plan cards (gap 8). Actions at y 674: CTA, then 16 gap, then the fine print (unchanged copy, `Urbanist Medium 12/auto #A6A09B`, "Restore purchase" tappable). Logo mark: `LogoMark size={72}` (`components/brand/LogoMark.tsx`).

### 2.6 Profile · My plan (Pro) `6787:5503`

This is the Pro version of P9 (06 §P9), which 06 only described in one line. Glows are the §1.2 defaults.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Nav Bar | `6787:5521` | 24,54 | Title "My plan" |
| Current plan card | `6787:5533` | 24,116 327×242 | `#FFFFFF`, r 28, 1.5 stroke `#6B5279`, padding 20, column gap 14, clips its glow. Glow inside: `{ color: '#E2CC40', opacity: 0.30, x: 170, y: -70, width: 200, blur: 60 }` relative to the card. |
| — head | `6787:5535` | row gap 10 | Tag Brand "PRO" (§1.1) + "Yearly plan" `Urbanist Medium 14/auto #736B66` |
| — title | `6787:5539` | | "You’re glowing with Pro" — `Urbanist SemiBold 22/auto #241A2E` |
| — renewal | `6787:5540` | | "Renews on 14 Oct 2027 · €59.99/year" — `Urbanist Regular 14/auto #736B66` |
| — benefits | `6787:5541` | column gap 8 | Four rows, row gap 10: `line/check` 16 `#6B5279` (no bubble, unlike the Free P9 card) + `Urbanist Regular 14/auto #4E3A5E`: "Unlimited Glow AI conversations", "Full sleep & mood insights", "All practices and soundscapes", "Weekly reflection from Glow AI" |
| Actions group | `6787:5594` | 24,382 327×180 | List Rows: "Manage subscription" (value "App Store", chevron) → store or portal · "Change to monthly" (chevron) · "Restore purchases" (chevron) → `restorePurchases()` |
| Legal note | `6787:5595` | 24,586 w 327 | "Manage or cancel any time in your App Store settings. You keep Pro until the end of the paid period." |

Interaction and data:
- Plan name, renewal date and status come from `useSubscription()` (`hooks/useSubscription.ts:151`; `type`, `expiryDate`, `status`). Price comes from the RevenueCat offering on iOS. Format the date with the device locale (`14 Oct 2027` in en-GB).
- When `status === 'canceling'` the renewal line should read "Pro until {date}" and "Change to monthly" should be hidden. That state is not drawn.
- Monthly subscribers see "Monthly plan", "Renews on {date} · {price}/month" and "Change to yearly".
- "Change to monthly" on iOS buys `$rc_monthly` in the same subscription group, which Apple applies at the next renewal. Tell the user that before purchase. On Stripe it goes through the billing portal (`lib/billing-management.ts:4`).
- The "App Store" value and the legal note must follow `subscription.provider`: Apple → "App Store"; Stripe (web and Android today, `trial-upgrade.tsx:87`) → for example "Web billing" and "…in your account billing settings". This copy is not drawn.
- Lifetime and trial users need their own head and renewal lines (`PremiumAccessCard.tsx:49-70` already has that logic).

Gaps vs code: there is no My plan screen. `components/PremiumAccessCard.tsx` (shown on Profile, `app/(tabs)/profile/index.tsx:193`) has the plan name, renewal text, restore and manage logic in the old card style. Reuse that logic and drop the card.

### 2.7 Settings · Accessibility `6795:6236`

Replaces the undesigned Appearance screen. Reached from the P2 "Accessibility" row.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Nav Bar | `6795:6254` | 24,54 | Title "Accessibility" |
| Title | `6795:6269` | 24,116 w 327 (2 lines) | "Make Inner Glow easier on you" — `Urbanist SemiBold 26/auto #241A2E` |
| Label | `6795:6270` | 24,202 | "Motion & light" — section label |
| Group | `6795:6291` | 24,240 327×120 | Toggle rows: "Reduce motion" / "Calmer animations and breathing orbs" (off) · "Softer glows" / "Lower brightness of light effects" (off) |
| Label | `6795:6294` | 24,384 | "Text & sound" |
| Group | `6795:6315` | 24,422 327×120 | "Larger text" / "Follows your phone’s text size" (off) · "Haptic cues" / "Gentle taps during breathing" (on) |

Toggle knobs here are `#FFFFFF`. Rows have no icon bubbles.

Behaviour (to confirm with design, see §5):
- **Reduce motion.** Default from `AccessibilityInfo.isReduceMotionEnabled()`; the toggle overrides it. When on, `GlowOrb` runs with `breathing={false}` (`components/glow/Glow.tsx:68-90`), breathing-player orbs fade instead of scaling, and other looping animations stop.
- **Softer glows.** Multiply every `GlowSpec.opacity` in `GlowField` and `Glow` by a factor (suggest 0.6).
- **Larger text.** React Native already follows the system text size unless `allowFontScaling` is off (no screen turns it off today). Read the toggle as "allow scaling above 1.0": when off, set `maxFontSizeMultiplier={1}` through a shared text default; when on, allow the system size (suggest a 1.6 cap so fixed layouts survive).
- **Haptic cues.** `expo-haptics` is installed but only used by `components/haptic-tab.tsx`. Add light impacts at each breathing phase change in the breathing player (07) when the toggle is on.

Gaps vs code: no screen and no preference store. Add an `accessibility-prefs` store (AsyncStorage) with a provider so the glow and animation components can read it.

### 2.8 Settings · Active sessions `6787:7485`

Reached from P5 Security → "Active sessions".

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Nav Bar | `6787:7503` | 24,54 | Title "Active sessions" |
| Title | `6787:7515` | 24,116 | "Where you’re signed in" — `Urbanist SemiBold 26/auto #241A2E` |
| Label | `6787:7516` | 24,171 | "This device" |
| Group | `6787:7527` | 24,209 327×60 | Value row (no chevron): icon bubble with `line/activity` (placeholder; see §4), "iPhone 15 · Limassol", supporting "Active now" |
| Label | `6787:7528` | 24,293 | "Other devices" |
| Group | `6787:7555` | 24,331 327×120 | Chevron rows: `line/activity` "iPad Air · Limassol" / "Last active 2 days ago" · `line/globe` "Web · Chrome on Mac" / "Last active 12 Oct" |
| Legal note | `6787:7556` | 24,475 | "Don’t recognise a device? Sign it out and change your password." |
| CTA | `6787:7562` | 24,674 | Secondary (§1.1: `#F1ECF5` fill, 1.5 plum stroke) "Sign out of other devices" |

Interaction:
- "Sign out of other devices" can ship now with `supabase.auth.signOut({ scope: 'others' })`. Confirm first with an alert.
- The device list needs a backend. Supabase does not list sessions to clients. Add an edge function `list-sessions` that reads `auth.sessions` for the caller (service role): `id`, `user_agent`, `ip`, `created_at`, `updated_at` (or `refreshed_at`), and marks the caller's own session from the JWT `session_id` claim. Parse device and browser from the user agent. A city ("Limassol") needs IP geolocation; drop the city if that is not wanted.
- The chevron on other devices implies a detail or a per-device sign-out. That screen is not drawn. Suggest a confirm sheet "Sign out of {device}?" that calls a `revoke-session` function (delete the row in `auth.sessions`).

Gaps vs code: nothing exists.

### 2.9 Settings · Edit reminder time `6787:7567`

A bottom sheet over Notifications (P4). It answers "reminder time editing" from 06 §8. Tapping a reminder row (not its toggle) opens it.

Sheet:

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Scrim | `6787:7643` | full screen | `#241A2E`@0.45 (`Colors.light.overlay`, `constants/theme.ts:109`) |
| Sheet | `6787:7644` | 0,340 375×472 | `#F7F4F2`, top corners only (radius not set in Figma; use 28), padding 12/24/40/24, column gap 16, centred |
| Grabber | `6787:7645` | 40×4 | `#CFC6D6` r 2 |
| Title | `6787:7638` | w 327 | Reminder name, "Mood check-in" — `Urbanist SemiBold 20/auto #241A2E`, centred |
| Time picker | `6787:7608` | 327×160 | `#FFFFFF` r 24, padding 8/24. Two wheel columns (hours, minutes) with a ":" between, gap 24. Selected value `Urbanist Regular 30/auto #241A2E`; two values above and below `Urbanist Regular 16/auto #A6A09B`, row gap 8. Minutes step by 5 (50, 55, 00, 05, 10). 24-hour clock. |
| Days | `6787:7623` | 327×40, row gap 6, centred | Seven 40 circles, `Urbanist SemiBold 14/auto`. Selected: `#F1ECF5`, 1.5 `#6B5279`, letter `#6B5279`. Unselected: `#FFFFFF`, 1px `#E6E0EA`, letter `#736B66`. Drawn: M T W T F selected, S S not. |
| Save | `6787:7639` | 327×56 | Primary "Save" |
| Turn off | `6787:7641` | 327×56 | Ghost (§1.1) "Turn off this reminder" — sets the row toggle off and closes |

Build the wheel with `@react-native-community/datetimepicker` (installed, 8.4.4) in `display="spinner"` with `minuteInterval={5}` only if its look can match; otherwise build two snapping `FlatList` wheels, which is what the design shows. The sheet should use the same bottom-sheet component as the other sheets in 07 (end-early sheet).

Background (Notifications, `6787:7572`): it is a redraw of P4 with the new List Row component. Differences from 06 §P4: all rows are 60 high (two-line subtitles wrap inside); title "Gentle nudges, only when they help." is `SemiBold 22/auto` (P4: 24/30); quiet-hours tile label is `SemiBold 11` (P4: Bold 11) and time is `Regular 18/auto #6B5279` (P4: SemiBold 17); toggle knobs are `#FFF6D6`. Build P4 to these newer values.

Gaps vs code:
- `lib/notifications.ts:295-345` gives each reminder one fixed time (`daily_checkin` 20:00, `mindful_breaks` 15:00 while the design says 08:30, and so on) and at most one weekday. The sheet needs per-reminder `{ hour, minute, weekdays: number[] }`, stored with the enabled flag (`PREFERENCES_KEY`, `:294`), and one weekly trigger per selected weekday (or one daily trigger when all seven are on).
- The row subtitle must be generated from that value ("Every day at 20:00", "Weekdays at 20:00", "Sundays").
- "Wind down" is relative to bedtime ("30 min before bedtime"), so its sheet needs an offset picker rather than a clock. That variant is not drawn.
- `app/(tabs)/notifications/index.tsx:405-430` renders reminders as RN `Switch` rows with no tap action.

### 2.10 Settings · Security (Android) `6787:7668`

This is P5 Security (06 §P5) with Android wording. It answers "Android biometric wording". The second glow is sky: `{ color: '#7FC6F1', opacity: 0.18, x: 200, y: 60, width: 220, blur: 90 }`, and a halo glow `{ color: '#E2CC40', opacity: 0.28, x: 127, y: 96, width: 120, blur: 40 }` sits behind the shield.

| Element | Node | Position / size | Spec |
|---|---|---|---|
| Nav Bar | `6787:7672` | 24,54 | Title "Security" |
| Shield art | `6787:7678` | 87.5,96 200×140 | Static SVG. Three shield outlines in `#6B5279` at opacity 0.32 (1.5 stroke, 72×98), 0.19 (1px, 96×124), 0.06 (1px, 120×148); gold disc 48 `#E2CC40` and inner disc 28 `#F2D96A`. These opacities differ from P5 `6720:4639` (0.90/0.35/0.15 and a 0.25 halo); export this node. |
| Title | `6787:7686` | y 260, centred | "Your space stays yours" — `Urbanist SemiBold 22/auto #241A2E` |
| Body | `6787:7687` | y 294, centred | "Lock the app and keep your account safe." — `Urbanist Regular 14/auto #736B66` |
| Label | `6787:7690` | 24,339 | "App lock" |
| Group | `6787:7692` | 24,361 327×120 | Toggle rows with icons: `line/lock` "Fingerprint or face unlock" / "Ask to unlock when the app opens" (on) · `line/eye` "Hide previews" / "Notifications won’t show what you wrote" (on) |
| Label | `6787:7697` | 24,541 | "Account" (60 gap above the label block, versus 28 elsewhere; see §5) |
| Group | `6787:7699` | 24,563 327×180 | Chevron rows, no icons: "Change password" · "Two-step verification" value "Off" · "Active sessions" value "2 devices" |

Interaction:
- Pick wording per platform and hardware with `expo-local-authentication` (`supportedAuthenticationTypesAsync`): iOS Face ID → "Face ID" / "Ask for Face ID when the app opens" (P5); iOS Touch ID → "Touch ID" (not drawn); Android → this screen's copy. The P2 row value ("Face ID" in `6719:4516`) follows the same rule.
- "Change password" for a signed-in user can reuse the New password screen (§2.2) with a back button. Whether to ask for the current password first is not drawn. Supabase requires recent sign-in for `updateUser({ password })` when "Secure password change" is on, so either ask for the current password or call `reauthenticate()` (which emails a code that could reuse §2.1).
- "Two-step verification" value comes from `supabase.auth.mfa.listFactors()` ("On" when a verified TOTP factor exists) and routes to `app/(auth)/two-factor-setup.tsx`.
- "Active sessions" value is the count of other sessions from `list-sessions` (§2.8).

Gaps vs code: P5 is not built. `expo-local-authentication` is not installed (`package.json`). There is no app-lock gate and no hide-previews behaviour (06 §6 item 12).

## 3. Asset table

| Node id | Name | Screen | Kind | Size | Notes |
|---|---|---|---|---|---|
| `6787:4892`, `4893` (and `4946/4947`, `5006/5007`, `5504/5505`, `6795:6237/6238`, `6787:7486/7487`) | Glow | Auth, My plan, Accessibility, Active sessions | Glow | 280 / 220 | §1.2 defaults |
| `6787:5041`, `5042` (and `5114`, `5115`) | Glow | Paywall states | Glow | 300 / 200 | `#E2CC40`@0.28 at 37.5,0; `#D8B4D8`@0.25 at 160,90; blur 80 |
| `6787:5534` | Ellipse | My plan (Pro) card | Glow | 200 | `#E2CC40`@0.30, blur 60, card-relative 170,−70, clipped by the card |
| `6787:7568`, `7569` | Glow | Edit reminder time | Glow | 280 / 200 | `#D8B4D8`@0.25 at −70,−50; `#E2CC40`@0.28 at 220,40 (200); blur 90 |
| `6787:7669`, `7670`, `7673` | Glow | Security (Android) | Glow | 280 / 220 / 120 | lilac default; sky `#7FC6F1`@0.18 at 200,60; gold `#E2CC40`@0.28 at 127,96 blur 40 |
| `6787:5024` | Orb | Password updated | Code (View + shadow) | 120 | `#FFF6D6`, shadow 0 0 40 `#E2CC40`@0.45; not a file |
| `6787:5046`, `5119` | Logo mark | Paywall states | SVG (existing) | 72 | `LogoMark size={72}` |
| `6787:7678` | Shield | Security (Android) | SVG | 200×140 | Export from this node (new opacities). Replaces `6720:4639` in 06 task 1. |
| `I…;6674:2967` | Info | Legal notes | SVG (existing) | 14 | Drawn inline in `LegalNote` |
| `6589:1632` | Icon/Arrow back | Nav bars | Icon | 22 | `arrow/back` exists |
| `6589:1672` | Icon/Arrow close | Paywall states | Icon | 22 | `arrow/close` exists |
| `6589:1657` | Icon/Arrow chevron-right | List rows | Icon | 18 | `arrow/chevron-right` exists |
| `6598:1837` | Icon/Line check | Rules, features, benefits | Icon | 14–16 | `line/check` exists |
| `6598:1841` | Icon/Line lock | Password updated, Security | Icon | 36 / 20 | `line/lock` exists |
| `6598:1810` | Icon/Line eye | Security | Icon | 20 | `line/eye` exists |
| `6598:1817` | Icon/Line activity | Active sessions, Notifications | Icon | 20 | `line/activity` exists; used as a stand-in for phone and tablet |
| `6753:4248` | Icon/Line globe | Active sessions | Icon | 20 | **Missing from `iconData.ts`.** Export the path from this main. |
| `6598:1781`, `1789`, `1792`, `1795`, `1814`, `1859`, `6609:2484` | Icon/Line heart, meditate, moon, journal, sparkle, chart, bell | Notifications background | Icon | 20 | All exist |
| none | phone, tablet, laptop | Active sessions | Icon | 20 | **Not drawn.** Device rows use `activity`; design needs device icons, then add them to `iconData.ts`. |

No raster images on these screens.

## 4. Icons the screens need that `iconData.ts` lacks

- `line/globe` (`6753:4248`) for the web session row, and for the Language row in P2 (06 asset table already lists it as ad hoc).
- Device icons (phone, tablet, desktop/laptop) for Active sessions are not drawn. `activity` is a placeholder.
- An unmet-rule glyph for the password rules (§2.2) is not drawn; a 16 circle outline in `#CFC6D6` can be drawn inline without a new icon.

## 5. Figma issues and open design points

- **Plan card heights vary.** Yearly is 67 (padding 10/14) on Monthly selected and 69 on Trial used; Monthly is 72 and 70. Canonical §2.7 is 68 fixed. Suggest 68 with centred content.
- **Monthly sub line differs between the two paywall frames:** "€9.99/month · cancel any time" (Monthly selected) vs "€9.99/month" (Trial used). §2.5 assumes the suffix only shows when Monthly is selected; confirm.
- **Toggle knob colour.** `#FFF6D6` inside List Rows on Notifications and Security, `#FFFFFF` on Accessibility and in code. Pick one.
- **Divider inset on rows without icons.** Dividers sit at x 64 even on icon-less rows (My plan actions, Security Account group), so they start mid-label. Use x 16 there.
- **Reminder mock data disagrees.** The sheet for "Mood check-in" has M–F selected, but the row behind it says "Every day at 20:00".
- **Session count disagrees.** Security says "2 devices" and Active sessions lists three (this device plus two others). Decide whether the value counts other devices or all devices.
- **Security spacing.** The gap above the Account block is 60, while the other settings screens use 28 between blocks. The Notifications background mixes 92, 60 and 28.
- **Undrawn states:** wrong or expired code, the enabled "Resend code" link, unmet password rules, Pro "canceling" and lifetime variants of My plan, Stripe wording for "App Store", Wind down offset picker, per-device session detail, Touch ID wording, signed-in change password (current-password step).
- **Brand spelling.** Accessibility title says "Inner Glow"; the brand is still written three ways (99 §2).
- **Layer hygiene.** The Legal/Note text layer is still named "INNER GLOW supports your wellbeing…" while holding other copy. Button text layers are all named "Continue". Section `6786:4878` no longer exists, so links to it are broken.

## 6. Answers to open questions

Items from `docs/design-handoff/99-open-questions.md` that these screens resolve, fully or in part:

| 99 item (quoted briefly) | Answer from these screens |
|---|---|
| §3 "Not designed: forgot-password code entry and new-password screens" | Resolved: Enter code `6787:4891`, New password `6787:4945`, Password updated `6787:5005` (§2.1–2.3). |
| §3 "paywall CTA when Monthly is selected and copy for trial-ineligible users" | Resolved: "Subscribe · €9.99/month" with the "Monthly has no free trial…" subtitle (`6787:5040`), and "Welcome back to Pro" with "Subscribe · €59.99/year" (`6787:5113`) (§2.4–2.5). |
| §3 "Appearance" | Resolved by replacement: Appearance is dropped; Settings · Accessibility `6795:6236` takes its row (§2.7). No dark mode is planned in this design. |
| §3 "Active sessions" | Resolved: `6787:7485` (§2.8). The backend still has to be built. |
| §3 "reminder-time editing" | Resolved for clock-time reminders: sheet `6787:7567` (§2.9). Wind down's offset picker is still missing. |
| §3 "Android biometric wording" | Resolved for Android: "Fingerprint or face unlock" / "Ask to unlock when the app opens" (`6787:7668`). Touch ID wording on iOS is still missing. |
| §3 "Pro-user variants" | Partly resolved: My plan (Pro) `6787:5503` (§2.6). Pro versions of P1 Profile and P2 Settings ("Your plan" card) are still missing. |
| §4 **Product** "Trial model: store intro offer that auto-renews (design) vs current non-renewing server trial … confirm prices and currency" | Design confirms the store intro-offer model and €59.99/year, €9.99/month, €4.99/mo equivalent, "Save 50%". The code already sells Yearly with a 7-day intro and Monthly (`lib/purchase-products.ts`, `lib/revenuecat.ts:38-40`). The Glow AI "€4.99/mo" card question is not addressed here. |
| §3 "Paywall shows Yearly and Monthly plans in EUR, but the configured products are Monthly and Lifetime" | Resolved in code since the audit (Lifetime is kept only for existing buyers, `lib/purchase-products.ts:4`), and both new paywall frames keep Yearly + Monthly. |
| §1 "Pick one value each: toggle off `#E8E0D5` vs `#E1DAE6` … divider `#F0EBE5` vs `#EFEAF2` … field radius 16 vs 26" | The new library uses toggle off `#E1DAE6`, divider `#EFEAF2` and a 52-high field with radius 16 (§1.1). That is strong evidence for those values; design should confirm they are canonical. |
| §1 "CTA label size varies … button height is 56 or 58. Back button comes in 44, 48 and 50; close button in 40 and 44" | The new library uses a 56 button with a SemiBold 16 label, a 44 back button and a 44 close button. Same caveat: confirm as canonical. |
| §1 "Confirm `#CFC6D6` for radio off and checkbox off" | Radio off is `#CFC6D6` with a 2px stroke on both paywall frames. Checkbox off is still not shown. |
| §1 "The Top Nav back ring is `#736B66` on Sign In and `#6B5279` elsewhere" | The new Back Button is white with a 1px `#CFC6D6` ring. This is a third value; confirm it replaces both. |
| §1 "The main components … are still in the old brown/olive palette" | Partly: these screens use a recoloured library (`6746:*`, `6753:*`). Whether the old mains (`4002:11881` etc.) are retired is not shown. |
| §3 "Icons missing from the icon set: … globe …" | Figma now has `Icon/Line globe` `6753:4248`; it is still missing in `iconData.ts`. |

Left unresolved by these screens:
- §4 **Product** "Forgot password shows masked email and phone with no input: where does the account come from?" Enter code also shows a masked email and still has no email input. The Phone/SMS path is not drawn either.
- §4 **Product** "Paywall sits before sign-up but purchases need an account". Not addressed.
- §3 "notification settings entry (old Settings tab removed)". Not addressed.
- §1 "No disabled, pressed or error states for buttons and inputs". Still not drawn; the Enter code and New password screens need error states.
- §5 "The Legal/Note layer name holds different copy from its text". Still true on these screens.

## 7. Proposed tasks

1. Add the new-library variants to the foundation components: centred-title `TopNav` with the 44 solid back button, `IconButton` `solid` variant, `AppField` `box` variant, `AppButton` secondary fill and a 56/16 transparent ghost, `Toggle` off `#E1DAE6`, 2px `Radio` with a `#CFC6D6` off ring, `MetaChip` `brand` tag, `LegalNote` colour `#8E7FA6`, and a `#CFC6D6` token (08 §1.1).
2. Add `line/globe` from `6753:4248` to `components/icons/iconData.ts`, and add phone/tablet/desktop device icons once design draws them (08 §3, §4).
3. Build `SettingsGroup` and `SettingsRow` to the List Row spec (60 high for one- and two-line rows, chevron/toggle/value trailing, x 16 divider on icon-less rows), as the concrete form of 06 task 13 (08 §1.1).
4. Add the 6-digit recovery-code step: switch the Supabase recovery email template to `{{ .Token }}` with a 600 s expiry, build Enter code with a single hidden OTP input, resend countdown and error state, and verify with `verifyOtp({ type: 'recovery' })`, as the code step of 01 task 11 (08 §2.1).
5. Rebuild `reset-password.tsx` as New password and Password updated with box fields, the three live rules, the 8-character-plus-number-or-symbol policy, and sign-out before "Back to sign in"; apply the same policy to sign-up and the Supabase auth settings (08 §2.2–2.3).
6. Extend the shared `Paywall` component (01 task 6) with plan- and eligibility-driven copy (Monthly-selected subtitle and "Subscribe · {price}/month" CTA, trial-used title, subtitle, sub lines and CTA) from RevenueCat prices and `isYearlyTrialEligible`, add a Stripe eligibility read, and use the new-library values from 08 §2.5.1 (08 §2.4–2.5).
7. Build My plan with the Pro state (current plan card, renewal from `useSubscription`, Manage / Change plan / Restore rows, provider-aware value and legal copy, canceling and lifetime fallbacks), as the Pro half of 06 task 23 (08 §2.6).
8. Add an accessibility preferences store and build Settings · Accessibility, wiring Reduce motion into `GlowOrb` and other loops, Softer glows into `GlowField`/`Glow`, Larger text into a shared font-scale cap, and Haptic cues into the breathing player; rename the P2 row (08 §2.7).
9. Build Active sessions with "Sign out of other devices" via `signOut({ scope: 'others' })`, plus `list-sessions` and `revoke-session` edge functions over `auth.sessions` (08 §2.8).
10. Add per-reminder times and weekdays to `lib/notifications.ts` with weekly triggers and generated subtitles, and build the Edit reminder time bottom sheet with wheel picker and day chips on the P4 Notifications screen (08 §2.9, 06 task 17).
11. Make Security (06 task 18) platform-aware with `expo-local-authentication` type detection and the Android copy from `6787:7668`, read Two-step status from `mfa.listFactors()`, show the session count, and route Change password to the New password screen with reauthentication (08 §2.10).
12. Export the shield art from `6787:7678` as SVG in place of `6720:4639` (08 §3, replaces that item in 06 task 1).
13. Replace the reset-password, paywall-state, My plan, Accessibility, Active sessions, reminder sheet and Security copy in `i18n/locales/en/translation.ts` with the verbatim design strings (08 §2).

## 8. Blockers

- Section `6786:4878` named in the request no longer exists, and `6787:7395` (Settings · Appearance) was deleted. Accessibility `6795:6236` was audited in its place.
- No Figma call failures. All extraction used read-only calls.
- The Stripe path (web and Android) has no trial-eligibility read, so the Trial already used state can only be shown on iOS until one is added.
- Product needs to confirm: what "Change to monthly" does for yearly subscribers, the per-device session detail, whether the app keeps IP-based locations for sessions, and the Larger text and Reduce motion semantics in §2.7.
