import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LegalNote } from '@/components/ui/controls';
import { toast } from '@/components/Toast';
import { supabase } from '@/supabase/supabase';

export const FEEDBACK_REASONS = [
  'not_accurate',
  'didnt_help',
  'inappropriate',
  'too_long',
  'other',
] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        height: 26,
        paddingHorizontal: 12,
        borderRadius: 13,
        justifyContent: 'center',
        borderWidth: on ? 1.5 : 1,
        borderColor: on ? palette.plum : palette.borderLilac,
        backgroundColor: on ? palette.selected : palette.white,
      }}
    >
      <Text style={[Type.captionS, { color: palette.plumDeep }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * "Was this helpful?" under Glow AI's latest reply (`6839:7909`). No opens "What went wrong?"
 * (`6839:7992`) with five reasons and an optional note; either answer ends with the thanks toast
 * (`6839:8108`).
 */
export function ReplyFeedback({
  conversationKey,
  messageId,
}: {
  conversationKey: string;
  messageId: string;
}) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [sheet, setSheet] = useState(false);
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (helpful: boolean, why: FeedbackReason | null = null, text = '') => {
    setBusy(true);
    const { error } = await supabase.from('chat_feedback').upsert(
      {
        conversation_key: conversationKey,
        message_id: messageId,
        helpful,
        reason: why,
        note: text.trim() ? text.trim().slice(0, 500) : null,
      },
      { onConflict: 'user_id,message_id' },
    );
    setBusy(false);
    if (error) {
      toast.error(t('replyFeedback.error'));
      return false;
    }
    setAnswer(helpful);
    toast.success(t('replyFeedback.thanks'));
    return true;
  };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Text style={[Type.captionS, { color: palette.textMuted }]}>
          {t('replyFeedback.question')}
        </Text>
        <Pill label={t('replyFeedback.yes')} on={answer === true} onPress={() => void save(true)} />
        <Pill label={t('replyFeedback.no')} on={answer === false} onPress={() => setSheet(true)} />
      </View>
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} gap={12}>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleSm,
            { fontSize: 22, lineHeight: 28, color: palette.ink, textAlign: 'center', marginTop: 8 },
          ]}
        >
          {t('replyFeedback.title')}
        </Text>
        <Text
          style={[Type.captionM, { fontSize: 14, color: palette.textMuted, textAlign: 'center' }]}
        >
          {t('replyFeedback.body')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' }}>
          {FEEDBACK_REASONS.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r }}
              onPress={() => setReason(reason === r ? null : r)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                borderWidth: reason === r ? 1.5 : 1,
                borderColor: reason === r ? palette.plum : palette.borderLilac,
                backgroundColor: reason === r ? palette.selected : palette.white,
              }}
            >
              <Text style={[Type.captionM, { fontSize: 14, color: palette.plumDeep }]}>
                {t(`replyFeedback.reasons.${r}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, alignSelf: 'flex-start', marginTop: 4 },
          ]}
        >
          {t('replyFeedback.more')}
        </Text>
        <TextInput
          accessibilityLabel={t('replyFeedback.more')}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={500}
          style={[
            Type.body,
            {
              alignSelf: 'stretch',
              minHeight: 64,
              borderRadius: 18,
              backgroundColor: palette.white,
              padding: 14,
              color: palette.ink,
            },
          ]}
        />
        <LegalNote text={t('replyFeedback.legal')} style={{ alignSelf: 'stretch' }} />
        <View style={{ alignSelf: 'stretch', gap: 4 }}>
          <AppButton
            title={t('replyFeedback.send')}
            busy={busy}
            onPress={() =>
              void save(false, reason, note).then((ok) => {
                if (ok) setSheet(false);
              })
            }
          />
          <AppButton title={t('common.cancel')} variant="text" onPress={() => setSheet(false)} />
        </View>
      </BottomSheet>
    </>
  );
}
