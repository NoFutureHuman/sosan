import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Clock,
  Building2,
  ChevronDown,
  ExternalLink,
  Bell,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const categories = ["전체", "자금 지원", "교육/컨설팅", "디지털 전환", "임차료", "마케팅", "수출"];
const regions = ["전국", "서울", "경기", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

type SupportItem = {
  id: string;
  title: string;
  org: string;
  category: string;
  region: string;
  amount: string;
  deadline: string;
  status: string;
  desc: string;
  url: string;
};

function normalizeStatus(raw: string): string {
  const s = raw.trim();
  if (!s) return "접수중";
  if (s.includes("접수") || s.includes("진행") || s.includes("OPEN")) return "접수중";
  if (s.includes("예정") || s.includes("대기")) return "접수예정";
  if (s.includes("마감") || s.includes("종료") || s.includes("CLOSE")) return "마감";
  if (s.includes("상시")) return "상시";
  return s;
}

function mapProgram(raw: Record<string, unknown>, index: number): SupportItem {
  const title = String(raw.title ?? "").trim();
  const org = String(raw.org ?? "").trim();
  const apiRegion = String(raw.region ?? "").trim();
  const region =
    apiRegion && regions.includes(apiRegion)
      ? apiRegion
      : regions.find((r) => r !== "전국" && (title.includes(r) || org.includes(r))) ?? "전국";
  const id = String(raw.id ?? `program-${index}`);
  return {
    id,
    title,
    org,
    category: String(raw.category ?? "기타").trim() || "기타",
    region,
    amount: String(raw.amount ?? "미정").trim() || "미정",
    deadline: String(raw.deadline ?? "미정").trim() || "미정",
    status: normalizeStatus(String(raw.status ?? "")),
    desc: String(raw.desc ?? "").trim(),
    url:
      String(raw.url ?? "").trim() ||
      (id ? `https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=${encodeURIComponent(id)}` : ""),
  };
}

export function GovernmentSupport() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showRegionFilter, setShowRegionFilter] = useState(false);
  const [supportData, setSupportData] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetch("/api/support/programs")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error && (!Array.isArray(data.programs) || data.programs.length === 0)) {
          setFetchError(String(data.error));
          setSupportData([]);
          return;
        }
        const programs = Array.isArray(data.programs)
          ? data.programs.map((p: Record<string, unknown>, i: number) => mapProgram(p, i))
          : [];
        setSupportData(programs);
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError("지원사업 정보를 불러오지 못했습니다.");
          setSupportData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = supportData.filter((item) => {
    const matchCategory = selectedCategory === "전체" || item.category === selectedCategory;
    const matchRegion = selectedRegion === "전국" || item.region === selectedRegion || item.region === "전국";
    const matchSearch = !searchQuery || item.title.includes(searchQuery) || item.desc.includes(searchQuery);
    return matchCategory && matchRegion && matchSearch;
  });

  const urgentCount = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return supportData.filter((item) => {
      const parsed = Date.parse(item.deadline.replace(/\./g, "-"));
      return !Number.isNaN(parsed) && parsed > now && parsed - now <= weekMs;
    }).length;
  }, [supportData]);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "접수중": return { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" };
      case "접수예정": return { background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" };
      case "마감": return { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" };
      default: return { background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" };
    }
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
            <Building2 className="w-4 h-4" style={{ color: "#60a5fa" }} />
          </div>
          <h1 className="text-white" style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em' }}>정부 지원사업 알림</h1>
        </div>
        <p className="text-gray-400" style={{ fontSize: '0.9rem' }}>기업마당(bizinfo.go.kr) 실시간 지원사업 공고</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "접수 중", value: supportData.filter(s => s.status === "접수중").length + "건", bg: "rgba(16,185,129,0.1)", color: "#10b981" },
          { label: "접수 예정", value: supportData.filter(s => s.status === "접수예정").length + "건", bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
          { label: "마감 임박", value: urgentCount + "건", bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
          { label: "내 북마크", value: bookmarks.size + "건", bg: "rgba(59,130,246,0.1)", color: "#60a5fa" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: stat.bg }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: '0.78rem', fontWeight: 500, color: stat.color, opacity: 0.7 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Notification Banner */}
      <div
        className="flex items-center gap-3 rounded-xl p-4 mb-6"
        style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.15)" }}>
          <Bell className="w-5 h-5" style={{ color: "#60a5fa" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white" style={{ fontSize: '0.88rem', fontWeight: 600 }}>맞춤 지원사업 알림 받기</p>
          <p className="text-gray-500" style={{ fontSize: '0.78rem' }}>내 업종 · 지역에 맞는 지원사업이 등록되면 알림을 보내드려요</p>
        </div>
        <Button className="text-white rounded-xl shrink-0 h-9 px-4 shadow-sm" style={{ background: "#3b82f6", fontSize: '0.82rem' }}>
          알림 설정
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="지원사업명, 키워드로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/40 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <Button
            variant="outline"
            className="rounded-xl h-11 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white px-4"
            onClick={() => setShowRegionFilter(!showRegionFilter)}
          >
            <MapPinIcon className="w-4 h-4 mr-1.5 text-gray-400" />
            {selectedRegion}
            <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
          </Button>
          {showRegionFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRegionFilter(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 bg-[#1a1d24] border border-white/10 rounded-xl shadow-xl p-2 w-52 max-h-64 overflow-y-auto">
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setSelectedRegion(r); setShowRegionFilter(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedRegion === r ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                    style={{ fontSize: '0.85rem', fontWeight: selectedRegion === r ? 600 : 400 }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full transition-all ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setSelectedCategory(cat)}
            style={{ fontSize: '0.82rem', fontWeight: 500 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mb-3">
        <p className="text-gray-500" style={{ fontSize: '0.82rem' }}>
          총 <span className="text-white" style={{ fontWeight: 600 }}>{filtered.length}건</span>
        </p>
      </div>

      {fetchError && (
        <div
          className="flex items-center gap-2 rounded-xl p-4 mb-4"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} />
          <p className="text-gray-400" style={{ fontSize: "0.82rem" }}>{fetchError}</p>
        </div>
      )}

      {/* Table */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        {/* Table Header */}
        <div className="grid border-b border-white/10 bg-white/5 px-4" style={{ gridTemplateColumns: '32px 90px 1fr 140px 110px 80px' }}>
          <div className="py-3" />
          <div className="py-3 text-gray-400 text-center" style={{ fontSize: '0.78rem', fontWeight: 600 }}>지역</div>
          <div className="py-3 text-gray-400 pl-3" style={{ fontSize: '0.78rem', fontWeight: 600 }}>사업명 / 기관</div>
          <div className="py-3 text-gray-400 text-right" style={{ fontSize: '0.78rem', fontWeight: 600 }}>지원금액</div>
          <div className="py-3 text-gray-400 text-center" style={{ fontSize: '0.78rem', fontWeight: 600 }}>마감일</div>
          <div className="py-3 text-gray-400 text-center" style={{ fontSize: '0.78rem', fontWeight: 600 }}>상태</div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin mb-3" />
            <p className="text-gray-400" style={{ fontSize: "0.88rem" }}>지원사업 정보를 불러오는 중...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400" style={{ fontSize: "0.95rem", fontWeight: 600 }}>등록된 지원사업이 없습니다</p>
            <p className="text-gray-600 mt-1" style={{ fontSize: "0.82rem" }}>API 연동 후 실제 공고가 표시됩니다</p>
          </div>
        )}

        {/* Table Rows */}
        {!loading && filtered.map((item) => (
          <div
            key={item.id}
            className="grid border-b border-white/5 last:border-0 hover:bg-emerald-500/10 transition-colors group px-4 items-center"
            style={{ gridTemplateColumns: '32px 90px 1fr 140px 110px 80px' }}
          >
            {/* Bookmark */}
            <button
              onClick={() => toggleBookmark(item.id)}
              className={`w-7 h-7 flex items-center justify-center transition-colors ${
                bookmarks.has(item.id) ? "text-primary" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {bookmarks.has(item.id) ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Region */}
            <div className="py-4 text-center">
              <div className="text-gray-300" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{item.region}</div>
              <div className="text-gray-500 mt-0.5" style={{ fontSize: '0.7rem' }}>{item.category}</div>
            </div>

            {/* Title + Org */}
            <div className="py-4 pl-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="truncate text-gray-200 group-hover:text-primary transition-colors" style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                  {item.title}
                </h3>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 cursor-pointer shrink-0 transition-colors" />
                  </a>
                )}
              </div>
              <div className="text-gray-500 truncate mt-0.5" style={{ fontSize: '0.76rem' }}>{item.org}</div>
            </div>

            {/* Amount */}
            <div className="py-4 text-right pr-2">
              <span className="text-primary" style={{ fontSize: '0.88rem', fontWeight: 700 }}>{item.amount}</span>
            </div>

            {/* Deadline */}
            <div className="py-4 text-center">
              <span className="text-gray-400" style={{ fontSize: '0.82rem' }}>{item.deadline}</span>
            </div>

            {/* Status */}
            <div className="py-4 flex justify-center">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                style={{ fontSize: '0.68rem', fontWeight: 600, ...getStatusStyle(item.status) }}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
