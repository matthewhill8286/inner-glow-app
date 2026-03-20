import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeComp, { TitleSegment, Slide } from '@/components/Welcome';

/**
 * Accent colours that match the Figma design for each step's highlighted keyword.
 * Index 0 = landing (no highlight), 1–5 = Steps One–Five.
 */
const HIGHLIGHT_COLORS: Record<number, string> = {
  1: '#5B8A5A', // sage green  – "Health"
  2: '#E8985A', // amber orange – "Intelligent"
  3: '#8B6B47', // brown (none) – no highlight in design
  4: '#5B8A5A', // sage green  – "Resources"
  5: '#E8985A', // amber orange – "Community"
};

/**
 * Parse a plain title + optional highlight keyword into TitleSegments
 * so the component can render coloured keywords inline.
 */
function buildTitleSegments(
  title: string,
  highlight: string | undefined,
  color: string | undefined,
): TitleSegment[] {
  if (!highlight || !color) return [{ text: title }];

  const idx = title.indexOf(highlight);
  if (idx === -1) return [{ text: title }];

  const segments: TitleSegment[] = [];
  if (idx > 0) segments.push({ text: title.slice(0, idx) });
  segments.push({ text: highlight, color });
  const after = title.slice(idx + highlight.length);
  if (after) segments.push({ text: after });
  return segments;
}

export default function Welcome() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [slideIndex, setSlideIndex] = useState(0);

  const SLIDES: Slide[] = Array.from({ length: 6 }, (_, i) => {
    const title = t(`welcome.slides.${i}.title`);
    const highlight = t(`welcome.slides.${i}.titleHighlight`, { defaultValue: '' });
    const color = HIGHLIGHT_COLORS[i];
    return {
      step: t(`welcome.slides.${i}.step`),
      titleSegments: buildTitleSegments(title, highlight || undefined, color),
      text: t(`welcome.slides.${i}.text`),
    };
  });

  const ILLUSTRATIONS = [
    require('@/assets/images/1.png'),
    require('@/assets/images/2.png'),
    require('@/assets/images/3.png'),
    require('@/assets/images/4.png'),
    require('@/assets/images/5.png'),
    require('@/assets/images/6.png'),
  ];

  const handleNext = async () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      await AsyncStorage.setItem('onboarding:seen:v1', 'true');
      router.replace('/(auth)/sign-up');
    }
  };

  const handleBack = () => {
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <WelcomeComp
      slideIndex={slideIndex}
      slides={SLIDES}
      illustration={ILLUSTRATIONS[slideIndex]}
      onNext={handleNext}
      onBack={slideIndex > 0 ? handleBack : undefined}
      onSignIn={handleSignIn}
    />
  );
}
