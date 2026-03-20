import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

function ProgressRing({
  size = 64,
  strokeWidth = 5,
  progress,
  color,
}: Readonly<{
  size?: number;
  strokeWidth?: number;
  progress: number;
  color: string;
}>) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      {/* Background track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.15}
      />
      {/* Progress arc */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

export default function ScoreCard({
  score,
  title,
  subtitle,
  bg,
}: Readonly<{
  score: string | number;
  title: string;
  subtitle: string;
  bg: string;
}>) {
  const numericScore = typeof score === 'string' ? parseInt(score, 10) || 0 : score;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: bg + '10',
        borderRadius: 18,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: bg + '18',
      }}
    >
      {/* Circular progress ring with score */}
      <View
        style={{
          width: 64,
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <ProgressRing size={64} strokeWidth={5} progress={numericScore} color={bg} />
        <Text
          style={{
            position: 'absolute',
            color: bg,
            fontSize: 20,
            fontWeight: '900',
          }}
        >
          {score}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: bg, fontSize: 15, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: bg, opacity: 0.6, fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
  );
}
