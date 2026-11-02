import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { toast } from '@/components/Toast';
import { ScoreCard, ScoreNav, ScoreScreen } from '@/components/score/ScoreParts';
import { practiceById, type Practice } from '@/data/practices';
import { openPractice } from '@/lib/practice-routes';
import { useFreudScore } from '@/hooks/useFreudScore';
import {
  durationMinutes,
  formatMinutes,
  planItems,
  PLAN_CATEGORIES,
  suggestionBonus,
  type PlanCategory,
} from '@/lib/glow-score';
import { backTo } from '@/lib/navigation';

/** Two practices per category stand in for the design's content cards (03 §2.6). */
const CONTENT: Record<PlanCategory, string[]> = {
  mindfulness: ['soothing-melodies', 'quiet-mind'],
  physical: ['full-body-relax', 'shoulder-release'],
  social: ['grounding', 'sigh-reset'],
  professional: ['anxiety-reset', 'box-breathing'],
};
const FALLBACK = ['box-breathing', 'sleep-sounds'];

function contentFor(category: PlanCategory): Practice[] {
  const picks: Practice[] = [];
  for (const id of [...CONTENT[category], ...FALLBACK]) {
    const p = practiceById(id);
    if (p && !picks.includes(p)) picks.push(p);
    if (picks.length === 2) break;
  }
  return picks;
}

/**
 * Suggested for you (03 §2.6): two practices for the category, the category's steps, a short read
 * and Mark as done, which completes what is left in the category. Finishing the last category opens
 * "You did it".
 */
export default function SuggestedScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ category: string }>();
  const category = (PLAN_CATEGORIES.includes(params.category as PlanCategory) ? params.category : 'mindfulness') as PlanCategory;
  const { width } = useWindowDimensions();
  const { currentScore, suggestions, completeSuggestion } = useFreudScore();
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const now = useMemo(() => new Date(), []);

  const plan = useMemo(() => planItems(suggestions, now), [suggestions, now]);
  const steps = plan.filter((s) => s.category === category);
  const pending = steps.filter((s) => !s.completed);
  const content = useMemo(() => contentFor(category), [category]);
  const cardW = (width - 32 - 11) / 2;

  const markDone = async () => {
    if (!pending.length || busy) return;
    setBusy(true);
    const start = currentScore.score;
    let added = 0;
    try {
      for (const s of pending) {
        await completeSuggestion({ suggestionId: s.id });
        added += suggestionBonus(s.points);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('glowScore.error'));
      setBusy(false);
      return;
    }
    setBusy(false);
    const doneIds = new Set(pending.map((s) => s.id));
    const left = plan.filter((s) => !s.completed && !doneIds.has(s.id)).length;
    if (left > 0) {
      toast.success(t('glowScore.categoryDone', { points: added }));
      backTo(undefined, '/(tabs)/freud-score/ai-suggestions');
      return;
    }
    // The whole plan is done: the gain is every step finished today.
    const to = Math.min(100, start + added);
    const gain = plan.reduce((a, s) => a + suggestionBonus(s.points), 0);
    const minutes = plan.reduce((a, s) => a + (durationMinutes(s.duration) ?? 0), 0);
    router.replace({
      pathname: '/(tabs)/freud-score/completed',
      params: { from: String(Math.max(0, to - gain)), to: String(to), done: String(plan.length), total: String(plan.length), minutes: String(minutes) },
    });
  };

  return (
    <ScoreScreen
      glows={[
        { color: palette.sky, opacity: 0.2, x: -40, y: 40, width: 260, blur: 90 },
        // Figma uses the old teal here (03 §8); lilac keeps it in the palette.
        { color: palette.lavenderSoft, opacity: 0.25, x: 170, y: 120, width: 240, blur: 90 },
      ]}
      nav={<ScoreNav label={t(`glowScore.categoryShort.${category}`)} backLabel={t('common.back')} onBack={() => backTo(undefined, '/(tabs)/freud-score/ai-suggestions')} />}
    >
      <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.plumDeep, textAlign: 'center', marginTop: 25, letterSpacing: 0 }]}>
        {t('glowScore.suggestedTitle')}
      </Text>

      <View style={{ flexDirection: 'row', gap: 11, marginTop: 22, marginHorizontal: -8 }}>
        {content.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`${t(`practices.items.${p.id}.title`)}, ${t(`glowScore.kind.${p.kind}`)}, ${p.listMinutes} min`}
            onPress={() => openPractice(p)}
            style={({ pressed }) => ({ width: cardW, minHeight: 206, borderRadius: 28, backgroundColor: palette.white, padding: 8, opacity: pressed ? 0.85 : 1 })}
          >
            <View style={{ height: 124, borderRadius: 20, backgroundColor: '#FBF8F5', overflow: 'hidden' }}>
              {p.kind === 'sleep' ? <SunsetCover width={cardW - 16} /> : <WavesCover width={cardW - 16} />}
            </View>
            <View style={{ paddingHorizontal: 6, paddingTop: 12, gap: 4 }}>
              <Text numberOfLines={1} style={[Type.bodyStrong, { color: palette.plumDeep }]}>{t(`practices.items.${p.id}.title`)}</Text>
              <Text style={[Type.captionS, { color: palette.textSubtle }]}>
                {t('glowScore.contentMeta', { kind: t(`glowScore.kind.${p.kind}`), minutes: p.listMinutes })}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {steps.length > 0 && (
        <ScoreCard style={{ marginTop: 16, paddingVertical: 8, paddingHorizontal: 18, marginHorizontal: -8 }}>
          {steps.map((s, i) => (
            <View
              key={s.id}
              accessible
              accessibilityLabel={`${s.title}${s.completed ? `, ${t('glowScore.done')}` : ''}`}
              style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: palette.surfaceLilac }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: s.completed ? 0 : 1.5, borderColor: palette.borderStrong, backgroundColor: s.completed ? palette.lavender : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {s.completed && <Icon name="line/check" size={14} color={palette.white} />}
              </View>
              <Text style={[Type.bodyMMedium, { flex: 1, color: s.completed ? palette.textSubtle : palette.ink }]}>{s.title}</Text>
              {durationMinutes(s.duration) ? (
                <Text style={[Type.captionM, { color: palette.textSubtle }]}>{formatMinutes(durationMinutes(s.duration)!)}</Text>
              ) : null}
            </View>
          ))}
        </ScoreCard>
      )}

      <ScoreCard style={{ marginTop: 16, marginHorizontal: -8, gap: 10 }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: palette.border, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 }}>
          <Text style={[Type.micro, { color: palette.plumDeep }]}>{t('glowScore.readTime')}</Text>
        </View>
        <Text style={[Type.titleSm, { color: palette.plumDeep }]}>{t(`glowScore.articles.${category}.title`)}</Text>
        <Text style={[Type.bodyS, { lineHeight: 21, color: palette.textMuted }]}>{t(`glowScore.articles.${category}.body`)}</Text>
        {expanded && (
          <Text style={[Type.bodyS, { lineHeight: 21, color: palette.textMuted }]}>{t(`glowScore.articles.${category}.more`)}</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((v) => !v)}
          hitSlop={4}
          style={({ pressed }) => ({ alignSelf: 'flex-start', borderWidth: 1, borderColor: palette.lavender, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, marginTop: 4, opacity: pressed ? 0.75 : 1 })}
        >
          <Text style={[Type.label, { fontWeight: '700', color: palette.lavender }]}>
            {t(expanded ? 'glowScore.readLess' : 'glowScore.readArticle')}
          </Text>
        </Pressable>
      </ScoreCard>

      <AppButton
        title={t(pending.length ? 'glowScore.markDone' : 'glowScore.backToPlan')}
        busy={busy}
        onPress={pending.length ? markDone : () => backTo(undefined, '/(tabs)/freud-score/ai-suggestions')}
        style={{ marginTop: 32 }}
      />
    </ScoreScreen>
  );
}

/** Calm sounds cover (03 §2.6): a lilac glow behind six fading sound waves. */
function WavesCover({ width }: { width: number }) {
  const sx = width / 150;
  const wave = (y: number, amp: number) => {
    let d = `M0,${y}`;
    for (let x = 0; x <= 150; x += 5) d += ` L${x * sx},${y + Math.sin((x / 150) * Math.PI * 3) * amp}`;
    return d;
  };
  return (
    <>
      <Glow color={palette.lavenderSoft} opacity={0.45} width={140} blur={30} style={{ position: 'absolute', left: (width - 140) / 2, top: -8 }} />
      <Svg width={width} height={124} style={{ position: 'absolute' }}>
        {[0.35, 0.3, 0.25, 0.2, 0.15, 0.1].map((o, i) => (
          <Path key={i} d={wave(40 + i * 9, 10 - i)} stroke={palette.plum} strokeOpacity={o} strokeWidth={1.5} fill="none" />
        ))}
      </Svg>
    </>
  );
}

/** Wind down cover (03 §2.6): dusk gradient, sun halo, half sun on the horizon. */
function SunsetCover({ width }: { width: number }) {
  const cx = width / 2;
  return (
    <>
      <Svg width={width} height={124} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="duskCover" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E6E1EE" />
            <Stop offset="1" stopColor="#F6E7D2" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={124} fill="url(#duskCover)" />
      </Svg>
      <Glow color={palette.mustard} opacity={0.55} width={130} blur={26} style={{ position: 'absolute', left: cx - 65, top: 32 }} />
      <Svg width={width} height={124} style={{ position: 'absolute' }}>
        <Path d={`M${cx - 30},96.7 A30,30 0 0 1 ${cx + 30},96.7 Z`} fill="#F0C77A" />
        <Line x1={0} x2={width} y1={96.7} y2={96.7} stroke={palette.plum} strokeOpacity={0.35} strokeWidth={1} />
      </Svg>
    </>
  );
}
