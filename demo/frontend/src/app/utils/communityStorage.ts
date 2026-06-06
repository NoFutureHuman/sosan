import { CommunityPost, MOCK_POSTS, findPostById } from "./communityData";
import { getStoredUser } from "./auth";

export type UserCommunityPost = CommunityPost & {
  isMine: true;
};

export type CommunityCommentRecord = {
  id: string;
  postId: number;
  postTitle: string;
  category: string;
  content: string;
  createdAt: string;
};

export type CommunityLikeRecord = {
  postId: number;
  postTitle: string;
  category: string;
  likedAt: string;
};

type CommunityUserData = {
  likes: CommunityLikeRecord[];
  posts: UserCommunityPost[];
  comments: CommunityCommentRecord[];
};

const STORAGE_PREFIX = "sosang_community_";

function storageKey(userKey?: string | null): string {
  const email = userKey ?? getStoredUser()?.email ?? "guest";
  return `${STORAGE_PREFIX}${email.toLowerCase()}`;
}

function loadRaw(userKey?: string | null): CommunityUserData {
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) {
      return { likes: [], posts: [], comments: [] };
    }
    const parsed = JSON.parse(raw) as CommunityUserData;
    return {
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return { likes: [], posts: [], comments: [] };
  }
}

function saveRaw(data: CommunityUserData, userKey?: string | null): void {
  localStorage.setItem(storageKey(userKey), JSON.stringify(data));
}

export function getCommunityActivity(userKey?: string | null) {
  const data = loadRaw(userKey);
  const likedIds = new Set(data.likes.map((l) => l.postId));
  return {
    likedPostIds: likedIds,
    likes: [...data.likes].sort((a, b) => b.likedAt.localeCompare(a.likedAt)),
    posts: [...data.posts].sort((a, b) => b.date.localeCompare(a.date)),
    comments: [...data.comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function isPostLiked(postId: number, userKey?: string | null): boolean {
  return loadRaw(userKey).likes.some((l) => l.postId === postId);
}

export function togglePostLike(post: CommunityPost, userKey?: string | null): boolean {
  const data = loadRaw(userKey);
  const index = data.likes.findIndex((l) => l.postId === post.id);
  if (index >= 0) {
    data.likes.splice(index, 1);
    saveRaw(data, userKey);
    return false;
  }
  data.likes.unshift({
    postId: post.id,
    postTitle: post.title,
    category: post.category,
    likedAt: new Date().toISOString(),
  });
  saveRaw(data, userKey);
  return true;
}

export function addUserPost(
  input: { category: string; title: string; content: string },
  authorName: string,
  userKey?: string | null,
): UserCommunityPost {
  const data = loadRaw(userKey);
  const nextId = Math.max(
    1000,
    ...MOCK_POSTS.map((p) => p.id),
    ...data.posts.map((p) => p.id),
  ) + 1;
  const post: UserCommunityPost = {
    id: nextId,
    category: input.category,
    title: input.title.trim(),
    content: input.content.trim(),
    author: authorName || "나",
    avatar: "🙂",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    views: 0,
    likes: 0,
    comments: 0,
    isPinned: false,
    isHot: false,
    isMine: true,
  };
  data.posts.unshift(post);
  saveRaw(data, userKey);
  return post;
}

export function addComment(
  postId: number,
  content: string,
  userKey?: string | null,
): CommunityCommentRecord | null {
  const data = loadRaw(userKey);
  const post = findPostById(postId, data.posts);
  if (!post) return null;

  const comment: CommunityCommentRecord = {
    id: `c-${Date.now()}`,
    postId,
    postTitle: post.title,
    category: post.category,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  data.comments.unshift(comment);

  const userPost = data.posts.find((p) => p.id === postId);
  if (userPost) {
    userPost.comments += 1;
  }
  saveRaw(data, userKey);
  return comment;
}

export function getCommentsForPost(postId: number, userKey?: string | null): CommunityCommentRecord[] {
  return loadRaw(userKey).comments.filter((c) => c.postId === postId);
}

export function getAllPostsForBoard(userKey?: string | null): CommunityPost[] {
  const { posts } = loadRaw(userKey);
  return [...posts, ...MOCK_POSTS];
}
