import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { ORB_LOOK, moodStep, type MoodScore } from '@/lib/mood-scale';
import AuraGood from '@/assets/svg/illustrations/mood/aura-good.svg';
import AuraTense from '@/assets/svg/illustrations/mood/aura-tense.svg';

const SIZE = 320;
const C = SIZE / 2;

/**
 * Mood orb (04 §B3). `checkIn` is the hero on the check-in screen: two glows, the Figma aura
 * contours (`6694:3578` Good, `6694:3630` Tense), an inner light and the face. `logged` swaps the
 * contours for three circular ripples (Mood logged, `6695:3624`). `home` is the smaller Mood home
 * orb (09 §3.13): two soft glows, the contours scaled to 260 and the face, with no inner light.
 */
export function MoodOrb({
  score,
  variant = 'checkIn',
  style,
}: {
  score: MoodScore;
  variant?: 'checkIn' | 'logged' | 'home';
  style?: StyleProp<ViewStyle>;
}) {
  const look = ORB_LOOK[score];
  const logged = variant === 'logged';
  if (variant === 'home') {
    const box = 260;
    return (
      <View
        style={[{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }, style]}
        pointerEvents="none"
        accessibilityElementsHidden
      >
        <Glow
          color={look.outer}
          opacity={0.28}
          width={240}
          blur={46}
          style={{ position: 'absolute', left: 10, top: 10 }}
        />
        <Glow
          color={palette.sky}
          opacity={0.18}
          width={150}
          blur={36}
          style={{ position: 'absolute', left: 105, top: 75 }}
        />
        {look.aura === 'tense' ? (
          <AuraTense width={box} height={box} style={{ position: 'absolute' }} />
        ) : (
          <AuraGood
            width={box}
            height={box}
            style={{ position: 'absolute', transform: [{ scaleY: look.squash }] }}
          />
        )}
        <Icon name={moodStep(score).face} size={56} color={palette.plum} />
      </View>
    );
  }

  return (
    <View
      style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      {logged ? (
        <>
          <Glow
            color={palette.mustard}
            opacity={0.5}
            width={300}
            blur={60}
            style={{ position: 'absolute', left: 10, top: 10 }}
          />
          <Glow
            color={palette.sky}
            opacity={0.35}
            width={180}
            blur={50}
            style={{ position: 'absolute', left: 130, top: 100 }}
          />
        </>
      ) : (
        <>
          <Glow
            color={look.outer}
            opacity={0.6}
            width={SIZE}
            blur={60}
            style={{ position: 'absolute', left: 0, top: 0 }}
          />
          <Glow
            color={look.inner}
            opacity={0.4}
            width={180}
            blur={40}
            style={{ position: 'absolute', left: 130, top: 100 }}
          />
        </>
      )}
      {logged ? (
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
          {[
            [110, 0.12],
            [90, 0.2],
            [70, 0.3],
          ].map(([r, o]) => (
            <Circle
              key={r}
              cx={C}
              cy={C}
              r={r}
              stroke={palette.plum}
              strokeOpacity={o}
              strokeWidth={1}
              fill="none"
            />
          ))}
        </Svg>
      ) : look.aura === 'tense' ? (
        <AuraTense width={SIZE} height={SIZE} style={{ position: 'absolute' }} />
      ) : (
        <AuraGood
          width={SIZE}
          height={SIZE}
          style={{ position: 'absolute', transform: [{ scaleY: look.squash }] }}
        />
      )}
      <Glow
        color={palette.cream}
        opacity={logged ? 0.95 : 0.9}
        width={logged ? 80 : 96}
        blur={logged ? 14 : 18}
        style={{ position: 'absolute' }}
      />
      <Icon name={moodStep(score).face} size={logged ? 48 : 56} color={palette.plum} />
    </View>
  );
}
