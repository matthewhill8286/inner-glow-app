import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Radio } from '@/components/ui/controls';
import { Glow } from '@/components/glow/Glow';
import MaleAura from '@/assets/svg/illustrations/assessment/gender-male-aura.svg';
import FemaleAura from '@/assets/svg/illustrations/assessment/gender-female-aura.svg';

/** Unselected rows and cards carry this shadow (0 8 16 ink @0.10); selected ones a 1.5 plum stroke instead. */
const ROW_SHADOW = '0px 8px 16px 0px rgba(36,26,46,0.10)';
/** Selected cards and inputs get a 4pt plum ring (@0.30). */
export const FOCUS_RING = '0px 0px 0px 4px rgba(107,82,121,0.30)';

/**
 * Pill option row (A1 `4002:14608`, A9 `4002:14839`): 56 high, padding 16, label left and a radio right.
 * A1 labels are SemiBold 16, A9 Medium 16; plum-deep by default, ink when selected.
 */
export function OptionRow({
  label,
  selected,
  onPress,
  weight = 'semibold',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  weight?: 'semibold' | 'medium';
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: selected ? palette.selected : palette.surface,
        borderWidth: 1.5,
        borderColor: selected ? palette.plum : 'transparent',
        boxShadow: selected ? undefined : ROW_SHADOW,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={[weight === 'semibold' ? Type.buttonL : { ...Type.buttonL, fontWeight: '500' }, { flex: 1, color: selected ? palette.ink : palette.plumDeep }]}>{label}</Text>
      <Radio selected={selected} />
    </Pressable>
  );
}

/**
 * Yes / No pair (A6 `4002:14729`): two equal 56-high cards, radius 20, padding 0/16/0/20, gap 12.
 * Selected `#F1ECF5` + 1.5 plum with a plum label; default white + 1px `#E6E0EA` with an ink label.
 */
export function PairOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 56,
        borderRadius: 20,
        paddingLeft: 20,
        paddingRight: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: selected ? palette.selected : palette.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? palette.plum : palette.borderLilac,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={[Type.buttonL, { fontWeight: '500', flex: 1, color: selected ? palette.plum : palette.ink }]}>{label}</Text>
      <Radio selected={selected} />
    </Pressable>
  );
}

/**
 * Distress card (A7 `4002:14813`): radius 32, padding 16, a 48 `#F7F4F2` icon well, title SemiBold 18
 * and body Medium 16 (gap 4), radio on the right. Default white with plum-deep / muted text;
 * selected `#F1ECF5` + 1.5 plum with ink text.
 */
export function DistressCard({
  icon,
  title,
  body,
  selected,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 32,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: selected ? palette.selected : palette.surface,
        borderWidth: 1.5,
        borderColor: selected ? palette.plum : 'transparent',
        boxShadow: selected ? undefined : ROW_SHADOW,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={24} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={[Type.headline, { letterSpacing: 0, color: selected ? palette.ink : palette.plumDeep }]}>{title}</Text>
          <Text style={[Type.bodyLg, { lineHeight: 19, letterSpacing: 0, color: selected ? palette.ink : palette.textMuted }]}>{body}</Text>
        </View>
      </View>
      <Radio selected={selected} />
    </Pressable>
  );
}

/** Per-card art for A2 (glow positions are relative to the 343×152 card). */
const GENDER_ART = {
  male: {
    Aura: MaleAura,
    glows: [
      { color: palette.sky, opacity: 0.18, x: 171.1, y: 7, size: 170, blur: 36 },
      { color: palette.mustard, opacity: 0.28, x: 238.5, y: 31.8, size: 90, blur: 24 },
    ],
  },
  female: {
    Aura: FemaleAura,
    glows: [
      { color: palette.rose, opacity: 0.22, x: 171.1, y: 7, size: 170, blur: 36 },
      { color: palette.lavenderSoft, opacity: 0.25, x: 178.7, y: 26.8, size: 100, blur: 26 },
    ],
  },
} as const;

/**
 * Gender card (A2 `4002:14621`): 343×152, radius 32, padding 16, label SemiBold 16 ink at the top left,
 * aura art clipped to the card. Selected: 1px plum stroke and the 4pt plum ring; default: the row shadow.
 */
export function GenderCard({
  kind,
  label,
  selected,
  onPress,
  style,
}: {
  kind: 'male' | 'female';
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const art = GENDER_ART[kind];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: 152,
          borderRadius: 32,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: selected ? palette.plum : 'transparent',
          boxShadow: selected ? FOCUS_RING : ROW_SHADOW,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, borderRadius: 31, overflow: 'hidden', padding: 16 }} pointerEvents="none">
        {art.glows.map((g, i) => (
          <Glow key={i} color={g.color} opacity={g.opacity} width={g.size} blur={g.blur} style={{ position: 'absolute', left: g.x, top: g.y }} />
        ))}
        <art.Aura width={327} height={136} style={{ position: 'absolute', left: 16, top: 16 }} />
        <Glow color={palette.gold} opacity={1} width={20} blur={6} style={{ position: 'absolute', left: 246.1, top: 82 }} />
        <Text style={[Type.buttonL, { color: palette.ink }]}>{label}</Text>
      </View>
    </Pressable>
  );
}
