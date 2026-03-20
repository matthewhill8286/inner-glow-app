import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription } from '@/hooks/useSubscription';
import { Colors, UI } from '@/constants/theme';
import { useStress } from '@/hooks/useStress';
import { showAlert } from '@/lib/state';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SkeletonRect } from '@/components/Skeleton';
import { STRESS_VIDEOS } from '@/data/stressVideos';

const TOOLS: {
  key: string;
  emoji: string;
  label: string;
  tint: string;
  route: string;
  locked?: boolean;
}[] = [
  {
    key: 'grounding',
    emoji: '🤲',
    label: 'Grounding',
    tint: '#E8985A',
    route: '/(tabs)/stress/grounding',
    locked: true,
  },
  {
    key: 'breathing',
    emoji: '🌬️',
    label: 'Breathing',
    tint: '#4FC3F7',
    route: '/(tabs)/stress/breathing',
  },
  { key: 'relatable', emoji: '🎬', label: 'Watch Video', tint: '#E57373', route: '' },
  { key: 'latest', emoji: '▶️', label: 'Resume', tint: '#8B6B47', route: '' },
];

export default function StressHub() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const { hasFullAccess } = useSubscription();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const { stressKit: kit, stressHistory, isLoading: loading } = useStress();

  const lastExercise = stressHistory[0];

  const bodyVideos = useMemo(
    () => STRESS_VIDEOS.filter((v) => v.category === 'body').slice(0, 5),
    [],
  );
  const mindVideos = useMemo(
    () => STRESS_VIDEOS.filter((v) => v.category === 'mind').slice(0, 5),
    [],
  );

  function handleToolPress(tool: (typeof TOOLS)[number]) {
    if (tool.key === 'grounding') {
      if (!hasFullAccess) {
        showAlert(t('common.premiumFeature'), t('stress.upgradeToUnlockGrounding'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.upgrade'), onPress: () => router.push('/(utils)/trial-upgrade') },
        ]);
        return;
      }
      router.push('/(tabs)/stress/grounding');
    } else if (tool.key === 'breathing') {
      router.push('/(tabs)/stress/breathing');
    } else if (tool.key === 'relatable') {
      router.push({
        pathname: '/(tabs)/stress/list/[category]/[videoId]',
        params: { category: 'body', videoId: 'yt-1' },
      });
    } else if (tool.key === 'latest') {
      if (lastExercise) {
        const video = STRESS_VIDEOS.find((v) => v.id === lastExercise.id);
        router.push({
          pathname: '/(tabs)/stress/list/[category]/[videoId]',
          params: { category: video?.category || 'body', videoId: lastExercise.id },
        });
      } else {
        router.push({
          pathname: '/(tabs)/stress/list/[category]/[videoId]',
          params: { category: 'body', videoId: 'body-1' },
        });
      }
    }
  }

  const hasKit =
    kit && (kit.triggers.length > 0 || kit.helpfulActions.length > 0 || kit.people.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {/* Custom header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Stress Relief</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Tools to calm your body & mind
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ gap: 14 }}>
            <SkeletonRect height={140} borderRadius={UI.radius.xxl} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SkeletonRect height={90} borderRadius={UI.radius.xxl} style={{ flex: 1 }} />
              <SkeletonRect height={90} borderRadius={UI.radius.xxl} style={{ flex: 1 }} />
            </View>
            <SkeletonRect height={160} borderRadius={UI.radius.xxl} />
          </View>
        ) : (
          <>
            {/* Quick phrase / stress kit hero */}
            <View style={[styles.heroCard, { backgroundColor: '#5B8A5A', borderColor: '#5B8A5A' }]}>
              <View style={styles.heroTop}>
                <View style={styles.heroIconWrap}>
                  <Text style={{ fontSize: 22 }}>🧘</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>
                    {hasKit ? 'Your Stress Kit' : 'Quick Phrase'}
                  </Text>
                  <Text style={styles.heroPhrase} numberOfLines={2}>
                    "{kit?.quickPhrase || 'Take a deep breath. This too shall pass.'}"
                  </Text>
                </View>
              </View>

              {hasKit && kit.helpfulActions.length > 0 && (
                <View style={styles.heroActions}>
                  {kit.helpfulActions.slice(0, 3).map((action, i) => (
                    <View key={i} style={styles.heroActionPill}>
                      <Text style={styles.heroActionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={() => {
                  if (!hasFullAccess) {
                    showAlert(t('common.premiumFeature'), t('stress.upgradeToUnlockPlan'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.upgrade'),
                        onPress: () => router.push('/(utils)/trial-upgrade'),
                      },
                    ]);
                    return;
                  }
                  router.push('/(tabs)/stress/plan');
                }}
                style={({ pressed }) => [styles.heroCta, { opacity: pressed ? 0.85 : 1 }]}
              >
                <MaterialIcons name="edit-note" size={18} color="#5B8A5A" />
                <Text style={styles.heroCtaText}>
                  {hasKit ? 'View Full Plan' : 'Create Your Plan'}
                </Text>
              </Pressable>
            </View>

            {/* Quick tools grid — 2×2 */}
            {[TOOLS.slice(0, 2), TOOLS.slice(2, 4)].map((row, rowIdx) => (
              <View key={rowIdx} style={styles.toolsRow}>
                {row.map((tool) => {
                  const isLocked = tool.locked && !hasFullAccess;
                  return (
                    <Pressable
                      key={tool.key}
                      onPress={() => handleToolPress(tool)}
                      style={({ pressed }) => [
                        styles.toolCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                          opacity: isLocked ? 0.7 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.toolIconWrap, { backgroundColor: tool.tint + '12' }]}>
                        <Text style={{ fontSize: 22 }}>{tool.emoji}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.toolLabel, { color: colors.text }]}>{tool.label}</Text>
                        {isLocked && <MaterialIcons name="lock" size={11} color={colors.mutedText} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Body Relaxation */}
            <View style={styles.videoSection}>
              <View style={styles.videoSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: '#6BBF8E' + '15' }]}>
                    <Text style={{ fontSize: 14 }}>💪</Text>
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Body Relaxation</Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/stress/list/[category]',
                      params: { category: 'body' },
                    })
                  }
                >
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
              >
                {bodyVideos.map((video) => (
                  <Pressable
                    key={video.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/stress/list/[category]/[videoId]',
                        params: { category: video.category, videoId: video.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.videoCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <View style={[styles.videoIconWrap, { backgroundColor: '#6BBF8E' + '15' }]}>
                      <MaterialIcons name="fitness-center" size={18} color="#6BBF8E" />
                    </View>
                    <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>
                      {video.title}
                    </Text>
                    <Text
                      style={[styles.videoSubtitle, { color: colors.mutedText }]}
                      numberOfLines={2}
                    >
                      {video.subtitle}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Mind Relaxation */}
            <View style={styles.videoSection}>
              <View style={styles.videoSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: '#9B8DF1' + '15' }]}>
                    <Text style={{ fontSize: 14 }}>🧠</Text>
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Mind Relaxation</Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/stress/list/[category]',
                      params: { category: 'mind' },
                    })
                  }
                >
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
              >
                {mindVideos.map((video) => (
                  <Pressable
                    key={video.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/stress/list/[category]/[videoId]',
                        params: { category: video.category, videoId: video.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.videoCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <View style={[styles.videoIconWrap, { backgroundColor: '#9B8DF1' + '15' }]}>
                      <MaterialIcons name="self-improvement" size={18} color="#9B8DF1" />
                    </View>
                    <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>
                      {video.title}
                    </Text>
                    <Text
                      style={[styles.videoSubtitle, { color: colors.mutedText }]}
                      numberOfLines={2}
                    >
                      {video.subtitle}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Recent activity */}
            {lastExercise && (
              <Pressable
                onPress={() => {
                  const video = STRESS_VIDEOS.find((v) => v.id === lastExercise.id);
                  router.push({
                    pathname: '/(tabs)/stress/list/[category]/[videoId]',
                    params: { category: video?.category || 'body', videoId: lastExercise.id },
                  });
                }}
                style={({ pressed }) => [
                  styles.recentCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={[styles.recentIconWrap, { backgroundColor: '#E8985A' + '12' }]}>
                  <Text style={{ fontSize: 16 }}>🔄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentTitle, { color: colors.text }]}>
                    {lastExercise.title}
                  </Text>
                  <Text style={[styles.recentDate, { color: colors.mutedText }]}>
                    Last played{' '}
                    {new Date(lastExercise.date).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <MaterialIcons name="play-circle-outline" size={28} color={colors.primary} />
              </Pressable>
            )}

            {/* Mindful hours link */}
            <Pressable
              onPress={() => router.push('/(tabs)/mindful')}
              style={({ pressed }) => [
                styles.mindfulLink,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.mindfulIconWrap, { backgroundColor: '#6BBF8E' + '12' }]}>
                  <Text style={{ fontSize: 18 }}>🕐</Text>
                </View>
                <View>
                  <Text style={[styles.mindfulTitle, { color: colors.text }]}>Mindful Hours</Text>
                  <Text style={[styles.mindfulSub, { color: colors.mutedText }]}>
                    Track your practice time
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.mutedText} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  } as any,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  // Hero card
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 20,
    borderWidth: 1,
    ...UI.shadow.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroPhrase: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  heroActionPill: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: UI.radius.pill,
  },
  heroActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: UI.radius.lg,
  },
  heroCtaText: {
    color: '#5B8A5A',
    fontSize: 15,
    fontWeight: '900',
  },

  // Quick tools
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    gap: 8,
    ...UI.shadow.sm,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Video sections
  videoSection: {
    marginTop: 8,
  },
  videoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  videoCard: {
    width: 190,
    padding: 16,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  videoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  videoSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Recent activity
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  recentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Mindful hours
  mindfulLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  mindfulIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mindfulTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  mindfulSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
});
