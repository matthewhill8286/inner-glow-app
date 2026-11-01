import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';
import { Chip } from '@/components/ui/Chip';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { useChat } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';
import type { UserProfile } from '@/lib/types';

const TONES = ['gentle', 'direct', 'playful'] as const;
/** The design's destructive text colour (05 §3.8). */
const DELETE_TEXT = '#C9744F';

/**
 * Glow AI settings (05 §3.8): the reply tone, Remember our talks, Use my journal and Voice replies,
 * saved on the profile and read by the chat function. Also links to the AI data permission and
 * deletes every conversation. Voice replies take effect once voice mode exists.
 */
export default function GlowAiSettings() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { profile, updateProfile } = useProfile({ lazy: true });
  const { clearAll, isClearing } = useChat();

  const save = (updates: Partial<UserProfile>) =>
    updateProfile(updates).catch(() => toast.error(t('glowAi.settingsScreen.saveError')));

  const confirmDeleteAll = () =>
    showAlert(t('glowAi.settingsScreen.deleteTitle'), t('glowAi.settingsScreen.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('glowAi.settingsScreen.delete'),
        style: 'destructive',
        onPress: () =>
          void clearAll().then(
            () => toast.success(t('glowAi.settingsScreen.deleted')),
            (err) => toast.error(err instanceof Error ? err.message : String(err)),
          ),
      },
    ]);

  const tone = profile?.aiTone ?? 'gentle';
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.22, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.28, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <NavBar
        title={t('glowAi.settingsScreen.title')}
        backLabel={t('common.back')}
        onBack={() => backTo(from, '/(tabs)/chat')}
        style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 26,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <Text
          accessibilityRole="header"
          style={[Type.buttonS, { fontSize: 13, color: palette.ink }]}
        >
          {t('glowAi.settingsScreen.tone')}
        </Text>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}
        >
          {TONES.map((key) => (
            <Chip
              key={key}
              kind="option"
              label={t(`glowAi.settingsScreen.tones.${key}`)}
              selected={tone === key}
              onPress={() => void save({ aiTone: key })}
            />
          ))}
        </View>

        <ListGroup style={{ marginTop: 20 }}>
          <ListRow
            icon="line/sparkle"
            label={t('glowAi.settingsScreen.memory')}
            supportingText={t('glowAi.settingsScreen.memoryBody')}
            trailing="toggle"
            toggled={profile?.aiMemory ?? true}
            onToggle={(v) => void save({ aiMemory: v })}
          />
          <ListRow
            icon="line/journal"
            label={t('glowAi.settingsScreen.journal')}
            supportingText={t('glowAi.settingsScreen.journalBody')}
            trailing="toggle"
            toggled={profile?.aiJournal ?? true}
            onToggle={(v) => void save({ aiJournal: v })}
          />
          <ListRow
            icon="line/mic"
            label={t('glowAi.settingsScreen.voice')}
            supportingText={t('glowAi.settingsScreen.voiceBody')}
            trailing="toggle"
            toggled={profile?.aiVoiceReplies ?? false}
            onToggle={(v) => void save({ aiVoiceReplies: v })}
          />
          <ListRow
            icon="line/shield"
            label={t('glowAi.settingsScreen.privacy')}
            supportingText={t('glowAi.settingsScreen.privacyBody')}
            onPress={() => router.push('/(utils)/ai-privacy')}
          />
        </ListGroup>

        <Pressable
          accessibilityRole="button"
          disabled={isClearing}
          onPress={confirmDeleteAll}
          style={({ pressed }) => ({
            marginTop: 16,
            minHeight: 56,
            borderRadius: 22,
            backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 20,
            paddingRight: 18,
            opacity: isClearing ? 0.5 : 1,
          })}
        >
          <Text style={[Type.bodyMSemi, { flex: 1, lineHeight: 21, color: DELETE_TEXT }]}>
            {t('glowAi.settingsScreen.deleteAll')}
          </Text>
          <Icon name="arrow/chevron-right" size={18} />
        </Pressable>

        <Text style={[Type.captionS, { lineHeight: 17, color: palette.textSubtle, marginTop: 16 }]}>
          {t('glowAi.settingsScreen.footnote')}
        </Text>
      </ScrollView>
    </View>
  );
}
