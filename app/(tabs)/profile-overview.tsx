import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import ScoreCard from '@/components/ScoreCard';

export default function ProfileOverview() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const name = profile?.name;

  return (
    <View style={{ flex: 1, backgroundColor: '#6f6660', padding: 24, justifyContent: 'center', paddingTop: insets.top + 6 }}>
      <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 26 }}>
        <Text style={{ fontSize: 26, fontWeight: '900' }}>
          {name ? t('profileOverview.greeting', { name }) : t('profileOverview.profileComplete')}
        </Text>
        <Text style={{ opacity: 0.7, marginTop: 8 }}>{t('profileOverview.snapshot')}</Text>

        <ScoreCard
          score={87}
          title={t('profileOverview.feelScore')}
          subtitle={t('common.wellbeingBaseline')}
          bg="#6bbf8e"
        />
        <ScoreCard
          score={41}
          title={t('common.stressLoad')}
          subtitle={t('common.keepStressManageable')}
          bg="#f2a65a"
        />
        <ScoreCard
          score={16}
          title={t('profileOverview.fatigueRisk')}
          subtitle={t('common.prioritizeRest')}
          bg="#9b8df1"
        />
      </View>

      <Pressable
        onPress={() => router.replace('/(onboarding)/suggested-categories')}
        style={{
          marginTop: 18,
          backgroundColor: '#a07b55',
          padding: 16,
          borderRadius: 18,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '900' }}>{t('common.continue')}</Text>
      </Pressable>
    </View>
  );
}
