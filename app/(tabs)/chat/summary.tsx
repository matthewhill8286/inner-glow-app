import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { GlowField, GlowOrb } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { Toggle } from '@/components/ui/controls';
import { toast } from '@/components/Toast';
import { useChat } from '@/hooks/useChat';
import { useJournal } from '@/hooks/useJournal';
import { useUser } from '@/hooks/useUser';
import { summariseChat } from '@/lib/chat';
import { checkInAgainTime } from '@/lib/talks';
import { scheduleNotification } from '@/lib/notifications';
import { queryKeys } from '@/lib/queryKeys';

/** Mood pill fills at 50% (05 §3.5), following the mood spectrum. */
const MOOD_FILL: Record<string, string> = {
  angry: `${palette.rose}80`,
  sad: `${palette.lavenderSoft}80`,
  neutral: '#E8DFD280',
  happy: `${palette.mustard}80`,
  'very-happy': `${palette.sky}80`,
};

function MoodPill({ mood, label }: { mood: string | null; label: string | null }) {
  if (!mood && !label) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingVertical: 5,
        paddingLeft: 8,
        paddingRight: 12,
        backgroundColor: MOOD_FILL[mood ?? 'neutral'],
      }}
    >
      {mood && <Icon name={`mood/${mood}` as IconName} size={16} />}
      {label && <Text style={[Type.buttonS, { fontSize: 13, color: palette.ink }]}>{label}</Text>}
    </View>
  );
}

function Card({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <View
      style={{
        backgroundColor: palette.white,
        borderRadius: 24,
        padding: 20,
        paddingTop: 16,
        gap: 10,
      }}
    >
      {eyebrow && (
        <Text
          style={[
            Type.microBold,
            { lineHeight: 15, color: palette.lavender, textTransform: 'uppercase' },
          ]}
        >
          {eyebrow}
        </Text>
      )}
      {children}
    </View>
  );
}

/**
 * Glow AI · Session summary (05 §3.5): what the talk covered, mood before and after, up to three key
 * points, a one-off check-in reminder three hours ahead, Save to journal and Continue talking. The
 * chat-summary function writes the summary, which also feeds "Remember our talks".
 */
export default function SessionSummary() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { issueKey } = useLocalSearchParams<{ issueKey: string }>();
  const { data: user } = useUser();
  const { history, isLoading: historyLoading } = useChat();
  const { createJournalEntry, isCreating } = useJournal();
  const messages = history[issueKey ?? ''] ?? [];
  const [saved, setSaved] = useState(false);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const checkIn = checkInAgainTime();

  const summary = useQuery({
    queryKey: queryKeys.chat.summary(user?.id, `${issueKey}:${messages.length}`),
    enabled: !!user && !!issueKey && !historyLoading && messages.length > 0,
    staleTime: Infinity,
    retry: false,
    queryFn: () =>
      summariseChat(
        issueKey!,
        messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
        i18n.language,
      ),
  });

  const close = () => router.dismissTo('/(tabs)/chat');

  async function toggleReminder(on: boolean) {
    try {
      if (!on) {
        if (reminderId) await Notifications.cancelScheduledNotificationAsync(reminderId);
        setReminderId(null);
        return;
      }
      const date = new Date();
      if (checkIn.hour <= date.getHours()) date.setDate(date.getDate() + 1);
      date.setHours(checkIn.hour, 0, 0, 0);
      const id = await scheduleNotification(
        t('glowAi.summary.reminderNotificationTitle'),
        t('glowAi.summary.reminderNotificationBody'),
        { url: '/(tabs)/chat' },
        { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      );
      setReminderId(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function saveToJournal() {
    const s = summary.data;
    if (!s) return;
    try {
      await createJournalEntry({
        title: s.title,
        content: [s.summary, ...s.keyPoints.map((p) => `• ${p}`)].filter(Boolean).join('\n'),
        tags: ['Glow AI'],
        topicContext: 'glow-ai',
      });
      setSaved(true);
      toast.success(t('glowAi.summary.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const s = summary.data;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.22, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.28, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <IconButton
          variant="glass"
          icon="arrow/close"
          accessibilityLabel={t('glowAi.summary.close')}
          onPress={close}
          style={{ alignSelf: 'flex-end' }}
        />
        <GlowOrb size={106} style={{ alignSelf: 'center', marginTop: 8 }} />

        {!s ? (
          <View style={{ alignItems: 'center', gap: 14, marginTop: 40 }}>
            {summary.isError ? (
              <>
                <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>
                  {t('glowAi.summary.error')}
                </Text>
                <AppButton
                  title={t('glowAi.summary.retry')}
                  variant="outline"
                  size="s"
                  onPress={() => void summary.refetch()}
                />
              </>
            ) : (
              <>
                <ActivityIndicator color={palette.plum} />
                <Text style={[Type.bodySm, { color: palette.textMuted }]}>
                  {t('glowAi.summary.loading')}
                </Text>
              </>
            )}
          </View>
        ) : (
          <>
            <Text
              accessibilityRole="header"
              style={[
                Type.titleMd,
                {
                  fontSize: 26,
                  lineHeight: 36,
                  color: palette.ink,
                  textAlign: 'center',
                  marginTop: 16,
                },
              ]}
            >
              {t('glowAi.summary.title')}
            </Text>
            <Text
              style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center', marginTop: 2 }]}
            >
              {t('glowAi.summary.subtitle', { count: s.minutes })}
            </Text>

            <View style={{ gap: 12, marginTop: 24 }}>
              {(s.moodBefore || s.moodAfter) && (
                <Card eyebrow={t('glowAi.summary.mood')}>
                  <View
                    accessible
                    accessibilityLabel={t('glowAi.summary.moodChange', {
                      before: s.moodBeforeLabel ?? s.moodBefore,
                      after: s.moodAfterLabel ?? s.moodAfter,
                    })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <MoodPill mood={s.moodBefore} label={s.moodBeforeLabel} />
                    <Icon name="arrow/forward" size={18} />
                    <MoodPill mood={s.moodAfter} label={s.moodAfterLabel} />
                  </View>
                </Card>
              )}
              {s.keyPoints.length > 0 && (
                <Card eyebrow={t('glowAi.summary.cameUp')}>
                  {s.keyPoints.map((point) => (
                    <View
                      key={point}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: palette.mustard,
                        }}
                      />
                      <Text style={[Type.bodySm, { flex: 1, color: palette.ink }]}>{point}</Text>
                    </View>
                  ))}
                </Card>
              )}
              <View
                style={{
                  backgroundColor: palette.white,
                  borderRadius: 24,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(142,127,166,0.14)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="line/bell" size={20} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}>
                    {t('glowAi.summary.reminderTitle', { time: checkIn.label })}
                  </Text>
                  <Text style={[Type.captionS, { lineHeight: 17, color: palette.textSubtle }]}>
                    {t('glowAi.summary.reminderBody')}
                  </Text>
                </View>
                <Toggle
                  value={!!reminderId}
                  onValueChange={(v) => void toggleReminder(v)}
                  accessibilityLabel={t('glowAi.summary.reminderTitle', { time: checkIn.label })}
                />
              </View>
            </View>

            <AppButton
              title={saved ? t('glowAi.summary.saved') : t('glowAi.summary.save')}
              icon="line/journal"
              iconPosition="left"
              disabled={saved || isCreating}
              onPress={() => void saveToJournal()}
              style={{ marginTop: 32 }}
            />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={10}
          style={{ alignSelf: 'center', marginTop: 18 }}
        >
          <Text style={[Type.buttonS, { fontSize: 14, color: palette.lavender }]}>
            {t('glowAi.summary.continue')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
