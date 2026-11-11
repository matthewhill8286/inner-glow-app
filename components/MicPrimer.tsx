import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { answerMicPrimer, onMicPrimer } from '@/lib/mic-primer';

/**
 * Talk instead of typing (`6801:6542`): the mic orb, why the microphone is needed, three promises,
 * then Allow microphone (which leads to the iOS prompt) and Not now.
 */
export function MicPrimer() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  useEffect(() => onMicPrimer(setOpen), []);
  const points = ['tap', 'deleted', 'settings'] as const;
  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => answerMicPrimer(false)}
    >
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <GlowField
          glows={[
            { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
            { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
          ]}
        />
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: insets.top + 76 }}>
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: palette.selected,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="line/mic" size={36} color={palette.plum} />
          </View>
          <Text
            accessibilityRole="header"
            style={[
              Type.titleLg,
              { fontSize: 30, color: palette.ink, textAlign: 'center', marginTop: 28 },
            ]}
          >
            {t('micPrimer.title')}
          </Text>
          <Text
            style={[
              Type.body,
              {
                fontWeight: '400',
                lineHeight: 21,
                color: palette.textMuted,
                textAlign: 'center',
                marginTop: 14,
              },
            ]}
          >
            {t('micPrimer.body')}
          </Text>
          <View
            style={{
              alignSelf: 'stretch',
              marginTop: 24,
              borderRadius: 24,
              backgroundColor: palette.white,
              padding: 20,
              gap: 14,
            }}
          >
            {points.map((p) => (
              <View key={p} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="line/check" size={16} color={palette.plum} />
                <Text
                  style={[
                    Type.captionM,
                    { flex: 1, fontSize: 14, lineHeight: 19, color: palette.plumDeep },
                  ]}
                >
                  {t(`micPrimer.points.${p}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View
          style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 16 }}
        >
          <AppButton title={t('micPrimer.allow')} onPress={() => answerMicPrimer(true)} />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => answerMicPrimer(false)}>
            <Text
              style={[
                Type.body,
                { fontSize: 14, fontWeight: '600', color: palette.plum, textAlign: 'center' },
              ]}
            >
              {t('micPrimer.notNow')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
