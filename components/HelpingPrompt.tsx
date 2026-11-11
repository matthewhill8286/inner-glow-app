import React, { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { useProfileStats } from '@/hooks/useProfileStats';
import { shouldAskHelping } from '@/lib/rating-prompt';

const ASKED_KEY = 'rating:asked-at:v1';
const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z';

function Light() {
  return (
    <Svg width={64} height={64}>
      <Defs>
        <RadialGradient id="helpLight" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.95} />
          <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={64} height={64} fill="url(#helpLight)" />
    </Svg>
  );
}

/**
 * Is Inner Glow helping you? (`6845:8787`) and Glad it's helping (`6845:8855`), over the day-complete
 * screen. The stars are decoration; Apple's own sheet takes the rating.
 */
export function HelpingPrompt() {
  const { t } = useTranslation();
  const { active } = useProfileStats();
  const [stage, setStage] = useState<'ask' | 'glad' | null>(null);
  const activeDays = active?.size ?? 0;

  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      void AsyncStorage.getItem(ASKED_KEY)
        .catch(() => null)
        .then((raw) => {
          if (!live || !shouldAskHelping(activeDays, raw ? Number(raw) : null)) return;
          void AsyncStorage.setItem(ASKED_KEY, String(Date.now())).catch(() => undefined);
          setStage('ask');
        });
    }, 1200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [activeDays]);

  const rate = async () => {
    setStage(null);
    if (await StoreReview.isAvailableAsync().catch(() => false))
      await StoreReview.requestReview().catch(() => undefined);
  };

  return (
    <Modal
      visible={!!stage}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setStage(null)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(36,26,46,0.45)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            borderRadius: 32,
            backgroundColor: palette.bg,
            padding: 24,
            paddingBottom: 16,
            alignItems: 'center',
            gap: 12,
          }}
        >
          {stage === 'ask' ? <Light /> : null}
          <Text
            accessibilityRole="header"
            style={[
              Type.titleSm,
              { fontSize: 22, lineHeight: 28, color: palette.ink, textAlign: 'center' },
            ]}
          >
            {t(stage === 'glad' ? 'helping.gladTitle' : 'helping.title')}
          </Text>
          <Text
            style={[
              Type.captionM,
              { fontSize: 14, lineHeight: 19, color: palette.textMuted, textAlign: 'center' },
            ]}
          >
            {t(stage === 'glad' ? 'helping.gladBody' : 'helping.body')}
          </Text>
          {stage === 'glad' ? (
            <View
              importantForAccessibility="no-hide-descendants"
              style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <Svg key={i} width={26} height={26} viewBox="0 0 24 24">
                  <Path
                    d={STAR}
                    fill="none"
                    stroke={i < 4 ? palette.gold : palette.borderStrong}
                    strokeWidth={1.4}
                    strokeLinejoin="round"
                  />
                </Svg>
              ))}
            </View>
          ) : null}
          <View style={{ alignSelf: 'stretch', gap: 4, marginTop: 8 }}>
            {stage === 'glad' ? (
              <>
                <AppButton title={t('helping.rate')} onPress={() => void rate()} />
                <AppButton
                  title={t('helping.later')}
                  variant="text"
                  onPress={() => setStage(null)}
                />
              </>
            ) : (
              <>
                <AppButton title={t('helping.yes')} onPress={() => setStage('glad')} />
                <AppButton
                  title={t('helping.no')}
                  variant="text"
                  onPress={() => {
                    setStage(null);
                    router.push('/(utils)/feedback');
                  }}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
