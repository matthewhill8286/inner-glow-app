import React, { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { toast } from '@/components/Toast';
import { SHELL_GLOWS } from '@/components/profile-setup/ProfileShell';
import { useProfile } from '@/hooks/useProfile';
import { useFreudScore } from '@/hooks/useFreudScore';
import { suggestedIssues } from '@/lib/profile-setup';
import AllSetAura from '@/assets/svg/illustrations/profile/all-set-aura.svg';

const RING = 172;
const STROKE = 3.5;
/** The ring runs from the top clockwise; 100 fills it. */
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * P5 · You're all set (`6676:3226`). The starting Glow score in a 172 ring with "your starting glow",
 * the named title and body, and "Go to my home". Finishing saves the assessment goal as the profile
 * intention and the suggested topics, which is what marks setup as done (`entryRouteForProfile`).
 * Figma draws the ring track at full plum, which hides the progress; the track here is plum @0.12.
 */
export default function ProfileCompletion() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sx = width / 375;
  const dy = insets.top - 44;
  const { profile, assessment, updateProfile } = useProfile();
  const { scoreHistory, currentScore } = useFreudScore();
  const [busy, setBusy] = useState(false);

  // The assessment saved the starting score; before it loads, fall back to the live estimate.
  const score = Math.round(scoreHistory[0]?.score ?? currentScore?.score ?? 0);
  const name = profile?.name?.trim();

  async function finish() {
    setBusy(true);
    try {
      const row = (assessment ?? null) as Record<string, any> | null;
      await updateProfile({
        intention: row?.goal || profile?.intention || 'Just checking things out',
        selectedIssues: suggestedIssues(row ? { mood: row.mood, stressBand: row.stress_band, sleepQuality: row.sleep_quality } : null),
      });
      router.replace('/(tabs)/home');
    } catch {
      toast.error(t('profileFlow.saveFailed'));
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          ...SHELL_GLOWS,
          { color: palette.mustard, opacity: 0.28, x: 27.5, y: 130 + dy, width: 320, blur: 70 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 157.5, y: 230 + dy, width: 200, blur: 60 },
        ]}
      />
      <AllSetAura width={333.1} height={300.2} style={{ position: 'absolute', left: 179.25 * sx - 166.55, top: 144.6 + dy }} />
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 204 + dy }}>
        <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`${score}, ${t('profileFlow.done.score')}`}>
          <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
            <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={palette.plum} strokeOpacity={0.12} strokeWidth={STROKE} fill="none" />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={palette.plum}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${(CIRCUMFERENCE * Math.min(100, Math.max(0, score))) / 100} ${CIRCUMFERENCE}`}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <Text style={{ ...Type.display, fontWeight: '400', fontSize: 64, lineHeight: 77, color: palette.plum, marginTop: -6 }}>{score}</Text>
          <Text style={[Type.chip, { color: palette.textMuted }]}>{t('profileFlow.done.score')}</Text>
        </View>
        <View style={{ marginTop: 64, paddingHorizontal: 24, gap: 11, alignItems: 'center' }}>
          <Text accessibilityRole="header" style={[Type.titleLg, { color: palette.ink, textAlign: 'center' }]}>
            {name ? t('profileFlow.done.titleNamed', { name }) : t('profileFlow.done.title')}
          </Text>
          <Text style={[Type.bodySm, { lineHeight: 17, color: palette.textMuted, textAlign: 'center', maxWidth: 287 }]}>{t('profileFlow.done.body')}</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 48 }}>
        <AppButton title={t('profileFlow.done.cta')} busy={busy} onPress={finish} />
      </View>
    </View>
  );
}
