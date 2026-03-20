import React from 'react';
import { View, Text } from 'react-native';

export default function ProfileProgressRing({ progress }: Readonly<{ progress: number }>) {
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 6,
        borderColor: '#d8d2cb',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
      }}
    >
      <Text style={{ fontWeight: '900' }}>{progress}%</Text>
    </View>
  );
}
