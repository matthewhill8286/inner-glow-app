import React from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { useFreudScore } from '@/hooks/useFreudScore';
import { getFreudColor } from '@/lib/freudScore';
import { SkeletonRect } from '@/components/Skeleton';
import { UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const C = {
  pageBg: '#6f6660',
  cardBg: '#FFFFFF',
  brown: '#a07b55',
  brownLight: '#6a5e55',
  brownText: '#96784E',
  olive: '#828a6a',
};

function BreakdownBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.brownLight }}>
          {icon} {label}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color }}>{value}</Text>
      </View>
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#f2ece6',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${value}%`,
            borderRadius: 4,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export default function ProfileCompletion() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { currentScore: freudScore, isDataLoading } = useFreudScore();

  const name = profile?.name;
  const score = freudScore?.score ?? 0;
  const scoreColor = getFreudColor(score);

  return (
    <View style={{ flex: 1, backgroundColor: C.pageBg, padding: 24, paddingTop: insets.top + 16 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
          {t('profileCompletion.title')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ backgroundColor: C.cardBg, borderRadius: 28, padding: 24, minHeight: 400 }}>
          {isDataLoading ? (
            <View style={{ gap: 14 }}>
              <SkeletonRect height={30} width={180} />
              <SkeletonRect height={20} width={240} />
              <View style={{ marginTop: 20, gap: 12 }}>
                <SkeletonRect height={100} borderRadius={UI.radius.xl} />
                <SkeletonRect height={60} borderRadius={12} />
                <SkeletonRect height={60} borderRadius={12} />
                <SkeletonRect height={60} borderRadius={12} />
              </View>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 24, fontWeight: '900', color: C.brownLight }}>
                {name
                  ? t('profileCompletion.greeting', { name })
                  : t('profileCompletion.profileComplete')}
              </Text>
              <Text style={{ opacity: 0.6, marginTop: 8, color: C.brownLight, fontSize: 15, lineHeight: 22 }}>
                {t('profileCompletion.freudScoreIntro', {
                  defaultValue: "Here's your initial Freud Score based on your assessment.",
                })}
              </Text>

              {/* Freud Score circle */}
              <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 6,
                    borderColor: scoreColor,
                    backgroundColor: scoreColor + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 36, fontWeight: '900', color: scoreColor }}>
                    {score}
                  </Text>
                </View>
                <Text
                  style={{
                    marginTop: 12,
                    fontSize: 18,
                    fontWeight: '800',
                    color: scoreColor,
                  }}
                >
                  {freudScore?.label ?? ''}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: C.brownLight,
                    opacity: 0.6,
                  }}
                >
                  {t('freudScore.title')}
                </Text>
              </View>

              {/* Breakdown bars */}
              <View style={{ marginTop: 8 }}>
                <BreakdownBar
                  label={t('freudScore.mood')}
                  value={freudScore?.breakdown.mood ?? 0}
                  color="#5AAF8B"
                  icon="😊"
                />
                <BreakdownBar
                  label={t('freudScore.sleep')}
                  value={freudScore?.breakdown.sleep ?? 0}
                  color="#7B6DC9"
                  icon="😴"
                />
                <BreakdownBar
                  label={t('freudScore.stress')}
                  value={freudScore?.breakdown.stress ?? 0}
                  color="#E8985A"
                  icon="🧘"
                />
                <BreakdownBar
                  label={t('freudScore.mindfulness')}
                  value={freudScore?.breakdown.mindfulness ?? 0}
                  color="#5B8A5A"
                  icon="🧠"
                />
                <BreakdownBar
                  label={t('freudScore.consistency')}
                  value={freudScore?.breakdown.consistency ?? 0}
                  color="#a07b55"
                  icon="📅"
                />
                <BreakdownBar
                  label={t('freudScore.journal')}
                  value={freudScore?.breakdown.journal ?? 0}
                  color="#C45B5B"
                  icon="📝"
                />
              </View>
            </>
          )}
        </View>

        {/* Continue button */}
        <Pressable
          onPress={() => router.replace('/(onboarding)/suggested-categories')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 18,
            borderRadius: 30,
            backgroundColor: C.brown,
            marginTop: 24,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>
            {t('common.continue')}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
