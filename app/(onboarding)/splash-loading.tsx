import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { LogoMark } from '@/components/brand/LogoMark';
import { DesignFrame, GradientBar } from '@/components/onboarding/OnboardingArt';

type Stage = 'splash' | 'quote' | 'loading';

const SPLASH_MS = 1100;
/** Long enough to read the quote (01 §2.2 suggests about 3.5 s). */
const QUOTE_MS = 3500;

/** Splash, Loading · Quote and Loading · Progress (01 §2.1–§2.3). */
export default function SplashLoading() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('splash');
  const [pct, setPct] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const quoteProgress = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const [readyToFinish, setReadyToFinish] = useState(false);

  // Stage sequencing: splash, then quote, then progress.
  useEffect(() => {
    const a = setTimeout(() => transitionTo('quote'), SPLASH_MS);
    const b = setTimeout(() => transitionTo('loading'), SPLASH_MS + QUOTE_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The quote's logo breathes in time with "BREATHE IN", and its bar fills over the stage.
  useEffect(() => {
    if (stage !== 'quote') return;
    quoteProgress.setValue(0);
    Animated.timing(quoteProgress, { toValue: 1, duration: QUOTE_MS, easing: Easing.linear, useNativeDriver: false }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage, quoteProgress, breathe]);

  // Native-like loading: jump to ~92, creep to 97, then finish to 100.
  useEffect(() => {
    if (stage !== 'loading') return;
    setPct(0);
    setReadyToFinish(false);
    progress.stopAnimation();
    progress.setValue(0);
    const sub = progress.addListener(({ value }) => setPct(Math.min(99, Math.max(0, Math.round(value * 99)))));
    const fastTo92 = Animated.timing(progress, { toValue: 0.92, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    const creepTo97 = Animated.timing(progress, { toValue: 0.97, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
    const minWait = setTimeout(() => setReadyToFinish(true), 2200);
    Animated.sequence([fastTo92, creepTo97]).start();
    return () => {
      clearTimeout(minWait);
      progress.removeListener(sub);
    };
  }, [stage, progress]);

  useEffect(() => {
    if (stage !== 'loading' || !readyToFinish) return;
    Animated.timing(progress, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(({ finished }) => {
      if (!finished) return;
      setPct(100);
      AsyncStorage.getItem('onboarding:seen:v1').then((seen) => {
        if (!seen) router.replace('/(onboarding)/welcome');
        else router.replace('/'); // Let index handle the routing gate
      });
    });
  }, [readyToFinish, router, stage, progress]);

  function transitionTo(next: Stage) {
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setStage(next);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }

  const dark = stage === 'splash';
  return (
    <View style={{ flex: 1, backgroundColor: dark ? palette.ink : palette.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Animated.View style={{ flex: 1, opacity: fade, paddingTop: insets.top - 44 }}>
        {stage === 'splash' && <SplashStage />}
        {stage === 'quote' && <QuoteStage breathe={breathe} progress={quoteProgress} />}
        {stage === 'loading' && <ProgressStage pct={pct} />}
      </Animated.View>
    </View>
  );
}

/** Splash `4002:13753`: night and warm glows, hairline rings, light logo, wordmark and tagline. */
function SplashStage() {
  const { t } = useTranslation();
  return (
    <DesignFrame height={812}>
      <Glow color={palette.plum} opacity={0.9} width={420} blur={80} style={{ position: 'absolute', left: -22.5, top: 150 }} />
      <Glow color={palette.mustard} opacity={0.3} width={280} blur={70} style={{ position: 'absolute', left: 47.5, top: 220 }} />
      <Svg width={375} height={812} style={{ position: 'absolute' }}>
        <Circle cx={187.5} cy={360} r={107} stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={1} fill="none" />
        <Circle cx={187.5} cy={360} r={82} stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={1} fill="none" />
      </Svg>
      <LogoMark size={120} ringColor="#FFFDF8" style={{ position: 'absolute', left: 127.5, top: 300 }} />
      <Text style={{ position: 'absolute', top: 560, width: 375, textAlign: 'center', ...Type.display, fontSize: 34, lineHeight: 41, letterSpacing: -0.68, color: '#FFFDF8' }}>
        {t('onboarding.wordmark')}
      </Text>
      <Text style={{ position: 'absolute', top: 606, width: 375, textAlign: 'center', ...Type.microBold, letterSpacing: 2.64, color: 'rgba(255,255,255,0.55)' }}>
        {t('onboarding.tagline')}
      </Text>
    </DesignFrame>
  );
}

/** Loading · Quote `4002:13762`: breathing cue, Rilke quote and a filling bar. */
function QuoteStage({ breathe, progress }: { breathe: Animated.Value; progress: Animated.Value }) {
  const { t } = useTranslation();
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <DesignFrame height={812}>
      <Glow color={palette.mustard} opacity={0.42} width={320} blur={90} style={{ position: 'absolute', left: -70, top: 40 }} />
      <Animated.View style={{ position: 'absolute', left: 59, top: 159, width: 74, height: 74, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}>
        <Svg width={74} height={74} style={{ position: 'absolute' }}>
          <Circle cx={37} cy={37} r={36.5} stroke={palette.plum} strokeOpacity={0.3} strokeWidth={1} fill="none" />
        </Svg>
        <LogoMark size={48} />
      </Animated.View>
      <Text style={{ position: 'absolute', left: 150, top: 182, ...Type.microBold, letterSpacing: 2.2, color: 'rgba(78,58,94,0.70)' }}>{t('onboarding.breatheIn')}</Text>
      <Text style={{ position: 'absolute', left: 150, top: 200, ...Type.captionM, color: palette.textMuted }}>{t('onboarding.gettingReady')}</Text>
      <Text style={{ position: 'absolute', left: 32, top: 330, width: 311, ...Type.display, fontSize: 30, lineHeight: 38.4, color: palette.ink }}>{t('splash.quote')}</Text>
      <Text style={{ position: 'absolute', left: 32, top: 560, ...Type.microBold, fontSize: 12, letterSpacing: 1.68, color: 'rgba(78,58,94,0.75)' }}>{t('splash.quoteAuthor')}</Text>
      <View style={{ position: 'absolute', left: 127.5, top: 716, width: 120, height: 3, borderRadius: 2, backgroundColor: 'rgba(107,82,121,0.12)', overflow: 'hidden' }}>
        <Animated.View style={{ height: 3, width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) }}>
          <GradientBar width={120} />
        </Animated.View>
      </View>
    </DesignFrame>
  );
}

/** Loading · Progress `4002:13757`: ring with a glowing head, logo, percent and caption. */
function ProgressStage({ pct }: { pct: number }) {
  const { t } = useTranslation();
  const r = 72.5;
  const circumference = 2 * Math.PI * r;
  const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
  const hx = 74 + r * Math.cos(angle);
  const hy = 74 + r * Math.sin(angle);
  return (
    <DesignFrame height={812}>
      <Glow color={palette.mustard} opacity={0.28} width={300} blur={80} style={{ position: 'absolute', left: 37.5, top: 230 }} />
      <View style={{ position: 'absolute', left: 113.5, top: 306, width: 148, height: 148 }}>
        <Svg width={148} height={148}>
          <Circle cx={74} cy={74} r={r} stroke={palette.lavender} strokeOpacity={0.2} strokeWidth={3} fill="none" />
          <Circle
            cx={74}
            cy={74}
            r={r}
            stroke={palette.plum}
            strokeWidth={3}
            fill="none"
            strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
            transform="rotate(-90 74 74)"
          />
        </Svg>
        <Glow color={palette.mustard} opacity={0.8} width={18} blur={8} style={{ position: 'absolute', left: hx - 9, top: hy - 9 }} />
        <View style={{ position: 'absolute', left: hx - 5, top: hy - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: palette.mustard }} />
      </View>
      <LogoMark size={80} style={{ position: 'absolute', left: 147.5, top: 340 }} />
      <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', top: 482, width: 375, textAlign: 'center', ...Type.titleSm, color: palette.plumDeep }}>{`${pct}%`}</Text>
      <Text style={{ position: 'absolute', top: 510, width: 375, textAlign: 'center', ...Type.bodySMedium, color: palette.textMuted }}>{t('onboarding.preparing')}</Text>
    </DesignFrame>
  );
}
