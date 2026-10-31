import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Circle, Stop } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, shadow } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { TAB_BAR_HEIGHT, tabBarOffset } from '@/lib/screen-layout';

export type GlowTab = { route: string; label: string; icon: IconName; centre?: boolean };

/**
 * Custom tab bar from the Nav/Tab Bar set `6604:2177` (00-foundations §4.5):
 * full-width white bar, five 75pt slots, raised radial Glow AI button in the centre,
 * a mustard glow behind the active icon.
 */
export function GlowTabBar({
  state,
  navigation,
  tabs,
  activeRoute,
  hidden,
}: BottomTabBarProps & { tabs: GlowTab[]; activeRoute: string; hidden?: boolean }) {
  const insets = useSafeAreaInsets();
  if (hidden) return null;
  const height = TAB_BAR_HEIGHT + tabBarOffset(insets.bottom);

  return (
    <View style={[styles.bar, { height, boxShadow: shadow.tabBar }]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = tab.route === activeRoute;
        const route = state.routes.find((r) => r.name === tab.route);
        const onPress = () => {
          if (!route) return;
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const labelStyle = [active ? Type.microBold : Type.micro, { color: active ? palette.plumDeep : palette.textSubtle }];
        return (
          <Pressable
            key={tab.route}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            style={styles.slot}
          >
            {tab.centre ? (
              <View style={styles.centreButton}>
                <Svg width={70} height={70} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <RadialGradient id="glowTab" cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor={palette.lavender} />
                      <Stop offset="1" stopColor={palette.plum} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={35} cy={35} r={32.5} fill="url(#glowTab)" stroke={palette.bg} strokeWidth={5} />
                </Svg>
                <Icon name={tab.icon} size={26} color={palette.white} strokeWidth={1.6} />
              </View>
            ) : (
              <View style={styles.iconWrap}>
                {active && <Glow color={palette.mustard} opacity={0.3} width={36} blur={10} style={styles.activeGlow} />}
                <Icon name={tab.icon} size={24} color={active ? palette.plum : palette.textSubtle} />
              </View>
            )}
            <Text style={[labelStyle, styles.label]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: palette.white,
    // Bar rectangle in all 25 Figma instances: top corners 32, bottom square.
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  slot: { flex: 1, alignItems: 'center', paddingTop: 10 },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  activeGlow: { position: 'absolute', left: -6, top: -6 },
  // 60pt button whose circle top sits 28pt above the bar, plus a 5pt outside ring in the
  // background colour (70pt box). Slot padding is 10, so the box starts 10 + 28 + 5 = 43pt up.
  centreButton: {
    width: 70,
    height: 70,
    marginTop: -43,
    marginBottom: -3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    boxShadow: shadow.glowButton,
  },
  label: { position: 'absolute', top: 38, textAlign: 'center' },
});
