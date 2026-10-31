import { useUser } from '@/hooks/useUser';
import { toast } from '@/components/Toast';
import { CommunityFilterSheet } from '@/components/community/CommunityFilterSheet';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { CommunityHeader, CommunityHeaderAction } from '@/components/community/CommunityHeader';
import { communityStyles } from '@/components/community/styles';
import { screenBottomPadding, TAB_BAR_HEIGHT, tabBarOffset } from '@/lib/screen-layout';
import { communityFilters } from '@/lib/community-filters';
import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import { CommunitySafety } from '@/components/CommunitySafety';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import { POST_IMAGES, getCategoryByKey, type CommunityPost } from '@/lib/community';
import { useCommunityFeed, useToggleLike, useToggleBookmark } from '@/hooks/useCommunity';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  backTo(from, '/(tabs)/home');
}

/* ── filter tabs ────────────────────────────────── */
const getBrowseTabs = (t: any) =>
  [
    { key: 'today', label: t('communityFixes.recent'), sort: 'recent' as const },
    { key: 'popular', label: t('community.tabs.popular'), sort: 'popular' as const },
  ] as const;

type BrowseTab = ReturnType<typeof getBrowseTabs>[number]['key'];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { data: currentUser } = useUser();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { from, categories, types, filter } = useLocalSearchParams<{
    from?: string;
    categories?: string;
    types?: string;
    filter?: string;
  }>();
  const filters = communityFilters({ categories, types });

  const [showFilters, setShowFilters] = useState(filter === 'open');
  useEffect(() => {
    if (filter === 'open') {
      setShowFilters(true);
      router.setParams({ filter: undefined });
    }
  }, [filter]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<BrowseTab>('today');

  const browseTabs = getBrowseTabs(t);
  const sortBy = browseTabs.find((t) => t.key === activeTab)?.sort ?? 'recent';
  const feedQuery = useCommunityFeed({
    sortBy,
    categories: filters.categories,
    types: filters.types,
  });
  const toggleLikeMut = useToggleLike();
  const toggleBookmarkMut = useToggleBookmark();

  const posts = feedQuery.data || [];

  const handleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      if (toggleLikeMut.isPending) return;
      toggleLikeMut.mutate(
        { postId, isLiked },
        { onError: () => toast.error(t('communityFixes.actionFailed')) },
      );
    },
    [toggleLikeMut, t],
  );

  const handleBookmark = useCallback(
    (postId: string, isBookmarked: boolean) => {
      if (toggleBookmarkMut.isPending) return;
      toggleBookmarkMut.mutate(
        { postId, isBookmarked },
        { onError: () => toast.error(t('communityFixes.actionFailed')) },
      );
    },
    [toggleBookmarkMut, t],
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      <CommunityHeader
        title={t('community.headerTitle')}
        subtitle={t('community.headerSubtitle')}
        onBack={() => goBack(from)}
      >
        <CommunityHeaderAction
          name="notifications-none"
          label={t('communityNotifs.title')}
          onPress={() => router.push('/(tabs)/community/notifications')}
        />
        <CommunityHeaderAction
          name="tune"
          label={t('communityFilter.title')}
          onPress={() => setShowFilters(true)}
        />
      </CommunityHeader>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: screenBottomPadding(insets.bottom) + 72 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome card (first visit) ────────── */}
        {showWelcome && (
          <AppCard
            style={{
              backgroundColor: colors.accent,
              borderColor: colors.accent,
              marginBottom: 24,
              padding: 22,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <MaterialIcons name="people-outline" size={28} color={colors.onAccent} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={() => setShowWelcome(false)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialIcons name="close" size={20} color={colors.onAccent} />
              </Pressable>
            </View>
            <Text style={[Typography.section, { color: colors.onAccent }]}>
              {t('community.welcomeTitle')}
            </Text>
            <Text style={[Typography.body, { color: colors.onAccent }]}>
              {t('community.welcomeDescription')}
            </Text>
            <AppButton
              title={t('community.startPostingButton')}
              variant="secondary"
              onPress={() => router.push('/(tabs)/community/new-post')}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {(['privacy', 'community'] as const).map((policy) => (
                <Pressable
                  key={policy}
                  accessibilityRole="link"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                  onPress={() => router.push({ pathname: '/(utils)/legal', params: { policy } })}
                >
                  <Text
                    style={[
                      Typography.caption,
                      { color: colors.onAccent, textDecorationLine: 'underline' },
                    ]}
                  >
                    {t(
                      policy === 'privacy'
                        ? 'community.privacyPolicy'
                        : 'community.communityGuidelines',
                    )}
                  </Text>
                </Pressable>
              ))}
            </View>
          </AppCard>
        )}

        {/* ── Browse By tabs ────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Text style={[s.sectionLabel, { color: colors.mutedText, marginBottom: 0 }]}>
            {t('community.browseByLabel')}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!currentUser}
            style={{ minHeight: 44, justifyContent: 'center' }}
            onPress={() =>
              currentUser &&
              router.push({
                pathname: '/(tabs)/community/profile',
                params: { userId: currentUser.id },
              })
            }
          >
            <Text style={[Typography.caption, { color: colors.tint }]}>
              {t('communityFixes.myPosts')}
            </Text>
          </Pressable>
        </View>
        <View style={s.tabRow}>
          {browseTabs.map((tab) => (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
              onPress={() => setActiveTab(tab.key)}
              style={[
                s.filterTab,
                {
                  backgroundColor: activeTab === tab.key ? colors.tint : colors.card,
                  borderColor: activeTab === tab.key ? colors.tint : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  s.filterTabText,
                  { color: activeTab === tab.key ? '#FFF' : colors.mutedText },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Loading state ───────────────────────── */}
        {feedQuery.isLoading && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[s.loadingText, { color: colors.mutedText }]}>
              {t('community.loadingPosts')}
            </Text>
          </View>
        )}

        {/* ── Error state ─────────────────────────── */}
        {feedQuery.isError && (
          <View style={[s.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
              😔
            </WellnessIconText>
            <Text style={[s.errorText, { color: colors.text }]}>
              {t('community.couldntLoadPosts')}
            </Text>
            <Pressable
              onPress={() => feedQuery.refetch()}
              style={({ pressed }) => [s.retryBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={s.retryText}>{t('community.tryAgainButton')}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Post feed ─────────────────────────── */}
        {!feedQuery.isLoading && !feedQuery.isError && (
          <View style={{ gap: 14, marginTop: 6 }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                colors={colors}
                theme={theme}
                onLike={() => handleLike(post.id, post.isLiked)}
                onBookmark={() => handleBookmark(post.id, post.isBookmarked)}
              />
            ))}
          </View>
        )}

        {/* ── Empty state ─────────────────────────── */}
        {!feedQuery.isLoading && !feedQuery.isError && posts.length === 0 && (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 36 }}>
              🌱
            </WellnessIconText>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No posts yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedText }]}>
              Be the first to share something with the community!
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/community/new-post' as any,
                  params: { from: '/(tabs)/community' },
                })
              }
              style={({ pressed }) => [s.emptyBtn, { opacity: pressed ? 0.78 : 1 }]}
            >
              <Text style={s.emptyBtnText}>Create Post</Text>
            </Pressable>
          </View>
        )}

        {/* ── End of feed ───────────────────────── */}
        {posts.length > 0 && (
          <View style={s.endOfFeed}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
              🌿
            </WellnessIconText>
            <Text style={[s.endText, { color: colors.mutedText }]}>
              You&#39;re all caught up. Take a moment to breathe.
            </Text>
          </View>
        )}
      </ScrollView>

      {showFilters && (
        <CommunityFilterSheet
          categories={filters.categories}
          types={filters.types}
          onClose={() => setShowFilters(false)}
          onApply={({ categories, types }) => {
            router.setParams({ categories: categories.join(','), types: types.join(',') });
            setShowFilters(false);
          }}
        />
      )}

      {/* ── Floating create post button ──────────── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('community.startPostingButton')}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/community/new-post' as any,
            params: { from: '/(tabs)/community' },
          })
        }
        style={({ pressed }) => [
          s.fab,
          {
            bottom: TAB_BAR_HEIGHT + tabBarOffset(insets.bottom) + 16,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <MaterialIcons name="add" size={26} color="#FFF" />
      </Pressable>
    </View>
  );
}

/* ── Post Card Component ────────────────────────── */
function PostCard({
  post,
  colors,
  theme,
  onLike,
  onBookmark,
}: {
  post: CommunityPost;
  colors: any;
  theme: string;
  onLike: () => void;
  onBookmark: () => void;
}) {
  const cat = getCategoryByKey(post.category);
  const imgMeta = post.image ? POST_IMAGES[post.image] : null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(tabs)/community/post' as any,
          params: { postId: post.id, from: '/(tabs)/community' },
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
      {/* author row */}
      <View style={s.postAuthorRow}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/community/profile' as any,
              params: { userId: post.author.id, from: '/(tabs)/community' },
            })
          }
          style={s.postAuthorPress}
        >
          <View style={[s.avatarCircle, { backgroundColor: (cat?.tint || colors.tint) + '18' }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 18 }}>
              {post.author.avatar}
            </WellnessIconText>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.nameRow}>
              <Text style={[s.authorName, { color: colors.text }]}>{post.author.name}</Text>
              {post.author.verified && (
                <View style={s.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color={colors.accent} />
                </View>
              )}
            </View>
            <Text style={[s.postTime, { color: colors.subtleText }]}>{post.createdAt}</Text>
          </View>
        </Pressable>
        <CommunitySafety authorId={post.author.id} targetId={post.id} targetType="post" />
        <Pressable onPress={onBookmark} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <MaterialIcons
            name={post.isBookmarked ? 'bookmark' : 'bookmark-border'}
            size={22}
            color={post.isBookmarked ? colors.tint : colors.mutedText}
          />
        </Pressable>
      </View>

      {/* category pill */}
      {cat && (
        <View style={[s.catPill, { backgroundColor: cat.tint + '15' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 12 }}>
            {cat.emoji}
          </WellnessIconText>
          <Text style={[s.catPillText, { color: cat.tint }]}>{cat.label}</Text>
        </View>
      )}

      {/* content */}
      <Text style={[s.postContent, { color: colors.text }]} numberOfLines={4}>
        {post.content}
      </Text>

      {/* image placeholder */}
      {imgMeta && (
        <View style={[s.postImage, { backgroundColor: imgMeta.bgColor + '20' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 40 }}>
            {imgMeta.emoji}
          </WellnessIconText>
        </View>
      )}

      {/* action bar */}
      <View style={[s.actionBar, { borderTopColor: colors.divider }]}>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <MaterialIcons
            name={post.isLiked ? 'favorite' : 'favorite-border'}
            size={18}
            color={post.isLiked ? '#C45B5B' : colors.mutedText}
          />
          <Text style={[s.actionText, { color: post.isLiked ? '#C45B5B' : colors.mutedText }]}>
            {post.likes}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/community/post' as any,
              params: { postId: post.id, from: '/(tabs)/community' },
            })
          }
          style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <MaterialIcons name="chat-bubble-outline" size={17} color={colors.mutedText} />
          <Text style={[s.actionText, { color: colors.mutedText }]}>
            {post.commentCount ?? post.comments.length}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share post"
          onPress={() => Share.share({ message: post.content })}
          style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <MaterialIcons name="share" size={17} color={colors.mutedText} />
          <Text style={[s.actionText, { color: colors.mutedText }]}>Share</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  scrollContent: { paddingTop: 16, paddingBottom: 120 },

  /* browse tabs */
  sectionLabel: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 13,
      fontWeight: Typography.weight.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    ...communityStyles.sectionLabel,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    ...{
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: UI.radius.md,
      borderWidth: 1,
    },
    ...communityStyles.filterTab,
  },
  filterTabText: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 13,
      fontWeight: Typography.weight.medium,
    },
    ...communityStyles.filterTabText,
  },

  /* loading */
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loadingText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },

  /* error */
  errorCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 32,
      borderWidth: 1,
      alignItems: 'center',
      gap: 10,
    },
    ...communityStyles.errorCard,
  },
  errorText: {
    fontFamily: Typography.family.body,
    fontSize: 16,
    fontWeight: Typography.weight.semibold,
  },
  retryBtn: {
    backgroundColor: '#8B6B47',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: UI.radius.lg,
    marginTop: 8,
  },
  retryText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },

  /* empty */
  emptyCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 36,
      borderWidth: 1,
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    ...communityStyles.emptyCard,
  },
  emptyTitle: { ...{ ...Typography.cardHeading }, ...communityStyles.emptyTitle },
  emptySub: {
    ...{ fontFamily: Typography.family.body, fontSize: 14, textAlign: 'center' },
    ...communityStyles.emptySub,
  },
  emptyBtn: {
    backgroundColor: '#8B6B47',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: UI.radius.lg,
    marginTop: 12,
  },
  emptyBtnText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },

  /* post card */
  postCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 16,
      borderWidth: 1,
      ...UI.shadow.sm,
    },
    ...communityStyles.postCard,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAuthorPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 14,
      fontWeight: Typography.weight.semibold,
    },
    ...communityStyles.authorName,
  },
  verifiedBadge: { marginTop: 1 },
  postTime: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 12,
      fontWeight: Typography.weight.bold,
      marginTop: 1,
    },
    ...communityStyles.postTime,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  catPillText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },
  postContent: {
    ...{ fontFamily: Typography.family.body, fontSize: 14, lineHeight: 21, marginTop: 10 },
    ...communityStyles.postContent,
  },
  postImage: {
    height: 140,
    borderRadius: UI.radius.lg,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    ...{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    ...communityStyles.actionBtn,
  },
  actionText: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
  },

  /* end of feed */
  endOfFeed: {
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    paddingBottom: 12,
  },
  endText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: Typography.weight.semibold,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#8B6B47',
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.shadow.lg,
  },
});
