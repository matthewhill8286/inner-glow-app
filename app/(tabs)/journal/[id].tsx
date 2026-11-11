import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSpace } from '@/components/navigation/TabBarContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/iconData';
import { Glow, GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { LegalNote } from '@/components/ui/controls';
import { RecordingPill } from '@/components/journal/RecordingPill';
import { ReflectionCard } from '@/components/journal/ReflectionCard';
import { isStoredAudio } from '@/lib/journal-audio';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { IconButton, NavBar } from '@/components/ui/IconButton';
import { CrisisSheet } from '@/components/chat/CrisisSheet';
import { toast } from '@/components/Toast';
import { useJournal } from '@/hooks/useJournal';
import {
  entryExportText,
  journalDate,
  journalMoodScore,
  movedDate,
  needsCrisisSupport,
} from '@/lib/journal-entry';
import { moodStep } from '@/lib/mood-scale';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';
import type { JournalEntry } from '@/lib/types';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';
import { journalTalkPrompt } from '@/lib/journal-entry';

function clock(iso: string, lang: string) {
  return new Date(iso).toLocaleTimeString(lang, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Journal entry (04 J5 with the 10 §3.11 changes): date title with a `more` button, the mood and
 * time line, title, body, tags, and "Talk it through with Glow AI". The `more` button opens the
 * Entry options sheet (`6770:4929`): Edit, Change date, Export and Delete entry.
 *
 * The reflection card and suggested practice need the journal-reflection function, which does
 * not exist yet, so they are left out. Crisis language opens the crisis sheet (04 §C).
 */
export default function JournalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomSpace = useBottomSpace();
  const { journalEntries, isLoading, deleteJournalEntry, changeJournalDate } = useJournal();
  const entry = journalEntries.find((e) => e.id === id);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const crisis = useMemo(() => needsCrisisSupport(entry?.content), [entry?.content]);
  useEffect(() => {
    if (crisis) setCrisisOpen(true);
  }, [crisis]);

  const back = () => backTo(undefined, '/(tabs)/journal');

  if (!entry) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          paddingTop: insets.top + 6,
          paddingHorizontal: 16,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={back}
          title={isLoading ? t('journalDetail.loading') : t('journalDetail.entryNotFound')}
        />
      </View>
    );
  }

  const score = journalMoodScore(entry.mood);
  const step = score ? moodStep(score) : null;
  const moodLabel = step ? t(`moodScale.${step.key}`) : null;
  const time = clock(entry.createdAt, i18n.language);
  const date = journalDate(entry.createdAt, i18n.language);
  const title = entry.title?.trim() || t('journalDetail.untitledEntry');

  const talk = () =>
    router.push({
      pathname: '/(tabs)/chat/new-conversation',
      params: {
        initialMessage: journalTalkPrompt(entry.title, entry.content)
          ? t('journalDetail.talkPrompt', { title: entry.title?.trim(), body: entry.content ?? '' })
          : t('journalDetail.talkPromptBody', { body: entry.content?.trim() || title }),
        from: `/(tabs)/journal/${entry.id}`,
      },
    });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16 }}>
        <NavBar
          backLabel={t('common.back')}
          onBack={back}
          title={date}
          trailing={
            <IconButton
              icon="line/more"
              variant="solid"
              iconSize={20}
              accessibilityLabel={t('journalDetail.moreOptions')}
              onPress={() => setOptionsOpen(true)}
            />
          }
        />
      </View>
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 22,
          paddingBottom: bottomSpace,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {step && <Icon name={step.face} size={18} color={palette.plum} />}
          <Text style={[Type.chipSelected, { color: palette.plum }]}>
            {moodLabel ? `${moodLabel} · ${time}` : time}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          style={[Type.titleLg, { lineHeight: 36, color: palette.ink, marginTop: 8 }]}
        >
          {title}
        </Text>
        <Text
          selectable
          style={[Type.bodyM, { lineHeight: 24, color: palette.ink, marginTop: 20 }]}
        >
          {entry.content?.trim() || t('journalDetail.noContent')}
        </Text>
        {(entry.tags ?? []).length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 24 }}>
            {(entry.tags ?? []).map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: palette.selected,
                  borderRadius: 999,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={[Type.tag, { lineHeight: 17, color: palette.plum }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {isStoredAudio(entry.audioUrl) && (
          <View style={{ marginTop: 20 }}>
            <RecordingPill path={entry.audioUrl} durationMs={entry.recordingDurationMs} />
          </View>
        )}
        <View style={{ marginTop: 28 }}>
          <ReflectionCard entry={entry} />
        </View>
        <LegalNote text={t('journalReflection.legal')} style={{ marginTop: 18 }} />
        <AppButton
          title={t('journalDetail.talkItThrough')}
          size="lg"
          onPress={talk}
          style={{ marginTop: 28 }}
        />
      </ScrollView>

      <EntryOptions
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        entry={entry}
        title={title}
        pill={[moodLabel, date, time].filter(Boolean).join(' · ')}
        face={step?.face}
        onEdit={() => {
          setOptionsOpen(false);
          router.push({ pathname: '/(tabs)/journal/new', params: { id: entry.id } });
        }}
        onDate={async (picked) => {
          setOptionsOpen(false);
          try {
            await changeJournalDate({
              id: entry.id,
              createdAt: movedDate(entry.createdAt, picked),
            });
            toast.success(t('journalDetail.options.dateChanged'));
          } catch {
            toast.error(t('journalDetail.options.dateError'));
          }
        }}
        onExport={() => {
          setOptionsOpen(false);
          const message = entryExportText(entry, {
            untitled: t('journalDetail.untitledEntry'),
            meta: [moodLabel, date, time].filter(Boolean).join(' · '),
            tags: t('journalDetail.options.tags'),
          });
          // Let the sheet close first: iOS will not present the share sheet over a closing modal.
          setTimeout(() => void Share.share({ title, message }), 300);
        }}
        onDelete={() => {
          setOptionsOpen(false);
          showAlert(t('journalDetail.deleteTitle'), t('journalDetail.deleteMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteJournalEntry(entry.id);
                  toast.success(t('toasts.journalDeleted'));
                  back();
                } catch {
                  toast.error(t('toasts.journalDeleteError'));
                }
              },
            },
          ]);
        }}
      />
      <CrisisSheet visible={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </View>
  );
}

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 100,
        borderRadius: 24,
        backgroundColor: palette.white,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingTop: 2,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.selected,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={22} color={palette.plum} />
      </View>
      <Text style={[Type.chip, { color: palette.plumDeep }]}>{label}</Text>
    </Pressable>
  );
}

/** Entry options sheet (10 §3.11, `6770:4929`), with a date step for Change date (not designed). */
function EntryOptions({
  visible,
  onClose,
  entry,
  title,
  pill,
  face,
  onEdit,
  onDate,
  onExport,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  entry: JournalEntry;
  title: string;
  pill: string;
  face?: IconName;
  onEdit: () => void;
  onDate: (picked: Date) => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState(() => new Date(entry.createdAt));
  useEffect(() => {
    if (!visible) return;
    setPicking(false);
    setPicked(new Date(entry.createdAt));
  }, [visible, entry.createdAt]);

  const changeDate = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: new Date(entry.createdAt),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, date) => event.type === 'set' && date && onDate(date),
      });
    } else setPicking(true);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      overlayOpacity={0.4}
      gap={20}
      closeLabel={t('journalDetail.options.cancel')}
      style={{ overflow: 'hidden' }}
    >
      <Glow
        color={palette.lavenderSoft}
        opacity={0.3}
        width={240}
        blur={70}
        style={{ position: 'absolute', left: -60, top: -120 }}
      />
      <Glow
        color={palette.mustard}
        opacity={0.22}
        width={200}
        blur={70}
        style={{ position: 'absolute', left: 230, top: -110 }}
      />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 22,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: palette.selected,
          }}
        >
          {face && <Icon name={face} size={14} color={palette.plum} />}
          <Text style={[Type.chip, { fontSize: 12, lineHeight: 14, color: palette.plum }]}>
            {pill}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={[Type.titleMd, { lineHeight: 30, color: palette.ink, textAlign: 'center' }]}
        >
          {picking ? t('journalDetail.options.pickDate') : title}
        </Text>
      </View>

      {picking ? (
        <>
          <DateTimePicker
            value={picked}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            accentColor={palette.plum}
            themeVariant="light"
            onChange={(_, date) => date && setPicked(date)}
            style={{ alignSelf: 'stretch' }}
            accessibilityLabel={t('journalDetail.options.pickDate')}
          />
          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <AppButton
              title={t('journalDetail.options.saveDate')}
              size="lg"
              onPress={() => onDate(picked)}
            />
            <AppButton
              title={t('journalDetail.options.back')}
              variant="ghost"
              size="lg"
              onPress={() => setPicking(false)}
            />
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
            <Tile icon="line/edit" label={t('journalDetail.options.edit')} onPress={onEdit} />
            <Tile
              icon="line/calendar"
              label={t('journalDetail.options.changeDate')}
              onPress={changeDate}
            />
            <Tile
              icon="line/download"
              label={t('journalDetail.options.export')}
              onPress={onExport}
            />
          </View>
          <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={onDelete}
              style={({ pressed }) => ({
                alignSelf: 'stretch',
                height: 52,
                borderRadius: 999,
                backgroundColor: palette.dangerSoft,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon name="line/trash" size={18} color={palette.danger} />
              <Text style={[Type.bodyMSemi, { color: palette.danger }]}>
                {t('journalDetail.options.delete')}
              </Text>
            </Pressable>
            <Text style={[Type.captionS, { color: palette.textSubtle, textAlign: 'center' }]}>
              {t('journalDetail.options.deleteNote')}
            </Text>
          </View>
          <AppButton
            title={t('journalDetail.options.cancel')}
            variant="ghost"
            size="lg"
            onPress={onClose}
            style={{ alignSelf: 'stretch' }}
          />
        </>
      )}
    </BottomSheet>
  );
}
