import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { MoodSlider } from '@/components/mood/MoodSlider';
import { AppButton } from '@/components/ui/AppButton';
import { NavBar } from '@/components/ui/IconButton';
import { CrisisSheet } from '@/components/chat/CrisisSheet';
import { toast } from '@/components/Toast';
import { JOURNAL_PROMPTS } from '@/data/journalPrompts';
import { useJournal } from '@/hooks/useJournal';
import { journalDate, journalMoodScore, movedDate, needsCrisisSupport } from '@/lib/journal-entry';
import { moodStep, type MoodScore } from '@/lib/mood-scale';
import { backTo } from '@/lib/navigation';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

const TAG_KEYS = ['work', 'breathing', 'sleep', 'family', 'friends'] as const;

function Tag({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        paddingVertical: selected ? 7.5 : 8,
        paddingHorizontal: selected ? 13.5 : 14,
        borderRadius: 999,
        backgroundColor: selected ? palette.selected : palette.white,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? palette.plum : palette.border,
      }}
    >
      <Text
        style={[
          selected ? Type.chipSelected : Type.chip,
          { color: selected ? palette.plum : palette.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Write entry (04 J2): the date title with a Save text button, the compact mood card, the editor card
 * with a follow-up prompt chip, the design's tags with "+ Add", and Save entry. A new entry goes to
 * Saved (J6); an edit from the entry options sheet saves over the entry and returns to it. Crisis
 * language opens the crisis sheet after saving (04 §C). The follow-up prompts are a fixed list: the
 * AI follow-up needs a backend that does not exist yet.
 */
export default function WriteEntry() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { promptId, date, id } = useLocalSearchParams<{
    promptId?: string;
    date?: string;
    id?: string;
  }>();
  const prompt = useMemo(() => JOURNAL_PROMPTS.find((p) => p.id === promptId), [promptId]);
  const { createJournalEntry, upsertJournalEntry, journalEntries } = useJournal();
  const editing = id ? journalEntries.find((e) => e.id === id) : undefined;

  const [mood, setMood] = useState<MoodScore>(3);
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [body, setBody] = useState(prompt ? `${prompt.prompt}\n\n` : '');
  const [tags, setTags] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [followUp, setFollowUp] = useState(0);
  const [saving, setSaving] = useState(false);
  const [crisisFor, setCrisisFor] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Edit (10 §3.11) opens this screen prefilled with the entry.
  useEffect(() => {
    if (!editing || prefilled) return;
    setTitle(editing.title ?? '');
    setBody(editing.content ?? '');
    setMood((journalMoodScore(editing.mood) ?? 3) as MoodScore);
    setTags(editing.tags ?? []);
    setPrefilled(true);
  }, [editing, prefilled]);

  const followUps = t('journalWrite.followUps', { returnObjects: true }) as string[];
  const shownDate = editing?.createdAt ?? date ?? new Date().toISOString();
  const navDate = journalDate(shownDate, i18n.language);
  const step = moodStep(mood);
  const designTags = TAG_KEYS.map((k) => t(`journalWrite.tags.${k}`));
  const tagOptions = [...designTags, ...tags.filter((tag) => !designTags.includes(tag))];
  const canSave = !saving && (title.trim().length > 0 || body.trim().length > 0);

  const toggle = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
    setNewTag('');
    setAdding(false);
  };
  const insertFollowUp = () => {
    const line = followUps[followUp % followUps.length];
    setBody((prev) => `${prev.trimEnd()}${prev.trim() ? '\n\n' : ''}${line}\n`);
    setFollowUp((n) => n + 1);
  };

  async function save() {
    if (!canSave) return;
    setSaving(true);
    const fields = {
      title: title.trim() || t('journalDetail.untitledEntry'),
      content: body.trim(),
      mood: step.checkIn,
      tags,
    };
    try {
      if (editing) {
        await upsertJournalEntry({ ...editing, ...fields });
        toast.success(t('toasts.journalSaved'));
        backTo(undefined, '/(tabs)/journal');
        return;
      }
      // An entry started from a past day in history is dated that day, at the current time.
      const created = await createJournalEntry({
        ...fields,
        ...(date ? { createdAt: movedDate(new Date().toISOString(), new Date(date)) } : {}),
      });
      if (needsCrisisSupport(fields.content)) setCrisisFor(created.id);
      else router.replace({ pathname: '/(tabs)/journal/saved', params: { id: created.id } });
    } catch {
      toast.error(t(editing ? 'toasts.journalSaveError' : 'toasts.journalCreateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 24 }}>
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/journal')}
          title={navDate}
          trailing={
            <Text
              accessibilityRole="button"
              onPress={save}
              suppressHighlighting
              style={[Type.bodyMSemi, { color: canSave ? palette.plum : palette.textSubtle }]}
            >
              {t('journalWrite.save')}
            </Text>
          }
        />
      </View>
      <ScrollView keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 28,
            padding: 20,
            paddingTop: 18,
            marginHorizontal: 16,
            marginTop: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <Text style={[Type.bodyStrong, { color: palette.ink }]}>{t('homeGlow.howAreYou')}</Text>
            <Text style={[Type.caption, { fontWeight: '500', color: palette.textSubtle }]}>
              {navDate}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Icon name={step.face} size={26} />
            <Text style={[Type.titleMd, { color: palette.plum }]}>
              {t(`moodScale.${step.key}`)}
            </Text>
            <Text
              style={[Type.captionS, { color: palette.textSubtle, marginLeft: 4, marginTop: 4 }]}
            >
              {t('homeGlow.slideToAdjust')}
            </Text>
          </View>
          <MoodSlider
            value={mood}
            onChange={setMood}
            startLabel={t('moodScale.tense')}
            endLabel={t('moodScale.great')}
            accessibilityLabel={t('homeGlow.howAreYou')}
            style={{ marginTop: 10 }}
          />
        </View>

        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 24,
            padding: 20,
            marginHorizontal: 24,
            marginTop: 12,
            gap: 14,
          }}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('journalWrite.titlePlaceholder')}
            placeholderTextColor={palette.textSubtle}
            accessibilityLabel={t('journalWrite.titleLabel')}
            style={[
              Type.titleSm,
              { lineHeight: 28, letterSpacing: 0, color: palette.ink, padding: 0 },
            ]}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t('journalWrite.bodyPlaceholder')}
            placeholderTextColor={palette.textSubtle}
            accessibilityLabel={t('journalWrite.bodyLabel')}
            multiline
            textAlignVertical="top"
            style={[Type.bodyM, { lineHeight: 23, color: palette.ink, minHeight: 92, padding: 0 }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('journalWrite.followUpHint')}
            onPress={insertFollowUp}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 38,
              paddingLeft: 12,
              paddingRight: 14,
              borderRadius: 16,
              backgroundColor: palette.surfaceLilacSoft,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Icon name="line/sparkle" size={16} color={palette.plum} />
            <Text style={[Type.chip, { color: palette.plum }]}>
              {followUps[followUp % followUps.length]}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginHorizontal: 24, marginTop: 24, gap: 12 }}>
          <Text style={[Type.chipSelected, { color: palette.ink }]}>
            {t('journalWrite.tagsLabel')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tagOptions.map((tag) => (
              <Tag
                key={tag}
                label={tag}
                selected={tags.includes(tag)}
                onPress={() => toggle(tag)}
              />
            ))}
            {adding ? (
              <TextInput
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                onBlur={addTag}
                autoFocus
                maxLength={24}
                returnKeyType="done"
                placeholder={t('journalWrite.newTag')}
                placeholderTextColor={palette.textSubtle}
                accessibilityLabel={t('journalWrite.newTag')}
                style={[
                  Type.chip,
                  {
                    minWidth: 90,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: palette.plum,
                    backgroundColor: palette.white,
                    color: palette.ink,
                  },
                ]}
              />
            ) : (
              <Tag
                label={t('journalWrite.addTag')}
                selected={false}
                onPress={() => setAdding(true)}
              />
            )}
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 32 }} />
        <AppButton
          title={t('journalWrite.saveEntry')}
          size="lg"
          icon="line/check"
          iconPosition="left"
          busy={saving}
          disabled={!canSave}
          onPress={save}
          style={{ marginHorizontal: 24 }}
        />
      </ScrollView>
      <CrisisSheet
        visible={crisisFor !== null}
        onClose={() => {
          const created = crisisFor;
          setCrisisFor(null);
          if (created)
            router.replace({ pathname: '/(tabs)/journal/saved', params: { id: created } });
        }}
      />
    </KeyboardAvoidingView>
  );
}
