import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { LegalNote } from '@/components/ui/controls';

const SUPPORT_EMAIL = 'support@innerglow.app';

/**
 * Contact us, the Help Centre's second tab (06 §P11, `6722:4837`): the aura hero, Message our team
 * and Report a problem (both open the support form, replies come by email), Email us, the
 * urgent-help card and the note. There is no in-app reply thread yet, so the subtitle says replies
 * come by email.
 */
export function ContactPanel() {
  const { t } = useTranslation();
  return (
    <>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 192, height: 192, alignItems: 'center', justifyContent: 'center' }}>
          <Glow
            color={palette.mustard}
            opacity={0.28}
            width={140}
            blur={44}
            style={{ position: 'absolute', left: 26, top: 24 }}
          />
          <Glow
            color={palette.lavenderSoft}
            opacity={0.25}
            width={120}
            blur={44}
            style={{ position: 'absolute', left: -14, top: 44 }}
          />
          <Svg width={192} height={192} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="contactLight" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={palette.cream} />
                <Stop offset="0.6" stopColor={palette.gold} stopOpacity={0.9} />
                <Stop offset="1" stopColor={palette.gold} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {[
              [31.2, 0.26],
              [46.2, 0.2],
              [60.3, 0.14],
              [72.9, 0.08],
            ].map(([r, o]) => (
              <Circle
                key={r}
                cx={96}
                cy={96}
                r={r}
                stroke={palette.plum}
                strokeOpacity={o}
                strokeWidth={1}
                fill="none"
              />
            ))}
            <Circle cx={96} cy={96} r={26} fill="url(#contactLight)" />
          </Svg>
        </View>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 24, color: palette.ink, textAlign: 'center' }]}
        >
          {t('contactUs.title')}
        </Text>
        <Text
          style={[
            Type.bodyS,
            {
              lineHeight: 20,
              color: palette.textMuted,
              textAlign: 'center',
              marginTop: 8,
              maxWidth: 279,
            },
          ]}
        >
          {t('contactUs.body')}
        </Text>
      </View>

      <ListGroup>
        <ListRow
          icon="line/chat"
          label={t('contactUs.message')}
          supportingText={t('contactUs.messageBody')}
          onPress={() =>
            router.push({ pathname: '/(utils)/support-message', params: { kind: 'message' } })
          }
        />
        <ListRow
          icon="line/email"
          label={t('contactUs.email')}
          supportingText={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <ListRow
          icon="line/activity"
          label={t('contactUs.problem')}
          supportingText={t('contactUs.problemBody')}
          onPress={() =>
            router.push({ pathname: '/(utils)/support-message', params: { kind: 'problem' } })
          }
        />
      </ListGroup>

      <View
        style={{
          backgroundColor: palette.white,
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: palette.rose,
          padding: 20,
          gap: 8,
          overflow: 'hidden',
        }}
      >
        <Glow
          color={palette.rose}
          opacity={0.25}
          width={140}
          blur={40}
          style={{ position: 'absolute', right: -43, top: -40 }}
        />
        <Text style={[Type.bodyStrong, { color: palette.ink }]}>{t('contactUs.urgentTitle')}</Text>
        <Text style={[Type.captionM, { lineHeight: 18, color: palette.textMuted }]}>
          {t('contactUs.urgentBody')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(utils)/resources')}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            marginTop: 6,
            height: 32,
            paddingHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.plum,
            backgroundColor: palette.selected,
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={[Type.chipSelected, { color: palette.plum }]}>
            {t('contactUs.urgentCta')}
          </Text>
        </Pressable>
      </View>

      <LegalNote text={t('contactUs.legal')} />
    </>
  );
}
