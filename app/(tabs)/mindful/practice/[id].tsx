import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow, GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { Toggle } from '@/components/ui/controls';
import { NavBar } from '@/components/ui/IconButton';
import { OptionPills, SoundSheet, usePracticeText } from '@/components/practices/PracticeParts';
import { practiceById, type Practice, type SoundKey } from '@/data/practices';
import { VideoDetails } from '@/components/practices/VideoDetails';
import { useFavouriteHeart } from '@/hooks/useFavouriteHeart';
import { backTo } from '@/lib/navigation';
import type { Pace } from '@/lib/practices';

const ACCENT = {
  breathing: palette.sky,
  mindfulness: palette.lavender,
  sleep: palette.lavenderSoft,
} as const;

/** Hero art per category (07 §2.6, 10 §3.4–3.5). */
function Hero({
  category,
  label,
}: {
  category: 'breathing' | 'mindfulness' | 'sleep';
  label?: string;
}) {
  return (
    <View
      style={{ height: 176, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {category === 'breathing' && (
        <>
          <Glow
            color={palette.sky}
            opacity={0.18}
            width={200}
            blur={40}
            style={{ position: 'absolute', left: 63, top: -12 }}
          />
          <Glow
            color={palette.mustard}
            opacity={0.28}
            width={140}
            blur={40}
            style={{ position: 'absolute', left: 150, top: 40 }}
          />
          <Svg width={160} height={160} style={{ position: 'absolute' }}>
            <Circle cx={80} cy={80} r={75} stroke={palette.plum} fill="none" />
            <Circle cx={80} cy={80} r={55} stroke={palette.plum} fill="none" />
          </Svg>
          <Glow
            color="#F2D96A"
            opacity={0.85}
            width={46}
            blur={12}
            style={{ position: 'absolute' }}
          />
          {label ? (
            <Text style={[Type.microBold, { fontSize: 12, color: palette.plumDeep }]}>{label}</Text>
          ) : null}
        </>
      )}
      {category === 'mindfulness' && (
        <>
          <Glow
            color={palette.lavender}
            opacity={0.3}
            width={180}
            blur={40}
            style={{ position: 'absolute', left: 73, top: -2 }}
          />
          <Glow
            color={palette.mustard}
            opacity={0.3}
            width={90}
            blur={24}
            style={{ position: 'absolute' }}
          />
          <Svg width={200} height={176} style={{ position: 'absolute' }}>
            {[20, 34, 48, 62, 76].map((r, i) => (
              <Circle
                key={r}
                cx={100}
                cy={88}
                r={r}
                stroke={palette.plum}
                strokeOpacity={0.4 - i * 0.06}
                fill="none"
              />
            ))}
          </Svg>
        </>
      )}
      {category === 'sleep' && (
        <>
          <Glow
            color={palette.lavenderSoft}
            opacity={0.25}
            width={158}
            blur={30}
            style={{ position: 'absolute', left: 150, top: -12 }}
          />
          <Svg width={327} height={176} style={{ position: 'absolute' }}>
            {[0.32, 0.26, 0.19, 0.13, 0.06].map((o, i) => (
              <Path
                key={o}
                d={`M0 ${120 + i * 6} C 80 ${100 + i * 8}, 160 ${140 - i * 4}, 327 ${112 + i * 6}`}
                stroke={palette.plum}
                strokeOpacity={o}
                fill="none"
              />
            ))}
          </Svg>
          <View style={{ position: 'absolute', left: 214, top: 50 }}>
            <Icon name="line/moon" size={30} />
          </View>
        </>
      )}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: palette.surfaceLilac, marginVertical: 12 }} />;
}

/**
 * Practice Set up (07 §2.6, restyled in 10 §3.4–3.5): Nav Bar with the favourite heart, the hero,
 * title, chips and description, the options card (pace, duration, sound, haptic cues or fade out)
 * and Start practice. The sound row opens Choose a sound. The design's voice guidance toggle is left
 * out because there are no narration recordings yet.
 */
export default function PracticeScreen() {
  const { id, duration } = useLocalSearchParams<{ id: string; duration?: string }>();
  const practice = practiceById(id);
  if (!practice) return null;
  // A reminder can open the set-up on one of the practice's lengths, such as the sunset's 10 minutes.
  const minutes = Number(duration);
  const start = practice.durations?.includes(minutes) ? minutes : practice.defaultDuration;
  return practice.kind === 'video' ? (
    <VideoDetails practice={practice} />
  ) : (
    <PracticeSetup practice={practice} startDuration={start} />
  );
}

function PracticeSetup({ practice, startDuration }: { practice: Practice; startDuration?: number }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const text = usePracticeText();
  const heart = useFavouriteHeart(practice.id, insets.bottom + 90);
  const [pace, setPace] = useState<Pace>('slow');
  const [duration, setDuration] = useState(startDuration ?? 5);
  const [sound, setSound] = useState<SoundKey>(practice.options.sound ?? 'silence');
  const [haptics, setHaptics] = useState(practice.options.haptics ?? false);
  const [fadeOut, setFadeOut] = useState(practice.options.fadeOut ?? false);
  const [soundOpen, setSoundOpen] = useState(false);

  const category = practice.category as 'breathing' | 'mindfulness' | 'sleep';
  const x = text(practice);

  const start = () =>
    router.push({
      pathname: '/(tabs)/mindful/play/[id]',
      params: {
        id: practice.id,
        duration: String(duration),
        pace,
        sound,
        haptics: haptics ? '1' : '0',
        fadeOut: fadeOut ? '1' : '0',
      },
    });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          {
            color: ACCENT[category],
            opacity: category === 'mindfulness' ? 0.2 : 0.25,
            x: 150,
            y: 30,
            width: 270,
            blur: 90,
          },
          { color: palette.mustard, opacity: 0.28, x: -60, y: 10, width: 220, blur: 90 },
        ]}
      />
      <NavBar
        title={t(`practices.categories.${category}.title`)}
        backLabel={t('common.back')}
        onBack={() => backTo(undefined, '/(tabs)/mindful')}
        trailing={heart.button}
        style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        <Hero category={category} label={practice.patternLabel} />
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 26, lineHeight: 34, color: palette.plumDeep }]}
        >
          {x.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {[t('practices.minutes', { count: duration }), x.tag, x.level].map((c) => (
            <View
              key={c}
              style={{
                height: 22,
                borderRadius: 999,
                paddingHorizontal: 10,
                justifyContent: 'center',
                backgroundColor: palette.borderLilac,
              }}
            >
              <Text
                style={[Type.buttonS, { fontSize: 12, lineHeight: 14, color: palette.plumDeep }]}
              >
                {c}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[Type.bodySm, { color: palette.textMuted }]}>{x.description}</Text>

        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 28,
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 18,
            marginTop: 8,
          }}
        >
          {practice.options.pace && (
            <>
              <Text style={[Type.buttonS, { fontSize: 13, color: palette.ink, marginBottom: 8 }]}>
                {t('practices.setup.pace')}
              </Text>
              <OptionPills
                label={t('practices.setup.pace')}
                value={pace}
                onChange={setPace}
                options={(['slow', 'normal', 'fast'] as Pace[]).map((p) => ({
                  value: p,
                  label: t(`practices.setup.paces.${p}`),
                }))}
              />
              <Divider />
            </>
          )}
          <Text style={[Type.buttonS, { fontSize: 13, color: palette.ink, marginBottom: 8 }]}>
            {t('practices.setup.duration')}
          </Text>
          <OptionPills
            label={t('practices.setup.duration')}
            value={duration}
            onChange={setDuration}
            options={(practice.durations ?? [5]).map((d) => ({
              value: d,
              label: t('practices.minutes', { count: d }),
            }))}
          />
          <Divider />
          <Pressable
            accessibilityRole="button"
            onPress={() => setSoundOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', minHeight: 32 }}
          >
            <Text style={[Type.buttonS, { fontSize: 14, flex: 1, color: palette.ink }]}>
              {t(
                category === 'mindfulness' ? 'practices.setup.soundscape' : 'practices.setup.sound',
              )}
            </Text>
            <Text
              style={[
                Type.bodySm,
                {
                  fontFamily: Type.bodyMMedium.fontFamily,
                  color: palette.textMuted,
                  marginRight: 6,
                },
              ]}
            >
              {t(`practices.sounds.${sound}.name`)}
            </Text>
            <Icon name="arrow/chevron-right" size={18} />
          </Pressable>
          {practice.options.haptics !== undefined && (
            <>
              <Divider />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[Type.buttonS, { fontSize: 14, flex: 1, color: palette.ink }]}>
                  {t('practices.setup.haptics')}
                </Text>
                <Toggle
                  value={haptics}
                  onValueChange={setHaptics}
                  accessibilityLabel={t('practices.setup.haptics')}
                />
              </View>
            </>
          )}
          {practice.options.fadeOut !== undefined && (
            <>
              <Divider />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[Type.buttonS, { fontSize: 14, flex: 1, color: palette.ink }]}>
                  {t('practices.setup.fadeOut')}
                </Text>
                <Toggle
                  value={fadeOut}
                  onValueChange={setFadeOut}
                  accessibilityLabel={t('practices.setup.fadeOut')}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 14 }}>
        <AppButton title={t('practices.setup.start')} onPress={start} />
      </View>
      {heart.toast}
      <SoundSheet
        visible={soundOpen}
        category={category}
        value={sound}
        onDone={(k) => {
          setSound(k);
          setSoundOpen(false);
        }}
        onClose={() => setSoundOpen(false)}
      />
    </View>
  );
}
