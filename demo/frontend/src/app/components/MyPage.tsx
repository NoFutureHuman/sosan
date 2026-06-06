import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Store,
  LogOut,
  Sparkles,
  User,
  Mail,
  Briefcase,
  Clock,
  ChevronRight,
  LayoutDashboard,
  ThumbsUp,
  MessageSquare,
  FileText,
  Users,
} from "lucide-react";
import {
  AnalysisHistoryItem,
  AUTH_CHANGE_EVENT,
  AuthUser,
  clearAuthSession,
  fetchMe,
  fetchMyHistory,
  getStoredUser,
} from "../utils/auth";
import { getCommunityActivity } from "../utils/communityStorage";

const businessLabels: Record<string, string> = {
  food: "외식업",
  retail: "소매업",
  service: "서비스업",
  manufacturing: "제조업",
  other: "기타",
};

type CommunityTab = "posts" | "comments" | "likes";

function formatWhen(iso: string) {
  if (!iso) return "-";
  return iso.slice(0, 16).replace("T", " ");
}

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

export function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [communityTab, setCommunityTab] = useState<CommunityTab>("posts");
  const [community, setCommunity] = useState(() => getCommunityActivity());
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setCommunity(getCommunityActivity(user?.email));
  };

  useEffect(() => {
    Promise.all([fetchMe(), fetchMyHistory()])
      .then(([profile, items]) => {
        setUser(profile);
        setHistory(items);
        setCommunity(getCommunityActivity(profile.email));
      })
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => setLoading(false));

    const onAuthChange = () => loadAll();
    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange);
  }, [navigate]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#141720", color: "rgba(255,255,255,0.5)" }}
      >
        마이페이지 불러오는 중...
      </div>
    );
  }

  const communityLists = {
    posts: community.posts,
    comments: community.comments,
    likes: community.likes,
  };
  const activeCommunityItems = communityLists[communityTab];

  return (
    <div className="min-h-screen" style={{ background: "#141720" }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 55%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#10b981,#34d399)" }}
          >
            <Store className="w-[18px] h-[18px] text-white" />
          </div>
          <span
            className="text-white"
            style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            소상<span style={{ color: "#10b981" }}>광장</span>
          </span>
        </Link>

        <h1
          className="text-white mb-1"
          style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em" }}
        >
          안녕하세요, {user?.name || "사장님"}!
        </h1>
        <p className="mb-8" style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.42)" }}>
          내 정보, 서비스 바로가기, 분석·커뮤니티 활동을 한곳에서 확인해요.
        </p>

        <div className="rounded-2xl p-5 mb-6 space-y-4" style={cardStyle}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <User className="w-6 h-6" style={{ color: "#34d399" }} />
            </div>
            <div>
              <p className="text-white font-semibold">{user?.name}</p>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
                {businessLabels[user?.businessType || ""] || user?.businessType || "업종 미설정"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
            <Mail className="w-4 h-4 shrink-0" />
            {user?.email}
          </div>
          <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
            <Briefcase className="w-4 h-4 shrink-0" />
            회원 가입일: {user?.createdAt?.slice(0, 10) || "-"}
          </div>
        </div>

        <h2 className="text-white mb-3" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          서비스 바로가기
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate("/ai-analysis?view=ownerMain")}
            className="flex items-center justify-between px-4 py-4 rounded-2xl text-left transition-all"
            style={{
              ...cardStyle,
              cursor: "pointer",
              background: "rgba(59,130,246,0.12)",
              borderColor: "rgba(59,130,246,0.35)",
            }}
          >
            <span>
              <span className="flex items-center gap-2 text-white font-semibold text-sm">
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                기존 사장님 화면
              </span>
              <span className="block mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                운영 대시보드·시세·도구
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/ai-analysis")}
            className="flex items-center justify-between px-4 py-4 rounded-2xl text-left transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))",
              border: "1px solid rgba(16,185,129,0.35)",
              cursor: "pointer",
            }}
          >
            <span>
              <span className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                AI 맞춤 분석
              </span>
              <span className="block mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                신생·기존 분석 시작
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
          </button>
        </div>

        <h2 className="text-white mb-1" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          완료된 분석 기록
        </h2>
        <p className="mb-4" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)" }}>
          항목을 누르면 저장된 리포트를 다시 볼 수 있어요.
        </p>

        {history.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center mb-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.9rem",
            }}
          >
            완료된 분석이 없습니다. AI 분석을 실행해 보세요.
          </div>
        ) : (
          <ul className="space-y-3 mb-8">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/mypage/history/${item.id}`)}
                  className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-left transition-all"
                  style={{ ...cardStyle, cursor: "pointer" }}
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {item.userType === "EXISTING" ? "기존 사장님" : "신생 창업자"} ·{" "}
                      {item.businessType || "업종 미입력"}
                    </p>
                    <p
                      className="flex items-center gap-1 mt-1"
                      style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      {item.createdAt?.slice(0, 16).replace("T", " ")}
                      {item.region ? ` · ${item.region}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#34d399" }} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            커뮤니티 활동
          </h2>
          <button
            type="button"
            onClick={() => navigate("/community")}
            className="text-xs flex items-center gap-1"
            style={{ color: "#34d399", background: "none", border: "none", cursor: "pointer" }}
          >
            <Users className="w-3.5 h-3.5" />
            커뮤니티 가기
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(
            [
              { key: "posts" as const, label: "게시글", icon: FileText, count: community.posts.length },
              { key: "comments" as const, label: "댓글", icon: MessageSquare, count: community.comments.length },
              { key: "likes" as const, label: "좋아요", icon: ThumbsUp, count: community.likes.length },
            ]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCommunityTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: communityTab === tab.key ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                border: communityTab === tab.key ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.06)",
                color: communityTab === tab.key ? "#34d399" : "rgba(255,255,255,0.45)",
                cursor: "pointer",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        <div className="rounded-xl mb-8 overflow-hidden" style={cardStyle}>
          {activeCommunityItems.length === 0 ? (
            <p className="p-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              {communityTab === "posts" && "작성한 게시글이 없습니다. 커뮤니티에서 글을 작성해 보세요."}
              {communityTab === "comments" && "작성한 댓글이 없습니다. 게시글에 댓글을 남겨 보세요."}
              {communityTab === "likes" && "공감한 게시글이 없습니다. 마음에 드는 글에 좋아요를 눌러 보세요."}
            </p>
          ) : (
            <ul>
              {communityTab === "posts" &&
                community.posts.map((post) => (
                  <li
                    key={post.id}
                    className="px-4 py-3 border-b border-white/5 last:border-0"
                  >
                    <p className="text-white text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {post.category} · {formatWhen(post.date)}
                    </p>
                  </li>
                ))}
              {communityTab === "comments" &&
                community.comments.map((c) => (
                  <li key={c.id} className="px-4 py-3 border-b border-white/5 last:border-0">
                    <p className="text-white text-sm line-clamp-2">{c.content}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {c.postTitle} · {formatWhen(c.createdAt)}
                    </p>
                  </li>
                ))}
              {communityTab === "likes" &&
                community.likes.map((like) => (
                  <li
                    key={`${like.postId}-${like.likedAt}`}
                    className="px-4 py-3 border-b border-white/5 last:border-0"
                  >
                    <p className="text-white text-sm font-medium truncate">{like.postTitle}</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {like.category} · {formatWhen(like.likedAt)}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.55)",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </div>
  );
}
