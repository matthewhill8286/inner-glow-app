import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { SegmentedControl } from '@/components/ui/controls';

/* ── Age wheel (A3 `4002:14633`) ───────────────────────────────────────────────────────── */

export const AGE_MIN = 13;
export const AGE_MAX = 100;
const AGE_ROW = 84;
const AGE_VISIBLE = 5;

/** One number on the wheel: 128 SemiBold at the centre, 64 then 30 (scale) at @0.30 further out. */
function AgeRow({ age, index, scrollY }: { age: number; index: number; scrollY: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const offset = index - scrollY.value / AGE_ROW;
    const distance = Math.abs(offset);
    return {
      opacity: interpolate(distance, [0, 1, 2, 3], [1, 0.3, 0.3, 0]),
      transform: [
        // Rows are 84 apart; Figma puts the neighbours at ±126 and ±191, so push them out.
        { translateY: interpolate(offset, [-3, -2, -1, 0, 1, 2, 3], [-23, -23, -42, 0, 42, 23, 23]) },
        { scale: interpolate(distance, [0, 1, 2], [1, 0.5, 0.234], 'clamp') },
      ],
    };
  });
  return (
    <Animated.View style={[{ height: AGE_ROW }, style]}>
      {/* The 128pt digits are taller than the row, so they sit in their own box centred on it. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: (AGE_ROW - 160) / 2, height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Text allowFontScaling={false} style={{ ...Type.display, fontSize: 128, lineHeight: 160, letterSpacing: -3.2, color: palette.plum }}>
          {age}
        </Text>
      </View>
    </Animated.View>
  );
}

/** Vertical snapping wheel. Calls `onChange` when a scroll settles on a new age. */
export function AgeWheel({ value, onChange, accessibilityLabel }: { value: number; onChange: (age: number) => void; accessibilityLabel: string }) {
  const ages = useMemo(() => Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i), []);
  const initial = (Math.min(AGE_MAX, Math.max(AGE_MIN, value)) - AGE_MIN) * AGE_ROW;
  const scrollY = useSharedValue(initial);
  const last = useRef(value);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const placed = useRef(false);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const age = AGE_MIN + Math.round(e.nativeEvent.contentOffset.y / AGE_ROW);
    const clamped = Math.min(AGE_MAX, Math.max(AGE_MIN, age));
    if (clamped !== last.current) {
      last.current = clamped;
      onChange(clamped);
      void Haptics.selectionAsync();
    }
  };
  return (
    <View
      style={{ height: AGE_ROW * AGE_VISIBLE, alignSelf: 'center', width: 256 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: AGE_MIN, max: AGE_MAX, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.min(AGE_MAX, Math.max(AGE_MIN, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
    >
      <Animated.ScrollView
        ref={scrollRef}
        // `contentOffset` alone lands a row short on iOS, so place the wheel once the content is laid out.
        onContentSizeChange={() => {
          if (placed.current) return;
          placed.current = true;
          scrollRef.current?.scrollTo({ y: initial, animated: false });
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={AGE_ROW}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: initial }}
        contentContainerStyle={{ paddingVertical: AGE_ROW * 2 }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(e) => {
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e);
        }}
      >
        {ages.map((age, i) => (
          <AgeRow key={age} age={age} index={i} scrollY={scrollY} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

/* ── Weight ruler (A4 `4002:14647`) ─────────────────────────────────────────────────────── */

export type WeightUnit = 'kg' | 'lbs';
const TICK = 16; // pitch between ticks
const PER_UNIT = 5; // ticks per kg or lb, so one unit is 80pt
const UNIT_PX = TICK * PER_UNIT;
const RANGE: Record<WeightUnit, [number, number]> = { kg: [30, 250], lbs: [66, 550] };
const RULER_H = 118;

/** One kilogram or pound of ruler: the major tick and its number, then four minor ticks. */
const RulerUnit = React.memo(function RulerUnit({ label, current }: { label: number; current: boolean }) {
  return (
    <View style={{ width: UNIT_PX, height: RULER_H }}>
      <View style={{ position: 'absolute', left: 0, top: 38, width: 8, height: 42, borderRadius: 4, backgroundColor: palette.borderStrong }} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ position: 'absolute', left: i * TICK + 2, top: 47, width: 4, height: 24, borderRadius: 2, backgroundColor: palette.borderLilac }} />
      ))}
      <Text allowFontScaling={false} style={[Type.buttonL, { position: 'absolute', top: 99, left: -16, width: 40, textAlign: 'center', color: current ? palette.plumDeep : palette.borderStrong }]}>
        {label}
      </Text>
    </View>
  );
});

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return Math.round(to === 'lbs' ? value * 2.20462 : value / 2.20462);
}

/**
 * Unit tabs, the 96pt value with its unit, and a horizontal ruler: minor ticks 24 high 4 wide `#E6E0EA`,
 * every fifth tick a 42 high 8 wide `#CFC6D6` major with its number under it, and a fixed 12×118
 * lavender indicator with a plum ring in the centre. The ruler snaps to whole kilograms or pounds.
 */
export function WeightPicker({
  value,
  unit,
  onChange,
  labels,
}: {
  value: number;
  unit: WeightUnit;
  onChange: (value: number, unit: WeightUnit) => void;
  labels: { kg: string; lbs: string; a11y: string };
}) {
  const [min, max] = RANGE[unit];
  const [width, setWidth] = useState(0);
  const [live, setLive] = useState(value);
  const listRef = useRef<FlatList<number>>(null);
  const half = width / 2;
  const values = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [min, max]);

  useEffect(() => {
    setLive(value);
    if (width) listRef.current?.scrollToOffset({ offset: (value - min) * UNIT_PX, animated: false });
    // Re-centre when the unit or the measured width changes, not on every value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, width]);

  const valueAt = (x: number) => Math.min(max, Math.max(min, min + Math.round(x / UNIT_PX)));
  // The last scroll event can be a unit away from where the snap lands, so settle both values here.
  const settle = (x: number) => {
    const next = valueAt(x);
    setLive(next);
    onChange(next, unit);
  };

  return (
    <View style={{ gap: 64 }}>
      <SegmentedControl
        options={[{ value: 'kg', label: labels.kg }, { value: 'lbs', label: labels.lbs }]}
        value={unit}
        onChange={(next) => onChange(Math.min(RANGE[next][1], Math.max(RANGE[next][0], convertWeight(live, unit, next))), next)}
      />
      <View style={{ gap: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }} accessible accessibilityLabel={`${labels.a11y}, ${live} ${unit}`}>
          <Text allowFontScaling={false} style={{ ...Type.display, fontSize: 96, lineHeight: 115, color: palette.plumDeep }}>{live}</Text>
          <Text allowFontScaling={false} style={{ ...Type.display, fontSize: 32, lineHeight: 49, color: palette.textMuted, marginBottom: 12 }}>{labels[unit]}</Text>
        </View>
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          style={{ height: RULER_H, marginHorizontal: -16 }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={labels.a11y}
          accessibilityValue={{ min, max, now: live, text: `${live} ${unit}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            const next = Math.min(max, Math.max(min, live + (e.nativeEvent.actionName === 'increment' ? 1 : -1)));
            setLive(next);
            onChange(next, unit);
            listRef.current?.scrollToOffset({ offset: (next - min) * UNIT_PX, animated: true });
          }}
        >
          {width > 0 && (
            <FlatList
              ref={listRef}
              horizontal
              data={values}
              keyExtractor={(v) => String(v)}
              renderItem={({ item }) => <RulerUnit label={item} current={item === live} />}
              extraData={live}
              getItemLayout={(_, index) => ({ length: UNIT_PX, offset: UNIT_PX * index, index })}
              initialScrollIndex={Math.min(max, Math.max(min, value)) - min}
              initialNumToRender={12}
              windowSize={5}
              showsHorizontalScrollIndicator={false}
              snapToInterval={UNIT_PX}
              decelerationRate="fast"
              // The major tick is 8 wide at the start of each unit, so its centre sits 4 in.
              contentContainerStyle={{ paddingLeft: half - 4, paddingRight: half - UNIT_PX + 4 }}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const next = valueAt(e.nativeEvent.contentOffset.x);
                if (next !== live) {
                  setLive(next);
                  void Haptics.selectionAsync();
                }
              }}
              onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.x)}
              onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.x)}
            />
          )}
          <View pointerEvents="none" style={{ position: 'absolute', left: half - 6, top: 0, width: 12, height: RULER_H, borderRadius: 6, backgroundColor: palette.lavender, boxShadow: '0px 0px 0px 4px rgba(107,82,121,0.30)' }} />
        </View>
      </View>
    </View>
  );
}
