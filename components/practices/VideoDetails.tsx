import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { NavBar } from '@/components/ui/IconButton';
import { usePracticeText } from '@/components/practices/PracticeParts';
import type { Practice } from '@/data/practices';
import { useFavouriteHeart } from '@/hooks/useFavouriteHeart';
import { backTo } from '@/lib/navigation';
import { mmss } from '@/lib/practices';

export const thumbnailUrl = (youtubeId: string) =>
  `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
/** "2:15" from seconds. */
export const clockLength = (seconds: number) => mmss(seconds).replace(/^0/, '');

function MetaChip({ label }: { label: string }) {
  return (
    <View
      style={{
        height: 22,
        borderRadius: 999,
        paddingHorizontal: 10,
        justifyContent: 'center',
        backgroundColor: palette.borderLilac,
      }}
    >
      <Text style={[Type.buttonS, { fontSize: 12, lineHeight: 14, color: palette.plumDeep }]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Video details (07 §2.12): the thumbnail hero with play and length badges, title, chips and
 * description, What you'll do, Good for and Source, and Play video. The heart saves it to favourites.
 */
export function VideoDetails({ practice }: { practice: Practice }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const text = usePracticeText()(practice);
  const heart = useFavouriteHeart(practice.id, insets.bottom + 90);
  const video = practice.video!;
  const length = clockLength(video.seconds);
  const steps = t(`practices.steps.${practice.id}`, { returnObjects: true }) as string[];
  const goodFor = t(`practices.goodFor.${practice.id}`, { returnObjects: true }) as string[];
  const tag = t(
    practice.category === 'relax-body' ? 'practices.relax.bodyTag' : 'practices.relax.mindTag',
  );
  const play = () =>
    router.push({ pathname: '/(tabs)/mindful/play/[id]', params: { id: practice.id } });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.3, x: 150, y: 30, width: 270, blur: 90 },
          { color: palette.mustard, opacity: 0.18, x: -60, y: 10, width: 220, blur: 90 },
        ]}
      />
      <NavBar
        title={tag}
        backLabel={t('common.back')}
        onBack={() => backTo(undefined, '/(tabs)/mindful')}
        trailing={heart.button}
        style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('practices.video.play')}, ${text.title}`}
          onPress={play}
          style={{ height: 176, borderRadius: 28, overflow: 'hidden', backgroundColor: '#F1EBE4' }}
        >
          <Image
            source={{ uri: thumbnailUrl(video.youtubeId) }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#403B36" stopOpacity={0} />
                <Stop offset="1" stopColor="#403B36" stopOpacity={0.45} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#heroShade)" />
          </Svg>
          <View
            style={{
              position: 'absolute',
              left: 14,
              top: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 999,
              paddingVertical: 4,
              paddingHorizontal: 10,
            }}
          >
            <Icon name="line/play" size={12} />
            <Text style={[Type.microBold, { color: palette.plumDeep }]}>
              {t('practices.video.badge')}
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: 58,
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <Icon name="line/play" size={24} color={palette.plum} />
          </View>
          <View
            style={{
              position: 'absolute',
              right: 14,
              bottom: 14,
              backgroundColor: 'rgba(63,60,54,0.75)',
              borderRadius: 8,
              paddingVertical: 3,
              paddingHorizontal: 8,
            }}
          >
            <Text style={[Type.microBold, { fontSize: 12, color: palette.white }]}>{length}</Text>
          </View>
        </Pressable>

        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 26, lineHeight: 34, color: palette.plumDeep }]}
        >
          {text.title}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {[t('practices.video.length', { length }), text.tag, text.level].map((c) => (
            <MetaChip key={c} label={c} />
          ))}
        </View>
        <Text style={[Type.bodySm, { color: palette.textMuted }]}>{text.description}</Text>

        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 28,
            padding: 20,
            paddingTop: 18,
            marginTop: 8,
          }}
        >
          <Text style={[Type.microBold, { fontSize: 13, lineHeight: 18, color: palette.ink }]}>
            {t('practices.video.whatYoullDo')}
          </Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {steps.map((step, i) => (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: 'rgba(226,204,64,0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={[Type.microBold, { fontSize: 12, color: palette.plumDeep }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[Type.bodySm, { flex: 1, color: palette.plumDeep }]}>{step}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: palette.surfaceLilac, marginVertical: 14 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text style={[Type.microBold, { fontSize: 13, lineHeight: 18, color: palette.ink }]}>
              {t('practices.video.goodFor')}
            </Text>
            {goodFor.map((g) => (
              <MetaChip key={g} label={g} />
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: palette.surfaceLilac, marginVertical: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[Type.microBold, { fontSize: 13, lineHeight: 18, color: palette.ink }]}>
              {t('practices.video.source')}
            </Text>
            <Text style={[Type.captionM, { color: palette.textMuted }]}>
              {t('practices.video.sourceValue')}
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 14 }}>
        <AppButton
          title={t('practices.video.play')}
          icon="line/play"
          iconPosition="left"
          onPress={play}
        />
      </View>
      {heart.toast}
    </View>
  );
}
