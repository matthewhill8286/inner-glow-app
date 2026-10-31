import { useUser } from '@/hooks/useUser';
import { toast } from '@/components/Toast';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { screenBottomPadding } from '@/lib/screen-layout';
import { communityStyles } from '@/components/community/styles';
import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import { CommunitySafety } from '@/components/CommunitySafety';
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import { getCategoryByKey } from '@/lib/community';
import { useCommunityProfile, useToggleFollow } from '@/hooks/useCommunity';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  backTo(from, '/(tabs)/community');
}

export default function CommunityProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { userId, from } = useLocalSearchParams<{ userId: string; from?: string }>();

  const { data: profile, isLoading, error } = useCommunityProfile(userId);
  const toggleFollow = useToggleFollow();
  const { data: currentUser } = useUser();

  if (isLoading) {
    return (
      <View
        style={[
          s.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: insets.top + 6,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View
        style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}
      >
        <CommunityHeader title={t('communityProfile.title')} onBack={() => goBack(from)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
            😕
          </WellnessIconText>
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: colors.text,
              fontSize: 16,
              fontWeight: Typography.weight.semibold,
            }}
          >
            {t('communityProfile.userNotFound')}
          </Text>
          <Text
            style={{ fontFamily: Typography.family.body, color: colors.mutedText, fontSize: 14 }}
          >
            {t('communityProfile.profileCouldNotLoad')}
          </Text>
        </View>
      </View>
    );
  }

  const { user, posts, isFollowing } = profile;

  const handleToggleFollow = () => {
    if (!userId || toggleFollow.isPending || userId === currentUser?.id) return;
    toggleFollow.mutate(
      { targetUserId: userId, isFollowing },
      { onError: () => toast.error(t('communityFixes.actionFailed')) },
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <CommunityHeader
        title={user.name}
        subtitle={t('communityProfile.title')}
        onBack={() => goBack(from)}
      >
        <CommunitySafety authorId={user.id} onBlocked={() => router.replace('/(tabs)/community')} />
      </CommunityHeader>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: screenBottomPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile hero card ───────────────── */}
        <View style={[s.heroCard, { backgroundColor: colors.tint }]}>
          {/* avatar */}
          <View style={s.heroAvatarWrap}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 42 }}>
              {user.avatar}
            </WellnessIconText>
          </View>

          {/* name & verified */}
          <View style={s.heroNameRow}>
            <Text style={s.heroName}>{user.name}</Text>
            {user.verified && <MaterialIcons name="verified" size={16} color="#FFF" />}
          </View>

          {/* stats row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{posts.length}</Text>
              <Text style={s.statLabel}>Posts</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{user.followers}</Text>
              <Text style={s.statLabel}>Followers</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{user.following}</Text>
              <Text style={s.statLabel}>Following</Text>
            </View>
          </View>

          {/* follow button */}
          {currentUser?.id !== userId && (
            <Pressable
              accessibilityRole="button"
              disabled={toggleFollow.isPending}
              accessibilityState={{
                disabled: toggleFollow.isPending,
                busy: toggleFollow.isPending,
              }}
              onPress={handleToggleFollow}
              style={({ pressed }) => [
                s.followBtn,
                {
                  backgroundColor: isFollowing ? 'rgba(255,255,255,0.2)' : '#FFF',
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <MaterialIcons
                name={isFollowing ? 'person-remove' : 'person-add'}
                size={16}
                color={isFollowing ? '#FFF' : colors.tint}
              />
              <Text style={[s.followBtnText, { color: isFollowing ? '#FFF' : colors.tint }]}>
                {t(isFollowing ? 'communityFixes.following' : 'communityFixes.follow')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Bio card ────────────────────────── */}
        {user.bio && (
          <View style={[s.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.bioLabel, { color: colors.mutedText }]}>About</Text>
            <Text style={[s.bioText, { color: colors.text }]}>{user.bio}</Text>
            {user.joinedDate && (
              <View style={s.joinedRow}>
                <MaterialIcons name="calendar-today" size={13} color={colors.subtleText} />
                <Text style={[s.joinedText, { color: colors.subtleText }]}>
                  Joined {user.joinedDate}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── User posts ──────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>Posts ({posts.length})</Text>

        {posts.length > 0 ? (
          <View style={{ gap: 12 }}>
            {posts.map((post) => {
              const cat = getCategoryByKey(post.category);
              return (
                <Pressable
                  key={post.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/community/post' as any,
                      params: { postId: post.id, from: '/(tabs)/community/profile' },
                    })
                  }
                  style={({ pressed }) => [
                    s.postCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  {/* content preview */}
                  <View style={s.postContent}>
                    {post.isHidden && (
                      <Text style={[Typography.caption, { color: colors.mutedText }]}>
                        {t('communityFixes.privatePost')}
                      </Text>
                    )}
                    {cat && (
                      <View style={[s.catPill, { backgroundColor: cat.tint + '15' }]}>
                        <WellnessIconText
                          style={{ fontFamily: Typography.family.body, fontSize: 11 }}
                        >
                          {cat.emoji}
                        </WellnessIconText>
                        <Text style={[s.catPillText, { color: cat.tint }]}>{cat.label}</Text>
                      </View>
                    )}
                    <Text style={[s.postText, { color: colors.text }]} numberOfLines={2}>
                      {post.content}
                    </Text>
                    <View style={s.postMeta}>
                      <View style={s.metaItem}>
                        <MaterialIcons name="favorite" size={13} color={colors.subtleText} />
                        <Text style={[s.metaText, { color: colors.subtleText }]}>{post.likes}</Text>
                      </View>
                      <View style={s.metaItem}>
                        <MaterialIcons
                          name="chat-bubble-outline"
                          size={13}
                          color={colors.subtleText}
                        />
                        <Text style={[s.metaText, { color: colors.subtleText }]}>
                          {post.commentCount ?? post.comments.length}
                        </Text>
                      </View>
                      <Text style={[s.metaText, { color: colors.subtleText }]}>
                        {post.createdAt}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
              📝
            </WellnessIconText>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No posts yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedText }]}>
              This user hasn&#39;t shared anything yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  scrollContent: { paddingTop: 16, paddingBottom: 100 },

  /* hero card */
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  heroName: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 18,
    fontWeight: Typography.weight.semibold,
  },

  /* stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 18,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 18,
    fontWeight: Typography.weight.bold,
  },
  statLabel: {
    fontFamily: Typography.family.body,
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    fontWeight: Typography.weight.bold,
    marginTop: 2,
  },
  statDivider: { width: 1, height: 30 },

  /* follow button */
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: UI.radius.lg,
  },
  followBtnText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },

  /* bio card */
  bioCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 18,
      borderWidth: 1,
      marginTop: 8,
      ...UI.shadow.sm,
    },
    ...communityStyles.bioCard,
  },
  bioLabel: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bioText: { fontFamily: Typography.family.body, fontSize: 14, lineHeight: 21 },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  joinedText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },

  /* section label */
  sectionLabel: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 13,
      fontWeight: Typography.weight.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 22,
      marginBottom: 12,
    },
    ...communityStyles.sectionLabel,
  },

  /* post card */
  postCard: {
    ...{
      borderRadius: UI.radius.xxl,
      borderWidth: 1,
      overflow: 'hidden',
      ...UI.shadow.sm,
    },
    ...communityStyles.postCard,
  },
  postContent: { ...{ padding: 14, gap: 6 }, ...communityStyles.postContent },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catPillText: {
    fontFamily: Typography.family.body,
    fontSize: 11,
    fontWeight: Typography.weight.semibold,
  },
  postText: { fontFamily: Typography.family.body, fontSize: 14, lineHeight: 20 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.medium,
  },

  /* empty */
  emptyCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 36,
      borderWidth: 1,
      alignItems: 'center',
      gap: 6,
    },
    ...communityStyles.emptyCard,
  },
  emptyTitle: { ...{ ...Typography.cardHeading }, ...communityStyles.emptyTitle },
  emptySub: {
    ...{ fontFamily: Typography.family.body, fontSize: 14, textAlign: 'center' },
    ...communityStyles.emptySub,
  },
});
