import React, { useRef, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { IconFab } from '@/components/ui/AppButton';
import { GradientBar, StepArt } from '@/components/onboarding/OnboardingArt';

const STEPS = [1, 2, 3, 4, 5] as const;
type Step = (typeof STEPS)[number];

/**
 * Carousel Steps One–Five (01 §2.6): artwork on top, a centred step tag, a gradient step track,
 * the title and an 80pt next button. Swiping also pages. After Step Five it goes to sign-up.
 */
export default function Steps() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Step>>(null);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const next = async () => {
    if (index < STEPS.length - 1) {
      list.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    // The paywall after Step Five is a separate task (t179); until then the flow goes to sign-up.
    await AsyncStorage.setItem('onboarding:seen:v1', 'true');
    router.replace('/(auth)/sign-up');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <FlatList
        ref={list}
        data={[...STEPS]}
        keyExtractor={(s) => String(s)}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          // Figma frames assume a 44pt status bar; on taller ones the gap above takes the art's top colour.
          <View style={{ width, backgroundColor: item === 4 ? '#EAF2F5' : palette.bg }}>
            <View style={{ marginTop: insets.top - 44 }}>
              <StepArt step={item} />
            </View>
            <View style={{ position: 'absolute', top: insets.top + 16, alignSelf: 'center' }}>
              <View style={{ borderWidth: 1, borderColor: palette.ink, borderRadius: 32, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Text style={{ ...Type.bodyStrong, letterSpacing: -0.3, color: palette.ink }}>{t(`onboarding.steps.${item}.tag`)}</Text>
              </View>
            </View>
          </View>
        )}
        style={{ flexGrow: 0 }}
      />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 17, paddingBottom: insets.bottom + 24 }}>
        <View style={{ width: 120, height: 3, borderRadius: 2, backgroundColor: 'rgba(107,82,121,0.12)', overflow: 'hidden', marginTop: 8 }}>
          <View style={{ width: ((index + 1) / STEPS.length) * 120, overflow: 'hidden' }}>
            <GradientBar width={120} id="stepTrack" />
          </View>
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          numberOfLines={2}
          style={{ ...Type.display, fontSize: 30, lineHeight: 38, letterSpacing: -0.3, color: palette.plumDeep, textAlign: 'center', marginTop: 26, maxWidth: 343 }}
        >
          {t(`onboarding.steps.${STEPS[index]}.title`)}
        </Text>
        <View style={{ flex: 1 }} />
        <IconFab accessibilityLabel={t('onboarding.next')} onPress={next} />
      </View>
    </View>
  );
}
