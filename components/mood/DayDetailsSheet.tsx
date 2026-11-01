import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Tag } from '@/components/ui/Chip';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { useJournal } from '@/hooks/useJournal';
import { moodScoreOf, moodStep } from '@/lib/mood-scale';
import type { MoodCheckIn } from '@/lib/types';

/**
 * Mood · Day details (09 §3.14, `6787:9281`): a flat mood orb, the mood word and when it was
 * logged, factor tags, the note, the linked journal entry and a Glow AI talk seeded with the day.
 * Rows without data are hidden.
 */
export function DayDetailsSheet({
  log,
  onClose,
}: {
  log: MoodCheckIn | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { journalEntries } = useJournal();
  if (!log)
    return (
      <BottomSheet visible={false} onClose={onClose}>
        {null}
      </BottomSheet>
    );

  const step = moodStep(moodScoreOf(log.mood));
  const mood = t(`moodScale.${step.key}`);
  const when = new Date(log.createdAt);
  const date = when.toLocaleDateString(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = when.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  const factors = (log.factors ?? []).map((f) => t(`moodCheckIn2.factor.${f}`));
  const journal = journalEntries.find((e) => e.moodLogId === log.id);

  const talk = () => {
    const prompt = t('moodDay.talkPrompt', {
      date,
      mood: mood.toLocaleLowerCase(),
      factors: factors.length ? t('moodDay.talkFactors', { factors: factors.join(', ') }) : '',
      note: log.note ? t('moodDay.talkNote', { note: log.note }) : '',
    });
    onClose();
    router.push({
      pathname: '/(tabs)/chat/new-conversation',
      params: { initialMessage: prompt, from: '/(tabs)/mood' },
    });
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      background={palette.bg}
      gap={16}
      closeLabel={t('moodDay.close')}
    >
      <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
        <Svg width={56} height={56} accessibilityElementsHidden>
          <Defs>
            <RadialGradient id="dayOrb" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="1" stopColor={step.color} />
            </RadialGradient>
          </Defs>
          <Circle cx={28} cy={28} r={28} fill="url(#dayOrb)" />
        </Svg>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 22, lineHeight: 30, color: palette.ink }]}
        >
          {mood}
        </Text>
        <Text style={[Type.captionM, { color: palette.textMuted }]}>
          {t('moodHome.loggedOn', { date, time })}
        </Text>
      </View>

      {factors.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {factors.map((f) => (
            <Tag key={f} label={f} />
          ))}
        </View>
      )}

      <View style={{ alignSelf: 'stretch', gap: 16 }}>
        {log.note ? (
          <View style={{ backgroundColor: palette.white, borderRadius: 20, padding: 16, gap: 6 }}>
            <Text
              style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}
            >
              {t('moodDay.yourNote')}
            </Text>
            <Text style={[Type.bodySm, { color: palette.plumDeep }]}>{log.note}</Text>
          </View>
        ) : null}
        <ListGroup>
          {journal && (
            <ListRow
              icon="line/journal"
              label={t('moodDay.openJournal')}
              onPress={() => {
                onClose();
                router.push({ pathname: '/(tabs)/journal/[id]', params: { id: journal.id } });
              }}
            />
          )}
          <ListRow icon="line/sparkle" label={t('moodDay.talk')} onPress={talk} />
        </ListGroup>
        <AppButton title={t('moodDay.close')} variant="text" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
