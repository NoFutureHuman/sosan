import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Store,
  Search,
  TrendingUp,
  Wrench,
  ArrowRight,
  LineChart,
  ChevronLeft,
  Home,
  Bell,
  ListChecks,
  Clock3,
  Boxes,
  Calculator,
  CheckSquare,
  Star,
  Users,
  FileText,
} from "lucide-react";
import { MarketPrice } from "./MarketPrice";
import { DxTools } from "./DxTools";
import { Community } from "./Community";
import { GovernmentSupport } from "./GovernmentSupport";
import { useAuthStatus } from "../hooks/useAuthStatus";

export type OwnerActiveView =
  | "dashboard"
  | "community"
  | "support"
  | "market-price"
  | "tools";

export const ownerTabPath = (tab: OwnerActiveView) =>
  tab === "dashboard" ? "/owner" : `/owner?tab=${tab}`;

const PAGE_BG = {
  background:
    "radial-gradient(900px 420px at 62% 10%, rgba(16,185,129,0.15), transparent 62%), radial-gradient(700px 360px at 22% 26%, rgba(56,189,248,0.08), transparent 62%), linear-gradient(180deg, #060b14 0%, #0a101b 100%)",
};

const VALID_TABS = new Set<OwnerActiveView>([
  "dashboard",
  "community",
  "support",
  "market-price",
  "tools",
]);

function parseTab(raw: string | null): OwnerActiveView {
  if (raw && VALID_TABS.has(raw as OwnerActiveView)) {
    return raw as OwnerActiveView;
  }
  return "dashboard";
}

export function ExistingOwnerMainPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStatus();
  const [activeView, setActiveView] = useState<OwnerActiveView>(() =>
    parseTab(searchParams.get("tab")),
  );
  const ownerName = user?.name ? `${user.name} 사장님` : "사장님";

  useEffect(() => {
    setActiveView(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const switchView = (view: OwnerActiveView) => {
    setActiveView(view);
    if (view === "dashboard") {
      setSearchParams({});
      return;
    }
    setSearchParams({ tab: view });
  };

  const serviceCards = [
    {
      title: "월간 운영 분석",
      desc: "POS 데이터와 운영 기록으로 성장 지표를 한눈에 확인하세요.",
      icon: LineChart,
      button: "월간 분석 보기",
      view: null as OwnerActiveView | null,
      path: "/ai-analysis?view=existing",
      tint: "rgba(34,197,94,0.2)",
      progressColor: "bg-emerald-400",
    },
    {
      title: "사장님 커뮤니티",
      desc: "업종별 노하우와 운영 고민을 사장님들과 나눠보세요.",
      icon: Users,
      button: "커뮤니티 바로가기",
      view: "community" as OwnerActiveView,
      path: null,
      tint: "rgba(59,130,246,0.2)",
      progressColor: "bg-blue-400",
    },
    {
      title: "지원사업 모음",
      desc: "정부·지자체 지원사업을 한눈에 확인하고 신청하세요.",
      icon: FileText,
      button: "지원사업 보기",
      view: "support" as OwnerActiveView,
      path: null,
      tint: "rgba(168,85,247,0.2)",
      progressColor: "bg-violet-400",
    },
    {
      title: "실시간 식자재 시세",
      desc: "품목 가격 변동과 위험 구간을 빠르게 파악할 수 있습니다.",
      icon: TrendingUp,
      button: "시세 확인하기",
      view: "market-price" as OwnerActiveView,
      path: null,
      tint: "rgba(56,189,248,0.2)",
      progressColor: "bg-sky-400",
    },
    {
      title: "운영 관리 서비스",
      desc: "체크리스트와 운영 도구로 반복 업무를 효율화하세요.",
      icon: Wrench,
      button: "운영 도구 바로가기",
      view: "tools" as OwnerActiveView,
      path: null,
      tint: "rgba(249,115,22,0.2)",
      progressColor: "bg-amber-400",
    },
  ];

  const headerTabs: { id: OwnerActiveView; label: string }[] = [
    { id: "dashboard", label: "분석" },
    { id: "community", label: "커뮤니티" },
    { id: "support", label: "지원사업" },
    { id: "market-price", label: "시세" },
    { id: "tools", label: "운영 관리" },
  ];

  const sidebarBtn = (view: OwnerActiveView, label: string, icon: ReactNode) => (
    <button
      onClick={() => switchView(view)}
      className={`w-full text-left rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2 ${
        activeView === view
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          : "text-zinc-300 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const embeddedView = activeView !== "dashboard";

  return (
    <div className="min-h-screen text-white flex" style={PAGE_BG}>
      <aside className="hidden lg:flex w-[250px] border-r border-white/10 bg-[#0a1220]/88 backdrop-blur-xl flex-col shrink-0">
        <div className="h-[66px] px-5 flex items-center border-b border-white/10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-zinc-100 text-sm">
              소상<span className="text-emerald-400">광장</span>
            </span>
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          <div>{sidebarBtn("dashboard", "대시보드", <Home className="w-4 h-4" />)}</div>

          <div>
            <div className="text-xs text-zinc-500 mb-2 px-1">분석</div>
            <div className="space-y-1">
              <button
                onClick={() => navigate("/ai-analysis?view=existing")}
                className="w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 inline-flex items-center gap-2"
              >
                <LineChart className="w-4 h-4 text-emerald-300" /> 월간 운영 분석
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 mb-2 px-1">정보 · 지원</div>
            <div className="space-y-1">
              {sidebarBtn("community", "사장님 커뮤니티", <Users className="w-4 h-4 text-blue-300" />)}
              {sidebarBtn("support", "지원사업 모음", <FileText className="w-4 h-4 text-violet-300" />)}
              {sidebarBtn("market-price", "실시간 식자재 시세", <TrendingUp className="w-4 h-4 text-sky-300" />)}
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 mb-2 px-1">운영 관리</div>
            {sidebarBtn("tools", "운영 관리 서비스", <Wrench className="w-4 h-4 text-amber-300" />)}
          </div>
        </div>

        <div className="p-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-blue-500/10 p-4">
            <div className="text-sm font-bold text-zinc-100 mb-1">데이터로 성장하는 사장님</div>
            <p className="text-xs text-zinc-300 leading-5">정확한 분석과 관리로 매출 상승을 경험하세요.</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[66px] border-b border-white/10 bg-[#0b1220]/88 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0">
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm overflow-x-auto">
            {headerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchView(tab.id)}
                className={`relative whitespace-nowrap shrink-0 ${
                  activeView === tab.id ? "text-emerald-300 font-semibold" : "text-white/70 hover:text-white"
                }`}
              >
                {tab.label}
                {activeView === tab.id && (
                  <span className="absolute -bottom-[22px] left-0 right-0 h-[2px] bg-emerald-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            <button className="h-9 px-3 rounded-lg border border-white/15 bg-white/5 text-sm text-zinc-200 inline-flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> 알림
            </button>
            <button
              onClick={() => switchView("community")}
              className="h-9 px-3 rounded-lg border border-white/15 bg-white/5 text-sm text-zinc-200 inline-flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" /> 검색
            </button>
            <button
              onClick={() => navigate("/mypage")}
              className="h-9 px-3 rounded-lg border border-white/15 bg-white/5 text-sm text-zinc-100"
            >
              {ownerName}
            </button>
          </div>
        </header>

        {embeddedView && (
          <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6">
            <div className="mb-4">
              <button
                onClick={() => switchView("dashboard")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/15 bg-white/10 hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4" /> 대시보드로 돌아가기
              </button>
            </div>
            {activeView === "community" && <Community />}
            {activeView === "support" && <GovernmentSupport />}
            {activeView === "market-price" && <MarketPrice />}
            {activeView === "tools" && <DxTools />}
          </main>
        )}

        {activeView === "dashboard" && (
          <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-2 text-zinc-100">
              안녕하세요, <span className="text-emerald-300">{ownerName}</span>!
            </h1>
            <p className="text-xl text-zinc-300 mb-8">오늘도 성공적인 하루 되세요.</p>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              {serviceCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-[0_12px_35px_rgba(0,0,0,0.35)]"
                  >
                    <div
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4 text-sm font-bold"
                      style={{ background: card.tint, border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <Icon className="w-4 h-4" /> {card.title}
                    </div>
                    <p className="text-sm text-white/75 leading-6 min-h-[52px]">{card.desc}</p>
                    <div className="h-14 rounded-xl mb-4 border border-white/10 bg-[#0a1220]/80 px-3 py-2">
                      <div className="h-2 rounded-full bg-white/10 mt-3">
                        <div className={`h-full w-[42%] rounded-full ${card.progressColor}`} />
                      </div>
                      <div className="text-right text-[13px] text-emerald-300 font-semibold mt-2">+3%</div>
                    </div>
                    <button
                      onClick={() => {
                        if (card.view) {
                          switchView(card.view);
                          return;
                        }
                        if (card.path) navigate(card.path);
                      }}
                      className="mt-5 w-full h-10 rounded-xl border border-white/15 bg-white/10 text-sm font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      {card.button} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sky-300 text-sm font-bold inline-flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> 실시간 시세 현황
                  </div>
                  <span className="text-xs text-zinc-400">업데이트 10:30</span>
                </div>
                <div className="h-36 rounded-xl border border-white/10 bg-[#0e1828] px-3 py-3 mb-3 relative overflow-hidden">
                  <div className="absolute left-0 right-0 top-8 h-[1px] bg-white/10" />
                  <div className="absolute left-0 right-0 top-16 h-[1px] bg-white/10" />
                  <div className="absolute left-0 right-0 top-24 h-[1px] bg-white/10" />
                  <svg viewBox="0 0 500 120" className="w-full h-full">
                    <path
                      d="M0 70 L55 62 L110 78 L165 72 L220 68 L275 55 L330 64 L385 45 L440 36 L500 58"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-zinc-400">품목 수</div>
                    <div className="text-2xl font-bold text-zinc-100">30개</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-zinc-400">위험 품목</div>
                    <div className="text-2xl font-bold text-rose-300">3개</div>
                  </div>
                </div>
                <button
                  onClick={() => switchView("market-price")}
                  className="mt-4 w-full h-10 rounded-xl border border-white/15 bg-white/10 text-sm font-semibold hover:bg-white/20 transition-all"
                >
                  시세 전체 보기
                </button>
              </div>

              <div className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
                <div className="text-amber-300 text-sm font-bold mb-3 inline-flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> 운영 관리 요약
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "재고 관리", icon: Boxes },
                    { label: "체크리스트", icon: CheckSquare },
                    { label: "업무 일정", icon: Clock3 },
                    { label: "마진 계산", icon: Calculator },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={`${item.label}-${idx}`}
                        className="rounded-xl border border-white/10 bg-[#0e1828] px-3 py-3 text-center"
                      >
                        <Icon className="w-4 h-4 mx-auto mb-2 text-violet-300" />
                        <div className="text-xs text-zinc-200">{item.label}</div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => switchView("tools")}
                  className="mt-4 w-full h-10 rounded-xl border border-white/15 bg-white/10 text-sm font-semibold hover:bg-white/20 transition-all"
                >
                  운영 관리 도구 열기
                </button>
              </div>
            </section>

            <div className="rounded-xl border border-white/10 bg-[#0e1828] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-zinc-300 inline-flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-300 shrink-0" />
                오늘의 인사이트: 전월 대비 매출이 8% 증가했어요! 이런 흐름을 유지해보세요.
              </div>
              <button
                onClick={() => switchView("community")}
                className="h-9 px-4 rounded-lg border border-white/15 bg-white/10 text-sm text-zinc-100 hover:bg-white/20 shrink-0"
              >
                커뮤니티 보기
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
