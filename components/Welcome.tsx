import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Each title segment is either plain text or a coloured keyword.
 * E.g. [ { text: 'Personalize Your Mental ' }, { text: 'Health', color: '#5B8A5A' }, { text: ' State With AI' } ]
 */
export type TitleSegment = { text: string; color?: string };

export type Slide = {
  step: string;                   // "Step One" / "Welcome"
  titleSegments: TitleSegment[];  // rich title with coloured keywords
  text: string;                   // subtitle / description
};

type Props = {
  slideIndex: number;
  slides: Slide[];
  illustration: ImageSourcePropType;
  onNext?: () => void;
  onBack?: () => void;
  onSignIn?: () => void;          // "Already have an account?" on landing
};

export default function WelcomeComp({
  slideIndex,
  slides,
  illustration,
  onNext,
  onBack,
  onSignIn,
}: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  const total = slides.length || 1;
  const safeIndex = Math.max(0, Math.min(slideIndex, total - 1));
  const slide = slides[safeIndex];
  const isLanding = safeIndex === 0;

  // Progress for steps 1–5 (skip the landing slide)
  const stepTotal = total - 1; // number of actual step slides
  const stepIndex = safeIndex - 1; // 0-based among step slides
  const progress = useMemo(() => {
    if (isLanding || stepTotal <= 0) return 0;
    return (stepIndex + 1) / stepTotal;
  }, [isLanding, stepIndex, stepTotal]);

  // Animated values
  const [trackWidth, setTrackWidth] = useState(86);
  const progressAnim = useRef(new Animated.Value(progress)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
    }).start();

    contentTranslate.setValue(12);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslate, progress, progressAnim, safeIndex]);

  /* ---------- Render rich title with coloured keywords ---------- */
  const renderTitle = (segments: TitleSegment[], style: object) => (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text key={i} style={seg.color ? { color: seg.color } : undefined}>
          {seg.text}
        </Text>
      ))}
    </Text>
  );

  /* ===================== LANDING SCREEN (slide 0) ===================== */
  if (isLanding) {
    return (
      <KeyboardAvoidingView style={styles.safe}>
        <View style={styles.screen}>
          {/* Logo */}
          <View style={[styles.landingLogoRow, { paddingTop: insets.top + 12 }]}>
            <View style={styles.logoIcon}>
              <View style={styles.logoDotsWrap}>
                <View style={[styles.logoDot, styles.logoDotTL]} />
                <View style={[styles.logoDot, styles.logoDotTR]} />
                <View style={[styles.logoDot, styles.logoDotBL]} />
                <View style={[styles.logoDot, styles.logoDotBR]} />
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.landingTitleWrap}>
            {renderTitle(slide.titleSegments, styles.landingTitle)}
            <Text style={styles.landingSubtitle}>{slide.text}</Text>
          </View>

          {/* Illustration */}
          <Animated.View
            style={[
              styles.landingIllustrationWrap,
              { opacity: contentOpacity, transform: [{ translateX: contentTranslate }] },
            ]}
          >
            <Image source={illustration} style={styles.landingIllustration} resizeMode="contain" />
          </Animated.View>

          {/* Get Started button */}
          <View style={styles.landingBottom}>
            <Pressable
              onPress={onNext}
              style={({ pressed }) => [
                styles.getStartedBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Text style={styles.getStartedArrow}>→</Text>
            </Pressable>

            {/* Sign-in link */}
            <Pressable onPress={onSignIn} style={styles.signInRow}>
              <Text style={styles.signInText}>
                Already have an account?{' '}
                <Text style={styles.signInLink}>Sign In.</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  /* ===================== STEP SLIDES (slides 1–5) ===================== */
  return (
    <KeyboardAvoidingView style={styles.safe}>
      <View style={styles.screen}>
        {/* Back button */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={[styles.backHit, { top: insets.top + 6 }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}

        {/* Step pill badge */}
        <View style={[styles.stepBadgeWrap, { top: insets.top + 8 }]}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {slide?.step ?? `Step ${safeIndex}`}
            </Text>
          </View>
        </View>

        {/* Illustration */}
        <Animated.View
          style={[
            styles.illustrationWrap,
            { opacity: contentOpacity, transform: [{ translateX: contentTranslate }] },
          ]}
        >
          <Image source={illustration} style={styles.illustration} resizeMode="cover" />
        </Animated.View>

        {/* Bottom content card */}
        <Animated.View
          style={[
            styles.bottomCard,
            { opacity: contentOpacity, transform: [{ translateX: contentTranslate }] },
          ]}
        >
          {/* Brown divider line at top of card */}
          <View style={styles.cardDivider} />

          <View style={styles.bottomRow}>
            <View style={{ flex: 1 }}>
              {renderTitle(slide?.titleSegments ?? [], styles.headline)}
            </View>

            <Pressable
              onPress={onNext}
              style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.96 }] }]}
              accessibilityRole="button"
              accessibilityLabel="Next"
            >
              <View style={styles.arrowStem} />
              <View style={styles.arrowHead} />
            </Pressable>
          </View>

          {/* Bottom progress indicator */}
          <View style={styles.progressTrack}>
            <View
              style={styles.progressTrackInner}
              accessibilityRole="progressbar"
              onLayout={(e) =>
                setTrackWidth(Math.max(1, Math.round(e.nativeEvent.layout.width)))
              }
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, trackWidth],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── Design tokens ─── */
const BG = '#F6F4F2';
const INK = '#1B1A18';
const BROWN = '#8B6B47';
const MUTED = 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1 },

  /* ── Back button ── */
  backHit: {
    position: 'absolute',
    // top is set dynamically via insets
    left: 14,
    zIndex: 20,
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 26, fontWeight: '900', color: INK, marginTop: -2 },

  /* ── Step pill badge ── */
  stepBadgeWrap: {
    position: 'absolute',
    // top is set dynamically via insets
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  stepBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: INK,
    letterSpacing: 0.3,
  },

  /* ── Illustration (step slides) ── */
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  /* ── Bottom card (step slides) ── */
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 0,
  },

  cardDivider: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BROWN,
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 6,
  },

  bottomRow: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  headline: {
    fontSize: 20,
    fontWeight: '900',
    color: INK,
    lineHeight: 26,
  },

  /* ── CTA circle ── */
  cta: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BROWN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  arrowStem: {
    width: 18,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ translateX: 2 }],
  },
  arrowHead: {
    position: 'absolute',
    right: 17,
    width: 10,
    height: 10,
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },

  /* ── Progress bar ── */
  progressTrack: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrackInner: {
    width: 86,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: BROWN,
  },

  /* ═══════════ LANDING SCREEN (slide 0) ═══════════ */
  landingLogoRow: {
    // paddingTop is set dynamically via insets
    paddingHorizontal: 24,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BROWN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDotsWrap: {
    width: 22,
    height: 22,
    position: 'relative',
  },
  logoDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  logoDotTL: { top: 0, left: 0 },
  logoDotTR: { top: 0, right: 0 },
  logoDotBL: { bottom: 0, left: 0 },
  logoDotBR: { bottom: 0, right: 0 },

  landingTitleWrap: {
    paddingHorizontal: 24,
    marginTop: 18,
  },
  landingTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: INK,
    lineHeight: 32,
  },
  landingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    fontWeight: '500',
  },

  landingIllustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  landingIllustration: {
    width: '100%',
    height: '100%',
  },

  landingBottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  getStartedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BROWN,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  getStartedArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signInRow: {
    marginTop: 16,
    paddingVertical: 4,
  },
  signInText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },
  signInLink: {
    color: BROWN,
    fontWeight: '700',
  },
});
