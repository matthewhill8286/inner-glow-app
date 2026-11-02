import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/controls';
import { toast } from '@/components/Toast';
import { useStressHistory } from '@/hooks/useStressHistory';
import { backTo } from '@/lib/navigation';
import {
  GROUNDING_ID,
  GROUNDING_TOTAL,
  SENSES,
  emptyGrounding,
  groundingFilled,
  groundingStage,
  type SenseKey,
} from '@/lib/stress-relief';

const TINTS: Record<SenseKey, string> = {
  see: palette.sky,
  feel: palette.mustard,
  hear: palette.lavenderSoft,
  smell: palette.rose,
  taste: palette.lavender,
};

/**
 * Grounding 5-4-3-2-1: name five things you can see, four you can feel, three you can hear, two
 * you can smell and one you can taste. Finishing saves it to stress history.
 */
export default function Grounding() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { addStressCompletion, isAddingHistory } = useStressHistory();
  const [answers, setAnswers] = useState(emptyGrounding);
  const filled = useMemo(() => groundingFilled(answers), [answers]);
  const stage = groundingStage(filled);
  const back = () => backTo(undefined, '/(tabs)/stress');

  const update = (key: SenseKey, index: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: prev[key].map((v, i) => (i === index ? value : v)) }));

  const done = async () => {
    try {
      await addStressCompletion(GROUNDING_ID, t('stressRelief.grounding.title'));
      toast.success(t('stressRelief.grounding.saved'));
      back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('stressRelief.error'));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SettingsScreen
        title={t('stressRelief.grounding.nav')}
        backLabel={t('common.back')}
        onBack={back}
        glows={[
          { color: palette.mustard, opacity: 0.2, x: -60, y: -20, width: 260, blur: 90 },
          { color: palette.sky, opacity: 0.25, x: 190, y: 60, width: 240, blur: 90 },
        ]}
        contentStyle={{ gap: 16 }}
        cta={
          <AppButton
            title={t(stage === 'done' ? 'stressRelief.grounding.grounded' : 'stressRelief.grounding.finish')}
            disabled={filled === 0}
            busy={isAddingHistory}
            onPress={() => void done()}
          />
        }
      >
        <View style={{ gap: 8, marginBottom: 4 }}>
          <Text accessibilityRole="header" style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}>
            {t('stressRelief.grounding.title')}
          </Text>
          <Text style={[Type.bodySm, { color: palette.textMuted }]}>{t('stressRelief.grounding.body')}</Text>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[Type.captionM, { color: palette.textMuted }]}>{t(`stressRelief.grounding.stage.${stage}`)}</Text>
            <Text style={[Type.labelM, { color: palette.plum }]}>{`${filled}/${GROUNDING_TOTAL}`}</Text>
          </View>
          <ProgressBar value={filled / GROUNDING_TOTAL} width={width - 48} gradient />
        </View>

        {SENSES.map((sense) => (
          <View key={sense.key} style={{ backgroundColor: palette.surface, borderRadius: 24, padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: TINTS[sense.key],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[Type.bodyStrong, { color: sense.key === 'taste' ? palette.white : palette.ink }]}>{sense.count}</Text>
              </View>
              <Text accessibilityRole="header" style={[Type.bodyStrong, { flex: 1, color: palette.ink }]}>
                {t(`stressRelief.grounding.senses.${sense.key}`, { count: sense.count })}
              </Text>
            </View>
            {answers[sense.key].map((value, i) => {
              const isFilled = value.trim().length > 0;
              return (
                <View
                  key={i}
                  style={{
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: isFilled ? palette.surfaceLilacSoft : palette.bg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: isFilled ? palette.plum : 'transparent',
                      borderWidth: isFilled ? 0 : 1.5,
                      borderColor: palette.borderStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isFilled && <Icon name="line/check" size={12} color={palette.white} />}
                  </View>
                  <TextInput
                    value={value}
                    onChangeText={(text) => update(sense.key, i, text)}
                    placeholder={t('stressRelief.grounding.placeholder', { count: i + 1 })}
                    placeholderTextColor={palette.textSubtle}
                    accessibilityLabel={`${t(`stressRelief.grounding.senses.${sense.key}`, { count: sense.count })}, ${i + 1}`}
                    returnKeyType="next"
                    style={[Type.bodyM, { flex: 1, color: palette.ink }]}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </SettingsScreen>
    </KeyboardAvoidingView>
  );
}
