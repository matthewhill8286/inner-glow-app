import React, { useState } from 'react';
import { Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { Icon, type IconName } from '@/components/icons/Icon';
import { LegalNote } from '@/components/ui/controls';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { toast } from '@/components/Toast';
import { supabase } from '@/supabase/supabase';
import { resetSubscription } from '@/hooks/useSubscription';
import { authTokenVar, showAlert } from '@/lib/state';
import { backTo } from '@/lib/navigation';
import { exportMyData } from '@/lib/data-export-run';

/** The server checks for this exact word, so it is not translated (06 §P14). */
const CONFIRM = 'DELETE';
const REMOVES: { icon: IconName; key: string }[] = [
  { icon: 'line/heart', key: 'mood' },
  { icon: 'line/journal', key: 'journal' },
  { icon: 'line/chat', key: 'talks' },
  { icon: 'line/moon', key: 'sleep' },
];

/**
 * Delete account (06 §P14): what deleting removes, Download my data first, type DELETE, then
 * Delete my account. The delete-account function, local clean-up and sign-out are unchanged.
 */
export default function DeleteAccount() {
  const { t } = useTranslation();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();
  async function removeAccount() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: 'DELETE' },
      });
      if (error || !data?.deleted)
        throw new Error(t('deleteFlow.failed'));
      await supabase.auth.signOut({ scope: 'local' });
      await AsyncStorage.clear();
      if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
        const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory).catch(
          () => [],
        );
        for (const name of files.filter((name) =>
          /^recording-.*\.(m4a|caf|wav|mp4|webm)$/i.test(name),
        )) {
          await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${name}`, { idempotent: true });
        }
      }
      resetSubscription();
      queryClient.clear();
      authTokenVar(null);
      router.replace('/(auth)/sign-in');
      toast.success(t('deleteFlow.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteFlow.failed'));
    } finally {
      setBusy(false);
    }
  }
  const download = async () => {
    setExporting(true);
    try {
      await exportMyData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aiData.exportError'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <SettingsScreen
      title={t('deleteFlow.header')}
      backLabel={t('common.back')}
      onBack={() => (busy ? undefined : backTo(undefined, '/(tabs)/profile/settings'))}
      glows={[
        { color: palette.rose, opacity: 0.18, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.lavenderSoft, opacity: 0.2, x: 200, y: 40, width: 220, blur: 90 },
      ]}
      contentStyle={{ gap: 14 }}
    >
      <View style={{ alignItems: 'center' }}>
        <Svg width={172} height={172}>
          <Defs>
            <RadialGradient id="deleteLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="0.6" stopColor={palette.rose} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.rose} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {[
            [44, 0.22],
            [64, 0.16],
            [84, 0.1],
          ].map(([r, o]) => (
            <Circle key={r} cx={86} cy={86} r={r} stroke={palette.danger} strokeOpacity={o} strokeWidth={1} fill="none" />
          ))}
          <Circle cx={86} cy={86} r={28} fill="url(#deleteLight)" />
        </Svg>
        <Text accessibilityRole="header" style={[Type.titleLg, { color: palette.ink, textAlign: 'center' }]}>{t('deleteFlow.title')}</Text>
        <Text style={[Type.bodyS, { lineHeight: 20, color: palette.textMuted, textAlign: 'center', marginTop: 8, maxWidth: 295 }]}>
          {t('deleteFlow.body')}
        </Text>
      </View>

      <View style={{ backgroundColor: palette.white, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 16, marginTop: 6 }}>
        {REMOVES.map((r) => (
          <View key={r.key} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={20} color={palette.danger} />
            </View>
            <Text style={[Type.bodySMedium, { flex: 1, color: palette.ink }]}>{t(`deleteFlow.removes.${r.key}`)}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={exporting}
        onPress={download}
        style={({ pressed }) => ({ minHeight: 76, borderRadius: 20, backgroundColor: palette.selected, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, opacity: pressed || exporting ? 0.7 : 1 })}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[Type.bodyMSemi, { color: palette.ink }]}>{t('deleteFlow.copyTitle')}</Text>
          <Text style={[Type.chipSelected, { color: palette.plum }]}>{exporting ? t('aiData.exporting') : t('aiData.download')}</Text>
        </View>
        <Icon name="arrow/chevron-right" size={18} />
      </Pressable>

      <Text style={[Type.labelM, { color: palette.lavender, marginTop: 6 }]}>{t('deleteFlow.typeLabel', { word: CONFIRM })}</Text>
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!busy}
        placeholder={CONFIRM}
        placeholderTextColor={palette.textSubtle}
        accessibilityLabel={t('deleteFlow.typeLabel', { word: CONFIRM })}
        style={[Type.bodyM, { height: 52, borderRadius: 16, borderWidth: confirmation ? 1.5 : 1, borderColor: confirmation ? palette.plum : palette.borderLilac, backgroundColor: palette.white, paddingHorizontal: 16, color: palette.ink }]}
      />

      <AppButton
        variant="danger"
        title={t('deleteFlow.delete')}
        busy={busy}
        disabled={confirmation !== CONFIRM}
        onPress={() =>
          showAlert(t('deleteFlow.confirmTitle'), t('deleteFlow.confirmBody'), [
            { text: t('deleteFlow.keep'), style: 'cancel' },
            { text: t('deleteFlow.delete'), style: 'destructive', onPress: () => void removeAccount() },
          ])
        }
        style={{ marginTop: 10 }}
      />
      <AppButton variant="text" title={t('deleteFlow.keep')} disabled={busy} onPress={() => backTo(undefined, '/(tabs)/profile/settings')} />
      {Platform.OS === 'ios' ? (
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://apps.apple.com/account/subscriptions')}>
          <LegalNote text={t('deleteFlow.billingIos')} />
        </Pressable>
      ) : (
        <LegalNote text={t('deleteFlow.billing')} />
      )}
    </SettingsScreen>
  );
}
