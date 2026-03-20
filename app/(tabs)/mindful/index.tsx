import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { router } from 'expo-router';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const SESSION_ICONS: Record<string, { icon: string; color: string }> = {
  meditation: { icon: 'self-improvement', color: '#7B6DC9' },
  breathing: { icon: 'air', color: '#5B8A5A' },
  relaxation: { icon: 'spa', color: '#E8985A' },
  sleep: { icon: 'bedtime', color: '#5A8FB5' },
  focus: { icon: 'psychology', color: '#8B6B47' },
};

function formatHours(totalSeconds: number): string {
  const hours = totalSeconds / 3600;
  return hours.toFixed(2);
}

function getSessionType(note?: string): string {
  if (!note) return 'meditation';
  const lower = note.toLowerCase();
  if (lower.includes('breath')) return 'breathing';
  if (lower.includes('relax')) return 'relaxation';
  if (lower.includes('sleep')) return 'sleep';
  if (lower.includes('focus')) return 'focus';
  return 'meditation';
}

function getSessionLabel(note?: string): string {
  if (!note) return 'Mindfulness Session';
  return note;
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MindfulHoursMain() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { mindfulnessHistory: history, isLoading } = useMindfulness();

  const totalSeconds = history.reduce((sum, e) => sum + e.seconds, 0);
  const totalHours = formatHours(totalSeconds);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = history.filter((e) => e.dateISO.slice(0, 10) === todayStr);
  const todaySeconds = todaySessions.reduce((sum, e) => sum + e.seconds, 0);
  const todayMins = Math.round(todaySeconds / 60);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: UI.spacing.xl,
      }}
    >
      <ScreenHeader
        title="Mindful Hours"
        showBack
        rightElement={
          <Pressable
            onPress={() => router.push('/(tabs)/mindful/stats')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              backgroundColor: colors.card,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            })}
          >
            <MaterialIcons name="bar-chart" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      {/* Total hours hero section */}
      <View
        style={{
          alignItems: 'center',
          marginTop: 28,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            ...UI.shadow.lg,
          }}
        >
          <Text
            style={{
              fontSize: 42,
              fontWeight: '900',
              color: colors.primary,
              letterSpacing: -1,
            }}
          >
            {totalHours}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedText,
              fontWeight: '600',
              marginTop: 2,
            }}
          >
            Total Hours
          </Text>
        </View>
      </View>

      {/* Today's progress bar */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: UI.radius.lg,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#5B8A5A20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="today" size={22} color="#5B8A5A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
            Today&apos;s Mindfulness
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 2 }}>
            {todayMins} min{todayMins !== 1 ? 's' : ''} completed
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/mindful/new-exercise')}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: UI.radius.pill,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 13 }}>
            + New Exercise
          </Text>
        </Pressable>
      </View>

      {/* Session history header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Recent Sessions</Text>
        <Pressable onPress={() => router.push('/(tabs)/mindful/stats')}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>View All</Text>
        </Pressable>
      </View>

      {/* Session history list */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : history.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.5,
            paddingBottom: 60,
          }}
        >
          <MaterialIcons name="self-improvement" size={64} color={colors.icon} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
            }}
          >
            No sessions yet
          </Text>
          <Text style={{ marginTop: 8, color: colors.mutedText, textAlign: 'center' }}>
            Start your first mindful exercise to begin tracking your progress.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
        >
          {history.slice(0, 20).map((entry) => {
            const type = getSessionType(entry.note);
            const iconInfo = SESSION_ICONS[type] || SESSION_ICONS.meditation;
            const minutes = Math.round(entry.seconds / 60);

            return (
              <View
                key={entry.id}
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
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: iconInfo.color + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={iconInfo.icon as any} size={22} color={iconInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: '700',
                      color: colors.text,
                      fontSize: 15,
                    }}
                  >
                    {getSessionLabel(entry.note)}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedText,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {formatSessionDate(entry.dateISO)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: colors.primary,
                    }}
                  >
                    {minutes}m
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedText }}>Duration</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
