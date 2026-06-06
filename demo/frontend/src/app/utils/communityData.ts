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

export const MOCK_POSTS: CommunityPost[] = [
  {
    id: 1, category: "외식업", title: "배달앱 수수료 줄이는 현실적인 방법 공유합니다",
    content: "3년째 치킨집 운영 중인데, 배달앱 수수료를 줄이면서도 매출을 유지하는 방법을 찾았습니다.",
    author: "치킨사장", avatar: "🐔", date: "2시간 전", views: 1283, likes: 123, comments: 47, isPinned: true, isHot: true,
  },
  {
    id: 2, category: "서비스업", title: "1인 카페 운영 6개월 차 후기 (현실 매출 공개)",
    content: "동네에 카페를 열고 6개월이 지났습니다. 현실적인 매출을 정리해봤습니다.",
    author: "카페장인", avatar: "☕", date: "5시간 전", views: 892, likes: 89, comments: 32, isPinned: false, isHot: true,
  },
  {
    id: 3, category: "노하우", title: "재고관리 엑셀 대신 이거 써보세요 (무료 도구 추천)",
    content: "엑셀로 재고관리 하다가 한계를 느껴서 찾아본 무료 도구들을 비교해봤습니다.",
    author: "효율왕", avatar: "📊", date: "8시간 전", views: 2156, likes: 156, comments: 28, isPinned: false, isHot: true,
  },
  {
    id: 4, category: "소매업", title: "편의점 야간 무인 시스템 도입 3개월 후기",
    content: "인건비 절약을 위해 야간 무인 시스템을 도입했는데 생각보다 만족스럽습니다.",
    author: "24시사장", avatar: "🏪", date: "12시간 전", views: 567, likes: 45, comments: 19, isPinned: false, isHot: false,
  },
  {
    id: 5, category: "프랜차이즈", title: "프차 본사와 분쟁 시 대처법 (경험담)",
    content: "프랜차이즈 운영 3년 차에 본사와 갈등이 생겼을 때 어떻게 해결했는지 공유합니다.",
    author: "경험자", avatar: "⚖️", date: "1일 전", views: 3421, likes: 234, comments: 87, isPinned: false, isHot: true,
  },
  {
    id: 6, category: "자유게시판", title: "오늘 손님이 남긴 감동 리뷰에 울컥했습니다",
    content: "창업한 지 1년, 힘들었는데 오늘 받은 리뷰 보고 눈물이 났네요.",
    author: "감동사장", avatar: "😢", date: "1일 전", views: 1823, likes: 312, comments: 56, isPinned: false, isHot: false,
  },
  {
    id: 7, category: "외식업", title: "주방 동선 개선으로 피크타임 효율 30% 올린 방법",
    content: "작은 주방에서 효율적으로 일하기 위해 동선을 재배치했는데 효과가 엄청났습니다.",
    author: "주방장", avatar: "👨‍🍳", date: "2일 전", views: 876, likes: 98, comments: 23, isPinned: false, isHot: false,
  },
  {
    id: 8, category: "노하우", title: "인스타그램으로 월 매출 200만원 늘린 마케팅 전략",
    content: "SNS 마케팅 전혀 모르던 제가 인스타로 매출을 올린 방법을 단계별로 공유합니다.",
    author: "마케팅초보", avatar: "📱", date: "2일 전", views: 4532, likes: 456, comments: 112, isPinned: false, isHot: true,
  },
];

export function findPostById(postId: number, userPosts: CommunityPost[] = []): CommunityPost | undefined {
  return MOCK_POSTS.find((p) => p.id === postId) ?? userPosts.find((p) => p.id === postId);
}
