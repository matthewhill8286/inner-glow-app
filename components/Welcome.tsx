import { welcomeLayout } from '@/lib/screen-layout';
import { Typography } from '@/constants/typography';
import { UI } from '@/constants/theme';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import WelcomeArtwork, { GlowMark } from '@/components/WelcomeArtwork';

export type TitleSegment = { text: string; color?: string };
export type Slide = { step: string; titleSegments: TitleSegment[]; text: string };
type Props = {
  slideIndex: number;
  slides: Slide[];
  onNext?: () => void;
  onBack?: () => void;
  onSignIn?: () => void;
};

export default function WelcomeComp({ slideIndex, slides, onNext, onBack, onSignIn }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const layout = welcomeLayout(width, height, fontScale);
  const { t } = useTranslation();
  const index = Math.max(0, Math.min(slideIndex, slides.length - 1));
  const slide = slides[index];
  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.brandRow}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t('welcome.back')}
              style={s.back}
            >
              <Feather name="arrow-left" size={22} color="#313D32" />
            </Pressable>
          ) : (
            <GlowMark />
          )}
          <Text style={s.wordmark}>INNER GLOW</Text>
          <Text style={s.step}>{index === 0 ? '' : `${index} / ${slides.length - 1}`}</Text>
        </View>
        <View style={[s.copy, { marginTop: layout.copyTop }]}>
          <Text style={s.eyebrow}>{index === 0 ? t('welcome.slides.0.step') : slide.step}</Text>
          <Text style={s.title}>{slide.titleSegments.map((x) => x.text).join('')}</Text>
          {!!slide.text && <Text style={s.subtitle}>{slide.text}</Text>}
        </View>
        <View style={[s.art, { height: layout.artworkHeight }]}>
          <WelcomeArtwork step={index} />
        </View>
        <View style={s.footer}>
          <View style={s.progress} accessibilityLabel={`${index + 1} / ${slides.length}`}>
            {slides.map((_, i) => (
              <View key={i} style={[s.dot, i === index && s.activeDot]} />
            ))}
          </View>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [s.primary, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={s.primaryText}>
              {index === 0 || index === slides.length - 1
                ? t('welcome.getStarted')
                : t('welcome.next')}
            </Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={onSignIn} accessibilityRole="button" style={s.signIn}>
            <Text style={s.signInText}>
              {t('welcome.alreadyHaveAccount')}{' '}
              <Text style={s.signInLink}>{t('welcome.signInLink')}</Text>
            </Text>
          </Pressable>
          <Text style={s.disclaimer}>{t('welcome.disclaimer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF9F5' },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 28,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmark: {
    fontFamily: Typography.family.body,
    flex: 1,
    fontSize: 12,
    letterSpacing: 2.8,
    fontWeight: Typography.weight.semibold,
    color: '#526651',
  },
  step: { fontFamily: Typography.family.body, fontSize: 12, color: '#7D8176' },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  copy: { marginTop: 44 },
  eyebrow: {
    fontFamily: Typography.family.body,
    color: '#767C6D',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  title: { ...Typography.heading, fontSize: 36, lineHeight: 44, color: '#28392B' },
  subtitle: {
    fontFamily: Typography.family.body,
    color: '#697164',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 18,
    maxWidth: 340,
  },
  art: { width: '100%', maxWidth: 360, alignSelf: 'center', marginVertical: 16 },
  footer: { marginTop: 'auto', paddingTop: 12 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 24 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D5DACE' },
  activeDot: { width: 22, backgroundColor: '#526651' },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#526651',
    minHeight: 54,
    borderRadius: 12,
    paddingHorizontal: 22,
  },
  primaryText: {
    fontFamily: Typography.family.body,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
  },
  signIn: { alignItems: 'center', paddingVertical: 20 },
  signInText: { fontFamily: Typography.family.body, fontSize: 13, color: '#747B6E' },
  signInLink: {
    fontFamily: Typography.family.body,
    color: '#354D38',
    fontWeight: Typography.weight.semibold,
  },
  disclaimer: {
    fontFamily: Typography.family.body,
    fontSize: 10,
    lineHeight: 15,
    color: '#7D8477',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
