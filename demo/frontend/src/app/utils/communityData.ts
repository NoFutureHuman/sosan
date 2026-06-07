export type CommunityPost = {
  id: number;
  category: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  isPinned: boolean;
  isHot: boolean;
};

export function findPostById(postId: number, userPosts: CommunityPost[] = []): CommunityPost | undefined {
  return userPosts.find((p) => p.id === postId);
}
