import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function TypingBubble() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % 3), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[0, 1, 2].map((d) => (
        <View
          key={d}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#aaa',
            opacity: i === d ? 1 : 0.3,
          }}
        />
      ))}
    </View>
  );
}
