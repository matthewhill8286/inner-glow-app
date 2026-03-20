import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { POST_IMAGES, getCategoryByKey, type CommunityComment } from '@/lib/community';
import {
  useCommunityPost,
  useToggleLike,
  useDeletePost,
  useAddComment,
  useMyProfile,
} from '@/hooks/useCommunity';
import { useUser } from '@/hooks/useUser';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { postId, from } = useLocalSearchParams<{ postId: string; from?: string }>();

  const { data: currentUser } = useUser();
  const { data: myProfile } = useMyProfile();
  const postQuery = useCommunityPost(postId);
  const toggleLikeMut = useToggleLike();
  const deletePostMut = useDeletePost();
  const addCommentMut = useAddComment();

  const post = postQuery.data;
  const cat = post ? getCategoryByKey(post.category) : null;
  const imgMeta = post?.image ? POST_IMAGES[post.image] : null;

  const [commentText, setCommentText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwnPost = post && currentUser ? post.author.id === currentUser.id : false;

  const handleLike = () => {
    if (!post) return;
    toggleLikeMut.mutate({ postId: post.id, isLiked: post.isLiked });
  };

  const handleComment = async () => {
    if (!commentText.trim() || !postId) return;
    try {
      await addCommentMut.mutateAsync({ postId, content: commentText.trim() });
      setCommentText('');
    } catch {
      // error handled by React Query
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    setShowDeleteModal(false);
    try {
      await deletePostMut.mutateAsync(postId);
      goBack(from);
    } catch {
      // error handled by React Query
    }
  };

  /* loading state */
  if (postQuery.isLoading || !post) {
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
          <Text style={[s.headerTitle, { color: colors.text }]}>Community Post</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#8B6B47" />
        </View>
      </View>
    );
  }

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
          <Text style={[s.headerTitle, { color: colors.text }]}>Community Post</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {post.comments.length} comments
          </Text>
        </View>
        {isOwnPost && (
          <Pressable
            onPress={() => setShowDeleteModal(true)}
            style={({ pressed }) => [
              s.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="more-horiz" size={20} color={colors.text} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── Post content ──────────────────── */}
          <View style={[s.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* author row */}
            <View style={s.authorRow}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/community-profile' as any,
                    params: { userId: post.author.id, from: '/(tabs)/community-post' },
                  })
                }
                style={s.authorPress}
              >
                <View style={[s.avatar, { backgroundColor: (cat?.tint || '#8B6B47') + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{post.author.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={[s.authorName, { color: colors.text }]}>{post.author.name}</Text>
                    {post.author.verified && (
                      <MaterialIcons name="verified" size={14} color="#5B8A5A" />
                    )}
                  </View>
                  <Text style={[s.postTime, { color: colors.subtleText }]}>
                    {post.author.followers} followers • {post.createdAt}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* category */}
            {cat && (
              <View style={[s.catPill, { backgroundColor: cat.tint + '15' }]}>
                <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                <Text style={[s.catPillText, { color: cat.tint }]}>{cat.label}</Text>
              </View>
            )}

            {/* content */}
            <Text style={[s.content, { color: colors.text }]}>{post.content}</Text>

            {/* image */}
            {imgMeta && (
              <View style={[s.postImage, { backgroundColor: imgMeta.bgColor + '20' }]}>
                <Text style={{ fontSize: 48 }}>{imgMeta.emoji}</Text>
              </View>
            )}

            {/* action bar */}
            <View style={[s.actionBar, { borderTopColor: colors.divider }]}>
              <Pressable onPress={handleLike} style={s.actionBtn}>
                <MaterialIcons
                  name={post.isLiked ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={post.isLiked ? '#C45B5B' : colors.mutedText}
                />
                <Text
                  style={[s.actionText, { color: post.isLiked ? '#C45B5B' : colors.mutedText }]}
                >
                  {post.likes}
                </Text>
              </Pressable>
              <View style={s.actionBtn}>
                <MaterialIcons name="chat-bubble-outline" size={18} color={colors.mutedText} />
                <Text style={[s.actionText, { color: colors.mutedText }]}>
                  {post.comments.length}
                </Text>
              </View>
              <Pressable style={s.actionBtn}>
                <MaterialIcons name="share" size={18} color={colors.mutedText} />
                <Text style={[s.actionText, { color: colors.mutedText }]}>Share</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Comments section ──────────────── */}
          {post.comments.length > 0 && (
            <>
              <Text style={[s.commentsLabel, { color: colors.mutedText }]}>
                Comments ({post.comments.length})
              </Text>
              <View style={{ gap: 10 }}>
                {post.comments.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} colors={colors} />
                ))}
              </View>
            </>
          )}

          {/* empty comments */}
          {post.comments.length === 0 && (
            <View
              style={[
                s.emptyComments,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={{ fontSize: 28 }}>💬</Text>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No comments yet</Text>
              <Text style={[s.emptySub, { color: colors.mutedText }]}>
                Be the first to share your thoughts.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Comment input ────────────────────── */}
        <View
          style={[s.commentBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
        >
          <View style={[s.commentAvatarSmall, { backgroundColor: '#8B6B4718' }]}>
            <Text style={{ fontSize: 14 }}>{myProfile?.avatar || '😊'}</Text>
          </View>
          <TextInput
            style={[s.commentInput, { color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Write a comment..."
            placeholderTextColor={colors.placeholder}
            value={commentText}
            onChangeText={setCommentText}
            maxLength={500}
          />
          <Pressable
            onPress={handleComment}
            disabled={!commentText.trim() || addCommentMut.isPending}
            style={({ pressed }) => [
              s.sendBtn,
              {
                backgroundColor: commentText.trim() ? '#8B6B47' : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {addCommentMut.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialIcons name="send" size={16} color="#FFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── Delete confirmation modal ──────────── */}
      {showDeleteModal && (
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setShowDeleteModal(false)} />
          <View style={[s.deleteModal, { backgroundColor: colors.card }]}>
            <Text style={{ fontSize: 32, textAlign: 'center' }}>🗑️</Text>
            <Text style={[s.deleteTitle, { color: colors.text }]}>Delete Post?</Text>
            <Text style={[s.deleteSub, { color: colors.mutedText }]}>
              Are you sure you want to delete your post? This action cannot be undone.
            </Text>
            <View style={s.deleteActions}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                style={({ pressed }) => [
                  s.deleteCancel,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[s.deleteCancelText, { color: colors.text }]}>
                  No, Don&#39;t Delete ✕
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [s.deleteConfirm, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={s.deleteConfirmText}>Yes, Delete 🗑️</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ── Comment Card ────────────────────────────────── */
function CommentCard({ comment, colors }: { comment: CommunityComment; colors: any }) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={[s.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.commentRow}>
        <View style={[s.commentAvatar, { backgroundColor: '#E8985A18' }]}>
          <Text style={{ fontSize: 16 }}>{comment.author.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.commentNameRow}>
            <Text style={[s.commentName, { color: colors.text }]}>{comment.author.name}</Text>
            <Text style={[s.commentTime, { color: colors.subtleText }]}>{comment.createdAt}</Text>
          </View>
          <Text style={[s.commentContent, { color: colors.mutedText }]}>{comment.content}</Text>
          <View style={s.commentActions}>
            <Pressable onPress={() => setLiked(!liked)} style={s.commentAction}>
              <MaterialIcons
                name={liked ? 'favorite' : 'favorite-border'}
                size={14}
                color={liked ? '#C45B5B' : colors.subtleText}
              />
              <Text style={[s.commentActionText, { color: colors.subtleText }]}>
                {comment.likes + (liked ? 1 : 0)}
              </Text>
            </Pressable>
            <Pressable style={s.commentAction}>
              <MaterialIcons name="reply" size={14} color={colors.subtleText} />
              <Text style={[s.commentActionText, { color: colors.subtleText }]}>Reply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 4,
    paddingHorizontal: UI.spacing.xl,
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: UI.spacing.xl,
  },

  /* post card */
  postCard: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorPress: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: { fontSize: 15, fontWeight: '800' },
  postTime: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  catPillText: { fontSize: 12, fontWeight: '700' },
  content: { fontSize: 15, lineHeight: 23, marginTop: 12 },
  postImage: {
    height: 180,
    borderRadius: UI.radius.lg,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 14, fontWeight: '700' },

  /* comments */
  commentsLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  commentCard: {
    borderRadius: UI.radius.xl,
    padding: 14,
    borderWidth: 1,
  },
  commentRow: { flexDirection: 'row', gap: 10 },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentName: { fontSize: 13, fontWeight: '800' },
  commentTime: { fontSize: 11, fontWeight: '600' },
  commentContent: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  commentActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionText: { fontSize: 12, fontWeight: '600' },

  /* empty comments */
  emptyComments: {
    borderRadius: UI.radius.xxl,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  emptySub: { fontSize: 14, textAlign: 'center' },

  /* comment bar */
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    paddingHorizontal: UI.spacing.xl,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
  },
  commentAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: UI.radius.md,
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* delete modal */
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  deleteModal: {
    width: '85%',
    borderRadius: UI.radius.xxl,
    padding: 28,
    ...UI.shadow.lg,
    gap: 8,
  },
  deleteTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  deleteSub: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  deleteActions: { gap: 10, marginTop: 16 },
  deleteCancel: {
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteCancelText: { fontSize: 15, fontWeight: '700' },
  deleteConfirm: {
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    backgroundColor: '#C45B5B',
    alignItems: 'center',
  },
  deleteConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
