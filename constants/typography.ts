import type { TextStyle } from 'react-native';

/**
 * Urbanist type scale derived from the Figma screens
 * (docs/design-handoff/00-foundations.md §2.3).
 *
 * Urbanist 400/500/600/700 is embedded natively as one family named
 * "Urbanist" (expo-font plugin in app.json), so `fontWeight` picks the right
 * file on both iOS and Android. The legacy keys (`family`, `weight`,
 * `heading`, `section`, ...) are kept so existing screens keep compiling.
 */
const URBANIST = 'Urbanist';
const family = { heading: URBANIST, body: URBANIST };

const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Plain objects (not `TextStyle`) so legacy screens can keep spreading them into any style.
const style = <W extends NonNullable<TextStyle['fontWeight']>>(
  fontWeight: W,
  fontSize: number,
  lineHeight?: number,
  letterSpacing = 0
) => ({ fontFamily: URBANIST, fontWeight, fontSize, lineHeight, letterSpacing });

/** Design scale. Letter spacing is in px (Figma % × size / 100). */
export const Type = {
  display: style(weight.semibold, 40, 48),
  titleXl: style(weight.semibold, 30, 38, -0.3),
  titleLg: style(weight.semibold, 26, 32),
  titleMd: style(weight.semibold, 22, 28),
  titleSm: style(weight.semibold, 20, 25, -0.1),
  headline: style(weight.semibold, 18, 22, -0.07),
  bodyStrong: style(weight.semibold, 16, 22, -0.05),
  bodyLg: style(weight.medium, 16, 25.6, -0.05),
  body: style(weight.medium, 15, 21),
  bodySm: style(weight.regular, 14, 20),
  label: style(weight.semibold, 14, 17, -0.03),
  chip: style(weight.medium, 13, 18),
  chipSelected: style(weight.semibold, 13, 18),
  caption: style(weight.semibold, 12, 16),
  micro: style(weight.medium, 11, 13),
  microBold: style(weight.bold, 11, 13),
  eyebrow: style(weight.bold, 11, 14, 1.3),
  legal: style(weight.regular, 11, 15.4),
} as const;

export type TypeToken = keyof typeof Type;

export const Typography = {
  family,
  weight,
  // Legacy tokens, now mapped onto the design scale.
  heading: { ...Type.titleXl },
  section: { ...Type.titleSm },
  cardHeading: { ...Type.headline },
  body: { ...Type.bodyLg },
  caption: { ...Type.bodySm, fontSize: 13, lineHeight: 18 },
  label: { ...Type.caption, letterSpacing: 0.6 },
};
