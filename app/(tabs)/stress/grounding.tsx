import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useStressHistory } from '@/hooks/useStressHistory';
import { toast } from '@/components/Toast';
import MaterialIcons from '@/components/AppIcon';

const SENSES: {
  key: string;
  emoji: string;
  label: string;
  count: number;
  tint: string;
}[] = [
  { key: 'see', emoji: '👁️', label: 'things you can see', count: 5, tint: '#5B8A5A' },
  { key: 'feel', emoji: '🤲', label: 'things you can feel', count: 4, tint: '#E8985A' },
  { key: 'hear', emoji: '👂', label: 'things you can hear', count: 3, tint: '#7B6DC9' },
  { key: 'smell', emoji: '👃', label: 'things you can smell', count: 2, tint: '#5A8FB5' },
  { key: 'taste', emoji: '👅', label: 'thing you can taste', count: 1, tint: '#C45B5B' },
];

export default function Grounding() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { addStressCompletion } = useStressHistory();

  const [answers, setAnswers] = useState<Record<string, string[]>>({
    see: ['', '', '', '', ''],
    feel: ['', '', '', ''],
    hear: ['', '', ''],
    smell: ['', ''],
    taste: [''],
  });

  function updateAnswer(senseKey: string, index: number, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [senseKey]: prev[senseKey].map((v, i) => (i === index ? value : v)),
    }));
  }

  const filledCount = useMemo(() => {
    return Object.values(answers)
      .flat()
      .filter((v) => v.trim().length > 0).length;
  }, [answers]);

  const totalInputs = 15; // 5+4+3+2+1
  const progress = filledCount / totalInputs;

  async function done() {
    await addStressCompletion('grounding-54321', t('grounding.title'));
    toast.success(t('common.groundingSuccess'));
    backTo(undefined, '/(tabs)/stress');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top + 6 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => backTo(undefined, '/(tabs)/stress')}
            style={({ pressed }) => [
              styles.backButton,
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Grounding 5-4-3-2-1</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              Bring attention back to the present
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* How it works + progress */}
          <View style={[styles.infoCard, { backgroundColor: '#5B8A5A' }]}>
            <View style={styles.infoTop}>
              <View style={styles.infoIconWrap}>
                <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 22 }}>
                  🌿
                </WellnessIconText>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>How it works</Text>
                <Text style={styles.infoText}>
                  Name what you notice around you. No pressure — a few words each is enough.
                </Text>
              </View>
            </View>
            {/* Progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {filledCount}/{totalInputs}
              </Text>
            </View>
          </View>

          {/* Sense blocks */}
          {SENSES.map((sense) => (
            <View
              key={sense.key}
              style={[
                styles.senseCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Sense header */}
              <View style={styles.senseHeader}>
                <View style={[styles.countBadge, { backgroundColor: sense.tint }]}>
                  <Text style={styles.countText}>{sense.count}</Text>
                </View>
                <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 22 }}>
                  {sense.emoji}
                </WellnessIconText>
                <Text style={[styles.senseLabel, { color: colors.text }]}>
                  {sense.count} {sense.label}
                </Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputList}>
                {answers[sense.key].map((value, i) => {
                  const isFilled = value.trim().length > 0;
                  return (
                    <View key={`${sense.key}-${i}`} style={styles.inputRow}>
                      <View
                        style={[
                          styles.inputDot,
                          {
                            backgroundColor: isFilled ? sense.tint : colors.border,
                          },
                        ]}
                      >
                        {isFilled && <MaterialIcons name="check" size={10} color="#FFFFFF" />}
                      </View>
                      <TextInput
                        value={value}
                        onChangeText={(text) => updateAnswer(sense.key, i, text)}
                        placeholder={`Observation ${i + 1}`}
                        placeholderTextColor={colors.placeholder}
                        style={[
                          styles.input,
                          {
                            backgroundColor: isFilled ? sense.tint + '08' : colors.inputBg,
                            color: colors.text,
                            borderColor: isFilled ? sense.tint + '25' : 'transparent',
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Finish button */}
          <Pressable
            onPress={done}
            style={({ pressed }) => [
              styles.finishButton,
              {
                backgroundColor: filledCount > 0 ? '#5B8A5A' : colors.inputBg,
                transform: [{ scale: pressed && filledCount > 0 ? 0.98 : 1 }],
              },
            ]}
          >
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 20 }}>
              🌟
            </WellnessIconText>
            <Text
              style={[
                styles.finishText,
                { color: filledCount > 0 ? '#FFFFFF' : colors.placeholder },
              ]}
            >
              {filledCount >= totalInputs ? "I'm grounded" : 'Finish exercise'}
            </Text>
          </Pressable>

          {/* Encouragement */}
          {filledCount > 0 && filledCount < totalInputs && (
            <Text style={[styles.encouragement, { color: colors.mutedText }]}>
              {filledCount < 5
                ? 'Great start — keep noticing...'
                : filledCount < 10
                  ? "You're doing well, almost there..."
                  : 'Nearly done — just a few more...'}
            </Text>
          )}
          {filledCount >= totalInputs && (
            <WellnessIconText style={[styles.encouragement, { color: '#5B8A5A' }]}>
              All senses engaged — you are fully present 🌿
            </WellnessIconText>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  } as any,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    ...Typography.heading,
  },
  headerSubtitle: { fontFamily: Typography.family.body, fontSize: 14, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  // Info card
  infoCard: {
    borderRadius: UI.radius.xxl,
    padding: 20,
    ...UI.shadow.md,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: Typography.family.body,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoText: {
    fontFamily: Typography.family.body,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
    lineHeight: 21,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  progressText: {
    fontFamily: Typography.family.body,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    minWidth: 36,
    textAlign: 'right',
  },

  // Sense cards
  senseCard: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  senseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: Typography.family.body,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: Typography.weight.bold,
  },
  senseLabel: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    fontWeight: Typography.weight.medium,
    flex: 1,
  },

  // Inputs
  inputList: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontFamily: Typography.family.body,
    flex: 1,
    padding: 12,
    borderRadius: UI.radius.md,
    fontSize: 14,
    borderWidth: 1,
  },

  // Finish
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    marginTop: 6,
    ...UI.shadow.md,
  },
  finishText: {
    fontFamily: Typography.family.body,
    fontSize: 16,
    fontWeight: Typography.weight.semibold,
  },

  // Encouragement
  encouragement: {
    fontFamily: Typography.family.body,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    fontStyle: 'italic',
  },
});
