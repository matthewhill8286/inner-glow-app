/**
 * InnerGlow theme tokens (warm, earthy, soft UI)
 * Matches the design board: cream background, brown primary, sage accents.
 */

// Brand / primary from designs (warm brown)
const brandBrown = '#8B6B47';
const brandBrownDark = '#C4A882';

// Warm neutrals
const cream = '#FAF8F5';
const cream2 = '#F2ECE6';
const ink = '#1B1A18';

// Accents seen across modules (sage / orange / lavender)
const sage = '#5B8A5A';
const sageDark = '#7EAD7E';
const amber = '#E8985A';
const lavender = '#7B6DC9';

// Score card colors
const scoreGreen = '#4AAD7A';
const scoreOrange = '#E8985A';
const scorePurple = '#8B7FE8';

// UI neutrals
const borderLight = 'rgba(0,0,0,0.06)';
const borderDark = 'rgba(255,255,255,0.10)';
const iconLight = 'rgba(0,0,0,0.50)';
const iconDark = 'rgba(255,255,255,0.65)';

export const Colors = {
  light: {
    // core
    text: ink,
    background: cream,
    surface: '#FFFFFF',
    card: '#FFFFFF',
    mutedText: 'rgba(0,0,0,0.55)',
    subtleText: 'rgba(0,0,0,0.40)',

    // brand
    tint: brandBrown,
    primary: brandBrown,
    onPrimary: '#FFFFFF',

    // accents
    accent: sage,
    onAccent: '#FFFFFF',
    success: sage,
    warning: amber,
    info: lavender,

    // scores
    scoreGreen,
    scoreOrange,
    scorePurple,

    // UI
    border: borderLight,
    divider: 'rgba(0,0,0,0.04)',
    icon: iconLight,

    // inputs
    inputBg: cream2,
    inputText: ink,
    placeholder: 'rgba(0,0,0,0.30)',

    // tabs
    tabBarBg: '#FFFFFF',
    tabIconDefault: 'rgba(0,0,0,0.35)',
    tabIconSelected: brandBrown,

    // overlays
    shadow: 'rgba(0,0,0,0.08)',
    overlay: 'rgba(0,0,0,0.35)',
  },

  dark: {
    // core
    text: '#F4F2EE',
    background: '#131210',
    surface: '#1D1A17',
    card: '#1D1A17',
    mutedText: 'rgba(255,255,255,0.65)',
    subtleText: 'rgba(255,255,255,0.50)',

    // brand
    tint: brandBrownDark,
    primary: brandBrownDark,
    onPrimary: '#1B1A18',

    // accents
    accent: sageDark,
    onAccent: '#1B1A18',
    success: sageDark,
    warning: '#F0B36A',
    info: '#9A98E6',

    // scores
    scoreGreen: '#5CBE8A',
    scoreOrange: '#F0A86A',
    scorePurple: '#9D91F0',

    // UI
    border: borderDark,
    divider: 'rgba(255,255,255,0.06)',
    icon: iconDark,

    // inputs
    inputBg: 'rgba(255,255,255,0.07)',
    inputText: '#F4F2EE',
    placeholder: 'rgba(255,255,255,0.35)',

    // tabs
    tabBarBg: '#1D1A17',
    tabIconDefault: 'rgba(255,255,255,0.45)',
    tabIconSelected: brandBrownDark,

    // overlays
    shadow: 'rgba(0,0,0,0.50)',
    overlay: 'rgba(0,0,0,0.55)',
  },
} as const;

// Component sizing tokens
export const UI = {
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
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
  card: {
    padding: 16,
    borderWidth: 1,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
  },
} as const;
