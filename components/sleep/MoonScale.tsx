import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { palette } from '@/constants/theme';

/** Moon centres on the arc in the 375 frame, with the arc's top at y 0 (06 §4.3, minus 200). */
const CENTRES: [number, number][] = [
  [57.5, 130],
  [95.6, 61.1],
  [187.5, 32.5],
  [279.4, 61.1],
  [317.5, 130],
];
/** Unselected moons fill as the score rises: opacity and how far the cutter sits from the disc. */
const LOOK = [
  { opacity: 0.35, cutX: 11.5 },
  { opacity: 0.45, cutX: 15.8 },
  { opacity: 0.55, cutX: 20.2 },
  { opacity: 0.65, cutX: 24.5 },
  { opacity: 0.75, cutX: 28.8 },
];

function MoonGlyph({ index, selected }: { index: number; selected: boolean }) {
  const size = selected ? 56 : 36;
  const r = selected ? 16.8 : 10.8;
  const cut = selected ? { x: 38.1 + r, y: 6.7 + r } : { x: LOOK[index].cutX + r, y: 4.3 + r };
  const id = `moonCut${index}${selected ? 's' : ''}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <Mask id={id}>
          <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
          <Circle cx={cut.x} cy={cut.y} r={r} fill="#000000" />
        </Mask>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 0.75}
        fill={selected ? palette.cream : palette.white}
        stroke={selected ? palette.plum : palette.borderLilac}
        strokeWidth={selected ? 1.5 : 1}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill={selected ? palette.gold : palette.lavender}
        fillOpacity={selected ? 1 : LOOK[index].opacity}
        mask={`url(#${id})`}
      />
    </Svg>
  );
}

/**
 * Moon quality scale (06 §4.3): five moons on an arc for sleep quality 1–5. The tapped moon grows
 * to the 56 selected look around the same centre.
 */
export function MoonScale({
  value,
  onChange,
  labels,
}: {
  value: number | null;
  onChange: (v: number) => void;
  labels: string[];
}) {
  const { width } = useWindowDimensions();
  const sx = width / 375;
  return (
    <View accessibilityRole="radiogroup" style={{ height: 160, marginHorizontal: -24 }}>
      {CENTRES.map(([cx, cy], i) => {
        const selected = value === i + 1;
        const size = selected ? 56 : 36;
        return (
          <Pressable
            key={i}
            accessibilityRole="radio"
            accessibilityLabel={labels[i]}
            accessibilityState={{ selected }}
            onPress={() => onChange(i + 1)}
            hitSlop={selected ? 0 : 10}
            style={{ position: 'absolute', left: cx * sx - size / 2, top: cy - size / 2 }}
          >
            <MoonGlyph index={i} selected={selected} />
          </Pressable>
        );
      })}
    </View>
  );
}
