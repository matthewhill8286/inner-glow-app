/**
 * Community Support – types, mock data, and helpers
 */

/* ── Types ──────────────────────────────────────── */
export type PostCategory =
  | 'self-care'
  | 'mindfulness'
  | 'cheers'
  | 'support'
  | 'therapy'
  | 'others';

export type PostType = 'story' | 'audio';

export type CommunityPost = {
  id: string;
  author: CommunityUser;
  category: PostCategory;
  postType: PostType;
  content: string;
  image?: string;
  createdAt: string;
  likes: number;
  comments: CommunityComment[];
  isLiked: boolean;
  isBookmarked: boolean;
};

export type CommunityUser = {
  id: string;
  name: string;
  avatar: string;
  followers: number;
  following: number;
  verified: boolean;
  bio?: string;
  joinedDate?: string;
};

export type CommunityComment = {
  id: string;
  author: CommunityUser;
  content: string;
  createdAt: string;
  likes: number;
};

export type CommunityNotification = {
  id: string;
  type: 'follow' | 'message' | 'comment' | 'video' | 'mention';
  user: string;
  description: string;
  time: string;
  read: boolean;
};

/* ── Category config ────────────────────────────── */
export const CATEGORIES: {
  key: PostCategory;
  label: string;
  emoji: string;
  tint: string;
}[] = [
  { key: 'self-care', label: 'Self Care', emoji: '🧖', tint: '#5B8A5A' },
  { key: 'mindfulness', label: 'Mindfulness', emoji: '🧘', tint: '#7B6DC9' },
  { key: 'cheers', label: 'Cheers', emoji: '🎉', tint: '#E8985A' },
  { key: 'support', label: 'Support', emoji: '🤝', tint: '#5A8FB5' },
  { key: 'therapy', label: 'Therapy', emoji: '💆', tint: '#8B6B47' },
  { key: 'others', label: 'Others', emoji: '✨', tint: '#C45B5B' },
];

/* ── Mock users ─────────────────────────────────── */
export const MOCK_USERS: CommunityUser[] = [
  {
    id: 'u1',
    name: 'Shinanrya Kaguya',
    avatar: '🧑‍🎨',
    followers: 23,
    following: 41,
    verified: true,
    bio: "Music is my default mood stabilizer. I'm trying to learn how to trust the process & give myself grace on low days.",
    joinedDate: '14 January, 2025',
  },
  {
    id: 'u2',
    name: 'Makima D. Smith',
    avatar: '👩‍🦱',
    followers: 156,
    following: 89,
    verified: false,
    bio: "Let's learn to find meditation spaces for clarity in heart & soul. Become Love the people around you.",
    joinedDate: '3 March, 2025',
  },
  {
    id: 'u3',
    name: 'Makima S.',
    avatar: '👩‍⚕️',
    followers: 67,
    following: 34,
    verified: false,
    bio: 'Everyday I thank god for today. Super grateful with life.',
    joinedDate: '20 June, 2025',
  },
];

/* ── Mock posts ─────────────────────────────────── */
export const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    author: MOCK_USERS[1],
    category: 'self-care',
    postType: 'story',
    content:
      "BRO, I'm sure I can't believe what Dr. Fraud just told me about my anxiety. Oh my god, there's so many great exercises I can do.",
    createdAt: '2h ago',
    likes: 13,
    comments: [
      {
        id: 'c1',
        author: MOCK_USERS[0],
        content: 'Everyday I thank god that boy... Super grateful with life.',
        createdAt: '1h ago',
        likes: 4,
      },
      {
        id: 'c2',
        author: MOCK_USERS[2],
        content:
          "Let's learn to find meditation spaces for clarity in heart & soul. Become Love the people around you.",
        createdAt: '45m ago',
        likes: 2,
      },
    ],
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'p2',
    author: MOCK_USERS[0],
    category: 'mindfulness',
    postType: 'story',
    content:
      "Music is my default mood stabilizer. I'm trying to learn how to trust the process & give myself grace on low days. It's not easy but I'm getting there.",
    image: 'nature',
    createdAt: '5h ago',
    likes: 47,
    comments: [
      {
        id: 'c3',
        author: MOCK_USERS[1],
        content: "This is so relatable! Keep it up, you're doing amazing things.",
        createdAt: '4h ago',
        likes: 8,
      },
    ],
    isLiked: true,
    isBookmarked: true,
  },
  {
    id: 'p3',
    author: MOCK_USERS[2],
    category: 'cheers',
    postType: 'story',
    content:
      'I just want to say I love this community. Having a safe space to share how you feel without judgment is so powerful.',
    createdAt: '1d ago',
    likes: 89,
    comments: [],
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'p4',
    author: MOCK_USERS[0],
    category: 'therapy',
    postType: 'story',
    content:
      "Today's first ever mental health community! I'm glad to see more of us opening up. Therapy has changed my life and I want the same for everyone here.",
    image: 'therapy',
    createdAt: '2d ago',
    likes: 112,
    comments: [
      {
        id: 'c4',
        author: MOCK_USERS[2],
        content: 'Everyday I thank god for today. Super grateful with life.',
        createdAt: '1d ago',
        likes: 15,
      },
    ],
    isLiked: true,
    isBookmarked: false,
  },
];

/* ── Mock community notifications ───────────────── */
export const MOCK_COMMUNITY_NOTIFS: CommunityNotification[] = [
  {
    id: 'cn1',
    type: 'follow',
    user: 'Makima',
    description: 'You have new followers!',
    time: '2h ago',
    read: false,
  },
  {
    id: 'cn2',
    type: 'message',
    user: '',
    description: 'You have unread messages',
    time: '3h ago',
    read: false,
  },
  {
    id: 'cn3',
    type: 'comment',
    user: 'Someone',
    description: 'Someone commented on your post',
    time: '5h ago',
    read: true,
  },
  {
    id: 'cn4',
    type: 'video',
    user: 'Someone',
    description: 'Someone posted new video!',
    time: '3d ago',
    read: true,
  },
  {
    id: 'cn5',
    type: 'mention',
    user: 'Mark & others',
    description: 'Someone mentioned you',
    time: '4d ago',
    read: true,
  },
  {
    id: 'cn6',
    type: 'mention',
    user: 'Jake',
    description: 'Someone mentioned you',
    time: '5d ago',
    read: true,
  },
];

/* ── Notification type meta ─────────────────────── */
export const NOTIF_META: Record<CommunityNotification['type'], { emoji: string; color: string }> = {
  follow: { emoji: '👤', color: '#5B8A5A' },
  message: { emoji: '💬', color: '#5A8FB5' },
  comment: { emoji: '💭', color: '#E8985A' },
  video: { emoji: '🎬', color: '#7B6DC9' },
  mention: { emoji: '📢', color: '#8B6B47' },
};

/* ── Post image placeholders (emoji-based art) ──── */
export const POST_IMAGES: Record<string, { emoji: string; bgColor: string }> = {
  nature: { emoji: '🌿', bgColor: '#5B8A5A' },
  therapy: { emoji: '🧑‍⚕️', bgColor: '#8B6B47' },
  meditation: { emoji: '🧘', bgColor: '#7B6DC9' },
  community: { emoji: '🤝', bgColor: '#E8985A' },
};

/* ── Helpers ─────────────────────────────────────── */
export function getCategoryByKey(key: PostCategory) {
  return CATEGORIES.find((c) => c.key === key);
}

export function timeAgo(dateStr: string): string {
  return dateStr; // mock data already has friendly strings
}
