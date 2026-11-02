import React, { useMemo, useRef } from 'react';
import { PanResponder, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import {
  dialPoint,
  minutesAt,
  mixColour,
  ringSegment,
  windowAllowed,
  windowMinutes,
  windowSegments,
} from '@/lib/sleep-flow';

const R_OUTER = 104;
const R_INNER = 89.44;
const R_MID = (R_OUTER + R_INNER) / 2;
const HANDLE = 30;
const SIZE = R_OUTER * 2 + HANDLE;
const C = SIZE / 2;

/**
 * 24-hour sleep window dial (06 §4.2): a lavender-to-mustard window on a faint ring, a moon handle
 * at bedtime and a star handle at wake. Drag a handle to move that end, or the band to move both,
 * in five-minute steps with a tick each hour. The window stays between 3 and 12 hours.
 */
export function SleepDial({
  bed,
  wake,
  onChange,
  centreLabel,
  centreSub,
  accessibilityLabel,
  onDragging,
}: {
  bed: number;
  wake: number;
  onChange: (bed: number, wake: number) => void;
  centreLabel: string;
  centreSub: string;
  accessibilityLabel: string;
  /** True while a handle or the band is held, so a parent scroll view can stop scrolling. */
  onDragging?: (dragging: boolean) => void;
}) {
  const state = useRef({ bed, wake, mode: null as null | 'bed' | 'wake' | 'both', grab: 0 });
  state.current.bed = bed;
  state.current.wake = wake;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const draggingRef = useRef(onDragging);
  draggingRef.current = onDragging;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const r = Math.hypot(x - C, y - C);
          if (r < R_INNER - 22 || r > R_OUTER + 22) return false;
          const s = state.current;
          const dist = (m: number) => {
            const p = dialPoint(m, R_MID, C, C);
            return Math.hypot(p.x - x, p.y - y);
          };
          const touch = minutesAt(x - C, y - C, 1);
          if (dist(s.bed) < 28) s.mode = 'bed';
          else if (dist(s.wake) < 28) s.mode = 'wake';
          else if (windowMinutes(s.bed, touch) < windowMinutes(s.bed, s.wake)) {
            s.mode = 'both';
            s.grab = touch;
          } else return false;
          draggingRef.current?.(true);
          return true;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (e) => {
          const s = state.current;
          const m = minutesAt(e.nativeEvent.locationX - C, e.nativeEvent.locationY - C);
          let nextBed = s.bed;
          let nextWake = s.wake;
          if (s.mode === 'bed') nextBed = m;
          else if (s.mode === 'wake') nextWake = m;
          else if (s.mode === 'both') {
            const shift = ((m - s.grab + 2160) % 1440) - 720;
            if (!shift) return;
            nextBed = (s.bed + shift + 1440) % 1440;
            nextWake = (s.wake + shift + 1440) % 1440;
            s.grab = m;
          }
          if ((nextBed === s.bed && nextWake === s.wake) || !windowAllowed(nextBed, nextWake)) return;
          const crossed = (a: number, b: number) => Math.floor(a / 60) !== Math.floor(b / 60);
          if (crossed(s.bed, nextBed) || crossed(s.wake, nextWake)) void Haptics.selectionAsync();
          s.bed = nextBed;
          s.wake = nextWake;
          onChangeRef.current(nextBed, nextWake);
        },
        onPanResponderRelease: () => {
          state.current.mode = null;
          draggingRef.current?.(false);
        },
        onPanResponderTerminate: () => {
          state.current.mode = null;
          draggingRef.current?.(false);
        },
      }),
    [],
  );

  const segments = windowSegments(bed, wake);
  const bedP = dialPoint(bed, R_MID, C, C);
  const wakeP = dialPoint(wake, R_MID, C, C);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}
      {...responder.panHandlers}
    >
      <Glow color={palette.lavenderSoft} opacity={0.4} width={250} blur={50} style={{ position: 'absolute', left: C - 125, top: C - 125 }} />
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Path
          d={`M${C},${C - R_OUTER} A${R_OUTER},${R_OUTER} 0 1 1 ${C - 0.01},${C - R_OUTER} Z M${C},${C - R_INNER} A${R_INNER},${R_INNER} 0 1 0 ${C + 0.01},${C - R_INNER} Z`}
          fill={palette.plum}
          fillOpacity={0.1}
          fillRule="evenodd"
        />
        {segments.map((s, i) => (
          <Path key={i} d={ringSegment(s.from, s.to, R_OUTER, R_INNER, C, C)} fill={mixColour(palette.lavender, palette.mustard, s.t)} />
        ))}
        <Circle cx={bedP.x} cy={bedP.y} r={HANDLE / 2 - 1} fill={palette.white} stroke={palette.plum} strokeWidth={2} />
        <Circle cx={wakeP.x} cy={wakeP.y} r={HANDLE / 2 - 1} fill={palette.white} stroke="#C9A92A" strokeWidth={2} />
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: bedP.x - 8, top: bedP.y - 8 }}>
        <Icon name="line/moon" size={16} color={palette.plum} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: wakeP.x - 8, top: wakeP.y - 8 }}>
        <Icon name="line/star" size={16} color="#C9A92A" />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[Type.titleXl, { lineHeight: 42, color: palette.ink, letterSpacing: 0 }]}>{centreLabel}</Text>
        <Text style={[Type.chip, { color: palette.textMuted }]}>{centreSub}</Text>
      </View>
    </View>
  );
}
