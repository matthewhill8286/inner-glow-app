import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { MOOD_SCALE, moodStep, scoreAtX, xForScore, type MoodScore } from '@/lib/mood-scale';

const TRACK_HEIGHT = 20;
const KNOB = 28;

/**
 * Compact mood slider (04 §B2): spectrum track with five stops, a cream knob with a mood glow,
 * and Tense / Great captions. Snaps to the stops; `onChange` fires live, `onRelease` once per drag.
 */
export function MoodSlider({
  value,
  onChange,
  onRelease,
  startLabel,
  endLabel,
  accessibilityLabel,
  style,
}: {
  value: MoodScore;
  onChange: (score: MoodScore) => void;
  onRelease?: (score: MoodScore) => void;
  startLabel: string;
  endLabel: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  // The responder is created once, so it reads the latest props and size through refs.
  const latest = useRef({ value, width, onChange, onRelease });
  latest.current = { value, width, onChange, onRelease };

  const responder = useMemo(() => {
    const move = (x: number) => {
      const { width: w, value: v, onChange: change } = latest.current;
      if (!w) return v;
      const next = scoreAtX(x, w);
      if (next !== v) {
        change(next);
        void Haptics.selectionAsync();
      }
      return next;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => move(e.nativeEvent.locationX),
      onPanResponderMove: (e) => move(e.nativeEvent.locationX),
      onPanResponderRelease: (e) => latest.current.onRelease?.(move(e.nativeEvent.locationX)),
    });
  }, []);

  const step = moodStep(value);
  const knobX = width ? xForScore(value, width) : 0;
  const stops = width ? MOOD_SCALE.map((m) => xForScore(m.score, width)) : [];

  return (
    <View style={style}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: KNOB + 8, justifyContent: 'center' }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 1, max: 5, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = (Math.min(5, Math.max(1, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))) as MoodScore;
          if (next !== value) {
            onChange(next);
            onRelease?.(next);
          }
        }}
        {...responder.panHandlers}
      >
        {width > 0 && (
          <>
            <Glow
              color={step.color}
              opacity={0.5}
              width={120}
              height={70}
              blur={24}
              style={{ position: 'absolute', left: knobX - 60, top: (KNOB + 8) / 2 - 35 }}
            />
            <Svg width={width} height={KNOB + 8} pointerEvents="none">
              <Defs>
                <LinearGradient id="moodTrack" x1="0" y1="0" x2="1" y2="0">
                  {MOOD_SCALE.map((m) => (
                    <Stop key={m.score} offset={m.stop} stopColor={m.trackColor} stopOpacity={0.95} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect x={0} y={(KNOB + 8 - TRACK_HEIGHT) / 2} width={width} height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill="url(#moodTrack)" />
              {stops.map((x, i) => (
                <Circle key={i} cx={x} cy={(KNOB + 8) / 2} r={2} fill="#FFFFFF" fillOpacity={0.9} />
              ))}
              <Circle cx={knobX} cy={(KNOB + 8) / 2} r={KNOB / 2 - 1.25} fill="#FAEDB8" stroke={palette.plum} strokeWidth={2.5} />
            </Svg>
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={[Type.micro, { color: palette.textSubtle }]}>{startLabel}</Text>
        <Text style={[Type.micro, { color: palette.textSubtle }]}>{endLabel}</Text>
      </View>
    </View>
  );
}
