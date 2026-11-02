import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow, GlowField } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import { useDailyGoal } from '@/hooks/usePractices';
import { screenBottomPadding } from '@/lib/screen-layout';

const RING = 220;
const R = (RING - 5.5) / 2;
const C = 2 * Math.PI * R;

/** Cover art for the four category cards (07 §2.1), drawn from the design's shapes. */
function Cover({ kind }: { kind: 'breathing' | 'relax' | 'mindfulness' | 'sleep' }) {
  return (
    <View
      style={{
        height: 58,
        borderRadius: 18,
        backgroundColor: kind === 'sleep' ? '#EDE2EE' : '#FBF8F5',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {kind === 'breathing' && (
        <>
          <Glow
            color={palette.sky}
            opacity={0.55}
            width={120}
            blur={24}
            style={{ position: 'absolute', left: 17.5, top: -31 }}
          />
          <Svg width={80} height={80} style={{ position: 'absolute' }}>
            {[14, 22, 30, 38].map((r, i) => (
              <Circle
                key={r}
                cx={40}
                cy={40}
                r={r}
                stroke={palette.plum}
                strokeOpacity={[0.5, 0.35, 0.25, 0.15][i]}
                fill="none"
              />
            ))}
          </Svg>
          <Glow color="#F2D96A" opacity={0.9} width={16} blur={4} />
        </>
      )}
      {kind === 'relax' && (
        <>
          <Glow
            color={palette.mustard}
            opacity={0.55}
            width={130}
            blur={26}
            style={{ position: 'absolute', left: 12.5, top: -36 }}
          />
          <Svg width={155} height={58} style={{ position: 'absolute' }}>
            {[10, 15, 20, 25, 30].map((h, i) => (
              <Path
                key={h}
                d={`M0 ${29} Q 39 ${29 - h} 78 29 T 155 29`}
                stroke={palette.plum}
                strokeOpacity={0.4 - i * 0.06}
                fill="none"
              />
            ))}
          </Svg>
        </>
      )}
      {kind === 'mindfulness' && (
        <>
          <Glow
            color={palette.lavender}
            opacity={0.45}
            width={120}
            blur={26}
            style={{ position: 'absolute', left: 17, top: -31 }}
          />
          <Glow color={palette.mustard} opacity={0.3} width={70} blur={18} />
          <Svg width={120} height={58} style={{ position: 'absolute' }}>
            {[8, 13, 18, 23, 28, 33].map((r, i) => (
              <Circle
                key={r}
                cx={60}
                cy={29}
                r={r}
                stroke={palette.plum}
                strokeOpacity={0.4 - i * 0.05}
                fill="none"
              />
            ))}
          </Svg>
        </>
      )}
      {kind === 'sleep' && (
        <>
          <Glow
            color={palette.lavenderSoft}
            opacity={0.7}
            width={110}
            blur={20}
            style={{ position: 'absolute', left: 22, top: -26 }}
          />
          <View style={{ position: 'absolute', top: 15 }}>
            <Icon name="line/moon" size={22} />
          </View>
          <Svg width={155} height={58} style={{ position: 'absolute' }}>
            <Line x1={0} x2={155} y1={46.4} y2={46.4} stroke={palette.plum} strokeOpacity={0.3} />
          </Svg>
        </>
      )}
      <View
        style={{
          position: 'absolute',
          right: 6,
          top: 6,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: palette.plum,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="line/play" size={12} color={palette.white} />
      </View>
    </View>
  );
}

const CARDS: { kind: 'breathing' | 'relax' | 'mindfulness' | 'sleep'; href: Href }[] = [
  {
    kind: 'breathing',
    href: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'breathing' } },
  },
  {
    kind: 'relax',
    href: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'relax' } },
  },
  {
    kind: 'mindfulness',
    href: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'mindfulness' } },
  },
  {
    kind: 'sleep',
    href: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'sleep' } },
  },
];

/**
 * Practices hub (07 §2.1): today's minutes against the daily goal in the ring (tap to change the
 * goal), the change since yesterday, and the four practice categories. The header adds Favourites
 * and Your sessions. The goal is in minutes, as on the Daily goal screen (10 §3.7).
 */
export default function PracticesHub() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { goal, today, yesterday } = useDailyGoal();
  const fraction = Math.min(1, today / goal);
  const end = -Math.PI / 2 + fraction * 2 * Math.PI;
  const delta = today - yesterday;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3EFED' }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.3, x: -40, y: 40, width: 260, blur: 90 },
          { color: palette.sky, opacity: 0.3, x: 170, y: 120, width: 240, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: screenBottomPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 10,
            paddingHorizontal: 24,
          }}
        >
          <IconButton
            variant="solid"
            icon="line/heart"
            iconSize={20}
            accessibilityLabel={t('practices.hub.favourites')}
            onPress={() => router.push('/(tabs)/mindful/favourites')}
          />
          <IconButton
            variant="solid"
            icon="line/chart"
            iconSize={20}
            accessibilityLabel={t('practices.hub.history')}
            onPress={() => router.push('/(tabs)/mindful/history')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${today} ${t('practices.hub.minutesToday')}, ${t('practices.hub.ofGoal', { goal })}. ${t('practices.hub.editGoal')}`}
          onPress={() => router.push('/(tabs)/mindful/goal')}
          style={{
            width: RING,
            height: RING,
            alignSelf: 'center',
            marginTop: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={palette.border}
              strokeWidth={5.5}
              fill="none"
            />
            {fraction > 0 && (
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                stroke={palette.plum}
                strokeWidth={5.5}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${C} ${C}`}
                strokeDashoffset={C * (1 - fraction)}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            )}
            <Circle
              cx={RING / 2 + R * Math.cos(end)}
              cy={RING / 2 + R * Math.sin(end)}
              r={9}
              fill={palette.mustard}
            />
          </Svg>
          <Text style={[Type.titleMd, { fontSize: 56, lineHeight: 64, color: palette.plumDeep }]}>
            {today}
          </Text>
          <Text
            style={[
              Type.bodySm,
              { fontFamily: Type.bodyMMedium.fontFamily, color: palette.textMuted },
            ]}
          >
            {t('practices.hub.ofGoal', { goal })}
          </Text>
          {delta !== 0 && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: palette.plum,
                borderRadius: 999,
                paddingVertical: 3,
                paddingHorizontal: 10,
              }}
            >
              <Text
                style={[Type.microBold, { fontSize: 12, lineHeight: 14, color: palette.white }]}
              >
                {t(delta > 0 ? 'practices.hub.up' : 'practices.hub.down', {
                  minutes: Math.abs(delta),
                })}
              </Text>
            </View>
          )}
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            marginTop: 28,
          }}
        >
          <Text
            accessibilityRole="header"
            style={[Type.bodyMSemi, { fontSize: 18, lineHeight: 24, color: palette.ink }]}
          >
            {t('practices.hub.choose')}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(tabs)/mindful/all')}
            hitSlop={10}
          >
            <Text
              style={[
                Type.buttonS,
                { fontSize: 14, fontFamily: Type.microBold.fontFamily, color: palette.lavender },
              ]}
            >
              {t('practices.hub.seeAll')}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 16,
            marginHorizontal: 1,
            backgroundColor: palette.white,
            borderRadius: 40,
            padding: 15,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 9,
            boxShadow: '0px -17px 38px rgba(75,52,37,0.05)',
          }}
        >
          {CARDS.map((c) => (
            <Pressable
              key={c.kind}
              accessibilityRole="button"
              accessibilityLabel={`${t(`practices.categories.${c.kind}.title`)}, ${t(`practices.categories.${c.kind}.meta`)}`}
              onPress={() => router.push(c.href)}
              style={({ pressed }) => ({
                width: '48.5%',
                borderRadius: 24,
                padding: 6,
                paddingBottom: 14,
                backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
                gap: 8,
              })}
            >
              <Cover kind={c.kind} />
              <View style={{ paddingHorizontal: 8, gap: 2 }}>
                <Text style={[Type.bodyMSemi, { lineHeight: 20, color: palette.ink }]}>
                  {t(`practices.categories.${c.kind}.title`)}
                </Text>
                <Text style={[Type.micro, { color: palette.textSubtle }]}>
                  {t(`practices.categories.${c.kind}.meta`)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
