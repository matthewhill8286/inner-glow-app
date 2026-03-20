import React from 'react';
import { View, Text, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, { Circle, G } from 'react-native-svg';

interface CategoryStat {
  label: string;
  icon: string;
  color: string;
  seconds: number;
  percentage: number;
}

function categorizeEntry(note?: string): string {
  if (!note) return 'Mindfulness';
  const lower = note.toLowerCase();
  if (lower.includes('breath')) return 'Breathing';
  if (lower.includes('relax')) return 'Relax';
  if (lower.includes('sleep')) return 'Sleep';
  return 'Mindfulness';
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  Breathing: { icon: 'air', color: '#5B8A5A' },
  Mindfulness: { icon: 'self-improvement', color: '#7B6DC9' },
  Relax: { icon: 'spa', color: '#E8985A' },
  Sleep: { icon: 'bedtime', color: '#5A8FB5' },
};

function DonutChart({
  categories,
  totalHours,
  size = 200,
  strokeWidth = 22,
  colors,
  t,
}: {
  categories: CategoryStat[];
  totalHours: string;
  size?: number;
  strokeWidth?: number;
  colors: any;
  t: any;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedOffset = 0;
  const segments = categories
    .filter((c) => c.percentage > 0)
    .map((cat) => {
      const dashLength = (cat.percentage / 100) * circumference;
      const gapLength = circumference - dashLength;
      const offset = -accumulatedOffset + circumference * 0.25; // start from top
      accumulatedOffset += dashLength;

      return {
        ...cat,
        dashLength,
        gapLength,
        offset,
      };
    });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Category segments */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          {segments.map((seg) => (
            <Circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${seg.dashLength} ${seg.gapLength}`}
              strokeDashoffset={-seg.offset + circumference * 0.25}
              strokeLinecap="round"
            />
          ))}
        </G>
      </Svg>
      {/* Center text */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: '900',
            color: colors.text,
            letterSpacing: -1,
          }}
        >
          {totalHours}
        </Text>
        <Text style={{ fontSize: 13, color: colors.mutedText, fontWeight: '600' }}>
          {t('mindfulStats.totalHours')}
        </Text>
      </View>
    </View>
  );
}

export default function MindfulStats() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { mindfulnessHistory: history, isLoading } = useMindfulness();

  // Calculate category breakdown
  const categoryMap: Record<string, number> = {};
  let totalSec = 0;
  for (const entry of history) {
    const cat = categorizeEntry(entry.note);
    categoryMap[cat] = (categoryMap[cat] || 0) + entry.seconds;
    totalSec += entry.seconds;
  }

  const categories: CategoryStat[] = Object.entries(CATEGORY_META).map(([label, meta]) => {
    const seconds = categoryMap[label] || 0;
    return {
      label,
      icon: meta.icon,
      color: meta.color,
      seconds,
      percentage: totalSec > 0 ? Math.round((seconds / totalSec) * 100) : 0,
    };
  });

  const totalHours = (totalSec / 3600).toFixed(2);

  // Weekly stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekEntries = history.filter((e) => new Date(e.dateISO) >= weekAgo);
  const weekSec = weekEntries.reduce((sum, e) => sum + e.seconds, 0);
  const weekMins = Math.round(weekSec / 60);
  const avgPerDay = Math.round(weekMins / 7);

  // Streak calculation
  let streak = 0;
  const dateSet = new Set(history.map((e) => e.dateISO.slice(0, 10)));
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: UI.spacing.xl,
        paddingTop: insets.top + 6,
      }}
    >
      <ScreenHeader title={t('mindfulStats.title')} showBack />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} size="large" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Donut chart */}
          <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 28 }}>
            <DonutChart categories={categories} totalHours={totalHours} colors={colors} t={t} />
          </View>

          {/* Category breakdown */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            {categories.map((cat) => (
              <View
                key={cat.label}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.lg,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: cat.color + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
                    {cat.label}
                  </Text>
                  <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
                    {t('mindfulStats.minutesTotal', { minutes: Math.round(cat.seconds / 60) })}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: cat.color + '18',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: UI.radius.pill,
                  }}
                >
                  <Text style={{ fontWeight: '800', color: cat.color, fontSize: 14 }}>
                    {cat.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Quick stats cards */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 12,
            }}
          >
            {t('mindfulStats.thisWeek')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: UI.radius.lg,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name="timer" size={24} color="#5B8A5A" />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {weekMins}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                {t('mindfulStats.minutesLabel')}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: UI.radius.lg,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name="trending-up" size={24} color="#E8985A" />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {avgPerDay}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                {t('mindfulStats.avgMinPerDay')}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: UI.radius.lg,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name="local-fire-department" size={24} color="#C45B5B" />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {streak}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                {t('mindfulStats.dayStreak')}
              </Text>
            </View>
          </View>

          {/* Session count */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: UI.radius.lg,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#7B6DC920',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="format-list-numbered" size={22} color="#7B6DC9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
                {t('mindfulStats.totalSessions')}
              </Text>
              <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 2 }}>
                {t('mindfulStats.motivationalMessage')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: colors.primary,
              }}
            >
              {history.length}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
