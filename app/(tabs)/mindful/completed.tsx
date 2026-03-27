import React from 'react';
import { View, Text, Pressable, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const getGoalLabels = (t: any): Record<string, string> => ({
  focus: t('mindfulCompleted.focus'),
  sleep: t('mindfulCompleted.sleep'),
  better: t('mindfulCompleted.better'),
  trauma: t('mindfulCompleted.trauma'),
  enjoy: t('mindfulCompleted.enjoy'),
});

export default function ExerciseCompleted() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { minutes = '25', goal = 'focus' } = useLocalSearchParams<{
    minutes: string;
    goal: string;
  }>();

  const mins = parseInt(minutes, 10);
  const goalLabel = getGoalLabels(t)[goal] || t('mindfulCompleted.defaultLabel');

  // Calculate score improvements based on duration
  const focusGain = Math.min(15, Math.round(mins * 0.32));
  const stressReduction = Math.min(10, Math.round(mins * 0.2));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: UI.spacing.xl,
          paddingTop: insets.top + 54,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#5B8A5A18',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#5B8A5A28',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="check-circle" size={56} color="#5B8A5A" />
          </View>
        </View>

        {/* Congrats text */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {t('mindfulCompleted.title')}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.mutedText,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
            paddingHorizontal: 20,
          }}
        >
          {t('mindfulCompleted.subtitle', { goal: goalLabel.toLowerCase() })}
        </Text>

        {/* Duration card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
            padding: 20,
            width: '100%',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        >
          <MaterialIcons name="timer" size={28} color={colors.primary} />
          <Text
            style={{
              fontSize: 36,
              fontWeight: '900',
              color: colors.primary,
              marginTop: 8,
            }}
          >
            {mins} min
          </Text>
          <Text style={{ color: colors.mutedText, fontWeight: '600', marginTop: 2 }}>
            {goalLabel}
          </Text>
        </View>

        {/* Score improvements */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            width: '100%',
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
              <MaterialIcons name="psychology" size={24} color="#5B8A5A" />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#5B8A5A',
              }}
            >
              +{focusGain}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedText,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              {t('mindfulCompleted.focusScore')}
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
                backgroundColor: '#E8985A18',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <MaterialIcons name="mood" size={24} color="#E8985A" />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#E8985A',
              }}
            >
              -{stressReduction}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedText,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              {t('mindfulCompleted.stressLevel')}
            </Text>
          </View>
        </View>

        {/* Motivational message */}
        <View
          style={{
            backgroundColor: colors.primary + '10',
            borderRadius: UI.radius.lg,
            padding: 16,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          <MaterialIcons name="lightbulb" size={22} color={colors.primary} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.text,
              lineHeight: 20,
            }}
          >
            {t('mindfulCompleted.motivationalMessage')}
          </Text>
        </View>

        {/* Action buttons */}
        <Pressable
          onPress={() => router.replace('/(tabs)/mindful')}
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
              color: colors.onPrimary,
              fontWeight: '800',
              fontSize: 16,
            }}
          >
            {t('mindfulCompleted.backButton')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/(tabs)/mindful/new-exercise',
            })
          }
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
              color: colors.text,
              fontWeight: '700',
              fontSize: 16,
            }}
          >
            {t('mindfulCompleted.anotherButton')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
