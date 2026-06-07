import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  Clock,
  PenSquare,
  Search,
  Pin,
  Flame,
  X,
  Image as ImageIcon,
  BarChart3,
  Users,
  TrendingUp,
  Bell,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { BusinessInsight } from "./BusinessInsight";
import { useNavigate } from "react-router";
import type { CommunityPost } from "../utils/communityData";
import { getStoredUser } from "../utils/auth";
import {
  addComment,
  addUserPost,
  getAllPostsForBoard,
  getCommentsForPost,
  getCommunityActivity,
  togglePostLike,
} from "../utils/communityStorage";

const boardCategories = [
  "전체", "외식업", "서비스업", "소매업", "도매업", "제조업", "프랜차이즈", "자유게시판", "노하우",
];

export function Community() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showWrite, setShowWrite] = useState(false);
  const [writeForm, setWriteForm] = useState({ category: "자유게시판", title: "", content: "" });
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [boardPosts, setBoardPosts] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [postComments, setPostComments] = useState<ReturnType<typeof getCommentsForPost>>([]);
  const [sortBy, setSortBy] = useState<"all" | "hot" | "latest">("all");
  const [mainTab, setMainTab] = useState<"community" | "insight">("community");
  const navigate = useNavigate();
  const userName = getStoredUser()?.name ?? "사장님";

  const refreshBoard = () => {
    const activity = getCommunityActivity();
    setBoardPosts(getAllPostsForBoard());
    setLikedPosts(activity.likedPostIds);
  };

  useEffect(() => {
    refreshBoard();
  }, []);

  useEffect(() => {
    if (selectedPostId == null) return;
    setPostComments(getCommentsForPost(selectedPostId));
  }, [selectedPostId, boardPosts]);

  const selectedPost = useMemo(
    () => boardPosts.find((p) => p.id === selectedPostId) ?? null,
    [boardPosts, selectedPostId],
  );

  const filtered = boardPosts
    .filter((p) => {
      const matchCat = selectedCategory === "전체" || p.category === selectedCategory;
      const matchSearch = !searchQuery || p.title.includes(searchQuery) || p.content.includes(searchQuery);
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "hot") return b.likes - a.likes;
      if (sortBy === "latest") return 0;
      // pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const toggleLike = (post: CommunityPost) => {
    togglePostLike(post);
    refreshBoard();
  };

  const handleSubmitPost = () => {
    if (!writeForm.title.trim() || !writeForm.content.trim()) return;
    addUserPost(writeForm, userName);
    setWriteForm({ category: "자유게시판", title: "", content: "" });
    setShowWrite(false);
    refreshBoard();
  };

  const handleSubmitComment = () => {
    if (!selectedPostId || !commentDraft.trim()) return;
    addComment(selectedPostId, commentDraft);
    setCommentDraft("");
    refreshBoard();
    setPostComments(getCommentsForPost(selectedPostId));
  };

  return (
    <div 
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10"
      style={{
        minHeight: '100vh',
        backgroundColor: '#141720',
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 50%)`,
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
            <Users className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <h1 className="text-white" style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em" }}>사장님 커뮤니티</h1>
        </div>
        <p className="text-gray-400" style={{ fontSize: "0.9rem" }}>업종별 노하우 공유 · 경영 고민 상담 · 데이터 기반 분석</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "전체 게시글", value: boardPosts.length + "개", bg: "rgba(16,185,129,0.1)", color: "#10b981" },
          { label: "HOT 게시글", value: boardPosts.filter((p) => p.isHot).length + "개", bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
          { label: "참여 사장님", value: new Set(boardPosts.map((p) => p.author)).size + "명", bg: "rgba(59,130,246,0.1)", color: "#60a5fa" },
          { label: "내 공감 게시글", value: likedPosts.size + "개", bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: stat.bg }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "0.78rem", fontWeight: 500, color: stat.color, opacity: 0.7 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Notification Banner */}
      <div
        className="flex items-center gap-3 rounded-xl p-4 mb-6"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.15)" }}>
          <Bell className="w-5 h-5" style={{ color: "#10b981" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white" style={{ fontSize: "0.88rem", fontWeight: 600 }}>인기 게시글 알림 받기</p>
          <p className="text-gray-500" style={{ fontSize: "0.78rem" }}>내 업종의 인기 게시글이 등록되면 알림을 보내드려요</p>
        </div>
        <Button
          className="text-white rounded-xl shrink-0 h-9 px-4 shadow-sm"
          style={{ background: "#10b981", fontSize: "0.82rem" }}
        >
          알림 설정
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setMainTab("community")}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            mainTab === "community"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
          style={{ fontSize: "0.88rem", fontWeight: 600 }}
        >
          <MessageSquare className="w-4 h-4" /> 게시판
        </button>
        <button
          onClick={() => setMainTab("insight")}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            mainTab === "insight"
              ? "bg-orange-600 text-white shadow-md shadow-orange-900/50"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
          style={{ fontSize: "0.88rem", fontWeight: 600 }}
        >
          <BarChart3 className="w-4 h-4" /> 창업·메뉴 분석
        </button>
        <button
          onClick={() => navigate("/ai-analysis")}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0 bg-white/5 text-emerald-400 hover:bg-emerald-500/20"
          style={{ fontSize: "0.88rem", fontWeight: 600, border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <Sparkles className="w-4 h-4" /> AI 맞춤 분석
        </button>
      </div>

      {mainTab === "insight" ? (
        <BusinessInsight />
      ) : (
        <>
          {/* Write Form */}
          {showWrite && (
            <Card className="mb-6 border-0 shadow-lg ring-1 ring-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-gray-900" style={{ fontWeight: 600, fontSize: "1.02rem" }}>새 글 작성</h3>
                  <button onClick={() => setShowWrite(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <select
                      className="border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                      value={writeForm.category}
                      onChange={(e) => setWriteForm({ ...writeForm, category: e.target.value })}
                    >
                      {boardCategories.filter((c) => c !== "전체").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={writeForm.title}
                      onChange={(e) => setWriteForm({ ...writeForm, title: e.target.value })}
                      className="flex-1 h-11 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-4 min-h-[140px] text-sm bg-white text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-gray-400"
                    placeholder="다른 사장님들과 나누고 싶은 이야기를 자유롭게 적어주세요..."
                    value={writeForm.content}
                    onChange={(e) => setWriteForm({ ...writeForm, content: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50">
                      <ImageIcon className="w-4 h-4" />
                      <span style={{ fontSize: "0.82rem" }}>사진 첨부</span>
                    </button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-xl h-10 border-gray-200" onClick={() => setShowWrite(false)}>취소</Button>
                      <Button className="bg-primary text-white rounded-xl h-10 px-6" onClick={handleSubmitPost}>등록하기</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search & Write */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="게시글 제목, 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/40 focus:ring-primary/20"
              />
            </div>
            <Button
              className="bg-primary text-white rounded-xl h-11 px-5 shadow-sm hover:shadow-md transition-all shrink-0"
              onClick={() => setShowWrite(!showWrite)}
            >
              <PenSquare className="w-4 h-4 mr-1.5" /> 글쓰기
            </Button>
          </div>

          {/* Sort Pills */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {[
              { key: "all", label: "전체" },
              { key: "hot", label: "🔥 인기순" },
              { key: "latest", label: "최신순" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key as typeof sortBy)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  sortBy === s.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
                style={{ fontSize: "0.82rem", fontWeight: 500 }}
              >
                {s.label}
              </button>
            ))}
            <div className="w-px h-5 bg-white/10 mx-1" />
            {boardCategories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setSelectedCategory(cat)}
                style={{ fontSize: "0.82rem", fontWeight: 500 }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="mb-3">
            <p className="text-gray-500" style={{ fontSize: "0.82rem" }}>
              총 <span className="text-white" style={{ fontWeight: 600 }}>{filtered.length}개</span> 게시글
            </p>
          </div>

          {/* Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
            {/* Table Header */}
            <div
              className="hidden md:grid border-b border-white/10 bg-white/5 px-4"
              style={{ gridTemplateColumns: "32px 90px 1fr 100px 90px 90px" }}
            >
              <div className="py-3" />
              <div className="py-3 text-gray-400 text-center" style={{ fontSize: "0.78rem", fontWeight: 600 }}>카테고리</div>
              <div className="py-3 text-gray-400 pl-3" style={{ fontSize: "0.78rem", fontWeight: 600 }}>제목 / 작성자</div>
              <div className="py-3 text-gray-400 text-center" style={{ fontSize: "0.78rem", fontWeight: 600 }}>조회 / 댓글</div>
              <div className="py-3 text-gray-400 text-center" style={{ fontSize: "0.78rem", fontWeight: 600 }}>작성일</div>
              <div className="py-3 text-gray-400 text-center" style={{ fontSize: "0.78rem", fontWeight: 600 }}>공감</div>
            </div>

            {/* Table Rows */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400" style={{ fontSize: "0.95rem", fontWeight: 600 }}>등록된 게시글이 없습니다</p>
                <p className="text-gray-600 mt-1" style={{ fontSize: "0.82rem" }}>첫 번째 글을 작성해보세요</p>
              </div>
            )}
            {filtered.map((post) => (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPostId(post.id)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedPostId(post.id)}
                className={`border-b border-white/5 last:border-0 transition-colors group cursor-pointer
                  ${post.isPinned ? "bg-primary/5 hover:bg-emerald-500/10" : "hover:bg-emerald-500/10"}`}
              >
                {/* Desktop row */}
                <div
                  className="hidden md:grid px-4 items-center"
                  style={{ gridTemplateColumns: "32px 90px 1fr 100px 90px 90px" }}
                >
                  {/* Badge icons */}
                  <div className="py-4 flex flex-col gap-1 items-center">
                    {post.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                    {post.isHot && <Flame className="w-3.5 h-3.5 text-red-500" />}
                  </div>

                  {/* Category */}
                  <div className="py-4 text-center">
                    <span
                      className="inline-block px-2.5 py-1 rounded-lg bg-white/5 text-gray-400"
                      style={{ fontSize: "0.74rem", fontWeight: 500 }}
                    >
                      {post.category}
                    </span>
                  </div>

                  {/* Title + Author */}
                  <div className="py-4 pl-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {post.isPinned && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0" style={{ fontSize: "0.64rem", fontWeight: 700 }}>공지</span>
                      )}
                      {post.isHot && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 shrink-0" style={{ fontSize: "0.64rem", fontWeight: 700 }}>HOT</span>
                      )}
                      <h4 className="truncate text-gray-200 group-hover:text-primary transition-colors" style={{ fontSize: "0.92rem", fontWeight: 600 }}>
                        {post.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span style={{ fontSize: "0.75rem" }}>{post.avatar}</span>
                      <span className="text-gray-500" style={{ fontSize: "0.75rem" }}>{post.author}</span>
                    </div>
                  </div>

                  {/* Views / Comments */}
                  <div className="py-4 text-center">
                    <div className="flex items-center justify-center gap-3 text-gray-500" style={{ fontSize: "0.78rem" }}>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {post.comments}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="py-4 text-center">
                    <span className="text-gray-500" style={{ fontSize: "0.82rem" }}>{post.date}</span>
                  </div>

                  {/* Likes */}
                  <div className="py-4 flex justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(post); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                        likedPosts.has(post.id)
                          ? "bg-primary/10 text-primary"
                          : "bg-white/5 text-gray-400 hover:bg-primary/10 hover:text-primary"
                      }`}
                      style={{ fontSize: "0.78rem", fontWeight: 600 }}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                      {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>

                {/* Mobile row */}
                <div className="md:hidden p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0" style={{ fontSize: "1.1rem" }}>
                      {post.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {post.isPinned && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary" style={{ fontSize: "0.64rem", fontWeight: 700 }}>공지</span>
                        )}
                        {post.isHot && (
                          <span className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-400" style={{ fontSize: "0.64rem", fontWeight: 700 }}>HOT</span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400" style={{ fontSize: "0.7rem", fontWeight: 500 }}>{post.category}</span>
                      </div>
                      <p className="text-gray-200 group-hover:text-primary transition-colors truncate mb-1" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{post.title}</p>
                      <div className="flex items-center gap-3 text-gray-500" style={{ fontSize: "0.75rem" }}>
                        <span>{post.author}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(post); }}
                          className={`flex items-center gap-1 ${likedPosts.has(post.id) ? "text-primary" : ""}`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                          {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                        </button>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setSelectedPostId(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">{selectedPost.category}</span>
                <h3 className="text-white font-bold mt-2">{selectedPost.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{selectedPost.author} · {selectedPost.date}</p>
              </div>
              <button type="button" onClick={() => setSelectedPostId(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{selectedPost.content}</p>
            <button
              type="button"
              onClick={() => toggleLike(selectedPost)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 ${
                likedPosts.has(selectedPost.id) ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400"
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> 공감
            </button>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white text-sm font-semibold mb-3">댓글 ({postComments.length})</p>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {postComments.length === 0 ? (
                  <p className="text-gray-500 text-xs">첫 댓글을 남겨 보세요.</p>
                ) : (
                  postComments.map((c) => (
                    <div key={c.id} className="rounded-lg px-3 py-2 bg-white/5">
                      <p className="text-gray-200 text-sm">{c.content}</p>
                      <p className="text-gray-500 text-xs mt-1">{c.createdAt.slice(0, 16).replace("T", " ")}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="댓글을 입력하세요"
                  className="flex-1 h-10 rounded-xl px-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                />
                <Button className="bg-primary text-white h-10 px-4 rounded-xl" onClick={handleSubmitComment}>
                  등록
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}