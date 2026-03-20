import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { create } from 'zustand';

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

/* ── Config per variant ──────────────────────────── */

const VARIANT_CONFIG: Record<
  ToastVariant,
  { bg: string; fg: string; icon: string; border: string }
> = {
  success: { bg: '#F0F9F4', fg: '#2D6A4F', icon: 'check-circle', border: '#C8E6D0' },
  error: { bg: '#FEF2F2', fg: '#B91C1C', icon: 'error', border: '#FECACA' },
  info: { bg: '#EFF6FF', fg: '#1D4ED8', icon: 'info', border: '#BFDBFE' },
  warning: { bg: '#FFFBEB', fg: '#B45309', icon: 'warning', border: '#FDE68A' },
};

/* ── Component ───────────────────────────────────── */

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const data = useToast((s) => s.toast);
  const hide = useToast((s) => s.hide);

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentId = useRef<string | null>(null);

  useEffect(() => {
    if (!data) return;

    // If same toast, skip
    if (currentId.current === data.id) return;
    currentId.current = data.id;

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        hide();
        currentId.current = null;
      });
    }, data.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data?.id]);

  if (!data) return null;

  const cfg = VARIANT_CONFIG[data.variant];

  return (
    <Animated.View
      style={[
        s.wrapper,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            hide();
            currentId.current = null;
          });
        }}
        style={[
          s.card,
          {
            backgroundColor: cfg.bg,
            borderColor: cfg.border,
          },
        ]}
      >
        <View style={[s.iconWrap, { backgroundColor: cfg.fg + '14' }]}>
          <MaterialIcons name={cfg.icon as any} size={18} color={cfg.fg} />
        </View>
        <Text style={[s.message, { color: cfg.fg }]} numberOfLines={2}>
          {data.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ── Styles ──────────────────────────────────────── */

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
});
