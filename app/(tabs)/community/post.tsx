import { toast } from '@/components/Toast';
import { CommunityHeader, CommunityHeaderAction } from '@/components/community/CommunityHeader';
import { screenBottomPadding } from '@/lib/screen-layout';
import { communityStyles } from '@/components/community/styles';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import { CommunitySafety } from '@/components/CommunitySafety';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
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
import MaterialIcons from '@/components/AppIcon';
import { POST_IMAGES, getCategoryByKey, type CommunityComment } from '@/lib/community';
import {
  useCommunityPost,
  useToggleLike,
  useDeletePost,
  useAddComment,
  useMyProfile,
  useToggleCommentLike,
} from '@/hooks/useCommunity';
import { useUser } from '@/hooks/useUser';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  backTo(from, '/(tabs)/community');
}

export default function PostDetailScreen() {
  const { t } = useTranslation();
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
  const commentInput = useRef<TextInput>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwnPost = post && currentUser ? post.author.id === currentUser.id : false;

  const handleLike = () => {
    if (!post || toggleLikeMut.isPending) return;
    toggleLikeMut.mutate(
      { postId: post.id, isLiked: post.isLiked },
      { onError: () => toast.error(t('communityFixes.actionFailed')) },
    );
  };

  const handleComment = async () => {
    if (!commentText.trim() || !postId || addCommentMut.isPending) return;
    const sentText = commentText.trim();
    try {
      await addCommentMut.mutateAsync({ postId, content: sentText });
      setCommentText((current) => (current.trim() === sentText ? '' : current));
    } catch {
      toast.error(t('communityFixes.actionFailed'));
    }
  };

  const handleDelete = async () => {
    if (!postId || deletePostMut.isPending) return;
    setShowDeleteModal(false);
    try {
      await deletePostMut.mutateAsync(postId);
      goBack(from);
    } catch {
      toast.error(t('communityFixes.actionFailed'));
    }
  };

  if (postQuery.isError || (!postQuery.isLoading && !post)) {
    return (
      <View
        style={[
          s.container,
          { backgroundColor: colors.background, padding: 24, paddingTop: insets.top + 24 },
        ]}
      >
        <Text style={{ color: colors.text }}>This post is unavailable.</Text>
        <Pressable onPress={() => goBack(from)}>
          <Text style={{ color: colors.tint, marginTop: 20 }}>Back to community</Text>
        </Pressable>
      </View>
    );
  }

  /* loading state */
  if (postQuery.isLoading || !post) {
    return (
      <View
        style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}
      >
        <View style={{ paddingHorizontal: UI.spacing.xl }}>
          <CommunityHeader
            title={t('community.headerTitle')}
            onBack={() => goBack(from)}
          ></CommunityHeader>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <View style={{ paddingHorizontal: UI.spacing.xl }}>
        <CommunityHeader title={t('community.headerTitle')} onBack={() => goBack(from)}>
          <CommunitySafety
            authorId={post.author.id}
            targetId={post.id}
            targetType="post"
            onBlocked={() => router.replace('/(tabs)/community')}
          />
          {isOwnPost && (
            <CommunityHeaderAction
              name="more-horiz"
              label={t('common.delete')}
              onPress={() => setShowDeleteModal(true)}
            />
          )}
        </CommunityHeader>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: screenBottomPadding(insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Post content ──────────────────── */}
          <View style={[s.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* author row */}
            <View style={s.authorRow}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/community/profile' as any,
                    params: { userId: post.author.id, from: '/(tabs)/community/post' },
                  })
                }
                style={s.authorPress}
              >
                <View style={[s.avatar, { backgroundColor: (cat?.tint || colors.tint) + '18' }]}>
                  <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 20 }}>
                    {post.author.avatar}
                  </WellnessIconText>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={[s.authorName, { color: colors.text }]}>{post.author.name}</Text>
                    {post.author.verified && (
                      <MaterialIcons name="verified" size={14} color={colors.accent} />
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
                <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 12 }}>
                  {cat.emoji}
                </WellnessIconText>
                <Text style={[s.catPillText, { color: cat.tint }]}>{cat.label}</Text>
              </View>
            )}

            {/* content */}
            <Text style={[s.content, { color: colors.text }]}>{post.content}</Text>

            {/* image */}
            {imgMeta && (
              <View style={[s.postImage, { backgroundColor: imgMeta.bgColor + '20' }]}>
                <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 48 }}>
                  {imgMeta.emoji}
                </WellnessIconText>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share post"
                onPress={() => Share.share({ message: post.content })}
                style={s.actionBtn}
              >
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
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    colors={colors}
                    postId={postId}
                    onReply={() => {
                      setCommentText((current) => (current ? current : `@${comment.author.name} `));
                      commentInput.current?.focus();
                    }}
                  />
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
              <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
                💬
              </WellnessIconText>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No comments yet</Text>
              <Text style={[s.emptySub, { color: colors.mutedText }]}>
                Be the first to share your thoughts.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Comment input ────────────────────── */}
        <View
          style={[
            s.commentBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              marginBottom: screenBottomPadding(insets.bottom) - 16,
            },
          ]}
        >
          <View style={[s.commentAvatarSmall, { backgroundColor: '#8B6B4718' }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 14 }}>
              {myProfile?.avatar || '😊'}
            </WellnessIconText>
          </View>
          <TextInput
            ref={commentInput}
            accessibilityLabel={t('communityFixes.writeComment')}
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
                backgroundColor: commentText.trim() ? colors.tint : colors.border,
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
            <WellnessIconText
              style={{ fontFamily: Typography.family.body, fontSize: 32, textAlign: 'center' }}
            >
              🗑️
            </WellnessIconText>
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
                <WellnessIconText style={s.deleteConfirmText}>Yes, Delete 🗑️</WellnessIconText>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ── Comment Card ────────────────────────────────── */
function CommentCard({
  comment,
  colors,
  postId,
  onReply,
}: {
  comment: CommunityComment;
  colors: any;
  postId: string;
  onReply: () => void;
}) {
  const { t } = useTranslation();
  const like = useToggleCommentLike();
  const liked = !!comment.isLiked;

  return (
    <View style={[s.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.commentRow}>
        <View style={[s.commentAvatar, { backgroundColor: '#E8985A18' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 16 }}>
            {comment.author.avatar}
          </WellnessIconText>
        </View>
        <View style={{ flex: 1 }}>
          <CommunitySafety
            authorId={comment.author.id}
            targetId={comment.id}
            targetType="comment"
          />
          <View style={s.commentNameRow}>
            <Text style={[s.commentName, { color: colors.text }]}>{comment.author.name}</Text>
            <Text style={[s.commentTime, { color: colors.subtleText }]}>{comment.createdAt}</Text>
          </View>
          <Text style={[s.commentContent, { color: colors.mutedText }]}>{comment.content}</Text>
          <View style={s.commentActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: liked, disabled: like.isPending }}
              disabled={like.isPending}
              onPress={() =>
                like.mutate(
                  { commentId: comment.id, postId, isLiked: liked },
                  { onError: () => toast.error(t('communityFixes.actionFailed')) },
                )
              }
              style={s.commentAction}
            >
              <MaterialIcons
                name={liked ? 'favorite' : 'favorite-border'}
                size={14}
                color={liked ? '#C45B5B' : colors.subtleText}
              />
              <Text style={[s.commentActionText, { color: colors.subtleText }]}>
                {comment.likes}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onReply} style={s.commentAction}>
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

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: UI.spacing.xl,
  },

  /* post card */
  postCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 18,
      borderWidth: 1,
      ...UI.shadow.sm,
    },
    ...communityStyles.postCard,
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
  authorName: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 15,
      fontWeight: Typography.weight.semibold,
    },
    ...communityStyles.authorName,
  },
  postTime: {
    ...{
      fontFamily: Typography.family.body,
      fontSize: 12,
      fontWeight: Typography.weight.bold,
      marginTop: 2,
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
    marginTop: 12,
  },
  catPillText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },
  content: { fontFamily: Typography.family.body, fontSize: 15, lineHeight: 23, marginTop: 12 },
  postImage: {
    height: 180,
    borderRadius: UI.radius.lg,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    ...{ flexDirection: 'row', alignItems: 'center', gap: 5 },
    ...communityStyles.actionBtn,
  },
  actionText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },

  /* comments */
  commentsLabel: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.medium,
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
  commentName: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
  },
  commentTime: {
    fontFamily: Typography.family.body,
    fontSize: 11,
    fontWeight: Typography.weight.bold,
  },
  commentContent: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  commentActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },

  /* empty comments */
  emptyComments: {
    borderRadius: UI.radius.xxl,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  emptyTitle: { ...{ ...Typography.cardHeading, marginTop: 4 }, ...communityStyles.emptyTitle },
  emptySub: {
    ...{ fontFamily: Typography.family.body, fontSize: 14, textAlign: 'center' },
    ...communityStyles.emptySub,
  },

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
    ...{
      fontFamily: Typography.family.body,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: UI.radius.md,
      fontSize: 14,
    },
    ...communityStyles.commentInput,
  },
  sendBtn: {
    ...{
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ...communityStyles.sendBtn,
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
  deleteTitle: {
    ...Typography.section,
    fontSize: 20,
    fontWeight: Typography.weight.regular,
    textAlign: 'center',
    marginTop: 8,
  },
  deleteSub: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  deleteActions: { gap: 10, marginTop: 16 },
  deleteCancel: {
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
  },
  deleteConfirm: {
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    backgroundColor: '#C45B5B',
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
  },
});
