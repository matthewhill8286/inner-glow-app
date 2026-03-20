import React from 'react';
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
import { getCategoryByKey } from '@/lib/community';
import { useCommunityProfile, useToggleFollow } from '@/hooks/useCommunity';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

export default function CommunityProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { userId, from } = useLocalSearchParams<{ userId: string; from?: string }>();

  const { data: profile, isLoading, error } = useCommunityProfile(userId);
  const toggleFollow = useToggleFollow();

  if (isLoading) {
    return (
      <View
        style={[
          s.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top + 6 },
        ]}
      >
        <ActivityIndicator size="large" color="#8B6B47" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
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
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('communityProfile.title')}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 28 }}>😕</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
            {t('communityProfile.userNotFound')}
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 14 }}>
            {t('communityProfile.profileCouldNotLoad')}
          </Text>
        </View>
      </View>
    );
  }

  const { user, posts, isFollowing } = profile;

  const handleToggleFollow = () => {
    if (!userId) return;
    toggleFollow.mutate({ targetUserId: userId, isFollowing });
  };

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
          <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>{user.followers} followers</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Profile hero card ───────────────── */}
        <View style={[s.heroCard, { backgroundColor: '#8B6B47' }]}>
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />

          {/* avatar */}
          <View style={s.heroAvatarWrap}>
            <Text style={{ fontSize: 42 }}>{user.avatar}</Text>
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
          <Pressable
            onPress={handleToggleFollow}
            style={({ pressed }) => [
              s.followBtn,
              {
                backgroundColor: isFollowing ? 'rgba(255,255,255,0.2)' : '#FFF',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <MaterialIcons
              name={isFollowing ? 'person-remove' : 'person-add'}
              size={16}
              color={isFollowing ? '#FFF' : '#8B6B47'}
            />
            <Text style={[s.followBtnText, { color: isFollowing ? '#FFF' : '#8B6B47' }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
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
                      pathname: '/(tabs)/community-post' as any,
                      params: { postId: post.id, from: '/(tabs)/community-profile' },
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
                  {/* content preview */}
                  <View style={s.postContent}>
                    {cat && (
                      <View style={[s.catPill, { backgroundColor: cat.tint + '15' }]}>
                        <Text style={{ fontSize: 11 }}>{cat.emoji}</Text>
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
                          {post.comments.length}
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
            <Text style={{ fontSize: 28 }}>📝</Text>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No posts yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedText }]}>
              This user hasn't shared anything yet.
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

  scrollContent: { paddingTop: 16, paddingBottom: 100 },

  /* hero card */
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -30,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -40,
    left: -20,
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
  heroName: { color: '#FFF', fontSize: 18, fontWeight: '900' },

  /* stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 18,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: '600', marginTop: 2 },
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
  followBtnText: { fontSize: 14, fontWeight: '800' },

  /* bio card */
  bioCard: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    marginTop: 14,
    ...UI.shadow.sm,
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bioText: { fontSize: 14, lineHeight: 21 },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  joinedText: { fontSize: 12, fontWeight: '600' },

  /* section label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 12,
  },

  /* post card */
  postCard: {
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  postContent: { padding: 14, gap: 6 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catPillText: { fontSize: 11, fontWeight: '700' },
  postText: { fontSize: 14, lineHeight: 20 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, fontWeight: '600' },

  /* empty */
  emptyCard: {
    borderRadius: UI.radius.xxl,
    padding: 36,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
