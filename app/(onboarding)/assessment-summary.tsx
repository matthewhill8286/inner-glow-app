import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { userScopedKey } from '@/lib/storage';
import { supabase } from '@/supabase/supabase';
import { calculateInitialFreudScore, getFreudColor } from '@/lib/freudScore';
import type { FreudBreakdown, FreudScoreResult } from '@/lib/freudScore';
import { useFreudScore } from '@/hooks/useFreudScore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Design tokens ── */
const BG = '#6f6660';
const CARD_BG = '#FFFFFF';
const BROWN_TEXT = '#6a5e55';

/* ── Breakdown metric config ── */
const BREAKDOWN_METRICS: {
  key: keyof FreudBreakdown;
  emoji: string;
  label: string;
  color: string;
}[] = [
  { key: 'mood', emoji: '😊', label: 'Mood', color: '#5AAF8B' },
  { key: 'sleep', emoji: '😴', label: 'Sleep', color: '#7E57C2' },
  { key: 'stress', emoji: '🧘', label: 'Stress', color: '#FF9800' },
  { key: 'mindfulness', emoji: '🧠', label: 'Mindfulness', color: '#BDBDBD' },
  { key: 'consistency', emoji: '📅', label: 'Consistency', color: '#8B6B47' },
  { key: 'journal', emoji: '📝', label: 'Journal', color: '#C45B5B' },
];

/* ── Score Ring (simplified for summary) ── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F5F0EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Center number */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: '900', color, letterSpacing: -1 }}>
            {score}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Breakdown Row ── */
function BreakdownRow({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>{emoji}</Text>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: BROWN_TEXT }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color }}>{value}</Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#F0EBE6',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.min(100, value)}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════
 *  MAIN SCREEN
 * ══════════════════════════════════════════════ */
export default function AssessmentSummary() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { saveScore } = useFreudScore();
  const [assessment, setAssessment] = useState<any>(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  /* Load assessment from AsyncStorage */
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const key = userScopedKey('assessment:v1', session?.user?.id);
      const raw = await AsyncStorage.getItem(key);
      setAssessment(raw ? JSON.parse(raw) : null);
    })();
  }, []);

  /* Calculate initial Freud Score from assessment */
  const initialScore: FreudScoreResult | null = useMemo(() => {
    if (!assessment) return null;
    return calculateInitialFreudScore(assessment);
  }, [assessment]);

  const scoreColor = initialScore ? getFreudColor(initialScore.score) : '#FFC107';

  /* Save the initial score to the DB once */
  useEffect(() => {
    if (initialScore && !scoreSaved) {
      setScoreSaved(true);
      saveScore({ result: initialScore, generateSuggestions: true }).catch((err: any) =>
        console.warn('[AssessmentSummary] Failed to save initial score:', err),
      );
    }
  }, [initialScore, scoreSaved, saveScore]);

  /* Derive a display name from the assessment or session */
  const userName = assessment?.name || t('assessmentSummary.defaultName', { defaultValue: 'there' });

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top + 16 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          marginBottom: 20,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
          {t('assessmentSummary.title')}
        </Text>
      </View>

      <ScrollView
        style={{ paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* White card */}
        <View
          style={{
            backgroundColor: CARD_BG,
            borderRadius: 32,
            padding: 26,
            minHeight: 400,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: '900', color: BROWN_TEXT }}>
            {t('assessmentSummary.heading', { defaultValue: 'Nice to meet you, {{name}}' }).replace(
              '{{name}}',
              userName,
            )}
          </Text>
          <Text style={{ opacity: 0.6, marginTop: 8, color: BROWN_TEXT, fontSize: 15, lineHeight: 22 }}>
            {t('assessmentSummary.subtitle', {
              defaultValue: "Here's your initial Freud Score based on your assessment.",
            })}
          </Text>

          {/* Score Ring */}
          {initialScore && (
            <>
              <ScoreRing score={initialScore.score} color={scoreColor} />

              <View style={{ alignItems: 'center', marginBottom: 24, marginTop: -8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: scoreColor }}>
                  {initialScore.label}
                </Text>
                <Text style={{ fontSize: 13, color: BROWN_TEXT, opacity: 0.5, marginTop: 2 }}>
                  {t('freudScore.title', { defaultValue: 'Freud Score' })}
                </Text>
              </View>

              {/* Breakdown bars */}
              <View>
                {BREAKDOWN_METRICS.map((m) => (
                  <BreakdownRow
                    key={m.key}
                    emoji={m.emoji}
                    label={m.label}
                    value={initialScore.breakdown[m.key]}
                    color={initialScore.breakdown[m.key] > 0 ? m.color : '#D5CEC7'}
                  />
                ))}
              </View>
            </>
          )}

          {/* Goal & Mood summary (below breakdown) */}
          {assessment?.goal && (
            <View
              style={{
                backgroundColor: '#f9f6f3',
                padding: 16,
                borderRadius: 20,
                marginTop: 8,
              }}
            >
              <Text style={{ fontWeight: '800', color: BROWN_TEXT, fontSize: 13 }}>
                {t('assessmentSummary.goal', { defaultValue: 'Your Goal' })}
              </Text>
              <Text style={{ color: BROWN_TEXT, opacity: 0.7, marginTop: 4, fontSize: 15 }}>
                {assessment.goal}
              </Text>
            </View>
          )}

          {assessment?.mood && (
            <View
              style={{
                backgroundColor: '#f9f6f3',
                padding: 16,
                borderRadius: 20,
                marginTop: 10,
              }}
            >
              <Text style={{ fontWeight: '800', color: BROWN_TEXT, fontSize: 13 }}>
                {t('assessmentSummary.currentMood', { defaultValue: 'Current Mood' })}
              </Text>
              <Text style={{ color: BROWN_TEXT, opacity: 0.7, marginTop: 4, fontSize: 15 }}>
                {assessment.mood}
              </Text>
            </View>
          )}
        </View>

        {/* Continue button */}
        <Pressable
          onPress={() => router.replace('/(onboarding)/profile-setup')}
          style={({ pressed }) => ({
            paddingVertical: 20,
            borderRadius: 35,
            backgroundColor: '#a07b55',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
            marginTop: 30,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
            {t('common.continue', { defaultValue: 'Continue' })}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
