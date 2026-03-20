import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { showAlert } from '@/lib/state';
import { toast } from '@/components/Toast';
import { useStress } from '@/hooks/useStress';
import { DEFAULT_KIT, StressKit } from '@/lib/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── section config ─────────────────────────────── */
const SECTIONS = [
  {
    key: 'triggers' as const,
    emoji: '⚡',
    title: 'Common Triggers',
    subtitle: 'What usually sets off your stress?',
    placeholder: 'Add a trigger\u2026',
    tint: '#E8985A',
    emptyHint: 'No triggers yet — knowing them is the first step.',
  },
  {
    key: 'helpfulActions' as const,
    emoji: '🛟',
    title: 'Helpful Actions',
    subtitle: 'What actually helps when stress hits?',
    placeholder: 'Add an action\u2026',
    tint: '#5B8A5A',
    emptyHint: 'Add things that ground you when it gets rough.',
  },
  {
    key: 'people' as const,
    emoji: '🤝',
    title: 'People Who Help',
    subtitle: 'Who can you reach out to?',
    placeholder: 'Add a person\u2026',
    tint: '#7B6DC9',
    emptyHint: 'You don\u2019t have to do this alone.',
  },
] as const;

export default function StressPlan() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const { stressKit, saveStressKit } = useStress();
  const [draft, setDraft] = useState<StressKit>(DEFAULT_KIT);

  useEffect(() => {
    if (stressKit) setDraft(stressKit);
  }, [stressKit]);

  /* ── list helpers ────────────────────────────── */
  const addItem = (field: keyof StressKit, value: string) => {
    const v = value.trim();
    if (!v) return;
    setDraft((p) => {
      const arr = Array.isArray(p[field]) ? (p[field] as string[]) : [];
      if (arr.includes(v)) return p;
      return { ...p, [field]: [...arr, v] } as StressKit;
    });
  };

  const removeItem = (field: keyof StressKit, idx: number) => {
    setDraft((p) => {
      const arr = Array.isArray(p[field]) ? (p[field] as string[]) : [];
      return { ...p, [field]: arr.filter((_, i) => i !== idx) } as StressKit;
    });
  };

  /* ── text inputs per section ─────────────────── */
  const [inputs, setInputs] = useState<Record<string, string>>({
    triggers: '',
    helpfulActions: '',
    people: '',
  });

  const setInput = (key: string, val: string) => setInputs((p) => ({ ...p, [key]: val }));

  /* ── save ─────────────────────────────────────── */
  async function save() {
    Keyboard.dismiss();
    const next: StressKit = {
      quickPhrase: draft.quickPhrase?.trim() || '',
      triggers: (draft.triggers || []).filter(Boolean),
      helpfulActions: (draft.helpfulActions || []).filter(Boolean),
      people: (draft.people || []).filter(Boolean),
      notes: draft.notes || '',
    };
    await saveStressKit(next);
    toast.success('Your Stress Kit was updated.');
    router.back();
  }

  /* ── counts for progress ─────────────────────── */
  const totalItems =
    (draft.triggers?.length || 0) +
    (draft.helpfulActions?.length || 0) +
    (draft.people?.length || 0);
  const hasPhrase = !!draft.quickPhrase?.trim();
  const filledSections = [
    hasPhrase,
    (draft.triggers?.length || 0) > 0,
    (draft.helpfulActions?.length || 0) > 0,
    (draft.people?.length || 0) > 0,
  ].filter(Boolean).length;

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Your Stress Plan</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            Build a personal kit you can use any time.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero card ──────────────────────────── */}
        <View style={[s.heroCard, { backgroundColor: '#8B6B47' }]}>
          <View style={s.heroTop}>
            <View style={s.heroIconWrap}>
              <Text style={{ fontSize: 26 }}>🧰</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>Personal Stress Kit</Text>
              <Text style={s.heroSub}>
                Personalize a quick plan for what helps you when stress spikes.
              </Text>
            </View>
          </View>

          {/* progress dots */}
          <View style={s.heroDivider} />
          <View style={s.progressRow}>
            <View style={s.progressDots}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    s.progressDot,
                    {
                      backgroundColor:
                        i < filledSections ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={s.progressText}>{filledSections}/4 sections filled</Text>
          </View>
        </View>

        {/* ── Quick Phrase ────────────────────────── */}
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: '#5A8FB520' }]}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Quick Phrase</Text>
              <Text style={[s.sectionSub, { color: colors.mutedText }]}>
                Say this to yourself when you feel overwhelmed.
              </Text>
            </View>
          </View>
          <TextInput
            value={draft.quickPhrase ?? ''}
            onChangeText={(t) => setDraft((p) => ({ ...p, quickPhrase: t }))}
            placeholder="e.g., This feeling will pass. I can take one small step."
            placeholderTextColor={colors.placeholder}
            style={[
              s.phraseInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: hasPhrase ? '#5B8A5A40' : colors.border,
              },
            ]}
            multiline
          />
        </View>

        {/* ── Editable list sections ─────────────── */}
        {SECTIONS.map((sec) => {
          const items = (draft[sec.key] as string[]) || [];
          const inputVal = inputs[sec.key] || '';
          return (
            <View
              key={sec.key}
              style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={s.sectionHeader}>
                <View style={[s.sectionIconWrap, { backgroundColor: sec.tint + '18' }]}>
                  <Text style={{ fontSize: 18 }}>{sec.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { color: colors.text }]}>{sec.title}</Text>
                  <Text style={[s.sectionSub, { color: colors.mutedText }]}>{sec.subtitle}</Text>
                </View>
                {items.length > 0 && (
                  <View style={[s.countBadge, { backgroundColor: sec.tint + '20' }]}>
                    <Text style={[s.countText, { color: sec.tint }]}>{items.length}</Text>
                  </View>
                )}
              </View>

              {/* add input row */}
              <View style={s.addRow}>
                <TextInput
                  value={inputVal}
                  onChangeText={(t) => setInput(sec.key, t)}
                  placeholder={sec.placeholder}
                  placeholderTextColor={colors.placeholder}
                  style={[s.addInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                  onSubmitEditing={() => {
                    addItem(sec.key, inputVal);
                    setInput(sec.key, '');
                  }}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={() => {
                    addItem(sec.key, inputVal);
                    setInput(sec.key, '');
                  }}
                  style={({ pressed }) => [
                    s.addBtn,
                    { backgroundColor: sec.tint, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <MaterialIcons name="add" size={20} color="#FFF" />
                </Pressable>
              </View>

              {/* items */}
              {items.length === 0 ? (
                <Text style={[s.emptyHint, { color: colors.mutedText }]}>{sec.emptyHint}</Text>
              ) : (
                <View style={s.itemsList}>
                  {items.map((it, idx) => (
                    <ItemRow
                      key={`${sec.key}-${idx}-${it}`}
                      text={it}
                      tint={sec.tint}
                      dividerColor={colors.divider}
                      textColor={colors.text}
                      isLast={idx === items.length - 1}
                      onRemove={() => removeItem(sec.key, idx)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Notes ───────────────────────────────── */}
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: '#C45B5B18' }]}>
              <Text style={{ fontSize: 18 }}>📝</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Notes</Text>
              <Text style={[s.sectionSub, { color: colors.mutedText }]}>
                Anything else that helps — music, places, reminders.
              </Text>
            </View>
          </View>
          <TextInput
            value={draft.notes ?? ''}
            onChangeText={(t) => setDraft((p) => ({ ...p, notes: t }))}
            placeholder="Write anything that helps you cope\u2026"
            placeholderTextColor={colors.placeholder}
            style={[
              s.notesInput,
              { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
            ]}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Action buttons ─────────────────────── */}
        <View style={s.actionRow}>
          <Pressable
            onPress={save}
            style={({ pressed }) => [s.saveBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFF" />
            <Text style={s.saveBtnText}>Save My Plan</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setDraft(DEFAULT_KIT);
              toast.info('Kit restored to defaults.');
            }}
            style={({ pressed }) => [
              s.resetBtn,
              {
                backgroundColor: theme === 'light' ? '#C45B5B10' : '#C45B5B18',
                borderColor: theme === 'light' ? '#C45B5B20' : '#C45B5B25',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <MaterialIcons
              name="refresh"
              size={18}
              color={theme === 'light' ? '#C45B5B' : '#E87B7B'}
            />
            <Text style={[s.resetBtnText, { color: theme === 'light' ? '#C45B5B' : '#E87B7B' }]}>
              Reset to Defaults
            </Text>
          </Pressable>
        </View>

        {/* encouragement footer */}
        <Text style={[s.footerText, { color: colors.mutedText }]}>
          {filledSections === 4
            ? 'Your plan is ready — you\u2019ve got this. 💪'
            : filledSections >= 2
              ? 'Great start — keep building your toolkit.'
              : 'Even one item here is a powerful first step.'}
        </Text>
      </ScrollView>
    </View>
  );
}

/* ── Item row with swipe-to-delete feel ──────────── */
function ItemRow({
  text,
  tint,
  dividerColor,
  textColor,
  isLast,
  onRemove,
}: {
  text: string;
  tint: string;
  dividerColor: string;
  textColor: string;
  isLast: boolean;
  onRemove: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleRemove = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onRemove());
  };

  return (
    <Animated.View
      style={[
        s.itemRow,
        {
          borderBottomColor: isLast ? 'transparent' : dividerColor,
          borderBottomWidth: isLast ? 0 : 1,
          opacity: fadeAnim,
          transform: [
            {
              translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[s.itemDot, { backgroundColor: tint }]} />
      <Text style={[s.itemText, { color: textColor }]}>{text}</Text>
      <Pressable
        onPress={handleRemove}
        hitSlop={8}
        style={({ pressed }) => [s.removeBtn, { opacity: pressed ? 0.5 : 1 }]}
      >
        <MaterialIcons name="close" size={16} color={tint} />
      </Pressable>
    </Animated.View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 8,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  /* hero */
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 20,
    ...UI.shadow.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '500', marginTop: 2 },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressDots: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: '600',
  },

  /* section card */
  sectionCard: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSub: { fontSize: 13, marginTop: 1 },

  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: { fontSize: 13, fontWeight: '800' },

  /* add row */
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  addInput: {
    flex: 1,
    padding: 12,
    borderRadius: UI.radius.md,
    fontSize: 14,
  },
  addBtn: {
    width: 42,
    borderRadius: UI.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* phrase input */
  phraseInput: {
    padding: 14,
    borderRadius: UI.radius.md,
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '600',
    minHeight: 54,
    borderWidth: 1,
  },

  /* notes input */
  notesInput: {
    padding: 14,
    borderRadius: UI.radius.md,
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
  },

  /* empty hint */
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 2,
  },

  /* items list */
  itemsList: { marginTop: 6 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  itemDot: { width: 7, height: 7, borderRadius: 4 },
  itemText: { flex: 1, fontSize: 15, fontWeight: '600' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* action buttons */
  actionRow: { gap: 10, marginTop: 6 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5B8A5A',
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    ...UI.shadow.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: 14, fontWeight: '700' },

  /* footer */
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    fontWeight: '500',
  },
});
