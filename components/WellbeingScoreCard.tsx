import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import { AppCard } from '@/components/ui/AppCard';
export function WellbeingScoreCard({
  score,
  label,
  loading,
  hasRecords = true,
}: {
  score: number;
  label: string;
  loading: boolean;
  hasRecords?: boolean;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <AppCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          loading ? 'Glow score is loading' : `Glow score ${score} out of 100. View breakdown`
        }
        onPress={() => router.push('/(tabs)/freud-score')}
        style={{ flexDirection: 'row', gap: 18, alignItems: 'center', minHeight: 96 }}
      >
        <View
          style={{
            width: 88,
            minHeight: 88,
            borderRadius: 18,
            backgroundColor: colors.primary + '10',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !hasRecords ? (
            <MaterialIcons name="insights" size={32} color={colors.primary} />
          ) : (
            <>
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  fontSize: 40,
                  lineHeight: 46,
                  fontWeight: Typography.weight.semibold,
                  color: colors.text,
                }}
              >
                {score}
              </Text>
              <Text style={[Typography.caption, { color: colors.mutedText }]}>out of 100</Text>
            </>
          )}
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text accessibilityRole="header" style={[Typography.section, { color: colors.text }]}>
            Your Glow score
          </Text>
          <Text style={[Typography.body, { color: colors.mutedText }]}>
            {loading
              ? 'Updating your overview…'
              : !hasRecords
                ? 'Start with a mood or sleep check-in.'
                : label || 'Your wellbeing overview'}
          </Text>
          <Text style={[Typography.caption, { color: colors.primary }]}>View score breakdown</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.mutedText} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/freud-score/ai-suggestions')}
        style={({ pressed }) => ({
          minHeight: 44,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[
            Typography.caption,
            { fontWeight: Typography.weight.semibold, color: colors.primary, flex: 1 },
          ]}
        >
          Explore personalised suggestions
        </Text>
        <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
      </Pressable>
    </AppCard>
  );
}
