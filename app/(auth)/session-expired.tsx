import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { forgetExpiredSession } from '@/lib/session-expiry';

/**
 * Session expired (`6832:8167`): the two rings around a mustard light, "Please sign in again",
 * the "Signed out for safety" chip, then Sign in and Use a different account.
 */
export default function SessionExpired() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const top = insets.top - 44;

  const signIn = async (keepEmail: boolean) => {
    await forgetExpiredSession();
    router.replace(
      keepEmail && email
        ? { pathname: '/(auth)/sign-in', params: { email } }
        : '/(auth)/sign-in',
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.45, x: 62.5, y: 175 + top, width: 250, blur: 60 },
          { color: palette.mustard, opacity: 0.35, x: 147.5, y: 240 + top, width: 160, blur: 50 },
        ]}
      />
      <View style={{ alignItems: 'center', marginTop: top + 205, paddingHorizontal: 24 }}>
        <Svg width={190} height={190}>
          <Defs>
            <RadialGradient id="expiredLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={95} cy={95} r={94.5} stroke={palette.plum} strokeWidth={1} fill="none" />
          <Circle cx={95} cy={95} r={74} stroke={palette.plum} strokeWidth={1.5} fill="none" />
          <Circle cx={95} cy={95} r={30} fill="url(#expiredLight)" />
        </Svg>
        <Text
          accessibilityRole="header"
          style={[Type.titleLg, { fontSize: 26, color: palette.ink, textAlign: 'center', marginTop: 91 }]}
        >
          {t('sessionExpired.title')}
        </Text>
        <Text
          style={[
            Type.body,
            { fontSize: 14, fontWeight: '400', lineHeight: 20, color: palette.textMuted, textAlign: 'center', marginTop: 11, maxWidth: 287 },
          ]}
        >
          {t('sessionExpired.body')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 34,
            paddingLeft: 12,
            paddingRight: 14,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: palette.selected,
          }}
        >
          <Icon name="line/lock" size={14} color={palette.plum} />
          <Text style={[Type.caption, { fontWeight: '600', color: palette.plum }]}>{t('sessionExpired.chip')}</Text>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 16 }}>
        <AppButton title={t('sessionExpired.signIn')} onPress={() => void signIn(true)} />
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void signIn(false)}>
          <Text style={[Type.body, { fontSize: 14, fontWeight: '600', color: palette.lavender, textAlign: 'center' }]}>
            {t('sessionExpired.differentAccount')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
