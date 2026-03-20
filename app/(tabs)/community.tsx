import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  CATEGORIES,
  POST_IMAGES,
  getCategoryByKey,
  type CommunityPost,
  type PostCategory,
} from '@/lib/community';
import { useCommunityFeed, useToggleLike, useToggleBookmark } from '@/hooks/useCommunity';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

/* ── filter tabs ────────────────────────────────── */
const getBrowseTabs = (t: any) =>
  [
    { key: 'today', label: t('community.tabs.today'), sort: 'recent' as const },
    { key: 'popular', label: t('community.tabs.popular'), sort: 'popular' as const },
    { key: 'new', label: t('community.tabs.new'), sort: 'recent' as const },
  ] as const;

type BrowseTab = ReturnType<typeof getBrowseTabs>[number]['key'];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<BrowseTab>('today');

  const browseTabs = getBrowseTabs(t);
  const sortBy = browseTabs.find((t) => t.key === activeTab)?.sort ?? 'recent';
  const feedQuery = useCommunityFeed({ sortBy });
  const toggleLikeMut = useToggleLike();
  const toggleBookmarkMut = useToggleBookmark();

  const posts = feedQuery.data || [];

  const handleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      toggleLikeMut.mutate({ postId, isLiked });
    },
    [toggleLikeMut],
  );

  const handleBookmark = useCallback(
    (postId: string, isBookmarked: boolean) => {
      toggleBookmarkMut.mutate({ postId, isBookmarked });
    },
    [toggleBookmarkMut],
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <View style={[s.header, { marginTop: insets.top + 14 }]}>
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [
            s.backBtn,
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
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('community.headerTitle')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {t('community.headerSubtitle')}
          </Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/community-notifs' as any,
                params: { from: '/(tabs)/community' },
              })
            }
            style={({ pressed }) => [
              s.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="notifications-none" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/community-filter' as any,
                params: { from: '/(tabs)/community' },
              })
            }
            style={({ pressed }) => [
              s.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="tune" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Welcome card (first visit) ────────── */}
        {showWelcome && (
          <View style={[s.welcomeCard, { backgroundColor: '#5B8A5A' }]}>
            {/* decorative circles */}
            <View style={[s.welcomeCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            <View style={[s.welcomeCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />

            {/* illustration area */}
            <View style={s.welcomeIllustration}>
              <Text style={{ fontSize: 64 }}>💚</Text>
            </View>

            <Text style={s.welcomeTitle}>{t('community.welcomeTitle')}</Text>
            <Text style={s.welcomeDesc}>{t('community.welcomeDescription')}</Text>

            <Pressable
              onPress={() => {
                setShowWelcome(false);
                router.push({
                  pathname: '/(tabs)/community-new-post' as any,
                  params: { from: '/(tabs)/community' },
                });
              }}
              style={({ pressed }) => [
                s.welcomeBtn,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Text style={s.welcomeBtnText}>{t('community.startPostingButton')}</Text>
            </Pressable>

            <View style={s.welcomeLinks}>
              <Pressable onPress={() => setShowWelcome(false)}>
                <Text style={s.welcomeLink}>{t('community.privacyPolicy')}</Text>
              </Pressable>
              <Text style={s.welcomeLinkDot}>•</Text>
              <Pressable onPress={() => setShowWelcome(false)}>
                <Text style={s.welcomeLink}>{t('community.communityGuidelines')}</Text>
              </Pressable>
            </View>

            {/* dismiss */}
            <Pressable onPress={() => setShowWelcome(false)} style={s.welcomeDismiss}>
              <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        )}

        {/* ── Browse By tabs ────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>
          {t('community.browseByLabel')}
        </Text>
        <View style={s.tabRow}>
          {browseTabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                s.filterTab,
                {
                  backgroundColor: activeTab === tab.key ? '#8B6B47' : colors.card,
                  borderColor: activeTab === tab.key ? '#8B6B47' : colors.border,
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
            <ActivityIndicator size="large" color="#8B6B47" />
            <Text style={[s.loadingText, { color: colors.mutedText }]}>
              {t('community.loadingPosts')}
            </Text>
          </View>
        )}

        {/* ── Error state ─────────────────────────── */}
        {feedQuery.isError && (
          <View style={[s.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 28 }}>😔</Text>
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
            <Text style={{ fontSize: 36 }}>🌱</Text>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No posts yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedText }]}>
              Be the first to share something with the community!
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/community-new-post' as any,
                  params: { from: '/(tabs)/community' },
                })
              }
              style={({ pressed }) => [s.emptyBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Text style={s.emptyBtnText}>Create Post</Text>
            </Pressable>
          </View>
        )}

        {/* ── End of feed ───────────────────────── */}
        {posts.length > 0 && (
          <View style={s.endOfFeed}>
            <Text style={{ fontSize: 28 }}>🌿</Text>
            <Text style={[s.endText, { color: colors.mutedText }]}>
              You're all caught up. Take a moment to breathe.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Floating create post button ──────────── */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(tabs)/community-new-post' as any,
            params: { from: '/(tabs)/community' },
          })
        }
        style={({ pressed }) => [s.fab, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
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
          pathname: '/(tabs)/community-post' as any,
          params: { postId: post.id, from: '/(tabs)/community' },
        })
      }
      style={({ pressed }) => [
        s.postCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* author row */}
      <View style={s.postAuthorRow}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/community-profile' as any,
              params: { userId: post.author.id, from: '/(tabs)/community' },
            })
          }
          style={s.postAuthorPress}
        >
          <View style={[s.avatarCircle, { backgroundColor: (cat?.tint || '#8B6B47') + '18' }]}>
            <Text style={{ fontSize: 18 }}>{post.author.avatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.nameRow}>
              <Text style={[s.authorName, { color: colors.text }]}>{post.author.name}</Text>
              {post.author.verified && (
                <View style={s.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#5B8A5A" />
                </View>
              )}
            </View>
            <Text style={[s.postTime, { color: colors.subtleText }]}>{post.createdAt}</Text>
          </View>
        </Pressable>
        <Pressable onPress={onBookmark} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <MaterialIcons
            name={post.isBookmarked ? 'bookmark' : 'bookmark-border'}
            size={22}
            color={post.isBookmarked ? '#8B6B47' : colors.mutedText}
          />
        </Pressable>
      </View>

      {/* category pill */}
      {cat && (
        <View style={[s.catPill, { backgroundColor: cat.tint + '15' }]}>
          <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
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
          <Text style={{ fontSize: 40 }}>{imgMeta.emoji}</Text>
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
              pathname: '/(tabs)/community-post' as any,
              params: { postId: post.id, from: '/(tabs)/community' },
            })
          }
          style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <MaterialIcons name="chat-bubble-outline" size={17} color={colors.mutedText} />
          <Text style={[s.actionText, { color: colors.mutedText }]}>{post.comments.length}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}>
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

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  scrollContent: { paddingTop: 16, paddingBottom: 120 },

  /* welcome card */
  welcomeCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 18,
    ...UI.shadow.md,
  },
  welcomeCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -30,
  },
  welcomeCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -40,
    left: -20,
  },
  welcomeIllustration: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  welcomeDesc: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  welcomeBtn: {
    backgroundColor: '#8B6B47',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: UI.radius.lg,
    alignSelf: 'flex-start',
    marginTop: 18,
    ...UI.shadow.sm,
  },
  welcomeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  welcomeLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  welcomeLink: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  welcomeLinkDot: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  welcomeDismiss: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* browse tabs */
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: UI.radius.md,
    borderWidth: 1,
  },
  filterTabText: { fontSize: 13, fontWeight: '700' },

  /* loading */
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loadingText: { fontSize: 14, fontWeight: '600' },

  /* error */
  errorCard: {
    borderRadius: UI.radius.xxl,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  errorText: { fontSize: 16, fontWeight: '800' },
  retryBtn: {
    backgroundColor: '#8B6B47',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: UI.radius.lg,
    marginTop: 8,
  },
  retryText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  /* empty */
  emptyCard: {
    borderRadius: UI.radius.xxl,
    padding: 36,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#8B6B47',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: UI.radius.lg,
    marginTop: 12,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  /* post card */
  postCard: {
    borderRadius: UI.radius.xxl,
    padding: 16,
    borderWidth: 1,
    ...UI.shadow.sm,
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
  authorName: { fontSize: 14, fontWeight: '800' },
  verifiedBadge: { marginTop: 1 },
  postTime: { fontSize: 12, fontWeight: '600', marginTop: 1 },
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
  catPillText: { fontSize: 12, fontWeight: '700' },
  postContent: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: { fontSize: 13, fontWeight: '700' },

  /* end of feed */
  endOfFeed: {
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    paddingBottom: 12,
  },
  endText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },

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
