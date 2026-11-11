import React, { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';

/** The 52pt arc that turns while the App Store confirms. */
function Spinner() {
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1);
  }, [turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  const r = 23;
  const length = 2 * Math.PI * r;
  return (
    <Animated.View style={[{ width: 52, height: 52 }, style]}>
      <Svg width={52} height={52}>
        <Circle
          cx={26}
          cy={26}
          r={r}
          stroke={palette.plum}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${length * 0.7} ${length}`}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Purchase · Confirming (`6832:8524`): a centred card over the dimmed paywall while StoreKit
 * finishes, so the person keeps the app open.
 */
export function ConfirmingPurchase({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(36,26,46,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          accessibilityLiveRegion="polite"
          style={{
            width: '100%',
            maxWidth: 311,
            borderRadius: 28,
            backgroundColor: palette.bg,
            paddingVertical: 28,
            paddingHorizontal: 24,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Spinner />
          <Text style={[Type.titleSm, { fontSize: 20, lineHeight: 26, color: palette.ink, textAlign: 'center', marginTop: 6 }]}>
            {t('purchaseStates.confirmingTitle')}
          </Text>
          <Text style={[Type.captionM, { color: palette.textMuted, textAlign: 'center' }]}>
            {t('purchaseStates.confirmingBody')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export type PurchaseResult = 'failed' | 'restored' | 'nothingFound';

const RESULT: Record<PurchaseResult, { icon: IconName; orb: string; tint: string }> = {
  failed: { icon: 'line/lock', orb: palette.dangerSoft, tint: palette.danger },
  restored: { icon: 'line/check', orb: palette.selected, tint: palette.plum },
  nothingFound: { icon: 'line/search', orb: palette.selected, tint: palette.plum },
};

/**
 * The paywall's result sheets: Payment didn't go through (`6832:8598`), Your Pro plan is back
 * (`6832:8681`) and No purchases found (`6832:8761`).
 */
export function PurchaseResultSheet({
  result,
  onClose,
  onPrimary,
  onSecondary,
}: {
  result: PurchaseResult | null;
  onClose: () => void;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  const { t } = useTranslation();
  const look = RESULT[result ?? 'failed'];
  const key = `purchaseStates.${result ?? 'failed'}`;
  return (
    <BottomSheet visible={!!result} onClose={onClose} gap={12}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: look.orb,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 12,
        }}
      >
        <Icon name={look.icon} size={22} color={look.tint} />
      </View>
      <Text accessibilityRole="header" style={[Type.titleSm, { fontSize: 20, lineHeight: 28, color: palette.ink, textAlign: 'center' }]}>
        {t(`${key}.title`)}
      </Text>
      <Text style={[Type.captionM, { color: palette.textMuted, textAlign: 'center' }]}>{t(`${key}.body`)}</Text>
      <View style={{ alignSelf: 'stretch', gap: 4, marginTop: 8 }}>
        <AppButton title={t(`${key}.primary`)} onPress={onPrimary} />
        {result !== 'restored' && onSecondary ? (
          <AppButton title={t(`${key}.secondary`)} variant="text" onPress={onSecondary} />
        ) : null}
      </View>
    </BottomSheet>
  );
}
