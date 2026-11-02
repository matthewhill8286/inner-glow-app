import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { LegalNote } from '@/components/ui/controls';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { toast } from '@/components/Toast';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import { aiPermission, requestAIPermission, setAIPermission } from '@/lib/ai-privacy';
import { exportMyData } from '@/lib/data-export-run';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';

/**
 * Glow AI & your data (06 §P6): what Glow AI may use, Download my data and Clear chat history.
 * The first switch is the AI processing permission every AI feature asks for; memory and journal
 * are the profile settings the chat function reads. Figma's "Use mood & sleep data" has no
 * separate control yet, so it is not shown.
 */
export default function GlowAiDataScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { profile, updateProfile } = useProfile({ lazy: true });
  const { clearAll } = useChat();
  const [allowed, setAllowed] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) void aiPermission(user.id).then((v) => setAllowed(v === 'allowed'));
  }, [user]);

  const togglePermission = async (on: boolean) => {
    if (!user) return;
    if (on) setAllowed(await requestAIPermission(user.id, true));
    else {
      await setAIPermission(user.id, false);
      setAllowed(false);
    }
    // Cached AI answers came from the old setting.
    queryClient.removeQueries({ queryKey: ['moodInsights'] });
    queryClient.removeQueries({ queryKey: ['sleepInsights'] });
  };
  const save = (updates: Parameters<typeof updateProfile>[0]) =>
    updateProfile(updates).catch(() => toast.error(t('aiData.saveError')));

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
  const clear = () =>
    showAlert(t('aiData.clearTitle'), t('aiData.clearBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('aiData.clear'),
        style: 'destructive',
        onPress: () =>
          void clearAll().then(
            () => toast.success(t('aiData.cleared')),
            () => toast.error(t('aiData.clearError')),
          ),
      },
    ]);

  return (
    <SettingsScreen
      title={t('aiData.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.22, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.sky, opacity: 0.18, x: 200, y: 40, width: 220, blur: 90 },
      ]}
    >
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ width: 120, height: 92, alignItems: 'center', justifyContent: 'center' }}>
          <Glow color={palette.lavenderSoft} opacity={0.35} width={120} blur={36} style={{ position: 'absolute', left: 0, top: -12 }} />
          <Glow color={palette.mustard} opacity={0.35} width={80} blur={24} style={{ position: 'absolute', left: 30, top: 8 }} />
          <Svg width={56} height={56}>
            <Defs>
              <RadialGradient id="aiOrb" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={palette.cream} />
                <Stop offset="1" stopColor={palette.plum} />
              </RadialGradient>
            </Defs>
            <Circle cx={28} cy={28} r={28} fill="url(#aiOrb)" />
          </Svg>
          <View style={{ position: 'absolute' }}>
            <Icon name="line/sparkle" size={22} color={palette.white} />
          </View>
        </View>
        <Text accessibilityRole="header" style={[Type.titleMd, { color: palette.ink, textAlign: 'center', maxWidth: 295 }]}>
          {t('aiData.heroTitle')}
        </Text>
        <Text style={[Type.bodyS, { lineHeight: 20, color: palette.textMuted, textAlign: 'center', maxWidth: 295 }]}>{t('aiData.heroBody')}</Text>
      </View>

      <SettingsSection label={t('aiData.personalisation')}>
        <ListGroup>
          <ListRow
            label={t('aiData.processing')}
            supportingText={t('aiData.processingBody')}
            trailing="toggle"
            toggled={allowed}
            onToggle={(v) => void togglePermission(v)}
          />
          <ListRow
            label={t('aiData.memory')}
            supportingText={t('aiData.memoryBody')}
            trailing="toggle"
            toggled={profile?.aiMemory ?? true}
            onToggle={(v) => void save({ aiMemory: v })}
          />
          <ListRow
            label={t('aiData.journal')}
            supportingText={t('aiData.journalBody')}
            trailing="toggle"
            toggled={profile?.aiJournal ?? true}
            onToggle={(v) => void save({ aiJournal: v })}
          />
        </ListGroup>
      </SettingsSection>

      <SettingsSection label={t('aiData.yourData')}>
        <ListGroup>
          <ListRow icon="line/download" label={exporting ? t('aiData.exporting') : t('aiData.download')} onPress={exporting ? undefined : download} />
          <ListRow icon="line/chat" label={t('aiData.clear')} tone="danger" onPress={clear} />
        </ListGroup>
      </SettingsSection>

      <View style={{ gap: 12 }}>
        <LegalNote text={t('aiData.legal')} />
        <Pressable accessibilityRole="link" onPress={() => router.push('/(utils)/legal')} hitSlop={6}>
          <LegalNote text={t('aiData.privacyLink')} />
        </Pressable>
      </View>
    </SettingsScreen>
  );
}
