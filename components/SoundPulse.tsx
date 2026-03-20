import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export default function SoundPulse({ active }: Readonly<{ active: boolean }>) {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  function loop(anim: Animated.Value, delay: number) {
    anim.setValue(0);
    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ]),
    );
  }

  useEffect(() => {
    if (!active) {
      a1.stopAnimation();
      a2.stopAnimation();
      a3.stopAnimation();
      a1.setValue(0);
      a2.setValue(0);
      a3.setValue(0);
      return;
    }
    const l1 = loop(a1, 0);
    const l2 = loop(a2, 600);
    const l3 = loop(a3, 1200);
    l1.start();
    l2.start();
    l3.start();
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [active]);

  const ringStyle = (anim: Animated.Value, size: number, color: string) => ({
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ringStyle(a3, 280, '#dbe3cb')} />
      <Animated.View style={ringStyle(a2, 220, '#cbd4b4')} />
      <Animated.View style={ringStyle(a1, 160, '#b8c39d')} />
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#828a6a',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}
      />
    </View>
  );
}
