import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow, GlowField, type GlowSpec } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';

export type UtilityKind = 'notFound' | 'offline' | 'serverError' | 'maintenance' | 'private';

const PLUM = '#6B5279';

/** Figma line art (05 §5.2), in the 375×812 frame's coordinates. */
const CONTOURS_500: [string, number][] = [
  ['M217.5 300L217.2 303.7L216.5 307.3L215.2 310.8L213.5 314.1L211.3 317.2L208.7 319.9L205.8 322.4L202.5 324.4L199 326.1L195.3 327.2L191.4 328L187.5 328.2L183.6 328L179.7 327.2L176 326.1L172.5 324.4L169.2 322.4L166.3 319.9L163.7 317.2L161.5 314.1L159.8 310.8L158.5 307.3L157.8 303.7L157.5 300L157.8 296.3L158.5 292.7L159.8 289.2L161.5 285.9L163.7 282.8L166.3 280.1L169.2 277.6L172.5 275.6L176 273.9L179.7 272.8L183.6 272L187.5 271.8L191.4 272L195.3 272.8L199 273.9L202.5 275.6L205.8 277.6L208.7 280.1L211.3 282.8L213.5 285.9L215.2 289.2L216.5 292.7L217.2 296.3L217.5 300Z', 0.32],
  ['M228.6 300L228.7 305.1L227.9 310.2L226.2 315.1L223.6 319.6L220.3 323.7L216.4 327.1L212 330L207.3 332.3L202.5 334L197.5 335.2L192.5 336L187.5 336.3L182.4 336.2L177.4 335.5L172.4 334.3L167.5 332.5L163 330.1L158.8 327L155.2 323.3L152.3 319.1L150.1 314.6L148.6 309.8L147.9 304.9L147.8 300L148.3 295.2L149.4 290.4L151 285.8L153.1 281.3L155.7 277.1L158.9 273.2L162.7 269.6L167 266.6L171.7 264.3L176.9 262.6L182.2 261.8L187.5 261.8L192.7 262.6L197.7 264.1L202.4 266.1L206.8 268.6L210.8 271.4L214.5 274.6L217.9 278.1L221 281.8L223.7 285.9L226 290.3L227.6 295L228.6 300Z', 0.28],
  ['M239.1 300L239.2 306.4L238 312.7L235.7 318.8L232.3 324.3L228 329.2L223.1 333.5L217.7 337.1L212.1 340L206.2 342.5L200.2 344.5L193.9 345.9L187.5 346.7L180.9 346.9L174.3 346.2L167.9 344.5L161.8 341.8L156.3 338.2L151.5 333.8L147.6 328.7L144.7 323.2L142.6 317.5L141.3 311.6L140.6 305.8L140.3 300L140.5 294.2L141.2 288.3L142.4 282.4L144.2 276.5L146.9 270.7L150.5 265.3L155.1 260.4L160.7 256.3L166.9 253.3L173.7 251.5L180.6 251L187.5 251.6L194.1 253.2L200.2 255.6L205.8 258.5L211 261.8L215.8 265.3L220.4 269.1L224.7 273.2L228.8 277.6L232.5 282.5L235.6 287.9L237.9 293.8L239.1 300Z', 0.25],
  ['M248.9 300L247.9 307.5L245.6 314.6L242.3 321.3L238.1 327.4L233.2 333L228 338.1L222.4 342.7L216.4 347.1L210 351.1L203.1 354.6L195.5 357.4L187.5 359.2L179.1 359.7L170.7 358.8L162.7 356.3L155.3 352.4L149 347.1L143.9 340.9L140.1 334.2L137.4 327.2L135.6 320.2L134.4 313.4L133.7 306.7L133.1 300L132.9 293.2L133 286.3L133.8 279.1L135.5 271.8L138.4 264.6L142.7 257.9L148.3 252L155.1 247.2L162.8 243.9L171 242L179.3 241.5L187.5 242.4L195.3 244.2L202.7 246.8L209.6 249.9L216.1 253.4L222.4 257.2L228.4 261.6L234 266.5L239 272L243.3 278.3L246.5 285.1L248.4 292.5L248.9 300Z', 0.21],
  ['M258.9 300L256.2 308.5L252.3 316.3L244.4 322.1L249.3 328.6L236.2 330.6L240.2 338L228.5 338.6L230.6 346.2L221 347.1L219.1 360.3L212.2 356.1L207.1 368.8L201.2 364.7L192.7 374.1L187.5 370.9L177.5 371.7L167.4 370.4L157.9 367.1L149.5 361.9L142.3 355.4L136.6 347.8L132.3 339.8L129.1 331.7L126.8 323.6L125 315.7L123.7 307.9L122.6 300L122.1 291.9L122.3 283.6L123.6 275.1L126.3 266.8L130.4 258.8L136.2 251.7L143.2 245.8L151.4 241.1L160.2 238L169.3 236.1L178.5 235.5L187.5 235.8L196.4 236.7L205.1 238.3L213.7 240.5L222.3 243.4L230.7 247.1L238.7 251.9L245.9 257.9L252 265L256.5 273.1L259.2 281.9L260 291L258.9 300Z', -1],
  ['M269.4 300L265.4 309.6L260.5 318.4L255.1 326.3L249.5 333.6L243.9 340.7L238.2 347.7L232.2 354.7L225.3 361.6L217.5 368L208.5 373.5L198.4 377.6L187.5 379.8L176.3 379.9L165.3 377.8L155.1 373.6L145.8 367.8L137.8 360.8L131 353.1L125.3 344.9L120.3 336.5L116 327.8L112.3 318.9L109.3 309.7L107.3 300L106.6 290L107.6 279.9L110.4 270L115.2 260.8L121.9 252.7L130 245.9L139.1 240.7L148.8 237L158.7 234.6L168.4 233L178 232L187.5 231.3L197.2 230.9L207.2 231L217.6 231.7L228.3 233.5L239 236.9L249.1 242.1L257.9 249.2L265 258L269.7 268L271.9 278.7L271.7 289.6L269.4 300Z', 0.13],
  ['M278.5 300L275 310.8L270.7 321L265.9 330.5L260.7 339.7L255.1 348.7L248.7 357.5L241.2 365.8L232.5 373.3L222.6 379.6L211.5 384.1L199.6 386.5L187.5 386.8L175.6 384.9L164.4 381.1L154 375.9L144.6 369.8L136 363.1L127.8 356.1L120 348.7L112.4 340.7L105.2 332L98.7 322.4L93.5 311.6L90.2 300L89.2 287.8L91.1 275.7L95.8 264.3L103.1 254.2L112.4 245.8L123.1 239.4L134.4 234.9L145.7 231.9L156.6 229.8L167.1 228.3L177.3 226.8L187.5 225.4L198.1 224L209.4 223.1L221.3 223.2L233.6 225L245.6 228.8L256.8 234.8L266.4 243.1L273.7 253.2L278.5 264.6L280.7 276.5L280.5 288.5L278.5 300Z', 0.1],
  ['M284 300L282.9 311.8L281.1 323.6L278.4 335.4L274.7 347.3L269.4 359L262.2 370.2L252.9 380.1L241.6 388.2L228.8 393.8L215.1 396.7L201 396.7L187.5 394.3L174.9 389.9L163.5 384.2L153.1 378L143.5 371.6L134.2 365.2L124.9 358.9L115.2 352.2L105.3 344.6L95.7 335.7L87.1 325.3L80.4 313.3L76.4 300L75.6 286.2L78.3 272.5L84.4 259.8L93.2 248.8L104.1 239.8L116 232.8L128.4 227.6L140.7 223.8L152.6 220.7L164.1 218L175.7 215.6L187.5 213.4L199.8 212L212.7 211.6L225.8 213L238.8 216.5L250.9 222.3L261.6 230.4L270.3 240.3L276.8 251.5L281.1 263.5L283.5 275.8L284.3 288L284 300Z', 0.06],
];
const CONTOURS_MAINT: [string, number][] = [
  ['M257.5 300L256.9 308.6L255.1 317L252.2 325.2L248.1 332.9L243 340.1L237 346.5L230.1 352.2L222.5 357L214.3 360.8L205.6 363.6L196.6 365.2L187.5 365.8L178.4 365.2L169.4 363.6L160.7 360.8L152.5 357L144.9 352.2L138 346.5L132 340.1L126.9 332.9L122.8 325.2L119.9 317L118.1 308.6L117.5 300L118.1 291.4L119.9 283L122.8 274.8L126.9 267.1L132 259.9L138 253.5L144.9 247.8L152.5 243L160.7 239.2L169.4 236.4L178.4 234.8L187.5 234.2L196.6 234.8L205.6 236.4L214.3 239.2L222.5 243L230.1 247.8L237 253.5L243 259.9L248.1 267.1L252.2 274.8L255.1 283L256.9 291.4L257.5 300Z', 0.32],
  ['M267.4 300L267.1 309.9L265.3 319.6L261.9 329L257.1 337.8L251.1 345.8L243.8 353L235.7 359.1L226.9 364.1L217.5 368L207.7 370.8L197.7 372.5L187.5 373.2L177.3 372.7L167.2 371.1L157.4 368.3L148 364.3L139.2 359.1L131.3 352.8L124.4 345.5L118.6 337.4L114.1 328.6L111 319.3L109.2 309.7L108.7 300L109.6 290.4L111.6 280.9L114.9 271.7L119.3 263L124.8 254.8L131.4 247.3L139 240.6L147.6 235L156.9 230.6L166.8 227.4L177.1 225.6L187.5 225.3L197.8 226.3L207.9 228.6L217.4 232.1L226.4 236.6L234.7 242.1L242.3 248.5L249.1 255.6L255 263.4L259.9 271.8L263.7 280.8L266.2 290.3L267.4 300Z', 0.27],
  ['M276.9 300L276.5 311L274.4 321.9L270.5 332.3L264.9 342L258 350.9L249.9 358.7L240.9 365.4L231.2 371.1L220.8 375.7L210.1 379.1L198.9 381.4L187.5 382.5L176 382.2L164.5 380.5L153.4 377.3L142.9 372.6L133.3 366.4L124.8 359L117.5 350.5L111.7 341.1L107.3 331.2L104.2 321L102.4 310.5L101.9 300L102.4 289.5L104.2 279L107.1 268.7L111.3 258.7L116.9 249.1L123.9 240.2L132.3 232.4L142 225.9L152.6 220.9L164 217.5L175.7 216L187.5 216.1L199 217.8L210 220.9L220.5 225.2L230.2 230.4L239.3 236.6L247.7 243.5L255.3 251.1L262 259.5L267.8 268.7L272.3 278.6L275.4 289.1L276.9 300Z', 0.22],
  ['M285.6 300L284.4 312L281.4 323.6L276.6 334.7L270.3 345L262.9 354.4L254.5 362.9L245.2 370.7L235.1 377.5L224.2 383.4L212.6 388.2L200.3 391.6L187.5 393.5L174.4 393.6L161.4 391.7L148.8 387.7L137.2 381.9L126.8 374.3L118 365.4L110.7 355.4L105 344.7L100.8 333.7L97.9 322.6L96 311.3L95.2 300L95.4 288.6L96.7 277.1L99.3 265.7L103.5 254.4L109.3 243.6L116.9 233.7L126.2 224.9L137 217.8L148.9 212.4L161.6 209L174.5 207.5L187.5 207.8L200.1 209.7L212.3 213L223.9 217.4L234.9 222.9L245.2 229.3L254.8 236.7L263.5 245.2L271.1 254.6L277.4 265L282 276.2L284.8 288L285.6 300Z', 0.16],
  ['M294.6 300L292 312.9L287.5 325.2L281.7 336.7L274.7 347.3L266.9 357.3L258.3 366.6L249 375.3L238.8 383.4L227.5 390.7L215.1 396.8L201.7 401.3L187.5 403.9L172.9 404.1L158.4 401.9L144.6 397.3L132 390.4L120.8 381.7L111.4 371.5L103.7 360.5L97.6 348.8L92.9 336.8L89.4 324.7L87 312.4L85.8 300L85.7 287.4L87.1 274.7L90.2 262.1L95.2 249.9L102.1 238.4L111 228.1L121.6 219.3L133.5 212.2L146.5 206.9L160 203.5L173.7 201.8L187.5 201.7L201.1 202.9L214.5 205.3L227.6 209L240.3 214L252.5 220.4L263.9 228.2L274 237.6L282.5 248.4L289.1 260.5L293.3 273.3L295.2 286.7L294.6 300Z', 0.11],
  ['M304.1 300L300.4 314L295 327.1L288.4 339.3L281 350.8L272.9 361.6L264 371.9L254.1 381.6L243.2 390.7L231 398.7L217.5 405.2L202.9 409.7L187.5 412L171.9 411.6L156.5 408.7L142 403.3L128.6 395.9L116.7 386.7L106.3 376.4L97.3 365.1L89.7 353.1L83.3 340.6L78.2 327.5L74.5 314L72.4 300L72.2 285.7L74.2 271.5L78.6 257.6L85.4 244.6L94.5 232.9L105.4 222.8L117.8 214.6L131.1 208.2L145 203.5L159.1 200.3L173.3 198.3L187.5 197.4L201.9 197.4L216.4 198.6L231.1 201.1L245.7 205.3L259.8 211.4L273 219.7L284.5 230L293.9 242.3L300.7 255.9L304.5 270.5L305.6 285.4L304.1 300Z', 0.06],
];
const PATH_404 =
  'M0.75 0.75L9.95 5.05L18.85 9.85L27.35 15.15L35.25 21.05L42.35 27.35L48.45 33.95L53.75 40.85L57.95 48.05L61.25 55.35L63.75 62.65L65.55 69.95L66.75 77.05L67.65 83.95L68.55 90.55L69.45 96.75L70.75 102.55L72.55 107.85L75.05 112.55L78.45 116.75L82.75 120.35L88.05 123.45L94.35 126.05L101.45 128.15L109.35 129.85L117.95 131.15L126.85 132.15L136.05 132.95L145.25 133.65L154.15 134.35L162.55 135.05';
const MOON =
  'M65.83 28C59.76 28.03 53.79 29.51 48.41 32.32C43.03 35.13 38.4 39.19 34.91 44.15C31.42 49.12 29.17 54.85 28.35 60.86C27.53 66.87 28.16 72.99 30.19 78.71C32.22 84.43 35.59 89.58 40.02 93.73C44.45 97.88 49.81 100.91 55.65 102.56C61.49 104.22 67.64 104.45 73.58 103.24C79.53 102.02 85.1 99.41 89.83 95.6C85.39 97.18 80.68 97.86 75.98 97.62C71.28 97.38 66.67 96.21 62.41 94.19C53.82 90.1 47.21 82.76 44.03 73.8C40.85 64.84 41.36 54.97 45.44 46.39C49.53 37.8 56.86 31.18 65.83 28Z';

function Art({ kind }: { kind: UtilityKind }) {
  switch (kind) {
    case 'notFound':
      return (
        <G transform="translate(187.5 280)">
          <Path d={PATH_404} stroke={PLUM} strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 7" fill="none" />
        </G>
      );
    case 'offline':
      return (
        <G>
          <Path d="M136.5 307C141.88 298.32 149.39 291.15 158.32 286.18C167.24 281.21 177.29 278.61 187.5 278.61C197.72 278.61 207.76 281.21 216.69 286.18C225.61 291.15 233.12 298.32 238.5 307" stroke={PLUM} strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M106.75 287.75C115.27 274 127.16 262.66 141.29 254.79C155.42 246.92 171.33 242.79 187.5 242.79C203.67 242.79 219.58 246.92 233.71 254.79C247.84 262.66 259.73 274 268.25 287.75" stroke={PLUM} strokeOpacity={0.3} strokeWidth={2} strokeLinecap="round" strokeDasharray="10 9" fill="none" />
          <Path d="M77 268.5C88.66 249.69 104.93 234.16 124.27 223.4C143.6 212.63 165.37 206.98 187.5 206.98C209.63 206.98 231.4 212.63 250.74 223.4C270.07 234.16 286.34 249.69 298 268.5" stroke={PLUM} strokeOpacity={0.15} strokeWidth={2} strokeLinecap="round" strokeDasharray="10 9" fill="none" />
        </G>
      );
    case 'serverError':
      return (
        <G>
          {CONTOURS_500.map(([d, o], i) =>
            o < 0 ? (
              <Path key={i} d={d} stroke="#E8828F" strokeOpacity={0.7} strokeWidth={1.4} fill="none" />
            ) : (
              <Path key={i} d={d} stroke={PLUM} strokeOpacity={o} strokeWidth={1} fill="none" />
            ),
          )}
        </G>
      );
    case 'maintenance':
      return (
        <G>
          {CONTOURS_MAINT.map(([d, o], i) => (
            <Path key={i} d={d} stroke={PLUM} strokeOpacity={o} strokeWidth={1} fill="none" />
          ))}
          <Path d={MOON} fill={palette.gold} transform="translate(135.7 232)" />
        </G>
      );
    case 'private':
      return (
        <G>
          <Circle cx={187.5} cy={300} r={95} stroke={PLUM} strokeOpacity={0.15} strokeWidth={1} fill="none" />
          <Circle cx={187.5} cy={300} r={75} stroke={PLUM} strokeOpacity={0.5} strokeWidth={2} fill="none" />
        </G>
      );
  }
}

/** Glows and inner lights per screen (05 §5.2), in frame coordinates. */
const GLOWS: Record<UtilityKind, GlowSpec[]> = {
  notFound: [
    { color: palette.mustard, opacity: 0.38, x: 57.5, y: 170, width: 260, blur: 60 },
    { color: palette.lavenderSoft, opacity: 0.3, x: 162.5, y: 245, width: 170, blur: 50 },
  ],
  offline: [{ color: palette.sky, opacity: 0.3, x: 67.5, y: 210, width: 240, blur: 60 }],
  serverError: [
    { color: palette.rose, opacity: 0.32, x: 57.5, y: 170, width: 260, blur: 60 },
    { color: palette.mustard, opacity: 0.3, x: 52.5, y: 195, width: 170, blur: 50 },
  ],
  maintenance: [{ color: palette.lavenderSoft, opacity: 0.45, x: 62.5, y: 175, width: 250, blur: 60 }],
  private: [
    { color: palette.lavender, opacity: 0.35, x: 62.5, y: 175, width: 250, blur: 60 },
    { color: palette.mustard, opacity: 0.3, x: 147.5, y: 240, width: 160, blur: 50 },
  ],
};
const LIGHTS: Record<UtilityKind, { color: string; opacity: number; x: number; y: number; size: number; blur: number }[]> = {
  notFound: [
    { color: palette.gold, opacity: 0.9, x: 164.5, y: 277, size: 46, blur: 10 },
    { color: palette.lavender, opacity: 0.6, x: 332.5, y: 415, size: 10, blur: 2 },
  ],
  offline: [
    { color: palette.mustard, opacity: 0.5, x: 172.5, y: 325, size: 30, blur: 8 },
    { color: palette.gold, opacity: 0.8, x: 181.5, y: 334, size: 12, blur: 2 },
  ],
  serverError: [{ color: palette.gold, opacity: 0.9, x: 170.5, y: 283, size: 34, blur: 8 }],
  // The moon's drop shadow, drawn as a glow behind it.
  maintenance: [{ color: palette.mustard, opacity: 0.7, x: 155, y: 260, size: 64, blur: 24 }],
  private: [{ color: palette.gold, opacity: 0.85, x: 162.5, y: 275, size: 50, blur: 12 }],
};

/**
 * Error and utility state (05 §5.1): back button, illustration, title, subtitle, status chip, a
 * primary action and a text link. 404, offline, 500, maintenance and private share it.
 */
export function UtilityState({
  kind,
  title,
  body,
  chip,
  chipIcon,
  cta,
  onCta,
  link,
  onLink,
  backLabel,
  onBack,
}: {
  kind: UtilityKind;
  title: string;
  body: string;
  chip: string;
  chipIcon: IconName;
  cta: string;
  onCta: () => void;
  link: string;
  onLink: () => void;
  backLabel: string;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // The art keeps its 375 frame, centred; the frame's 44pt status bar becomes the real inset.
  const top = insets.top - 44;
  const left = (width - 375) / 2;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField glows={GLOWS[kind].map((g) => ({ ...g, y: g.y + top }))} />
      <View pointerEvents="none" style={{ position: 'absolute', left, top, width: 375, height: 460 }}>
        {LIGHTS[kind].map((l, i) => (
          <Glow key={i} color={l.color} opacity={l.opacity} width={l.size} blur={l.blur} style={{ position: 'absolute', left: l.x, top: l.y }} />
        ))}
        <Svg width={375} height={460} viewBox="0 0 375 460" style={{ position: 'absolute' }}>
          <Art kind={kind} />
        </Svg>
        {kind === 'private' && (
          <View style={{ position: 'absolute', left: 172.5, top: 284 }}>
            <Icon name="line/lock" size={30} color={palette.plum} />
          </View>
        )}
      </View>

      {onBack && (
        <IconButton accessibilityLabel={backLabel} onPress={onBack} style={{ position: 'absolute', left: 24, top: insets.top + 10 }} />
      )}

      <View style={{ position: 'absolute', left: 24, right: 24, top: top + 486, alignItems: 'center' }}>
        <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 28, lineHeight: 39, color: palette.ink, textAlign: 'center' }]}>
          {title}
        </Text>
        <Text style={[Type.bodyS, { lineHeight: 20, color: palette.textMuted, textAlign: 'center', marginTop: 4, maxWidth: 287 }]}>{body}</Text>
        <View
          style={{
            marginTop: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
            paddingLeft: 12,
            paddingRight: 14,
            borderRadius: 999,
            backgroundColor: palette.selected,
          }}
        >
          <Icon name={chipIcon} size={14} color={palette.plum} />
          <Text style={[Type.caption, { color: palette.plum }]}>{chip}</Text>
        </View>
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 18, gap: 14 }}>
        <AppButton title={cta} onPress={onCta} />
        <Pressable accessibilityRole="button" onPress={onLink} hitSlop={8} style={{ alignSelf: 'center', minHeight: 32, justifyContent: 'center' }}>
          <Text style={[Type.buttonS, { color: palette.lavender }]}>{link}</Text>
        </Pressable>
      </View>
    </View>
  );
}
