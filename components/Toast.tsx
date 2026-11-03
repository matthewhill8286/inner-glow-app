import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { create } from 'zustand';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';

/* ── Types ───────────────────────────────────────── */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

/* ── Store ───────────────────────────────────────── */

interface ToastStore {
  toast: ToastData | null;
  show: (message: string, variant?: ToastVariant, duration?: number) => void;
  hide: () => void;
}

export const useToast = create<ToastStore>()((set) => ({
  toast: null,
  show: (message, variant = 'success', duration = 2400) => {
    set({
      toast: {
        id: `t_${Date.now()}`,
        message,
        variant,
        duration,
      },
    });
  },
  hide: () => set({ toast: null }),
}));

/* ── Convenience callers (import-and-call anywhere) ── */

export const toast = {
  success: (msg: string, ms?: number) => useToast.getState().show(msg, 'success', ms),
  error: (msg: string, ms?: number) => useToast.getState().show(msg, 'error', ms ?? 3500),
  info: (msg: string, ms?: number) => useToast.getState().show(msg, 'info', ms),
  warning: (msg: string, ms?: number) => useToast.getState().show(msg, 'warning', ms ?? 3000),
};

/* ── Look ────────────────────────────────────────── */

/**
 * Toast (`6839:8191` "Feedback sent", `6787:6370` "Saved to favourites"): an ink `#241A2E` pill with a
 * white 16 line icon, 10 gap and Medium 14 white text, padding 12–14/16. Short messages are a pill;
 * longer ones wrap to two lines on a radius 20 card. It sits centred near the bottom, above the tab
 * bar. The variant only changes the icon, and its colour for errors and warnings, so every toast
 * stays one calm design.
 */
const ICON_COLOR: Record<ToastVariant, string> = {
  success: palette.white,
  info: palette.white,
  warning: palette.mustard,
  error: palette.rose,
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const color = ICON_COLOR[variant];
  const line = {
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={16} height={16} viewBox="0 0 18 18">
      {variant === 'success' ? (
        <Path d="M3.5 9.5 7 13l7.5-8" {...line} />
      ) : (
        <>
          <Circle cx={9} cy={9} r={7.2} {...line} />
          {variant === 'info' ? (
            <>
              <Path d="M9 8.2v4.3" {...line} />
              <Circle cx={9} cy={5.6} r={0.9} fill={color} />
            </>
          ) : (
            <>
              <Path d="M9 5.2v4.4" {...line} />
              <Circle cx={9} cy={12.4} r={0.9} fill={color} />
            </>
          )}
        </>
      )}
    </Svg>
  );
}

/** Messages up to this length fit on one line, so they get the pill shape. */
const PILL_CHARS = 34;
const HIDDEN_Y = 24;

/* ── Component ───────────────────────────────────── */

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const data = useToast((s) => s.toast);
  const hide = useToast((s) => s.hide);

  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentId = useRef<string | null>(null);

  const dismiss = (duration = 220) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: HIDDEN_Y, duration, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true }),
    ]).start(() => {
      hide();
      currentId.current = null;
    });
  };

  useEffect(() => {
    if (!data || currentId.current === data.id) return;
    currentId.current = data.id;
    if (timerRef.current) clearTimeout(timerRef.current);
    translateY.setValue(HIDDEN_Y);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 90, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => dismiss(), data.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (!data) return null;
  const pill = data.message.length <= PILL_CHARS;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        // Above the tab bar and the home indicator, where the frames place it.
        bottom: insets.bottom + 96,
        zIndex: 9999,
        alignItems: 'center',
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={data.message}
        accessibilityHint="Double tap to dismiss"
        onPress={() => dismiss(160)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          maxWidth: '100%',
          paddingVertical: pill ? 12 : 14,
          paddingHorizontal: 16,
          borderRadius: pill ? 999 : 20,
          backgroundColor: palette.ink,
          boxShadow: '0px 8px 24px rgba(36,26,46,0.18)',
        }}
      >
        <ToastIcon variant={data.variant} />
        <Text
          numberOfLines={2}
          style={[Type.bodySMedium, { flexShrink: 1, lineHeight: 18, color: palette.white }]}
        >
          {data.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
