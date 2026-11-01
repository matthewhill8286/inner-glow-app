import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { palette } from '@/constants/theme';

const OPACITY = [1, 0.6, 0.3];

/**
 * Typing bubble (05 §2.1): 68×36 white, radius 22 with a 6 corner bottom-left, three 8pt lavender dots
 * at 1.0, 0.6 and 0.3 opacity. The fade steps along the dots while the reply is on its way.
 */
export default function TypingBubble() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % 3), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      style={{ width: 68, height: 36, borderRadius: 22, borderBottomLeftRadius: 6, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
    >
      {[0, 1, 2].map((d) => (
        <View key={d} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.lavender, opacity: OPACITY[(d - i + 3) % 3] }} />
      ))}
    </View>
  );
}
