import React from 'react';
import { View, type DimensionValue, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Skeleton } from '@/components/Skeleton';

/** Loading bars and blocks are lilac (`#E6E0EA`) on white cards, as in `6817:7276` and `6817:7339`. */
function Bar({
  width,
  height = 10,
  radius = 5,
  style,
}: {
  width: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={radius}
      style={{ backgroundColor: palette.borderLilac, ...style }}
    />
  );
}

function Card({
  children,
  height,
  style,
}: {
  children: React.ReactNode;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: palette.white,
        padding: 20,
        gap: 12,
        height,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

/** Home loading (`6817:7276`): the header, the mood card, the Glow AI bar, the glow card and For you today. */
export function HomeSkeleton() {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Skeleton
          width={44}
          height={44}
          borderRadius={22}
          style={{ backgroundColor: palette.borderLilac }}
        />
        <View style={{ gap: 8 }}>
          <Bar width={90} />
          <Bar width={140} height={14} radius={7} />
        </View>
      </View>
      <Card>
        <Bar width="40%" />
        <Bar width="85%" />
        <Bar width="70%" />
        <Bar width="55%" />
      </Card>
      <Card>
        <Bar width="40%" />
        <Bar width="65%" />
      </Card>
      <Card height={240}>
        <Bar width="40%" />
        <Bar width="85%" />
        <Bar width="70%" />
        <Bar width="55%" />
        <Bar width="45%" />
      </Card>
      <Card height={150}>
        <Bar width="40%" />
        <Bar width="65%" />
      </Card>
    </View>
  );
}

function ListCard() {
  return (
    <Card style={{ gap: 14 }}>
      <Bar width="32%" />
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton
            width={28}
            height={28}
            borderRadius={14}
            style={{ backgroundColor: palette.borderLilac }}
          />
          <Bar width="55%" />
        </View>
      ))}
    </Card>
  );
}

/** Glow score Insights loading (`6817:7339`): the period switch, the trend card and two list cards. */
export function InsightsSkeleton() {
  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={{ gap: 16, marginTop: 16 }}
    >
      <Bar width="100%" height={44} radius={22} />
      <Card>
        <Bar width="28%" />
        <Bar width="20%" height={22} radius={11} />
        <Bar width="100%" height={110} radius={20} />
      </Card>
      <ListCard />
      <ListCard />
    </View>
  );
}
