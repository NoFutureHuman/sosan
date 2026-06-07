import React from "react";
import { BadgeDollarSign, ChevronLeft, Settings2, Sparkles, TrendingUp, Users } from "lucide-react";
import {
  formatRegionAddress,
  RegionAddressInput,
  type RegionAddressValue,
} from "./DetailedStartupQuestionnaire";

type AnalysisMode = "light" | "deep";

type ExistingOwnerEntryViewProps = {
  onBack: () => void;
  onStartAnalysis: () => void;
  expanded: string[];
  onToggleExpanded: (title: string) => void;
  pageBgStyle: React.CSSProperties;
};

export function ExistingOwnerEntryView({
  onBack,
  onStartAnalysis,
  expanded,
  onToggleExpanded,
  pageBgStyle,
}: ExistingOwnerEntryViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12" style={{ ...pageBgStyle, position: "relative" }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(620px 220px at 18% 18%, rgba(52,211,153,0.12), transparent 70%), radial-gradient(580px 240px at 82% 72%, rgba(59,130,246,0.09), transparent 72%)",
        }}
      />
      <div className="w-full max-w-5xl">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium mb-7"
          style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
        >
          <ChevronLeft className="w-4 h-4" /> 이전
        </button>

        <div className="flex justify-center mb-4">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.28)", fontSize: "0.8rem", fontWeight: 700, color: "#6ee7b7" }}
          >
            <Sparkles style={{ width: "14px", height: "14px" }} />
            기존 사장님 전용 시작 화면
          </div>
        </div>

        <h1 className="text-center mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.3rem)", fontWeight: 900, letterSpacing: "-0.04em" }}>
          무엇을 먼저 <span style={{ color: "#86efac" }}>확인해볼까요?</span>
        </h1>
        <p className="text-center mb-8" style={{ fontSize: "1.03rem", color: "rgba(255,255,255,0.45)" }}>
          필요한 기능을 바로 이용하고, 원하는 분석을 이어서 진행할 수 있습니다.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {[
            {
              title: "사장님 커뮤니티",
              desc: "다른 사장님들의 운영 경험, 실패/성공 사례, 업종별 실전 팁을 모아둔 정보 공간입니다.",
              tag: "인사이트 공유",
              tint: "rgba(16,185,129,0.08)",
              iconColor: "#34d399",
              icon: <Users style={{ width: "21px", height: "21px" }} />,
              bgIcon: <Users style={{ width: "82px", height: "82px" }} />,
              details: [
                "운영 노하우와 사례 중심의 게시글을 빠르게 탐색할 수 있습니다.",
                "업종/주제별 질문을 통해 비슷한 상황의 해결 방법을 참고할 수 있습니다.",
              ],
            },
            {
              title: "시장 시세 확인",
              desc: "식자재와 핵심 품목의 가격 흐름을 확인하고, 원가 변동 리스크를 미리 파악하는 기능입니다.",
              tag: "실시간 데이터",
              tint: "rgba(59,130,246,0.08)",
              iconColor: "#60a5fa",
              icon: <TrendingUp style={{ width: "21px", height: "21px" }} />,
              bgIcon: <TrendingUp style={{ width: "82px", height: "82px" }} />,
              details: [
                "품목별 가격 변동과 추세를 확인해 발주 타이밍 판단에 활용할 수 있습니다.",
                "상승 위험 품목을 미리 파악해 원가 관리 전략을 세울 수 있습니다.",
              ],
            },
            {
              title: "서비스 도구",
              desc: "매장 운영을 표준화하고 반복 업무를 줄이기 위한 실무 도구를 모아둔 영역입니다.",
              tag: "운영 효율화",
              tint: "rgba(168,85,247,0.08)",
              iconColor: "#c084fc",
              icon: <Settings2 style={{ width: "21px", height: "21px" }} />,
              bgIcon: <Settings2 style={{ width: "82px", height: "82px" }} />,
              details: [
                "체크리스트, 일정, 기본 운영 지표를 한 곳에서 정리할 수 있습니다.",
                "반복 업무를 단순화해 운영 누락을 줄이고 관리 효율을 높일 수 있습니다.",
              ],
            },
            {
              title: "지원사업 모음",
              desc: "정부/유관기관의 지원사업 정보를 모아 신청 가능 항목을 쉽게 확인하는 안내 기능입니다.",
              tag: "사업 성장 지원",
              tint: "rgba(245,158,11,0.08)",
              iconColor: "#fbbf24",
              icon: <BadgeDollarSign style={{ width: "21px", height: "21px" }} />,
              bgIcon: <BadgeDollarSign style={{ width: "82px", height: "82px" }} />,
              details: [
                "공고 상태와 지원 목적을 빠르게 비교해 우선순위를 정할 수 있습니다.",
                "운영/디지털/자금 등 필요한 분야의 사업을 한눈에 파악할 수 있습니다.",
              ],
            },
          ].map((item) => {
            const isExpanded = expanded.includes(item.title);
            return (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-[2px]"
                style={{ background: item.tint, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 14px 30px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)" }}
              >
                <div className="pointer-events-none absolute -right-3 top-12 opacity-[0.11]" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {item.bgIcon}
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)", color: item.iconColor }}>
                    {item.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.08)" }}>
                    {item.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "8px", letterSpacing: "-0.03em" }}>{item.title}</h3>
                <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, minHeight: "56px" }}>{item.desc}</p>
                <button
                  onClick={() => onToggleExpanded(item.title)}
                  className="mt-3 h-[40px] px-4 rounded-lg transition-all active:scale-[0.99]"
                  style={{ background: "rgba(7,16,33,0.48)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.9)", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}
                >
                  {isExpanded ? "접기" : "자세히 보기"}
                </button>
                {isExpanded && (
                  <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "rgba(7,16,33,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {item.details.map((line) => (
                      <p key={line} style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "4px" }}>
                        - {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl p-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(134,239,172,0.14))", border: "1px solid rgba(134,239,172,0.35)", boxShadow: "0 10px 26px rgba(16,185,129,0.18)" }}>
          <div>
            <div className="text-[1.8rem] font-black leading-tight tracking-tight mb-1">이제 맞춤 분석을 시작해볼까요?</div>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.95rem" }}>사장님의 데이터를 기반으로 최적의 인사이트를 제공합니다.</p>
          </div>
          <button
            onClick={onStartAnalysis}
            className="h-[52px] min-w-[230px] rounded-2xl transition-all active:scale-[0.99] px-6 hover:shadow-[0_8px_28px_rgba(255,255,255,0.25)]"
            style={{ background: "rgba(255,255,255,0.94)", color: "#0f172a", fontSize: "1rem", fontWeight: 800, border: "none", cursor: "pointer" }}
          >
            맞춤 분석 시작하기 →
          </button>
        </div>

        <div className="rounded-2xl p-4 grid sm:grid-cols-3 gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { title: "안전한 데이터 관리", desc: "암호화로 안전하게 보호됩니다.", icon: <Sparkles className="w-4 h-4" /> },
            { title: "실시간 업데이트", desc: "최신 데이터가 즉시 반영됩니다.", icon: <TrendingUp className="w-4 h-4" /> },
            { title: "전문가 지원", desc: "언제든 도움을 받으세요.", icon: <Users className="w-4 h-4" /> },
          ].map((item) => (
            <div key={item.title} className="rounded-xl px-3 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="inline-flex items-center gap-1.5 mb-1.5" style={{ color: "#86efac", fontSize: "0.86rem", fontWeight: 700 }}>
                {item.icon}
                {item.title}
              </div>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ExistingOwnerFlowViewsProps = {
  flow: string;
  analysisMode: "light" | "deep";
  PAGE_BG: React.CSSProperties;
  TopBar: any;
  QuestionStep: any;
  ProgressBar: any;
  EXISTING_CATEGORY_OPTIONS: Array<{ label: string; desc: string }>;
  EXISTING_CATEGORY_VISUALS: Record<string, { icon?: any; tint?: string }>;
  DEEP_CATEGORY_DATA_FIELDS: Record<string, Array<{ key: string; label: string }>>;
  selectedExistingCategories: string[];
  setSelectedExistingCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedDeepCategories: string[];
  setSelectedDeepCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setFlow: (flow: any) => void;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
  setExistingQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  existingQuestionFlow: any[];
  existingQuestionIndex: number;
  ans: (key: string) => string;
  set: (key: string, value: string) => void;
  addrQ2ex: RegionAddressValue;
  setAddrQ2ex: React.Dispatch<React.SetStateAction<RegionAddressValue>>;
  setDeepQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  deepQuestionFlow: any[];
  deepQuestionIndex: number;
  posInputMode: "manual" | "csv";
  setPosInputMode: (mode: "manual" | "csv") => void;
  posCsvReady: boolean;
  posCsvUpload?: {
    fileName: string;
    rowCount: number;
    columns: string[];
  } | null;
  csvError: string;
  posInputError: string;
  posMetrics: Record<string, string>;
  setPosMetrics: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setPosInputError: React.Dispatch<React.SetStateAction<string>>;
  setCsvError: React.Dispatch<React.SetStateAction<string>>;
  handlePosCsvUpload: (file: File) => void;
  onDownloadPosCsvTemplate: () => void;
  validatePosMetrics: (
    metrics: Record<string, string>,
    mode?: "manual" | "csv",
  ) => string | null;
  onDeepPosContinue: () => void;
  onQuestionsComplete?: (mode: "light" | "deep") => void;
};

export function ExistingOwnerFlowViews(props: ExistingOwnerFlowViewsProps) {
  const {
    flow,
    analysisMode,
    PAGE_BG,
    TopBar,
    QuestionStep,
    ProgressBar,
    EXISTING_CATEGORY_OPTIONS,
    EXISTING_CATEGORY_VISUALS,
    DEEP_CATEGORY_DATA_FIELDS,
    selectedExistingCategories,
    setSelectedExistingCategories,
    selectedDeepCategories,
    setSelectedDeepCategories,
    setFlow,
    setAnswers,
    setExistingQuestionIndex,
    existingQuestionFlow,
    existingQuestionIndex,
    ans,
    set,
    addrQ2ex,
    setAddrQ2ex,
    setDeepQuestionIndex,
    deepQuestionFlow,
    deepQuestionIndex,
    posInputMode,
    setPosInputMode,
    csvError,
    posInputError,
    posMetrics,
    setPosMetrics,
    setPosInputError,
    setCsvError,
    handlePosCsvUpload,
    onDownloadPosCsvTemplate,
    validatePosMetrics,
    onDeepPosContinue,
    posCsvReady,
    posCsvUpload,
    onQuestionsComplete,
  } = props;

  if (flow === "existingNotice") return (
    <div style={PAGE_BG}>
      <div className="min-h-screen flex flex-col items-center justify-start pt-20 px-4">
        <div className="w-full max-w-3xl">
          <TopBar onBack={() => setFlow("existingEntry")} />
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-6" style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)", fontSize: "0.8rem", fontWeight: 600, color: "#fb923c" }}>
            <Sparkles style={{ width: "14px", height: "14px" }} />
            기존 사장님 안내
          </div>
          <div className="rounded-2xl p-7 mb-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="mb-4" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.35 }}>
              시작 전에 확인해주세요
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.8 }}>
              이 분석은 AI를 활용한 결과문입니다.
              <br />
              실제 효과가 미비하거나 없을 수 있으니 주의하시길 바랍니다.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setFlow("existingEntry")} className="h-[54px] rounded-2xl transition-all active:scale-[0.99]" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontSize: "0.98rem", fontWeight: 700, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
              돌아가기
            </button>
            <button onClick={() => setFlow("exCategorySelect")} className="h-[54px] rounded-2xl transition-all active:scale-[0.99]" style={{ background: "linear-gradient(135deg,#10b981,#34d399)", color: "white", fontSize: "0.98rem", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(16,185,129,0.4)" }}>
              확인하고 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (flow === "exCategorySelect") {
    const selected = selectedExistingCategories;
    const setSelected = setSelectedExistingCategories;
    return (
      <div style={PAGE_BG}>
        <div className="min-h-screen flex flex-col items-center justify-start pt-20 px-4">
          <div className="w-full max-w-4xl">
            <TopBar onBack={() => setFlow("existingNotice")} />
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", fontSize: "0.8rem", fontWeight: 600, color: "#34d399" }}>
              <Sparkles style={{ width: "14px", height: "14px" }} />
              가벼운 분석 · 카테고리 선택
            </div>
            <h2 className="mb-3" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.25 }}>
              어떤 항목을 분석할까요?
            </h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
              복수 선택 가능하며, 선택한 카테고리의 질문과 솔루션만 결과에 반영됩니다.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {EXISTING_CATEGORY_OPTIONS.map((item) => {
                const isSelected = selected.includes(item.label);
                const visual = EXISTING_CATEGORY_VISUALS[item.label];
                const Icon = visual?.icon ?? Sparkles;
                return (
                  <button
                    key={item.label}
                    onClick={() => setSelected((prev) => (prev.includes(item.label) ? prev.filter((v) => v !== item.label) : [...prev, item.label]))}
                    className="text-left rounded-2xl p-5 transition-all active:scale-[0.98] h-full"
                    style={{ minHeight: "200px", background: isSelected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", border: isSelected ? "1.5px solid #10b981" : "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: visual?.tint ?? "rgba(16,185,129,0.2)" }}>
                      <Icon style={{ width: "20px", height: "20px", color: isSelected ? "#34d399" : "rgba(255,255,255,0.8)" }} />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: isSelected ? "#34d399" : "white" }}>{item.label}</span>
                      <span style={{ fontSize: "0.78rem", color: isSelected ? "#34d399" : "rgba(255,255,255,0.35)" }}>{isSelected ? "선택됨" : "선택"}</span>
                    </div>
                    <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.48)" }}>{item.desc}</p>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setAnswers((prev) => ({ ...prev, selectedCategories: selected }));
                setExistingQuestionIndex(0);
                setFlow("existingQuestions");
              }}
              disabled={selected.length === 0}
              className="w-full h-[56px] rounded-2xl transition-all active:scale-[0.99]"
              style={{
                background: selected.length ? "linear-gradient(135deg,#10b981,#34d399)" : "rgba(255,255,255,0.06)",
                color: selected.length ? "white" : "rgba(255,255,255,0.25)",
                fontSize: "1.02rem",
                fontWeight: 700,
                border: "none",
                cursor: selected.length ? "pointer" : "not-allowed",
                boxShadow: selected.length ? "0 8px 28px rgba(16,185,129,0.4)" : "none",
              }}
            >
              선택한 카테고리로 질문 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (flow === "existingQuestions") {
    const total = existingQuestionFlow.length;
    const index = existingQuestionIndex;
    const current = existingQuestionFlow[existingQuestionIndex];
    const isFirst = index === 0;
    const isLast = index === total - 1;
    if (!current) {
      if (onQuestionsComplete) {
        onQuestionsComplete("light");
      } else {
        setFlow("loading");
      }
      return null;
    }
    const goBack = () => {
      if (isFirst) {
        setFlow("exCategorySelect");
        return;
      }
      setExistingQuestionIndex((prev) => Math.max(0, prev - 1));
    };
    const goNext = () => {
      if (isLast) {
        if (onQuestionsComplete) {
          onQuestionsComplete("light");
          return;
        }
        setFlow("loading");
        return;
      }
      setExistingQuestionIndex((prev) => Math.min(total - 1, prev + 1));
    };
    if (current.type === "address") {
      const isValid = !!addrQ2ex.sido;
      return (
        <div style={PAGE_BG}>
          <div
            style={{
              padding: "32px 20px",
              maxWidth: "840px",
              margin: "0 auto",
            }}
          >
            <TopBar onBack={goBack} />
            <ProgressBar current={index + 1} total={total} />
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-7"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.35)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#34d399",
              }}
            >
              <Sparkles style={{ width: "14px", height: "14px" }} />
              AI 어시스턴트의 질문
            </div>
            <h2
              className="mb-10"
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.2,
              }}
            >
              {current.question}
            </h2>
            <RegionAddressInput address={addrQ2ex} onChange={setAddrQ2ex} />
            <button
              onClick={() => {
                set("region", formatRegionAddress(addrQ2ex));
                goNext();
              }}
              disabled={!isValid}
              className="w-full h-[56px] rounded-2xl transition-all active:scale-[0.99]"
              style={{
                background: isValid
                  ? "linear-gradient(135deg,#10b981,#34d399)"
                  : "rgba(255,255,255,0.06)",
                color: isValid ? "white" : "rgba(255,255,255,0.25)",
                fontSize: "1.02rem",
                fontWeight: 700,
                border: "none",
                cursor: isValid ? "pointer" : "not-allowed",
                boxShadow: isValid ? "0 8px 28px rgba(16,185,129,0.4)" : "none",
              }}
            >
              다음으로
            </button>
          </div>
        </div>
      );
    }
    return (
      <div style={PAGE_BG}>
        <QuestionStep
          step={index + 1}
          total={total}
          question={current.question}
          options={current.options || []}
          selected={ans(current.answerKey || "")}
          onSelect={(value: string) => current.answerKey && set(current.answerKey, value)}
          onBack={goBack}
          onNext={goNext}
        />
      </div>
    );
  }

  return null;
}
