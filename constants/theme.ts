import { Typography } from './typography';

/**
 * InnerGlow theme tokens — "Dusk Plum" palette from the Figma file
 * (docs/design-handoff/00-foundations.md §1.3, §3.1).
 *
 * `palette` holds the raw design colours. `Colors.light` keeps the keys the
 * existing screens already use and points them at the new palette, so screens
 * pick up the redesign before they are migrated one by one.
 */

export const palette = {
  ink: '#241A2E',
  plumDeep: '#4E3A5E',
  plum: '#6B5279',
  lavender: '#8E7FA6',
  lavenderSoft: '#D8B4D8',
  textMuted: '#736B66',
  textSubtle: '#A6A09B',
  textLegal: '#8A8296',
  bg: '#F7F4F2',
  surface: '#FFFFFF',
  surfaceSand: '#F0EBE5',
  surfaceLilac: '#EFEAF2',
  surfaceLilacSoft: '#F5F1F7',
  selected: '#F1ECF5',
  softButton: '#F3E9F3',
  border: '#E8E0D5',
  borderLilac: '#E6E0EA',
  toggleOffAlt: '#E1DAE6',
  // New library primitives ("🧩 Design System" colour frame `6750:4131`).
  borderStrong: '#CFC6D6', // plum/200: nav back button stroke, radio and checkbox off, sheet grabber
  dangerSoft: '#FBEDEE', // danger/50: surface/danger
  mustard: '#E2CC40',
  gold: '#F2D96A',
  cream: '#FFF6D6',
  sky: '#7FC6F1',
  rose: '#FFB3BE',
  sand: '#E8DFD2',
  danger: '#B4505A',
  white: '#FFFFFF',
} as const;

/** Glow colours used with `components/glow` (Figma LAYER_BLUR ellipses). */
export const glowColors = {
  mustard: palette.mustard,
  lilac: palette.lavenderSoft,
  sky: palette.sky,
  rose: palette.rose,
  cream: palette.cream,
  gold: palette.gold,
  sand: palette.sand,
  lavender: palette.lavender,
} as const;

/** Gradient stops for react-native-svg / Skia gradients (00 §1.2). */
export const gradients = {
  glowButton: [palette.lavender, palette.plum],
  progress: [palette.mustard, palette.lavender],
  avatar: [palette.lavenderSoft, palette.plum],
  moodSpectrum: [palette.rose, palette.lavenderSoft, '#EFE6DA', palette.mustard, palette.sky],
} as const;

const light = {
  // core
  text: palette.ink,
  heading: palette.plumDeep,
  background: palette.bg,
  surface: palette.surface,
  card: palette.surface,
  mutedText: palette.textMuted,
  subtleText: palette.textSubtle,
  legalText: palette.textLegal,
  link: palette.lavender,

  // brand
  tint: palette.plum,
  primary: palette.plum,
  onPrimary: palette.white,
  selected: palette.selected,

  // accents
  accent: palette.lavender,
  onAccent: palette.white,
  success: palette.plum,
  warning: '#B39A1E',
  danger: palette.danger,
  info: palette.lavender,

  // scores (kept for existing score screens until they are rebuilt)
  scoreGreen: palette.plum,
  scoreOrange: palette.mustard,
  scorePurple: palette.lavender,

  // UI
  border: palette.border,
  divider: palette.surfaceSand,
  icon: palette.plum,

  // inputs
  inputBg: palette.surface,
  inputText: palette.textMuted,
  placeholder: palette.textMuted,

  // tabs
  tabBarBg: palette.surface,
  tabIconDefault: palette.textSubtle,
  tabIconSelected: palette.plum,

  // overlays
  shadow: 'rgba(36,26,46,0.05)',
  overlay: 'rgba(36,26,46,0.45)',
} as const;

export const Colors = {
  light,
  // No dark designs exist yet (00 §1.3); app.json forces the light interface style.
  dark: light,
} as const;

/** Box shadows as RN `boxShadow` strings (new architecture), 00 §3.1. */
export const shadow = {
  card: '0px 8px 16px 0px rgba(36,26,46,0.05)',
  tabBar: '0px -4px 24px 0px rgba(107,82,121,0.10)',
  glowButton: '0px 0px 18px 2px rgba(226,204,64,0.55), 0px 6px 14px 0px rgba(107,82,121,0.30)',
  soft: '0px 6px 18px 0px rgba(107,82,121,0.08)',
  focusRing: '0px 0px 0px 4px rgba(107,82,121,0.18)',
  haloSm: '0px 0px 14px 3px rgba(226,204,64,0.80)',
  dark: '0px 4px 14px 0px rgba(0,0,0,0.18)',
} as const;

// Component sizing tokens
export const UI = {
  typography: Typography,
  radius: {
    sm: 12,
    md: 16,
    lg: 16,
    xl: 18,
    xxl: 20,
    card: 22,
    tallCard: 32,
    tag: 32,
    toggle: 14,
    checkbox: 6,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  gutter: 24,
  card: {
    padding: 16,
    borderWidth: 0,
  },
  shadow: {
    sm: { boxShadow: shadow.card },
    md: { boxShadow: shadow.card },
    lg: { boxShadow: shadow.soft },
    card: { boxShadow: shadow.card },
    tabBar: { boxShadow: shadow.tabBar },
    glowButton: { boxShadow: shadow.glowButton },
    focusRing: { boxShadow: shadow.focusRing },
  },
} as const;
