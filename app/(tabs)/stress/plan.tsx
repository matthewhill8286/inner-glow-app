import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { AppButton } from '@/components/ui/AppButton';
import { Tag } from '@/components/ui/Chip';
import { toast } from '@/components/Toast';
import { useStress } from '@/hooks/useStress';
import type { StressKit } from '@/lib/types';
import { backTo } from '@/lib/navigation';
import { addPlanItem, planFilled } from '@/lib/stress-relief';

type ListKey = 'triggers' | 'helpfulActions' | 'people';
const LISTS: ListKey[] = ['triggers', 'helpfulActions', 'people'];
const EMPTY: StressKit = { quickPhrase: '', triggers: [], helpfulActions: [], people: [], notes: '' };

const fieldStyle = [Type.bodyM, { color: palette.ink }];

/**
 * Stress plan: a quick phrase for hard moments, what sets stress off, what helps, who to reach out
 * to, and notes. Saved as the stress kit the Stress relief hub shows.
 */
export default function StressPlan() {
  const { t } = useTranslation();
  const { stressKit, saveStressKit, isSavingKit } = useStress({ lazy: true });
  const [draft, setDraft] = useState<StressKit>(EMPTY);
  const [inputs, setInputs] = useState<Record<ListKey, string>>({ triggers: '', helpfulActions: '', people: '' });
  const back = () => backTo(undefined, '/(tabs)/stress');

  useEffect(() => {
    if (stressKit) setDraft(stressKit);
  }, [stressKit]);

  const add = (key: ListKey) => {
    setDraft((d) => ({ ...d, [key]: addPlanItem(d[key], inputs[key]) }));
    setInputs((i) => ({ ...i, [key]: '' }));
  };
  const remove = (key: ListKey, index: number) => setDraft((d) => ({ ...d, [key]: d[key].filter((_, i) => i !== index) }));

  const save = async () => {
    Keyboard.dismiss();
    // Anything still typed in an add field is kept too.
    const next = LISTS.reduce<StressKit>((k, key) => ({ ...k, [key]: addPlanItem(k[key], inputs[key]) }), {
      ...draft,
      quickPhrase: draft.quickPhrase?.trim() ?? '',
      notes: draft.notes ?? '',
    });
    try {
      await saveStressKit(next);
      toast.success(t('stressRelief.plan.saved'));
      back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('stressRelief.error'));
    }
  };

  const card = { backgroundColor: palette.surface, borderRadius: 24, padding: 18, gap: 12 } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SettingsScreen
        title={t('stressRelief.plan.nav')}
        backLabel={t('common.back')}
        onBack={back}
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -40, width: 280, blur: 90 },
          { color: palette.rose, opacity: 0.2, x: 190, y: 80, width: 220, blur: 90 },
        ]}
        contentStyle={{ gap: 24 }}
        cta={<AppButton title={t('stressRelief.plan.save')} busy={isSavingKit} onPress={() => void save()} />}
      >
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="header" style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}>
            {t('stressRelief.plan.title')}
          </Text>
          <Text style={[Type.bodySm, { color: palette.textMuted }]}>{t('stressRelief.plan.body')}</Text>
          <Text style={[Type.labelM, { color: palette.plum, marginTop: 4 }]}>{t('stressRelief.planFilled', { filled: planFilled(draft) })}</Text>
        </View>

        <SettingsSection label={t('stressRelief.plan.phrase.label').toUpperCase()}>
          <View style={card}>
            <Text style={[Type.captionM, { color: palette.textMuted }]}>{t('stressRelief.plan.phrase.hint')}</Text>
            <TextInput
              value={draft.quickPhrase ?? ''}
              onChangeText={(v) => setDraft((d) => ({ ...d, quickPhrase: v }))}
              placeholder={t('stressRelief.defaultPhrase')}
              placeholderTextColor={palette.textSubtle}
              accessibilityLabel={t('stressRelief.plan.phrase.label')}
              multiline
              style={[fieldStyle, { minHeight: 64, backgroundColor: palette.bg, borderRadius: 16, padding: 14, textAlignVertical: 'top' }]}
            />
          </View>
        </SettingsSection>

        {LISTS.map((key) => (
          <SettingsSection key={key} label={t(`stressRelief.plan.${key}.label`).toUpperCase()}>
            <View style={card}>
              <Text style={[Type.captionM, { color: palette.textMuted }]}>{t(`stressRelief.plan.${key}.hint`)}</Text>
              {draft[key].length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {draft[key].map((item, i) => (
                    <Tag
                      key={item}
                      label={item}
                      variant="brand"
                      onRemove={() => remove(key, i)}
                      style={{ height: 30, paddingHorizontal: 12 }}
                    />
                  ))}
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={inputs[key]}
                  onChangeText={(v) => setInputs((s) => ({ ...s, [key]: v }))}
                  onSubmitEditing={() => add(key)}
                  submitBehavior="submit"
                  returnKeyType="done"
                  placeholder={t(`stressRelief.plan.${key}.placeholder`)}
                  placeholderTextColor={palette.textSubtle}
                  accessibilityLabel={t(`stressRelief.plan.${key}.placeholder`)}
                  style={[fieldStyle, { flex: 1, height: 46, backgroundColor: palette.bg, borderRadius: 16, paddingHorizontal: 14 }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('stressRelief.plan.add')}
                  disabled={!inputs[key].trim()}
                  onPress={() => add(key)}
                  style={({ pressed }) => ({
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: palette.plum,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: !inputs[key].trim() ? 0.4 : pressed ? 0.8 : 1,
                  })}
                >
                  <Icon name="line/plus" size={20} color={palette.white} />
                </Pressable>
              </View>
            </View>
          </SettingsSection>
        ))}

        <SettingsSection label={t('stressRelief.plan.notes.label').toUpperCase()}>
          <View style={card}>
            <TextInput
              value={draft.notes ?? ''}
              onChangeText={(v) => setDraft((d) => ({ ...d, notes: v }))}
              placeholder={t('stressRelief.plan.notes.placeholder')}
              placeholderTextColor={palette.textSubtle}
              accessibilityLabel={t('stressRelief.plan.notes.label')}
              multiline
              style={[fieldStyle, { minHeight: 96, backgroundColor: palette.bg, borderRadius: 16, padding: 14, textAlignVertical: 'top' }]}
            />
          </View>
        </SettingsSection>
      </SettingsScreen>
    </KeyboardAvoidingView>
  );
}
