import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, GlowOrb } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { useGlowAiUsage } from '@/hooks/useGlowAi';
import { backTo } from '@/lib/navigation';
import { supabase } from '@/supabase/supabase';
import configureRevenueCat, { getDefaultOffering, PLAN_TO_PACKAGE } from '@/lib/revenuecat';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 240;
const STROKE = 3.6;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** The yearly plan's monthly price from the App Store ("€4.99/mo"), or null where it is not available. */
function useProMonthlyPrice() {
  const [price, setPrice] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let live = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await configureRevenueCat(session?.user?.id);
      const yearly = (await getDefaultOffering())?.availablePackages.find(
        (p) => p.identifier === PLAN_TO_PACKAGE.yearly,
      );
      if (live && yearly?.product.pricePerMonthString)
        setPrice(`${yearly.product.pricePerMonthString}/mo`);
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return price;
}

/**
 * Glow AI · Free limit (05 §3.6): the used-talks ring around the S=171 orb, the reset line, the Pro
 * card and "Start 7 days free", which opens the paywall. "Wait until Monday" closes the screen.
 */
export default function FreeLimit() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { used, limit } = useGlowAiUsage();
  const shown = used ?? limit;
  const price = useProMonthlyPrice();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.min(1, shown / limit), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, shown, limit]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - progress.value) }));
  const close = () => backTo(undefined, '/(tabs)/chat');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.bg,
        paddingTop: insets.top + 10,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.22, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.28, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <IconButton
        variant="glass"
        icon="arrow/close"
        accessibilityLabel={t('glowAi.freeLimit.close')}
        onPress={close}
        style={{ alignSelf: 'flex-end' }}
      />

      <View
        style={{
          width: SIZE,
          height: SIZE,
          alignSelf: 'center',
          marginTop: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg
          width={SIZE}
          height={SIZE}
          style={{ position: 'absolute' }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={palette.plum}
            strokeOpacity={0.1}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={palette.plum}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            animatedProps={arc}
            fill="none"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <GlowOrb size={171} />
      </View>

      <Text
        accessibilityRole="header"
        style={[
          Type.titleMd,
          { fontSize: 24, lineHeight: 34, color: palette.ink, textAlign: 'center', marginTop: 20 },
        ]}
      >
        {t('glowAi.freeLimit.title')}
      </Text>
      <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center', marginTop: 8 }]}>
        {t('glowAi.freeLimit.body', { used: shown, limit })}
      </Text>

      <View style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: palette.white,
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: palette.plum,
          paddingVertical: 18,
          paddingHorizontal: 20,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}>
            {t('glowAi.freeLimit.proTitle')}
          </Text>
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {price
              ? t('glowAi.freeLimit.proBody', { price })
              : t('glowAi.freeLimit.proBodyNoPrice')}
          </Text>
        </View>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: palette.mustard,
            borderRadius: 999,
            paddingVertical: 2,
            paddingHorizontal: 8,
          }}
        >
          <Text style={[Type.microBold, { lineHeight: 15, color: palette.ink }]}>
            {t('glowAi.freeLimit.pro')}
          </Text>
        </View>
      </View>
      <AppButton
        title={t('glowAi.freeLimit.start')}
        onPress={() => router.push('/(utils)/trial-upgrade')}
        style={{ marginTop: 26 }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={close}
        hitSlop={10}
        style={{ alignSelf: 'center', marginTop: 18 }}
      >
        <Text style={[Type.buttonS, { fontSize: 14, color: palette.lavender }]}>
          {t('glowAi.freeLimit.wait')}
        </Text>
      </Pressable>
    </View>
  );
}
