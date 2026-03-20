import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMood } from '@/hooks/useMood';
import { MoodCheckIn } from '@/lib/types';
import { useSubscription } from '@/hooks/useSubscription';
import { showAlert } from '@/lib/state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Mood definitions with full-screen colors ── */
function getMoods(t: any): {
  key: MoodCheckIn['mood'];
  label: string;
  face: string;
  bg: string;
  color: string;
  description: string;
}[] {
  return [
    {
      key: 'Bad',
      label: t('moodCheckIn.depressed'),
      face: '\uD83D\uDE2D',
      bg: '#7B6DC9',
      color: '#fff',
      description: t('moodCheckIn.feelingDepressed'),
    },
    {
      key: 'Low',
      label: t('moodCheckIn.sad'),
      face: '\uD83D\uDE1E',
      bg: '#5A8FB5',
      color: '#fff',
      description: t('moodCheckIn.feelingSad'),
    },
    {
      key: 'Okay',
      label: t('moodCheckIn.neutral'),
      face: '\uD83D\uDE10',
      bg: '#E8985A',
      color: '#fff',
      description: t('moodCheckIn.feelingNeutral'),
    },
    {
      key: 'Good',
      label: t('moodCheckIn.happy'),
      face: '\uD83D\uDE0A',
      bg: '#5B8A5A',
      color: '#fff',
      description: t('moodCheckIn.feelingHappy'),
    },
    {
      key: 'Great',
      label: t('moodCheckIn.overjoyed'),
      face: '\uD83E\uDD29',
      bg: '#D4A843',
      color: '#fff',
      description: t('moodCheckIn.feelingOverjoyed'),
    },
  ];
}

export default function MoodCheckIn_Screen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { addMoodCheckIn } = useMood();
  const { hasFullAccess } = useSubscription();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'mood' | 'details'>('mood');
  const [selectedIdx, setSelectedIdx] = useState(2); // start at Neutral
  const [energy, setEnergy] = useState<MoodCheckIn['energy']>(3);
  const [stress, setStress] = useState<MoodCheckIn['stress']>(5);
  const [note, setNote] = useState('');

  const MOODS = getMoods(t);
  const current = MOODS[selectedIdx];

  /* ── Animations ── */
  const bgAnim = useRef(new Animated.Value(0)).current;
  const faceScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgAnim, { toValue: selectedIdx, duration: 300, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(faceScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(faceScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();
  }, [selectedIdx, bgAnim, faceScale]);

  const bgColor = bgAnim.interpolate({
    inputRange: MOODS.map((_, i) => i),
    outputRange: MOODS.map((m) => m.bg),
  });

  /* ── Swipe gesture to change mood ── */
  const swipeThreshold = 50;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -swipeThreshold) {
          // Swipe left → next mood
          setSelectedIdx((prev) => Math.min(MOODS.length - 1, prev + 1));
        } else if (gs.dx > swipeThreshold) {
          // Swipe right → previous mood
          setSelectedIdx((prev) => Math.max(0, prev - 1));
        }
      },
    }),
  ).current;

  async function saveMood() {
    if (!hasFullAccess) {
      showAlert(t('moodCheckIn.premiumFeature'), t('moodCheckIn.upgradeToLogMood'), [
        { text: t('moodCheckIn.cancel'), style: 'cancel' },
        {
          text: t('moodCheckIn.upgrade'),
          onPress: () => router.push('/(utils)/trial-upgrade' as any),
        },
      ]);
      return;
    }
    await addMoodCheckIn({
      mood: current.key,
      energy,
      stress,
      note: note.trim() || undefined,
    });
    router.back();
  }

  if (step === 'mood') {
    return (
      <Animated.View style={{ flex: 1, backgroundColor: bgColor }} {...panResponder.panHandlers}>
        {/* Top Bar */}
        <View
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: UI.spacing.xl,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>
            {selectedIdx + 1} / {MOODS.length}
          </Text>
        </View>

        {/* Center Content */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 20,
            }}
          >
            {t('moodCheckIn.howFeeling')}
          </Text>
          <Animated.Text
            style={{
              fontSize: 120,
              transform: [{ scale: faceScale }],
            }}
          >
            {current.face}
          </Animated.Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 24 }}>
            {current.description}
          </Text>
        </View>

        {/* Mood Dots Selector */}
        <View style={{ paddingBottom: insets.bottom + 90, alignItems: 'center' }}>
          {/* Dot row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            {MOODS.map((m, i) => {
              const isActive = selectedIdx === i;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setSelectedIdx(i)}
                  style={{
                    width: isActive ? 16 : 10,
                    height: isActive ? 16 : 10,
                    borderRadius: isActive ? 8 : 5,
                    backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                    borderWidth: isActive ? 2 : 0,
                    borderColor: 'rgba(255,255,255,0.8)',
                  }}
                />
              );
            })}
          </View>

          {/* Arrow navigation */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 }}>
            <Pressable
              onPress={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: selectedIdx === 0 ? 0.3 : pressed ? 0.7 : 1,
              })}
              disabled={selectedIdx === 0}
            >
              <MaterialIcons name="chevron-left" size={28} color="#fff" />
            </Pressable>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.7)',
                width: 100,
                textAlign: 'center',
              }}
            >
              {current.label}
            </Text>

            <Pressable
              onPress={() => setSelectedIdx(Math.min(MOODS.length - 1, selectedIdx + 1))}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: selectedIdx === MOODS.length - 1 ? 0.3 : pressed ? 0.7 : 1,
              })}
              disabled={selectedIdx === MOODS.length - 1}
            >
              <MaterialIcons name="chevron-right" size={28} color="#fff" />
            </Pressable>
          </View>

          {/* Set Mood Button */}
          <Pressable
            onPress={() => setStep('details')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: '#fff',
              paddingHorizontal: 40,
              paddingVertical: 18,
              borderRadius: UI.radius.pill,
              opacity: pressed ? 0.9 : 1,
              ...UI.shadow.md,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: current.bg }}>Set Mood</Text>
            <MaterialIcons name="check" size={20} color={current.bg} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  /* ── Step 2: Details ── */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: UI.spacing.sm,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={() => setStep('mood')}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                ...UI.shadow.sm,
              })}
            >
              <MaterialIcons
                name="arrow-back-ios"
                size={16}
                color={colors.text}
                style={{ marginLeft: 4 }}
              />
            </Pressable>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
              {t('moodCheckIn.details')}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: UI.radius.pill,
              backgroundColor: current.bg + '20',
            }}
          >
            <Text style={{ fontSize: 18 }}>{current.face}</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: current.bg }}>
              {current.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Energy Level */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: UI.radius.xxl,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.sm,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedText,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            {t('moodCheckIn.energyLevel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([1, 2, 3, 4, 5] as const).map((v) => {
              const active = energy === v;
              const fills = ['#C45B5B', '#E8985A', '#E8C85A', '#6BBF8A', '#4AAD7A'];
              return (
                <Pressable
                  key={v}
                  onPress={() => setEnergy(v)}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderRadius: UI.radius.md,
                    borderWidth: 1.5,
                    backgroundColor: active ? fills[v - 1] + '18' : 'transparent',
                    borderColor: active ? fills[v - 1] + '50' : colors.border,
                    transform: [{ scale: pressed ? 0.93 : 1 }],
                  })}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: active ? fills[v - 1] : colors.mutedText,
                    }}
                  >
                    {v}
                  </Text>
                  {(v === 1 || v === 5) && (
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '600',
                        color: colors.mutedText,
                        marginTop: 2,
                      }}
                    >
                      {v === 1 ? t('moodCheckIn.low') : t('moodCheckIn.high')}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Stress Level */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: UI.radius.xxl,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.sm,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedText,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            {t('moodCheckIn.stressLevel')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: 11 }, (_, i) => i).map((v) => {
              const active = stress === v;
              const ratio = v / 10;
              const r = Math.round(74 + ratio * (196 - 74));
              const g = Math.round(173 + ratio * (91 - 173));
              const b = Math.round(122 + ratio * (91 - 122));
              const stressColor = `rgb(${r},${g},${b})`;
              return (
                <Pressable
                  key={v}
                  onPress={() => setStress(v as MoodCheckIn['stress'])}
                  style={({ pressed }) => ({
                    flexGrow: 1,
                    minWidth: '17%' as any,
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: UI.radius.sm,
                    borderWidth: 1.5,
                    backgroundColor: active ? stressColor : 'transparent',
                    borderColor: active ? stressColor : colors.border,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: active ? '900' : '600',
                      color: active ? '#FFFFFF' : colors.mutedText,
                    }}
                  >
                    {v}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedText }}>
              {t('moodCheckIn.none')}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedText }}>
              {t('moodCheckIn.extreme')}
            </Text>
          </View>
        </View>

        {/* Note */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: UI.radius.xxl,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.sm,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedText,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            {t('moodCheckIn.noteOptional')}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('moodCheckIn.notePlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: colors.text,
              minHeight: 80,
              textAlignVertical: 'top',
              backgroundColor: colors.inputBg,
              borderRadius: UI.radius.lg,
              padding: 14,
            }}
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={saveMood}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: current.bg,
            paddingVertical: 18,
            borderRadius: UI.radius.xl,
            opacity: pressed ? 0.9 : 1,
            ...UI.shadow.md,
          })}
        >
          <Text style={{ fontSize: 22 }}>{current.face}</Text>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>
            {t('moodCheckIn.logCheckIn')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
