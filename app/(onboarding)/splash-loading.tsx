import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Stage = 'splash' | 'quote' | 'loading';

export default function SplashLoading() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<Stage>('splash');
  const [pct, setPct] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;

  // 0..1 progress
  const progress = useRef(new Animated.Value(0)).current;

  // Used to allow the final snap to 100% after a minimum time
  const [readyToFinish, setReadyToFinish] = useState(false);

  const bg = useMemo(() => {
    if (stage === 'splash') return COLORS.splash;
    if (stage === 'quote') return COLORS.quote;
    return COLORS.loading;
  }, [stage]);

  // Stage sequencing (splash -> quote -> loading)
  useEffect(() => {
    const a = setTimeout(() => transitionTo('quote'), 1100);
    const b = setTimeout(() => transitionTo('loading'), 1100 + 2200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native-like loading: jump to ~92, creep to 97, then finish to 100
  useEffect(() => {
    if (stage !== 'loading') return;

    setPct(0);
    setReadyToFinish(false);
    progress.stopAnimation();
    progress.setValue(0);

    // Listener updates pct (0..99 while animating, will snap to 100 at finish)
    const sub = progress.addListener(({ value }) => {
      // Show 0..99 during animation; we’ll set 100 explicitly at the end.
      const shown = Math.min(99, Math.max(0, Math.round(value * 99)));
      setPct(shown);
    });

    // 1) Fast ramp to 92%
    const fastTo92 = Animated.timing(progress, {
      toValue: 0.92,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    // 2) Slow creep to 97% (the “native hang”)
    const creepTo97 = Animated.timing(progress, {
      toValue: 0.97,
      duration: 1800,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });

    // 3) Wait a minimum time before allowing finish
    const minWait = setTimeout(() => setReadyToFinish(true), 2200);

    // Start phases 1 & 2
    Animated.sequence([fastTo92, creepTo97]).start();

    return () => {
      clearTimeout(minWait);
      progress.removeListener(sub);
    };
  }, [stage, progress]);

  // Finish when “readyToFinish” becomes true
  useEffect(() => {
    if (stage !== 'loading') return;
    if (!readyToFinish) return;

    // 4) Final snap to 100% (short and satisfying)
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      setPct(100);

      // Go to Welcome Slides or Sign In
      AsyncStorage.getItem('onboarding:seen:v1').then((seen) => {
        if (!seen) {
          router.replace('/(onboarding)/welcome');
        } else {
          router.replace('/index' as any); // Let index handle the routing gate
        }
      });
    });
  }, [readyToFinish, router, stage, progress]);

  function transitionTo(next: Stage) {
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setStage(next);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: bg, paddingTop: insets.top }]}>
      {/* Grain overlay (subtle) */}
      <GrainOverlay />

      <Animated.View style={[styles.content, { opacity: fade }]}>
        {stage === 'splash' ? <SplashStage /> : null}
        {stage === 'quote' ? <QuoteStage /> : null}
        {stage === 'loading' ? <LoadingStage pct={pct} /> : null}
      </Animated.View>
    </View>
  );
}

function SplashStage() {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <Text style={styles.logo}>{t('splash.logo')}</Text>
    </View>
  );
}

function QuoteStage() {
  const { t } = useTranslation();
  return (
    <View style={[styles.center, { paddingHorizontal: 28, alignItems: 'center' }]}>
      <Text style={styles.quote}>{t('splash.quote')}</Text>
      <Text style={styles.quoteAuthor}>{t('splash.quoteAuthor')}</Text>
    </View>
  );
}

function LoadingStage({ pct }: { pct: number }) {
  return (
    <View style={styles.center}>
      <Text style={styles.loadingPct}>{pct}%</Text>
    </View>
  );
}

/**
 * Grain overlay:
 * Uses a tiny base64 PNG noise tile and repeats it.
 * - iOS supports resizeMode="repeat"
 * - Android support varies; we also keep it subtle so it won’t look “broken” if it falls back.
 * If repeat doesn’t work on your Android target, tell me and I’ll swap to an SVG-dot approach.
 */
function GrainOverlay() {
  return (
    <Image
      source={{ uri: NOISE_TILE }}
      style={styles.grain}
      resizeMode={Platform.OS === 'ios' ? 'repeat' : 'cover'}
    />
  );
}

const COLORS = {
  splash: '#F6F4F2', // off-white
  quote: '#7C8063', // olive/green
  loading: '#9A7A4D', // warm brown
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#141414',
  },

  quote: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  quoteAuthor: {
    marginTop: 18,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)',
  },

  loadingPct: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
  },

  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08, // subtle grain
  },
});

// Tiny noise tile (data URI). Small + subtle.
// If you want a different grain “feel”, I can generate a stronger/weaker tile.
const NOISE_TILE =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAw0lEQVR42u2YwQ3CMAxFv5bA' +
  'Cq2QGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQ' +
  'GmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGm' +
  'QGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQG' +
  'mQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQG' +
  'mQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQG' +
  'mQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQG' +
  'mQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQG' +
  'mQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQG' +
  'mQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGmQGgY3yQx2H0jNAAAAAElFTkSuQmCC';
