import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, Glow } from '@/components/glow/Glow';
import { LogoMark } from '@/components/brand/LogoMark';
import { AppButton } from '@/components/ui/AppButton';
import { Checkbox } from '@/components/ui/controls';
import { saveLocalConsent } from '@/lib/consent';

const POINTS = ['medical', 'emergency', 'data'] as const;

/** Before we begin · Consent `6674:2972` (01 §2.5). The CTA waits for the agree checkbox. */
export default function Consent() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);

  const accept = async () => {
    await saveLocalConsent();
    router.push('/(onboarding)/steps');
  };
  const legal = (policy: 'terms' | 'privacy') => router.push({ pathname: '/(utils)/legal', params: { policy } });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.35, x: 37.5, y: 0, width: 300, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.3, x: 160, y: 90, width: 200, blur: 80 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 60, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <LogoMark size={64} style={{ alignSelf: 'center' }} />
        <Text accessibilityRole="header" style={{ ...Type.titleLg, lineHeight: 36, color: palette.ink, textAlign: 'center', marginTop: 28 }}>
          {t('onboarding.consentTitle')}
        </Text>
        <Text style={{ ...Type.bodySm, color: palette.textMuted, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
          {t('onboarding.consentSubtitle')}
        </Text>

        <View style={{ marginTop: 40, gap: 28 }}>
          {POINTS.map((p) => (
            <View key={p} style={{ flexDirection: 'row', gap: 12, paddingLeft: 4 }}>
              <View style={{ width: 10, height: 10, marginTop: 6, alignItems: 'center', justifyContent: 'center' }}>
                <Glow color={palette.mustard} opacity={0.7} width={14} blur={8} style={{ position: 'absolute' }} />
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette.mustard }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Type.bodyMSemi, lineHeight: 21, color: palette.ink }}>{t(`onboarding.consent.${p}.title`)}</Text>
                <Text style={{ ...Type.captionM, lineHeight: 18, color: palette.textMuted, marginTop: 4 }}>{t(`onboarding.consent.${p}.body`)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => setAgreed((a) => !a)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          style={{ marginTop: 36, backgroundColor: palette.surface, borderRadius: 18, paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Checkbox checked={agreed} onChange={setAgreed} accessibilityLabel={t('onboarding.agree')} />
          <Text style={{ ...Type.captionM, color: palette.ink, flex: 1 }}>
            {t('onboarding.agree')}{' '}
            <Text style={{ fontWeight: '600', color: palette.plum }} onPress={() => legal('terms')}>
              {t('onboarding.terms')}
            </Text>{' '}
            {t('onboarding.and')}{' '}
            <Text style={{ fontWeight: '600', color: palette.plum }} onPress={() => legal('privacy')}>
              {t('onboarding.privacy')}
            </Text>
          </Text>
        </Pressable>

        <AppButton title={t('onboarding.understand')} disabled={!agreed} onPress={accept} style={{ marginTop: 22 }} />
      </ScrollView>
    </View>
  );
}
