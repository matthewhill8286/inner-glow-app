import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { MOOD_SCALE, moodStep, scoreAtX, xForScore, type MoodScore } from '@/lib/mood-scale';

const TRACK_HEIGHT = 20;

/** Compact (04 §B2, Home and Write entry) and full (04 §B1, check-in) knob and glow styles. */
const SIZES = {
  compact: { knob: 28, knobFill: '#FAEDB8', glowW: 120, glowH: 70, glowBlur: 24, caption: { ...Type.micro } },
  full: { knob: 30, knobFill: palette.cream, glowW: 70, glowH: 70, glowBlur: 18, caption: { ...Type.caption, fontWeight: '500' as const, lineHeight: 17 } },
};

/**
 * Mood slider: spectrum track with five stops, a cream knob with a mood glow, and Tense /
 * Great captions. Snaps to the stops; `onChange` fires live, `onRelease` once per drag.
 */
export function MoodSlider({
  size = 'compact',
  value,
  onChange,
  onRelease,
  startLabel,
  endLabel,
  accessibilityLabel,
  style,
}: {
  size?: keyof typeof SIZES;
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
  const { knob: KNOB, knobFill, glowW, glowH, glowBlur, caption } = SIZES[size];
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
              width={glowW}
              height={glowH}
              blur={glowBlur}
              style={{ position: 'absolute', left: knobX - glowW / 2, top: (KNOB + 8) / 2 - glowH / 2 }}
            />
            {/* The knob overhangs the track ends (as in Figma), so the canvas is wider by half a knob each side. */}
            <Svg width={width + KNOB} height={KNOB + 8} pointerEvents="none" style={{ position: 'absolute', left: -KNOB / 2 }}>
              <Defs>
                <LinearGradient id="moodTrack" x1="0" y1="0" x2="1" y2="0">
                  {MOOD_SCALE.map((m) => (
                    <Stop key={m.score} offset={m.stop} stopColor={m.trackColor} stopOpacity={0.95} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect x={KNOB / 2} y={(KNOB + 8 - TRACK_HEIGHT) / 2} width={width} height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill="url(#moodTrack)" />
              {stops.map((x, i) => (
                <Circle key={i} cx={x + KNOB / 2} cy={(KNOB + 8) / 2} r={2} fill="#FFFFFF" fillOpacity={0.9} />
              ))}
              <Circle cx={knobX + KNOB / 2} cy={(KNOB + 8) / 2} r={KNOB / 2 - 1.25} fill={knobFill} stroke={palette.plum} strokeWidth={2.5} />
            </Svg>
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={[caption, { color: palette.textSubtle }]}>{startLabel}</Text>
        <Text style={[caption, { color: palette.textSubtle }]}>{endLabel}</Text>
      </View>
    </View>
  );
}
