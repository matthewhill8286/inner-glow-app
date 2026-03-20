import React from 'react';
import { View } from 'react-native';

export default function CarouselDots({
  count,
  active,
}: Readonly<{ count: number; active: number }>) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 10 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? 'white' : 'rgba(255,255,255,0.4)',
          }}
        />
      ))}
    </View>
  );
}
