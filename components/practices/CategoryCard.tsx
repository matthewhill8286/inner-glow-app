import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import BreathingMotif from '@/assets/svg/illustrations/practices/breathing-motif.svg';
import RelaxMotif from '@/assets/svg/illustrations/practices/relax-motif.svg';
import MindfulnessMotif from '@/assets/svg/illustrations/practices/mindfulness-motif.svg';
import SleepMoon from '@/assets/svg/illustrations/practices/sleep-moon.svg';

export type Kind = 'breathing' | 'relax' | 'mindfulness' | 'sleep';

/** Card tint and glow per category (07 §2.1, Figma `6757:10112`). */
const LOOK: Record<Kind, { bg: string; glow: string; glowOpacity: number }> = {
  breathing: { bg: '#E6F2FB', glow: palette.sky, glowOpacity: 0.55 },
  relax: { bg: '#FAF3D6', glow: palette.mustard, glowOpacity: 0.55 },
  mindfulness: { bg: '#FDEDF0', glow: palette.rose, glowOpacity: 0.55 },
  sleep: { bg: '#EFE8F4', glow: palette.lavenderSoft, glowOpacity: 0.7 },
};

/** The motif in the top of each card, placed as in the 166.5 × 140 Figma card. */
function Motif({ kind }: { kind: Kind }) {
  if (kind === 'breathing')
    return (
      <>
        <BreathingMotif width={140.7} height={69.9} style={{ position: 'absolute', left: '50%', marginLeft: -70.35, top: 13.5 }} />
        <Glow color="#F2D96A" opacity={0.95} width={13} blur={3} style={{ position: 'absolute', left: '50%', marginLeft: -6.5, top: 42 }} />
      </>
    );
  if (kind === 'relax') return <RelaxMotif width={134.7} height={50.3} style={{ position: 'absolute', left: '50%', marginLeft: -67.35, top: 23.3 }} />;
  if (kind === 'mindfulness')
    return (
      <>
        <MindfulnessMotif width={150.8} height={70} style={{ position: 'absolute', left: '50%', marginLeft: -75.4, top: 13.5 }} />
        <Glow color={palette.mustard} opacity={0.95} width={14} blur={3} style={{ position: 'absolute', left: '50%', marginLeft: -7, top: 41.7 }} />
      </>
    );
  return (
    <>
      <SleepMoon width={50.5} height={50.5} style={{ position: 'absolute', left: '50%', marginLeft: -25.25, top: 23.2 }} />
      <View style={{ position: 'absolute', left: 16, right: 16, top: 74.5, height: 1, backgroundColor: palette.plum, opacity: 0.3 }} />
    </>
  );
}

/**
 * Practice category card (Practices hub `6757:10112`, Home "For you today"): the category's tint
 * with a large soft glow, its motif, the play badge, then the title and meta at the bottom.
 */
export function CategoryCard({ kind, title, meta, onPress }: { kind: Kind; title: string; meta: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${meta}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 140,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: LOOK[kind].bg,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Glow color={LOOK[kind].glow} opacity={LOOK[kind].glowOpacity} width={196} blur={24} style={{ position: 'absolute', left: -14.75, top: -49.5 }} />
      <Motif kind={kind} />
      <View
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: palette.plum,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="line/play" size={12} color={palette.white} />
      </View>
      <View style={{ position: 'absolute', left: 16, right: 12, top: 93, gap: 2 }}>
        <Text numberOfLines={1} style={[Type.bodyMSemi, { lineHeight: 18, color: palette.ink }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[Type.micro, { fontWeight: '400', color: palette.textSubtle }]}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}
