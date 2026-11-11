import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, type GlowSpec } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import { Icon, type IconName } from '@/components/icons/Icon';
import { screenBottomPadding } from '@/lib/screen-layout';
import { useTranslation } from 'react-i18next';
import {
  periodStart,
  ringPoint,
  signed,
  SCORE_PERIODS,
  type PlanCategory,
  type ScorePeriod,
} from '@/lib/glow-score';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Score ring (03 §4.1): track, value arc from 12 o'clock clockwise, an optional mustard gain arc
 * after it (the "You did it" ring) and the white knob with a mustard stroke at the end. Butt caps.
 */
export function ScoreRing({
  size,
  thickness,
  value,
  gain = 0,
  color = palette.plum,
  trackColor = 'rgba(107,82,121,0.15)',
  knob = false,
  animateGain = false,
  children,
  style,
}: {
  size: number;
  thickness: number;
  value: number;
  gain?: number;
  color?: string;
  trackColor?: string;
  knob?: boolean;
  animateGain?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const base = Math.max(0, Math.min(100, value));
  const extra = Math.max(0, Math.min(100 - base, gain));
  const progress = useSharedValue(animateGain ? 0 : 1);
  const [knobAt, setKnobAt] = useState(animateGain ? base : base + extra);

  useEffect(() => {
    if (!animateGain || !extra) return;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    // The knob jumps to the end once the arc has drawn; animating it along the arc is not needed.
    const id = setTimeout(() => setKnobAt(base + extra), 900);
    return () => clearTimeout(id);
  }, [animateGain, base, extra, progress]);

  const gainLength = (c * extra) / 100;
  const gainProps = useAnimatedProps(() => ({
    strokeDashoffset: gainLength * (1 - progress.value),
  }));
  const k = ringPoint(size, thickness, knobAt);

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={[(c * base) / 100, c]}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {extra > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={palette.mustard}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={`${gainLength} ${c}`}
            animatedProps={gainProps}
            transform={`rotate(${base * 3.6 - 90} ${size / 2} ${size / 2})`}
          />
        )}
        {knob && (
          <Circle
            cx={k.x}
            cy={k.y}
            r={6}
            fill={palette.white}
            stroke={palette.mustard}
            strokeWidth={4}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

/** Small list ring (44 or 46) with the value in the middle (03 §2.2–2.3). */
export function MiniRing({
  value,
  color,
  size = 44,
}: {
  value: number;
  color: string;
  size?: 44 | 46;
}) {
  return (
    <ScoreRing
      size={size}
      thickness={size / 10}
      value={value}
      color={color}
      trackColor={palette.border}
    >
      <Text
        style={[
          Type.caption,
          { fontWeight: '700', fontSize: size === 46 ? 14 : 13, color: palette.ink },
        ]}
      >
        {value}
      </Text>
    </ScoreRing>
  );
}

/** Top nav for the score screens: 50 back button with a 1.5 plum ring and a centred title pill. */
export function ScoreNav({
  label,
  backLabel,
  onBack,
  trailing,
  backIcon = 'arrow/back',
}: {
  label?: string;
  backLabel: string;
  onBack: () => void;
  trailing?: React.ReactNode;
  backIcon?: IconName;
}) {
  return (
    <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <IconButton variant="nav" icon={backIcon} accessibilityLabel={backLabel} onPress={onBack} />
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[Type.bodyMSemi, { flex: 1, textAlign: 'center', color: palette.plumDeep }]}
      >
        {label}
      </Text>
      <View style={{ width: 44, alignItems: 'flex-end' }}>{trailing}</View>
    </View>
  );
}

/**
 * Screen shell: glows (and optional art) behind a scroll view with the score nav, 24 side padding,
 * and an optional CTA at the end of the content. `tabBar` leaves room for the tab bar.
 */
/** Lets a ring tell ScoreScreen where its centre is, so the aura art can sit around it. */
const RingCentre = createContext<((y: number) => void) | null>(null);

/**
 * Wraps the ring that the aura art centres on. The art is drawn at its design size with its contour
 * centre on the ring's centre, so the two line up on every phone width (TestFlight build 37 report:
 * on a 440-wide iPhone the scaled art sat 36 points below the ring).
 */
export function RingAnchor({
  size,
  marginTop,
  children,
}: {
  size: number;
  marginTop?: number;
  children: React.ReactNode;
}) {
  const report = useContext(RingCentre);
  return (
    <View
      style={{ alignItems: 'center', marginTop }}
      onLayout={(e: LayoutChangeEvent) => report?.(e.nativeEvent.layout.y + size / 2)}
    >
      {children}
    </View>
  );
}

export function ScoreScreen({
  glows,
  art,
  artCentre,
  nav,
  children,
  tabBar = false,
  contentStyle,
}: {
  glows: GlowSpec[];
  art?: React.ReactNode;
  /** The art's contour centre in its own coordinates; a RingAnchor in the children sets where it goes. */
  artCentre?: { x: number; y: number };
  nav: React.ReactNode;
  children: React.ReactNode;
  tabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [ringY, setRingY] = useState<number | null>(null);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField glows={glows} />
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingTop: insets.top + 7,
            paddingHorizontal: 24,
            paddingBottom: screenBottomPadding(insets.bottom, tabBar),
          },
          contentStyle,
        ]}
      >
        {art && artCentre && ringY !== null ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: ringY - artCentre.y,
              left: width / 2 - artCentre.x,
            }}
          >
            {art}
          </View>
        ) : art && !artCentre ? (
          // Art is placed in the 375 frame, whose status bar is 44 high.
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: insets.top - 44, left: 0, right: 0 }}
          >
            {art}
          </View>
        ) : null}
        <RingCentre.Provider value={setRingY}>
          {nav}
          {children}
        </RingCentre.Provider>
      </ScrollView>
    </View>
  );
}

/** 1W · 1M · 3M · 1Y pills (03 §2.3): 35 high, lavender outline, the active one filled. */
export function PeriodPills({
  value,
  onChange,
  labels,
  style,
}: {
  value: ScorePeriod;
  onChange: (p: ScorePeriod) => void;
  labels: Record<ScorePeriod, string>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityRole="tablist" style={[{ flexDirection: 'row', gap: 8 }, style]}>
      {SCORE_PERIODS.map((p) => {
        const active = p === value;
        return (
          <Pressable
            key={p}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(p)}
            hitSlop={6}
            style={({ pressed }) => ({
              height: 35,
              paddingHorizontal: 16,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: palette.lavender,
              backgroundColor: active ? palette.lavender : 'transparent',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={[
                Type.bodySMedium,
                {
                  fontWeight: active ? '700' : '500',
                  color: active ? palette.white : palette.lavender,
                },
              ]}
            >
              {labels[p]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Delta pill ("+6 vs September"): lavender 15% fill, arrow and Bold 12 lavender. */
export function DeltaPill({
  delta,
  label,
  solid = false,
  withValue = true,
}: {
  delta: number;
  label: string;
  solid?: boolean;
  withValue?: boolean;
}) {
  const fg = solid ? palette.white : palette.lavender;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingVertical: solid ? 4 : 3,
        paddingLeft: solid ? 10 : 8,
        paddingRight: solid ? 12 : 10,
        borderRadius: 999,
        backgroundColor: solid ? palette.lavender : 'rgba(142,127,166,0.15)',
      }}
    >
      {delta !== 0 && <Icon name={delta > 0 ? 'arrow/up' : 'arrow/down'} size={14} color={fg} />}
      <Text style={[Type.labelM, { color: fg }]}>
        {delta !== 0 && withValue ? `${signed(delta)} ${label}` : label}
      </Text>
    </View>
  );
}

/** White pill chip with an icon (status chips, action chips, stats). */
export function PillChip({
  icon,
  label,
  onPress,
  outlined = false,
  height = 32,
  textSize = 12,
  iconSize = 16,
  iconColor,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  outlined?: boolean;
  height?: number;
  textSize?: number;
  iconSize?: number;
  iconColor?: string;
}) {
  const body = (
    <>
      <Icon name={icon} size={iconSize} color={iconColor ?? palette.plum} />
      <Text
        style={[
          Type.caption,
          {
            fontSize: textSize,
            lineHeight: textSize + 4,
            color: outlined ? palette.plum : palette.ink,
          },
        ]}
      >
        {label}
      </Text>
    </>
  );
  const style: ViewStyle = {
    height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: outlined ? 1 : 0,
    borderColor: 'rgba(107,82,121,0.40)',
  };
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={height < 44 ? (44 - height) / 2 : undefined}
      style={({ pressed }) => [style, { opacity: pressed ? 0.75 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

/** Date tile: "OCT" over the day (03 §2.2 pill 46×46, §2.3 tile 46×54 r16). */
export function DateTile({
  date,
  locale,
  tall = false,
}: {
  date: Date;
  locale: string;
  tall?: boolean;
}) {
  return (
    <View
      style={{
        width: 46,
        height: tall ? 54 : 46,
        borderRadius: tall ? 16 : 23,
        backgroundColor: '#F5F5F4',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          Type.micro,
          {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: tall ? '500' : '400',
            color: palette.textSubtle,
          },
        ]}
      >
        {date.toLocaleDateString(locale, { month: 'short' }).toUpperCase()}
      </Text>
      <Text
        style={[
          Type.bodyStrong,
          { fontSize: tall ? 18 : 16, lineHeight: tall ? 22 : 20, color: '#44403B' },
        ]}
      >
        {date.getDate()}
      </Text>
    </View>
  );
}

/** White r28 card. */
export function ScoreCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ backgroundColor: palette.white, borderRadius: 28, padding: 20 }, style]}>
      {children}
    </View>
  );
}

/** Period title ("October") and comparison ("vs September") for the summary and trend cards. */
export function usePeriodText(period: ScorePeriod, now: Date) {
  const { t, i18n } = useTranslation();
  const month = (offset: number) =>
    periodStart('1M', now, offset).toLocaleDateString(i18n.language, { month: 'long' });
  const title = {
    '1W': t('glowScore.period.thisWeek'),
    '1M': month(0),
    '3M': `${month(-2)} – ${month(0)}`,
    '1Y': String(now.getFullYear()),
  }[period];
  const versus = {
    '1W': t('glowScore.period.vsLastWeek'),
    '1M': t('glowScore.period.vs', { what: month(-1) }),
    '3M': t('glowScore.period.vsPrevious3'),
    '1Y': t('glowScore.period.vs', { what: now.getFullYear() - 1 }),
  }[period];
  const labels: Record<ScorePeriod, string> = { '1W': '1W', '1M': '1M', '3M': '3M', '1Y': '1Y' };
  return { title, versus, labels };
}

/** Plan category icons (03 §2.5). */
export const CATEGORY_ICON: Record<PlanCategory, IconName> = {
  mindfulness: 'line/meditate',
  physical: 'line/activity',
  social: 'line/users',
  professional: 'line/health',
};
