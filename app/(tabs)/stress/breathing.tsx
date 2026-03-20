import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { BREATHING_EXERCISES, BreathingExercise } from '@/data/breathingExercises';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BreathingListScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: UI.spacing.xl,
      }}
    >
      <ScreenHeader
        title={t('stressBreathing.title')}
        subtitle={t('stressBreathing.subtitle')}
        showBack
      />

      <FlatList
        style={{ marginTop: 14 }}
        data={BREATHING_EXERCISES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <BreathingCard exercise={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function BreathingCard({ exercise }: { exercise: BreathingExercise }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Pressable
      onPress={() => {
        router.push({
          pathname: '/(tabs)/stress/breathing/[id]',
          params: { id: exercise.id },
        });
      }}
      style={{
        backgroundColor: colors.card,
        borderRadius: UI.radius.xl,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="air" size={24} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>
          {exercise.title}
        </Text>
        <Text style={{ color: colors.mutedText, marginTop: 4 }}>{exercise.subtitle}</Text>
      </View>

      <MaterialIcons name="chevron-right" size={24} color={colors.divider} />
    </Pressable>
  );
}
