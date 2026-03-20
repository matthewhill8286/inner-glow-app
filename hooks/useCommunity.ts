import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { useUser } from './useUser';
import type {
  CommunityPost,
  CommunityUser,
  CommunityComment,
  CommunityNotification,
  PostCategory,
  PostType,
} from '@/lib/community';
import { timeAgo } from '@/lib/community';

/* ── Row types from Supabase ────────────────────── */
type PostRow = {
  id: string;
  user_id: string;
  category: string;
  post_type: string;
  content: string;
  image_key: string | null;
  is_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  display_name: string;
  avatar: string;
  bio: string | null;
  verified: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
};

type NotifRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  description: string;
  read: boolean;
  created_at: string;
};

/* ── Helpers ─────────────────────────────────────── */
function profileToUser(p: ProfileRow): CommunityUser {
  const joinDate = new Date(p.created_at);
  const month = joinDate.toLocaleString('en-US', { month: 'long' });
  const day = joinDate.getDate();
  const year = joinDate.getFullYear();

  return {
    id: p.user_id,
    name: p.display_name,
    avatar: p.avatar,
    followers: p.followers_count,
    following: p.following_count,
    verified: p.verified,
    bio: p.bio || undefined,
    joinedDate: `${day} ${month}, ${year}`,
  };
}

export function formatTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

/* ── Default fallback profile ───────────────────── */
const FALLBACK_USER: CommunityUser = {
  id: 'unknown',
  name: 'Anonymous',
  avatar: '👤',
  followers: 0,
  following: 0,
  verified: false,
};

/* ═══════════════════════════════════════════════════
   useCommunityFeed – paginated post feed
   ═══════════════════════════════════════════════════ */
export function useCommunityFeed(opts?: {
  category?: PostCategory;
  sortBy?: 'recent' | 'popular';
}) {
  const { data: user } = useUser();
  const category = opts?.category;
  const sortBy = opts?.sortBy ?? 'recent';

  return useQuery({
    queryKey: ['communityFeed', user?.id, category, sortBy],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      /* 1) fetch posts */
      let postQ = supabase.from('community_posts').select('*').eq('is_hidden', false);

      if (category) postQ = postQ.eq('category', category);

      if (sortBy === 'popular') {
        postQ = postQ.order('likes_count', { ascending: false });
      } else {
        postQ = postQ.order('created_at', { ascending: false });
      }

      postQ = postQ.limit(50);

      const { data: posts, error: postErr } = await postQ;
      if (postErr) throw postErr;
      if (!posts || posts.length === 0) return [];

      /* 2) gather unique user IDs from posts */
      const userIds = [...new Set((posts as PostRow[]).map((p) => p.user_id))];

      /* 3) fetch profiles for those users */
      const { data: profiles } = await supabase
        .from('community_profiles')
        .select('*')
        .in('user_id', userIds);

      const profileMap = new Map<string, ProfileRow>();
      (profiles || []).forEach((p: ProfileRow) => profileMap.set(p.user_id, p));

      /* 4) fetch current user's likes & bookmarks in one go */
      const postIds = (posts as PostRow[]).map((p) => p.id);

      const [likesRes, bookmarksRes] = await Promise.all([
        supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds),
        supabase
          .from('community_bookmarks')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds),
      ]);

      const likedIds = new Set((likesRes.data || []).map((l: any) => l.post_id));
      const bookmarkedIds = new Set((bookmarksRes.data || []).map((b: any) => b.post_id));

      /* 5) map to CommunityPost[] */
      const result: CommunityPost[] = (posts as PostRow[]).map((p) => {
        const profile = profileMap.get(p.user_id);
        const author = profile ? profileToUser(profile) : { ...FALLBACK_USER, id: p.user_id };

        return {
          id: p.id,
          author,
          category: p.category as PostCategory,
          postType: p.post_type as PostType,
          content: p.content,
          image: p.image_key || undefined,
          createdAt: formatTimeAgo(p.created_at),
          likes: p.likes_count,
          comments: [], // comments loaded on detail
          isLiked: likedIds.has(p.id),
          isBookmarked: bookmarkedIds.has(p.id),
        };
      });

      return result;
    },
  });
}

/* ═══════════════════════════════════════════════════
   useCommunityPost – single post with comments
   ═══════════════════════════════════════════════════ */
export function useCommunityPost(postId: string | undefined) {
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['communityPost', postId, user?.id],
    enabled: !!user && !!postId,
    queryFn: async () => {
      if (!user || !postId) throw new Error('Missing params');

      /* fetch post */
      const { data: post, error: postErr } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postErr) throw postErr;
      const p = post as PostRow;

      /* fetch author profile */
      const { data: authorProfile } = await supabase
        .from('community_profiles')
        .select('*')
        .eq('user_id', p.user_id)
        .single();

      const author = authorProfile
        ? profileToUser(authorProfile as ProfileRow)
        : { ...FALLBACK_USER, id: p.user_id };

      /* fetch comments with their author profiles */
      const { data: comments } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      const commentRows = (comments || []) as CommentRow[];
      const commentUserIds = [...new Set(commentRows.map((c) => c.user_id))];

      let commentProfiles = new Map<string, ProfileRow>();
      if (commentUserIds.length > 0) {
        const { data: cProfiles } = await supabase
          .from('community_profiles')
          .select('*')
          .in('user_id', commentUserIds);
        (cProfiles || []).forEach((cp: ProfileRow) => commentProfiles.set(cp.user_id, cp));
      }

      const mappedComments: CommunityComment[] = commentRows.map((c) => {
        const cProfile = commentProfiles.get(c.user_id);
        const cAuthor = cProfile ? profileToUser(cProfile) : { ...FALLBACK_USER, id: c.user_id };
        return {
          id: c.id,
          author: cAuthor,
          content: c.content,
          createdAt: formatTimeAgo(c.created_at),
          likes: c.likes_count,
        };
      });

      /* fetch like & bookmark status */
      const [likeRes, bookmarkRes] = await Promise.all([
        supabase
          .from('community_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle(),
        supabase
          .from('community_bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle(),
      ]);

      const result: CommunityPost = {
        id: p.id,
        author,
        category: p.category as PostCategory,
        postType: p.post_type as PostType,
        content: p.content,
        image: p.image_key || undefined,
        createdAt: formatTimeAgo(p.created_at),
        likes: p.likes_count,
        comments: mappedComments,
        isLiked: !!likeRes.data,
        isBookmarked: !!bookmarkRes.data,
      };

      return result;
    },
  });
}

/* ═══════════════════════════════════════════════════
   useCreatePost
   ═══════════════════════════════════════════════════ */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async (input: {
      category: PostCategory;
      postType: PostType;
      content: string;
      imageKey?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          category: input.category,
          post_type: input.postType,
          content: input.content,
          image_key: input.imageKey || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useDeletePost
   ═══════════════════════════════════════════════════ */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;
      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['communityPost'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useToggleLike
   ═══════════════════════════════════════════════════ */
export function useToggleLike() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        /* unlike */
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (error) throw error;
      } else {
        /* like */
        const { error } = await supabase
          .from('community_likes')
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }

      return { postId, nowLiked: !isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['communityPost'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useToggleBookmark
   ═══════════════════════════════════════════════════ */
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isBookmarked) {
        const { error } = await supabase
          .from('community_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_bookmarks')
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }

      return { postId, nowBookmarked: !isBookmarked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['communityPost'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useAddComment
   ═══════════════════════════════════════════════════ */
export function useAddComment() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['communityPost', vars.postId] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useDeleteComment
   ═══════════════════════════════════════════════════ */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
      if (error) throw error;
      return { commentId, postId };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['communityPost', vars.postId] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useCommunityProfile – view any user's profile
   ═══════════════════════════════════════════════════ */
export function useCommunityProfile(userId: string | undefined) {
  const { data: currentUser } = useUser();

  return useQuery({
    queryKey: ['communityProfile', userId, currentUser?.id],
    enabled: !!currentUser && !!userId,
    queryFn: async () => {
      if (!currentUser || !userId) throw new Error('Missing params');

      /* fetch profile */
      const { data: profile, error } = await supabase
        .from('community_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      const user = profileToUser(profile as ProfileRow);

      /* fetch their posts */
      const { data: posts } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      /* check if current user follows this user */
      const { data: followRow } = await supabase
        .from('community_followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .maybeSingle();

      /* map posts (without comments – just count) */
      const userPosts: CommunityPost[] = ((posts || []) as PostRow[]).map((p) => ({
        id: p.id,
        author: user,
        category: p.category as PostCategory,
        postType: p.post_type as PostType,
        content: p.content,
        image: p.image_key || undefined,
        createdAt: formatTimeAgo(p.created_at),
        likes: p.likes_count,
        comments: [],
        isLiked: false,
        isBookmarked: false,
      }));

      return {
        user,
        posts: userPosts,
        isFollowing: !!followRow,
      };
    },
  });
}

/* ═══════════════════════════════════════════════════
   useMyProfile – current user's community profile
   ═══════════════════════════════════════════════════ */
export function useMyProfile() {
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['myProfile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      /* If no profile exists yet, return a default */
      if (!data) {
        return {
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          avatar: '😊',
          followers: 0,
          following: 0,
          verified: false,
        } as CommunityUser;
      }

      return profileToUser(data as ProfileRow);
    },
  });
}

/* ═══════════════════════════════════════════════════
   useToggleFollow
   ═══════════════════════════════════════════════════ */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isFollowing,
    }: {
      targetUserId: string;
      isFollowing: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        /* unfollow */
        const { error } = await supabase
          .from('community_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        /* follow */
        const { error } = await supabase
          .from('community_followers')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }

      return { targetUserId, nowFollowing: !isFollowing };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['communityProfile', vars.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useCommunityNotifications
   ═══════════════════════════════════════════════════ */
export function useCommunityNotifications() {
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['communityNotifs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs: CommunityNotification[] = ((data || []) as NotifRow[]).map((n) => ({
        id: n.id,
        type: n.type as CommunityNotification['type'],
        user: '', // will be enriched if needed
        description: n.description,
        time: formatTimeAgo(n.created_at),
        read: n.read,
      }));

      return notifs;
    },
  });
}

/* ═══════════════════════════════════════════════════
   useMarkNotifRead
   ═══════════════════════════════════════════════════ */
export function useMarkNotifRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: string) => {
      const { error } = await supabase
        .from('community_notifications')
        .update({ read: true })
        .eq('id', notifId);
      if (error) throw error;
      return notifId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityNotifs'] });
    },
  });
}

/* ═══════════════════════════════════════════════════
   useUpdateProfile
   ═══════════════════════════════════════════════════ */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async (input: { displayName?: string; avatar?: string; bio?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, any> = {};
      if (input.displayName !== undefined) updates.display_name = input.displayName;
      if (input.avatar !== undefined) updates.avatar = input.avatar;
      if (input.bio !== undefined) updates.bio = input.bio;

      const { data, error } = await supabase
        .from('community_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['communityProfile'] });
    },
  });
}
