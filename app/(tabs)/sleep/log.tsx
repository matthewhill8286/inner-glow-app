import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSleep } from '@/hooks/useSleep';
import { useSubscription } from '@/hooks/useSubscription';
import { showAlert } from '@/lib/state';
import { toast } from '@/components/Toast';

/* ── helpers ──────────────────────────────────────── */
function goBack(from?: string) {
  if (from) router.replace(from as any);
  else router.back();
}

const QUALITY_OPTIONS = [
  { val: 1, emoji: '😫', label: 'Terrible' },
  { val: 2, emoji: '😟', label: 'Poor' },
  { val: 3, emoji: '😐', label: 'Fair' },
  { val: 4, emoji: '😊', label: 'Good' },
  { val: 5, emoji: '😴', label: 'Excellent' },
];

/* ── Main Screen ─────────────────────────────────── */
export default function LogSleepScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ duration?: string; from?: string }>();
  const { hasFullAccess } = useSubscription();
  const { addSleepEntry } = useSleep();

  const [quality, setQuality] = useState(3);
  const [duration, setDuration] = useState(params.duration || '8');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Bedtime / wake inputs
  const [bedHour, setBedHour] = useState('22');
  const [bedMin, setBedMin] = useState('00');
  const [wakeHour, setWakeHour] = useState('06');
  const [wakeMin, setWakeMin] = useState('00');

  const handleSave = async () => {
    if (!hasFullAccess) {
      showAlert('Premium Feature', 'Upgrade to lifetime access to log new sleep entries.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/(utils)/trial-upgrade') },
      ]);
      return;
    }

    setSaving(true);
    try {
      const hours = parseFloat(duration) || 0;
      const end = new Date();
      const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
      await addSleepEntry({
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        quality: quality as any,
        duration: hours,
        notes: note || undefined,
      } as any);
      toast.success('Sleep entry saved.');
      goBack(params.from);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
        {/* ── Header ──────────────────────────── */}
        <View style={s.header}>
          <Pressable
            onPress={() => goBack(params.from)}
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
            <Text style={[s.headerTitle, { color: colors.text }]}>Log Sleep</Text>
            <Text style={[s.headerSub, { color: colors.mutedText }]}>How did you rest?</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Quality Rating ────────────────── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardLabel, { color: colors.mutedText }]}>Sleep Quality</Text>
            <View style={s.qualityRow}>
              {QUALITY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.val}
                  onPress={() => setQuality(opt.val)}
                  style={({ pressed }) => [
                    s.qualityBtn,
                    {
                      backgroundColor: quality === opt.val ? '#8B6B47' : colors.inputBg,
                      transform: [{ scale: pressed ? 0.92 : quality === opt.val ? 1.05 : 1 }],
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                  <Text
                    style={[
                      s.qualityLabel,
                      { color: quality === opt.val ? '#FFF' : colors.mutedText },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Duration ─────────────────────── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardLabel, { color: colors.mutedText }]}>Duration (Hours)</Text>
            <View style={s.durationRow}>
              {/* Quick buttons */}
              {['4', '6', '7', '8', '9'].map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setDuration(h)}
                  style={[
                    s.durBtn,
                    {
                      backgroundColor: duration === h ? '#5B8A5A' : colors.inputBg,
                    },
                  ]}
                >
                  <Text style={[s.durBtnText, { color: duration === h ? '#FFF' : colors.text }]}>
                    {h}h
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="Custom hours"
              placeholderTextColor={colors.placeholder}
              style={[
                s.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          {/* ── Notes ────────────────────────── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardLabel, { color: colors.mutedText }]}>Notes (Optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              placeholder="Dreams, feelings, anything affecting your sleep…"
              placeholderTextColor={colors.placeholder}
              style={[
                s.input,
                s.textArea,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          {/* ── Tip Card ─────────────────────── */}
          <View style={[s.tipCard, { backgroundColor: '#7B6DC915' }]}>
            <MaterialIcons name="lightbulb-outline" size={18} color="#7B6DC9" />
            <Text style={[s.tipText, { color: colors.mutedText }]}>
              Consistent logging helps the AI give you better sleep recommendations
            </Text>
          </View>

          {/* ── Save Button ──────────────────── */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              s.saveBtn,
              {
                backgroundColor: '#8B6B47',
                opacity: saving ? 0.6 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFF" />
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Sleep Entry'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  } as any,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  } as any,
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

  /* cards */
  card: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },

  /* quality */
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  qualityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: UI.radius.md,
    gap: 4,
  },
  qualityLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* duration */
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  durBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },

  /* inputs */
  input: {
    padding: 14,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  /* tip */
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: UI.radius.lg,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  /* save */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    ...UI.shadow.md,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
