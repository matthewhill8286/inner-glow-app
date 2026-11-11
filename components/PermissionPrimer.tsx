import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { answerPrimer, onPrimer, type PrimerKind } from '@/lib/permission-primer';

const LOOK: Record<PrimerKind, { icon: 'line/mic' | 'line/health'; points: readonly string[] }> = {
  mic: { icon: 'line/mic', points: ['tap', 'deleted', 'settings'] },
  health: { icon: 'line/health', points: ['choose', 'neverWrite', 'disconnect'] },
};

/**
 * Permission primers: Talk instead of typing (`6801:6542`) and Bring in your sleep (`6801:6587`).
 * The orb, why the permission is needed, three promises, then the allow button (which leads to the
 * iOS prompt) and Not now.
 */
export function PermissionPrimer() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<PrimerKind | null>(null);
  const [shown, setShown] = useState<PrimerKind>('mic');
  useEffect(
    () =>
      onPrimer((k) => {
        setKind(k);
        if (k) setShown(k);
      }),
    [],
  );
  const look = LOOK[shown];
  const key = shown === 'mic' ? 'micPrimer' : 'healthPrimer';
  return (
    <Modal
      visible={!!kind}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => answerPrimer(false)}
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
            <Icon name={look.icon} size={36} color={palette.plum} />
          </View>
          <Text
            accessibilityRole="header"
            style={[
              Type.titleLg,
              { fontSize: 30, color: palette.ink, textAlign: 'center', marginTop: 28 },
            ]}
          >
            {t(`${key}.title`)}
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
            {t(`${key}.body`)}
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
            {look.points.map((p) => (
              <View key={p} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="line/check" size={16} color={palette.plum} />
                <Text
                  style={[
                    Type.captionM,
                    { flex: 1, fontSize: 14, lineHeight: 19, color: palette.plumDeep },
                  ]}
                >
                  {t(`${key}.points.${p}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View
          style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 16 }}
        >
          <AppButton title={t(`${key}.allow`)} onPress={() => answerPrimer(true)} />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => answerPrimer(false)}>
            <Text
              style={[
                Type.body,
                { fontSize: 14, fontWeight: '600', color: palette.plum, textAlign: 'center' },
              ]}
            >
              {t(`${key}.notNow`)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
