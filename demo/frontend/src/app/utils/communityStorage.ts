import { CommunityPost, findPostById } from "./communityData";
import { getStoredUser } from "./auth";

export type BoardPost = CommunityPost & {
  authorEmail: string;
};

export type CommunityCommentRecord = {
  id: string;
  postId: number;
  postTitle: string;
  category: string;
  content: string;
  createdAt: string;
  authorEmail: string;
  authorName: string;
};

export type CommunityLikeRecord = {
  postId: number;
  postTitle: string;
  category: string;
  likedAt: string;
};

type BoardData = {
  posts: BoardPost[];
  comments: CommunityCommentRecord[];
};

type UserLikesData = {
  likes: CommunityLikeRecord[];
};

type LegacyCommunityUserData = {
  likes?: CommunityLikeRecord[];
  posts?: BoardPost[];
  comments?: CommunityCommentRecord[];
};

const STORAGE_PREFIX = "sosang_community_";
const BOARD_KEY = `${STORAGE_PREFIX}board`;
const LIKES_PREFIX = `${STORAGE_PREFIX}likes_`;

let legacyMigrated = false;

function currentUserKey(userKey?: string | null): string {
  return (userKey ?? getStoredUser()?.email ?? "guest").toLowerCase();
}

function likesKey(userKey?: string | null): string {
  return `${LIKES_PREFIX}${currentUserKey(userKey)}`;
}

function emptyBoard(): BoardData {
  return { posts: [], comments: [] };
}

function emptyLikes(): UserLikesData {
  return { likes: [] };
}

function loadBoardRaw(): BoardData {
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw) as BoardData;
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return emptyBoard();
  }
}

function saveBoardRaw(data: BoardData): void {
  localStorage.setItem(BOARD_KEY, JSON.stringify(data));
}

function loadLikesRaw(userKey?: string | null): UserLikesData {
  try {
    const raw = localStorage.getItem(likesKey(userKey));
    if (!raw) return emptyLikes();
    const parsed = JSON.parse(raw) as UserLikesData;
    return {
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
    };
  } catch {
    return emptyLikes();
  }
}

function saveLikesRaw(data: UserLikesData, userKey?: string | null): void {
  localStorage.setItem(likesKey(userKey), JSON.stringify(data));
}

function migrateLegacyUserStorage(): void {
  if (legacyMigrated) return;
  legacyMigrated = true;

  const board = loadBoardRaw();
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    if (key === BOARD_KEY || key.startsWith(LIKES_PREFIX)) continue;

    const legacyEmail = key.slice(STORAGE_PREFIX.length).toLowerCase();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LegacyCommunityUserData;

      for (const post of parsed.posts ?? []) {
        if (board.posts.some((p) => p.id === post.id)) continue;
        board.posts.push({
          ...post,
          authorEmail: post.authorEmail ?? legacyEmail,
        });
      }

      for (const comment of parsed.comments ?? []) {
        if (board.comments.some((c) => c.id === comment.id)) continue;
        board.comments.push({
          ...comment,
          authorEmail: comment.authorEmail ?? legacyEmail,
          authorName: comment.authorName ?? "",
        });
      }

      const likes = loadLikesRaw(legacyEmail);
      for (const like of parsed.likes ?? []) {
        if (likes.likes.some((l) => l.postId === like.postId)) continue;
        likes.likes.push(like);
      }
      saveLikesRaw(likes, legacyEmail);
      keysToRemove.push(key);
    } catch {
      // ignore malformed legacy entries
    }
  }

  saveBoardRaw(board);
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function loadBoard(): BoardData {
  migrateLegacyUserStorage();
  return loadBoardRaw();
}

function saveBoard(data: BoardData): void {
  saveBoardRaw(data);
}

function loadLikes(userKey?: string | null): UserLikesData {
  migrateLegacyUserStorage();
  return loadLikesRaw(userKey);
}

function saveLikes(data: UserLikesData, userKey?: string | null): void {
  saveLikesRaw(data, userKey);
}

function removeLikesForPost(postId: number): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(LIKES_PREFIX)) keys.push(key);
  }
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as UserLikesData;
      const likes = Array.isArray(parsed.likes) ? parsed.likes : [];
      const filtered = likes.filter((l) => l.postId !== postId);
      if (filtered.length !== likes.length) {
        localStorage.setItem(key, JSON.stringify({ likes: filtered }));
      }
    } catch {
      // ignore malformed entries
    }
  }
}

export function getCommunityActivity(userKey?: string | null) {
  const email = currentUserKey(userKey);
  const board = loadBoard();
  const likes = loadLikes(email);

  return {
    likedPostIds: new Set(likes.likes.map((l) => l.postId)),
    likes: [...likes.likes].sort((a, b) => b.likedAt.localeCompare(a.likedAt)),
    posts: board.posts
      .filter((p) => p.authorEmail === email)
      .sort((a, b) => b.date.localeCompare(a.date)),
    comments: board.comments
      .filter((c) => c.authorEmail === email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function isPostLiked(postId: number, userKey?: string | null): boolean {
  return loadLikes(userKey).likes.some((l) => l.postId === postId);
}

export function togglePostLike(post: CommunityPost, userKey?: string | null): boolean {
  const data = loadLikes(userKey);
  const index = data.likes.findIndex((l) => l.postId === post.id);
  if (index >= 0) {
    data.likes.splice(index, 1);
    saveLikes(data, userKey);
    return false;
  }
  data.likes.unshift({
    postId: post.id,
    postTitle: post.title,
    category: post.category,
    likedAt: new Date().toISOString(),
  });
  saveLikes(data, userKey);
  return true;
}

export function addUserPost(
  input: { category: string; title: string; content: string },
  authorName: string,
  userKey?: string | null,
): BoardPost {
  const board = loadBoard();
  const authorEmail = currentUserKey(userKey);
  const nextId = Math.max(1000, ...board.posts.map((p) => p.id), 0) + 1;
  const post: BoardPost = {
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
    authorEmail,
  };
  board.posts.unshift(post);
  saveBoard(board);
  return post;
}

export function addComment(
  postId: number,
  content: string,
  userKey?: string | null,
): CommunityCommentRecord | null {
  const board = loadBoard();
  const post = findPostById(postId, board.posts);
  if (!post) return null;

  const authorEmail = currentUserKey(userKey);
  const authorName = getStoredUser()?.name ?? "사장님";

  const comment: CommunityCommentRecord = {
    id: `c-${Date.now()}`,
    postId,
    postTitle: post.title,
    category: post.category,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    authorEmail,
    authorName,
  };
  board.comments.unshift(comment);

  const boardPost = board.posts.find((p) => p.id === postId);
  if (boardPost) {
    boardPost.comments += 1;
  }
  saveBoard(board);
  return comment;
}

export function getCommentsForPost(postId: number): CommunityCommentRecord[] {
  return loadBoard()
    .comments.filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getAllPostsForBoard(): BoardPost[] {
  return [...loadBoard().posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function deleteUserPost(postId: number, userKey?: string | null): boolean {
  const email = currentUserKey(userKey);
  const board = loadBoard();
  const index = board.posts.findIndex((p) => p.id === postId && p.authorEmail === email);
  if (index < 0) return false;

  board.posts.splice(index, 1);
  board.comments = board.comments.filter((c) => c.postId !== postId);
  saveBoard(board);
  removeLikesForPost(postId);
  return true;
}

export function deleteUserComment(commentId: string, userKey?: string | null): boolean {
  const email = currentUserKey(userKey);
  const board = loadBoard();
  const index = board.comments.findIndex((c) => c.id === commentId && c.authorEmail === email);
  if (index < 0) return false;

  const { postId } = board.comments[index];
  board.comments.splice(index, 1);

  const post = board.posts.find((p) => p.id === postId);
  if (post && post.comments > 0) {
    post.comments -= 1;
  }
  saveBoard(board);
  return true;
}
