import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { PASSCODE_LENGTH } from '@/lib/passcode';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'] as const;

/**
 * Enter your passcode (`6832:8264`): the title, six dots, the round white keys, the biometric key
 * bottom-left, Delete bottom-right. `onComplete` runs when six digits are in; returning false clears
 * the dots and shows `error`.
 */
export function PasscodePad({
  title,
  subtitle,
  error,
  onComplete,
  onBiometric,
}: {
  title: string;
  subtitle: string;
  error?: string | null;
  onComplete: (code: string) => Promise<boolean> | boolean;
  onBiometric?: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const press = async (k: (typeof KEYS)[number]) => {
    if (checking) return;
    if (k === 'bio') return onBiometric?.();
    if (k === 'del') return setCode((c) => c.slice(0, -1));
    const next = (code + k).slice(0, PASSCODE_LENGTH);
    setCode(next);
    void Haptics.selectionAsync().catch(() => undefined);
    if (next.length === PASSCODE_LENGTH) {
      setChecking(true);
      const ok = await onComplete(next);
      setChecking(false);
      if (!ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => undefined,
        );
        setCode('');
      }
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        accessibilityRole="header"
        style={[Type.titleLg, { fontSize: 26, color: palette.ink, textAlign: 'center' }]}
      >
        {title}
      </Text>
      <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center', marginTop: 8 }]}>
        {subtitle}
      </Text>
      <View
        accessible
        accessibilityLabel={t('passcode.entered', { count: code.length, total: PASSCODE_LENGTH })}
        style={{ flexDirection: 'row', gap: 14, marginTop: 28 }}
      >
        {Array.from({ length: PASSCODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: 7,
              borderWidth: 1.5,
              borderColor: error ? palette.danger : palette.plum,
              backgroundColor: i < code.length ? palette.plum : 'transparent',
            }}
          />
        ))}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={[Type.caption, { color: palette.danger, minHeight: 18, marginTop: 10 }]}
      >
        {error ?? ''}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: 3 * 76 + 2 * 26,
          gap: 14,
          columnGap: 26,
          marginTop: 8,
        }}
      >
        {KEYS.map((k) => {
          if (k === 'bio' && !onBiometric)
            return <View key={k} style={{ width: 76, height: 76 }} />;
          const round = k !== 'bio' && k !== 'del';
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={
                k === 'bio' ? t('passcode.useBiometric') : k === 'del' ? t('passcode.delete') : k
              }
              onPress={() => void press(k)}
              style={({ pressed }) => ({
                width: 76,
                height: 76,
                borderRadius: 38,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: round
                  ? pressed
                    ? palette.selected
                    : palette.white
                  : 'transparent',
              })}
            >
              {k === 'bio' ? (
                <Icon name="line/shield" size={22} color={palette.plum} />
              ) : k === 'del' ? (
                <Text style={[Type.captionM, { fontSize: 14, color: palette.plumDeep }]}>
                  {t('passcode.delete')}
                </Text>
              ) : (
                <Text
                  style={[Type.titleLg, { fontSize: 28, fontWeight: '400', color: palette.ink }]}
                >
                  {k}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
