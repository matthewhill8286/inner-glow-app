import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMindfulness } from '@/hooks/useMindfulness';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@/components/AppIcon';
import ScreenHeader from '@/components/ScreenHeader';

const SESSION_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  meditation: { icon: 'self-improvement', color: '#7B6DC9', label: 'Meditation' },
  breathing: { icon: 'air', color: '#5B8A5A', label: 'Breathing' },
  relaxation: { icon: 'spa', color: '#E8985A', label: 'Relaxation' },
  sleep: { icon: 'bedtime', color: '#5A8FB5', label: 'Sleep' },
  focus: { icon: 'psychology', color: '#8B6B47', label: 'Focus' },
};

function getSessionType(note?: string): string {
  if (!note) return 'meditation';
  const lower = note.toLowerCase();
  if (lower.includes('breath')) return 'breathing';
  if (lower.includes('relax')) return 'relaxation';
  if (lower.includes('sleep')) return 'sleep';
  if (lower.includes('focus')) return 'focus';
  return 'meditation';
}

function formatDuration(seconds: number): { value: string; unit: string } {
  if (seconds >= 3600) {
    const h = (seconds / 3600).toFixed(1);
    return { value: h, unit: 'hours' };
  }
  const m = Math.round(seconds / 60);
  return { value: String(m), unit: m === 1 ? 'minute' : 'minutes' };
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionDetail() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mindfulnessHistory } = useMindfulness();

  const entry = useMemo(
    () => mindfulnessHistory.find((e) => e.id === id),
    [id, mindfulnessHistory],
  );

  if (!entry) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: UI.spacing.xl }}
      >
        <ScreenHeader title="Session Detail" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
          <MaterialIcons name="error-outline" size={48} color={colors.icon} />
          <Text
            style={{
              fontFamily: Typography.family.body,
              marginTop: 12,
              color: colors.mutedText,
              fontSize: 15,
            }}
          >
            Session not found
          </Text>
        </View>
      </View>
    );
  }

  const type = getSessionType(entry.note);
  const iconInfo = SESSION_ICONS[type] || SESSION_ICONS.meditation;
  const duration = formatDuration(entry.seconds);
  const sessionLabel = entry.note || 'Mindfulness Session';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: UI.spacing.xl }}>
        <ScreenHeader title="Session Detail" showBack />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero icon */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 28 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: iconInfo.color + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: iconInfo.color + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name={iconInfo.icon as any} size={36} color={iconInfo.color} />
            </View>
          </View>

          <Text
            style={{
              ...Typography.section,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {sessionLabel}
          </Text>
          <View
            style={{
              backgroundColor: iconInfo.color + '18',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: UI.radius.pill,
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontFamily: Typography.family.body,
                fontSize: 13,
                fontWeight: Typography.weight.semibold,
                color: iconInfo.color,
              }}
            >
              {iconInfo.label}
            </Text>
          </View>
        </View>

        {/* Duration card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        >
          <MaterialIcons name="timer" size={28} color={colors.primary} />
          <Text
            style={{
              fontFamily: Typography.family.body,
              fontSize: 42,
              fontWeight: Typography.weight.semibold,
              color: colors.primary,
              marginTop: 8,
              letterSpacing: -1,
            }}
          >
            {duration.value}
          </Text>
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: colors.mutedText,
              fontWeight: Typography.weight.semibold,
              marginTop: 2,
              fontSize: 15,
            }}
          >
            {duration.unit}
          </Text>
        </View>

        {/* Date & time cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
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
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#5B8A5A18',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <MaterialIcons name="calendar-today" size={22} color="#5B8A5A" />
            </View>
            <Text
              style={{
                fontFamily: Typography.family.body,
                fontSize: 14,
                fontWeight: Typography.weight.semibold,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              {formatFullDate(entry.dateISO)}
            </Text>
            <Text
              style={{
                fontFamily: Typography.family.body,
                fontSize: 12,
                color: colors.mutedText,
                fontWeight: Typography.weight.semibold,
                marginTop: 4,
              }}
            >
              Date
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
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#7B6DC918',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <MaterialIcons name="schedule" size={22} color="#7B6DC9" />
            </View>
            <Text
              style={{
                fontFamily: Typography.family.body,
                fontSize: 14,
                fontWeight: Typography.weight.semibold,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              {formatTime(entry.dateISO)}
            </Text>
            <Text
              style={{
                fontFamily: Typography.family.body,
                fontSize: 12,
                color: colors.mutedText,
                fontWeight: Typography.weight.semibold,
                marginTop: 4,
              }}
            >
              Time
            </Text>
          </View>
        </View>

        {/* Motivational tip */}
        <View
          style={{
            backgroundColor: colors.primary + '10',
            borderRadius: UI.radius.lg,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          <MaterialIcons name="lightbulb" size={22} color={colors.primary} />
          <Text
            style={{
              fontFamily: Typography.family.body,
              flex: 1,
              fontSize: 13,
              color: colors.text,
              lineHeight: 20,
            }}
          >
            Consistency is key. Every session builds on the last, strengthening your mindfulness
            practice.
          </Text>
        </View>

        {/* Action buttons */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/mindful/new-exercise',
            })
          }
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 18,
            borderRadius: UI.radius.lg,
            alignItems: 'center',
            width: '100%',
            opacity: pressed ? 0.8 : 1,
            marginBottom: 12,
          })}
        >
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: colors.onPrimary,
              fontWeight: Typography.weight.semibold,
              fontSize: 16,
            }}
          >
            Start Another Session
          </Text>
        </Pressable>

        <Pressable
          onPress={() => backTo(undefined, '/(tabs)/mindful')}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            paddingVertical: 18,
            borderRadius: UI.radius.lg,
            alignItems: 'center',
            width: '100%',
            opacity: pressed ? 0.8 : 1,
            borderWidth: 1,
            borderColor: colors.border,
          })}
        >
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: colors.text,
              fontWeight: Typography.weight.semibold,
              fontSize: 16,
            }}
          >
            Back to Sessions
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
