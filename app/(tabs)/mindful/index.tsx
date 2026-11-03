import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import { useDailyGoal } from '@/hooks/usePractices';
import { CategoryCard, type Kind } from '@/components/practices/CategoryCard';
import { screenBottomPadding } from '@/lib/screen-layout';
import AuraContours from '@/assets/svg/illustrations/practices/aura.svg';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

const RING = 220;
const R = (RING - 5.5) / 2;
const C = 2 * Math.PI * R;
/** The 9-point goal knob sits on the ring, so the drawing gets this margin or the knob is clipped at 0 min (TestFlight report 9). */
const KNOB_PAD = 10;
const MID = RING / 2 + KNOB_PAD;

const CARDS: { kind: Kind; href: Href }[] = [
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
  const { width } = useWindowDimensions();
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
      <AuraContours
        width={width}
        height={(480 * width) / 375}
        style={{ position: 'absolute', top: 0 }}
        pointerEvents="none"
      />
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
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
          <Svg
            width={RING + 2 * KNOB_PAD}
            height={RING + 2 * KNOB_PAD}
            style={{ position: 'absolute', left: -KNOB_PAD, top: -KNOB_PAD }}
          >
            <Circle cx={MID} cy={MID} r={R} stroke={palette.border} strokeWidth={5.5} fill="none" />
            {fraction > 0 && (
              <Circle
                cx={MID}
                cy={MID}
                r={R}
                stroke={palette.plum}
                strokeWidth={5.5}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${C} ${C}`}
                strokeDashoffset={C * (1 - fraction)}
                transform={`rotate(-90 ${MID} ${MID})`}
              />
            )}
            <Circle
              cx={MID + R * Math.cos(end)}
              cy={MID + R * Math.sin(end)}
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
            gap: 10,
            boxShadow: '0px -17px 38px rgba(36,26,46,0.05)',
          }}
        >
          {CARDS.map((c) => (
            <View key={c.kind} style={{ width: '48.5%' }}>
              <CategoryCard
                kind={c.kind}
                title={t(`practices.categories.${c.kind}.title`)}
                meta={t(`practices.categories.${c.kind}.meta`)}
                onPress={() => router.push(c.href)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
