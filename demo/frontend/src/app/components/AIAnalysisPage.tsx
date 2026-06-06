    import { useState, useEffect, useMemo, useRef } from "react";
    import { Link, useSearchParams } from "react-router";
    import type { AiAnalysisResult } from "../utils/openai";
    import {
        Store,
        ChevronLeft,
        Sparkles,
        AlertTriangle,
        TrendingUp,
        Megaphone,
        Users,
        Star,
        BadgeDollarSign,
        Settings2,
    } from "lucide-react";
    import { NewResultReport } from "./NewResultReport";
    import { ExistingResultReport } from "./ExistingResultReport";
    import {
        DetailedStartupQuestionnaire,
        type RegionAddressValue,
    } from "./DetailedStartupQuestionnaire";
    import {
        ExistingOwnerAnalysisModeSelectView,
        ExistingOwnerEntryView,
        ExistingOwnerFlowViews,
    } from "./ExistingOwner";
    import { ExistingOwnerMainPage } from "./ExistingOwnerMainPage";
    import { motion, AnimatePresence } from "framer-motion";
    import { authHeaders } from "../utils/auth";
    import {
        fetchExistingOwnerApiBundle,
        type CommercialContext,
        type SbizStoreData,
        type RoneRentContext,
        type BizinfoContext,
        type KamisMarketData,
    } from "../utils/budongsan";
    import {
        parsePhaseQuestions,
        withLightAllPhaseContext,
        withDeepAllPhaseContext,
        buildFinalUserAnswers,
    } from "../utils/existingOwnerHelpers";
    import {
        type PosMetrics,
        type PosCsvUploadPayload,
        INITIAL_POS_METRICS,
        decodeCsvBinary,
        ingestGenericCsvFile,
        downloadPosCsvTemplate,
        buildDeepPosPayload,
        metricsFromAnswers,
        hasPosCsvData,
        resolveDeepPosSource,
        csvPayloadFromAnswers,
    } from "../utils/posCsvIngest";
    
    /* ─────────────────────────────────────────
       데이터 정의
    ───────────────────────────────────────── */
    const BUSINESS_TYPES = [
        "음식점 (한식/양식/중식 등)",
        "카페 (음료/디저트 등)",
        "제과점/베이커리",
        "소매점 (편의점/의류 등)",
        "서비스업 (미용/피트니스 등)",
        "기타 업종",
    ];
    
    const INDUSTRY_OPTIONS = [
        {
            id: "restaurant",
            label: "음식점 (한식/양식/중식 등)",
            subOptions: ["한식", "중식", "일식", "양식", "분식", "기타 음식점"],
        },
        {
            id: "cafe",
            label: "카페 (음료/디저트 등)",
            subOptions: ["테이크아웃", "음료", "디저트", "대형", "기타 카페"],
        },
        {
            id: "dessert",
            label: "제과점/베이커리",
            subOptions: [
                "개인 빵집",
                "프랜차이즈 베이커리",
                "수제 디저트",
                "샌드위치/샐러드",
                "기타 제과점",
            ],
        },
        {
            id: "retail",
            label: "소매점 (편의점/의류 등)",
            subOptions: [
                "편의점/마트",
                "의류/잡화",
                "식음료/농수산물",
                "화장품/뷰티",
                "기타 소매점",
            ],
        },
        {
            id: "service",
            label: "서비스업 (미용/피트니스 등)",
            subOptions: [
                "미용/헤어/네일",
                "피트니스/요가",
                "세탁/수선",
                "학원/교육",
                "기타 서비스업",
            ],
        },
        {
            id: "other",
            label: "기타 업종",
            subOptions: ["숙박업", "여가/오락", "부동산업", "기타"],
        },
    ];
    
    const CURRENT_CHALLENGES = [
        "매출 정체",
        "마케팅/홍보",
        "인건비/재료비 관리",
        "배달/플랫폼 수수료",
        "직원 관리 문제",
        "경쟁 심화",
    ];

    const OPERATION_PERIOD_OPTIONS = [
        "6개월 미만",
        "6개월~1년",
        "1년~3년",
        "3년~5년",
        "5년 이상",
    ];

    const SALES_TREND_OPTIONS = ["증가", "유지", "감소"];

    const OPERATION_BURDEN_OPTIONS = [
        "인건비/재료비 부담",
        "고객 유입·마케팅",
        "임대료·고정비",
        "배달 플랫폼 수수료",
        "인력 관리",
        "경쟁 심화",
    ];
    
    const EXISTING_CATEGORY_OPTIONS = [
        { label: "매출 성과", desc: "매출 흐름과 성장 모멘텀을 집중 진단합니다." },
        {
            label: "마케팅 역량",
            desc: "유입 채널, 홍보 효율, 전환 가능성을 분석합니다.",
        },
        { label: "단골 확보", desc: "재방문율과 충성 고객 유지 전략을 점검합니다." },
        { label: "평판 관리", desc: "리뷰 대응과 고객 신뢰 관리 수준을 확인합니다." },
        { label: "가격 경쟁력", desc: "가격대 적합성과 객단가 경쟁력을 확인합니다." },
        {
            label: "운영 효율",
            desc: "인력/좌석/피크 대응 등 운영 효율을 진단합니다.",
        },
    ];
    
    type AnalysisMode = "light" | "deep";
    
    const DEEP_CATEGORY_DATA_FIELDS: Record<
        string,
        Array<{ key: keyof PosMetrics; label: string }>
    > = {
        "매출 성과": [
            { key: "monthlyRevenue", label: "월 매출(원)" },
            { key: "monthlyOrders", label: "월 주문건수" },
            { key: "averageTicket", label: "객단가(원)" },
            { key: "peakSalesShare", label: "피크시간 매출 비중(%)" },
            { key: "dineInShare", label: "매장 비중(%)" },
            { key: "deliveryShare", label: "배달 비중(%)" },
            { key: "takeoutShare", label: "포장 비중(%)" },
            { key: "topMenuShare", label: "상위메뉴 매출 비중(%)" },
        ],
        "마케팅 역량": [
            { key: "adBudget", label: "월 광고비(원)" },
            { key: "conversionRate", label: "유입 대비 전환율(%)" },
        ],
        "단골 확보": [{ key: "repeatCustomerRate", label: "재방문 고객 비중(%)" }],
        "평판 관리": [
            { key: "reviewAverageScore", label: "평균 리뷰 평점" },
            { key: "negativeReviewRatio", label: "부정 리뷰 비중(%)" },
        ],
        "가격 경쟁력": [
            { key: "competitorPriceGap", label: "경쟁점 대비 가격 차이(%)" },
            { key: "bundleOrderRatio", label: "세트/번들 주문 비중(%)" },
        ],
        "운영 효율": [
            { key: "laborCost", label: "월 인건비(원)" },
            { key: "tableTurnoverRate", label: "평균 테이블 회전율(일)" },
        ],
    };
    
    const DEEP_CATEGORY_DUPLICATE_QUESTION_KEYS: Record<string, string[]> = {
        "매출 성과": [
            "revenue",
            "sales",
            "revenueTrend",
            "peak",
            "averageOrderTrend",
        ],
        "마케팅 역량": ["marketing", "adEfficiency"],
        "단골 확보": ["repeat", "repeatCycle", "revisitReasonClarity"],
        "평판 관리": ["ratingLevel", "reviewResponseSpeed", "complaintResolution"],
        "가격 경쟁력": [
            "priceSatisfaction",
            "competitorPricePosition",
            "bundleStrategy",
        ],
        "운영 효율": ["workers", "peakTimeWork"],
    };
    
    const EXISTING_CATEGORY_VISUALS: Record<
        string,
        { icon: React.ComponentType<{ style?: React.CSSProperties }>; tint: string }
    > = {
        "매출 성과": { icon: TrendingUp, tint: "rgba(16,185,129,0.22)" },
        "마케팅 역량": { icon: Megaphone, tint: "rgba(59,130,246,0.22)" },
        "단골 확보": { icon: Users, tint: "rgba(168,85,247,0.22)" },
        "평판 관리": { icon: Star, tint: "rgba(245,158,11,0.22)" },
        "가격 경쟁력": { icon: BadgeDollarSign, tint: "rgba(14,165,233,0.22)" },
        "운영 효율": { icon: Settings2, tint: "rgba(244,114,182,0.22)" },
    };
    
    const INITIAL_REGION_ADDRESS: RegionAddressValue = {
        sido: "",
        sigungu: "",
    };
    
    /* ─────────────────────────────────────────
       스타일 헬퍼
    ───────────────────────────────────────── */
    const PAGE_BG: React.CSSProperties = {
        minHeight: "100vh",
        background: "#141720",
        color: "white",
        fontFamily: "'Noto Sans KR', sans-serif",
    };
    
    /* ─────────────────────────────────────────
       공통 헤더
    ───────────────────────────────────────── */
    function TopBar({ onBack, label }: { onBack?: () => void; label?: string }) {
        return (
            <div className="flex items-center justify-between mb-6">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 transition-all"
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "0.88rem",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
                        }
                    >
                        <ChevronLeft style={{ width: "16px", height: "16px" }} /> 이전으로
                    </button>
                ) : (
                    <div />
                )}
                {label && (
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.25)" }}>
              {label}
            </span>
                )}
            </div>
        );
    }
    
    /* ─────────────────────────────────────────
       진행 바
    ───────────────────────────────────────── */
    function ProgressBar({ current, total }: { current: number; total: number }) {
        return (
            <div className="mb-10">
                <div className="flex items-center justify-between mb-2">
                    <div
                        className="h-1.5 rounded-full flex-1 mr-4 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(current / total) * 100}%`,
                                background: "linear-gradient(90deg,#10b981,#34d399)",
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: "0.8rem",
                            color: "rgba(255,255,255,0.35)",
                            whiteSpace: "nowrap",
                        }}
                    >
              {current} / {total}
            </span>
                </div>
            </div>
        );
    }
    
    /* ─────────────────────────────────────────
       선택지 버튼
    ───────────────────────────────────────── */
    function ChoiceButton({
                              label,
                              selected,
                              onClick,
                          }: {
        label: string;
        selected: boolean;
        onClick: () => void;
    }) {
        return (
            <button
                onClick={onClick}
                className="w-full text-left transition-all active:scale-[0.98]"
                style={{
                    padding: "18px 22px",
                    borderRadius: "14px",
                    border: selected
                        ? "1.5px solid #10b981"
                        : "1px solid rgba(255,255,255,0.1)",
                    background: selected
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(255,255,255,0.04)",
                    color: selected ? "#34d399" : "rgba(255,255,255,0.65)",
                    fontSize: "0.97rem",
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    boxShadow: selected ? "0 0 0 1px rgba(16,185,129,0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                    if (!selected) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!selected) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    }
                }}
            >
                {label}
            </button>
        );
    }
    
    /* ─────────────────────────────────────────
       설문 래퍼
    ───────────────────────────────────────── */
    function QuestionStep({
                              step,
                              total,
                              question,
                              options,
                              selected,
                              onSelect,
                              onBack,
                              onNext,
                          }: {
        step: number;
        total: number;
        question: string;
        options: string[];
        selected: string;
        onSelect: (v: string) => void;
        onBack: () => void;
        onNext: () => void;
    }) {
        const isBizType = question.includes("업종");
        const [openAccordion, setOpenAccordion] = useState<string>("");
        return (
            <div
                style={{
                    ...PAGE_BG,
                    padding: "32px 20px",
                    maxWidth: "840px",
                    margin: "0 auto",
                }}
            >
                <TopBar onBack={onBack} />
                <ProgressBar current={step} total={total} />
    
    
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
                    {question}
                </h2>
    
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                    {isBizType
                        ? INDUSTRY_OPTIONS.map((option) => {
                            const isOpen = openAccordion === option.id;
                            const isSelected =
                                selected === option.label ||
                                (option.subOptions &&
                                    option.subOptions.some((sub) => selected.includes(sub)));
    
                            return (
                                <div key={option.id} className="flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            if (option.subOptions) {
                                                if (isOpen) {
                                                    setOpenAccordion("");
                                                } else {
                                                    setOpenAccordion(option.id);
                                                    onSelect("");
                                                }
                                            } else {
                                                onSelect(option.label);
                                                setOpenAccordion("");
                                            }
                                        }}
                                        className="w-full text-left transition-all active:scale-[0.98]"
                                        style={{
                                            padding: "18px 22px",
                                            borderRadius: "14px",
                                            border:
                                                isSelected || isOpen
                                                    ? "1.5px solid #10b981"
                                                    : "1px solid rgba(255,255,255,0.1)",
                                            background:
                                                isSelected || isOpen
                                                    ? "rgba(16,185,129,0.12)"
                                                    : "rgba(255,255,255,0.04)",
                                            color:
                                                isSelected || isOpen
                                                    ? "#34d399"
                                                    : "rgba(255,255,255,0.65)",
                                            fontSize: "0.97rem",
                                            fontWeight: isSelected || isOpen ? 600 : 400,
                                        }}
                                    >
                                        {option.label}
                                    </button>
    
                                    <AnimatePresence>
                                        {isOpen && option.subOptions && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: -5 }}
                                                animate={{ height: "auto", opacity: 1, marginTop: 0 }}
                                                exit={{ height: 0, opacity: 0, marginTop: -5 }}
                                                className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2 overflow-hidden"
                                            >
                                                {option.subOptions.map((sub) => (
                                                    <button
                                                        key={sub}
                                                        onClick={() => onSelect(sub)}
                                                        className="py-2.5 px-3 rounded-xl text-[0.85rem] transition-all"
                                                        style={{
                                                            border:
                                                                selected === sub
                                                                    ? "1px solid #34d399"
                                                                    : "1px solid rgba(255,255,255,0.1)",
                                                            background:
                                                                selected === sub ? "#34d399" : "transparent",
                                                            color:
                                                                selected === sub
                                                                    ? "#141720"
                                                                    : "rgba(255,255,255,0.5)",
                                                            fontWeight: selected === sub ? 700 : 400,
                                                        }}
                                                    >
                                                        {sub}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                        : options.map((opt) => (
                            <ChoiceButton
                                key={opt}
                                label={opt}
                                selected={selected === opt}
                                onClick={() => onSelect(opt)}
                            />
                        ))}
                </div>
    
                <button
                    onClick={onNext}
                    disabled={!selected}
                    className="w-full h-[56px] rounded-2xl transition-all active:scale-[0.99]"
                    style={{
                        background: selected
                            ? "linear-gradient(135deg,#10b981,#34d399)"
                            : "rgba(255,255,255,0.06)",
                        color: selected ? "white" : "rgba(255,255,255,0.25)",
                        fontSize: "1.02rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: selected ? "pointer" : "not-allowed",
                        boxShadow: selected ? "0 8px 28px rgba(16,185,129,0.4)" : "none",
                    }}
                >
                    다음으로
                </button>
            </div>
        );
    }
    
    /* ─────────────────────────────────────────
       주소 입력 스텝 (Daum Postcode API)
    ───────────────────────────────────────── */
    interface AddressValue {
        zonecode: string;
        addr: string;
        detail: string;
    }
    
    function AddressStep({
                             step,
                             total,
                             onBack,
                             onNext,
                             address,
                             onAddressChange,
                         }: {
        step: number;
        total: number;
        onBack: () => void;
        onNext: () => void;
        address: AddressValue;
        onAddressChange: (v: AddressValue) => void;
    }) {
        useEffect(() => {
            if ((window as any).daum?.Postcode) return;
            if (document.getElementById("daum-postcode-script")) return;
            const script = document.createElement("script");
            script.id = "daum-postcode-script";
            script.src =
                "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
            document.head.appendChild(script);
        }, []);
    
        const openPostcode = () => {
            if (!(window as any).daum?.Postcode) return;
            new (window as any).daum.Postcode({
                oncomplete: (data: any) => {
                    onAddressChange({
                        zonecode: data.zonecode,
                        addr: data.roadAddress || data.jibunAddress,
                        detail: "",
                    });
                },
            }).open();
        };
    
        const isValid = !!address.addr;
    
        const baseInput: React.CSSProperties = {
            width: "100%",
            height: "52px",
            padding: "0 16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.95rem",
            outline: "none",
            cursor: "default",
            transition: "border-color 0.2s, box-shadow 0.2s",
        };
    
        return (
            <div
                style={{
                    ...PAGE_BG,
                    padding: "32px 20px",
                    maxWidth: "840px",
                    margin: "0 auto",
                }}
            >
                <TopBar onBack={onBack} />
                <ProgressBar current={step} total={total} />
    
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
                    현재 매장이 위치한 지역은 어디인가요?
                </h2>
    
                <div className="space-y-3 mb-10">
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={address.zonecode}
                            placeholder="우편번호"
                            style={{ ...baseInput, width: "160px", flexShrink: 0 }}
                        />
                        <button
                            onClick={openPostcode}
                            style={{
                                height: "52px",
                                padding: "0 22px",
                                borderRadius: "12px",
                                background: "rgba(16,185,129,0.15)",
                                border: "1px solid rgba(16,185,129,0.35)",
                                color: "#34d399",
                                fontSize: "0.92rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "rgba(16,185,129,0.28)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "rgba(16,185,129,0.15)")
                            }
                        >
                            주소 검색
                        </button>
                    </div>
    
                    <input
                        readOnly
                        value={address.addr}
                        placeholder="주소 검색 버튼을 눌러 주소를 입력해 주세요"
                        style={baseInput}
                    />
    
                    <input
                        readOnly={!address.addr}
                        value={address.detail}
                        onChange={(e) =>
                            onAddressChange({ ...address, detail: e.target.value })
                        }
                        placeholder={
                            address.addr
                                ? "상세주소를 입력하세요 (동, 호수 등)"
                                : "주소 검색 후 입력 가능합니다"
                        }
                        style={{
                            ...baseInput,
                            cursor: address.addr ? "text" : "default",
                            color: address.addr ? "white" : "rgba(255,255,255,0.25)",
                            border: address.addr
                                ? "1px solid rgba(255,255,255,0.18)"
                                : "1px solid rgba(255,255,255,0.07)",
                            background: address.addr
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.02)",
                        }}
                        onFocus={(e) => {
                            if (address.addr) {
                                e.currentTarget.style.borderColor = "rgba(16,185,129,0.55)";
                                e.currentTarget.style.boxShadow =
                                    "0 0 0 3px rgba(16,185,129,0.1)";
                            }
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = address.addr
                                ? "rgba(255,255,255,0.18)"
                                : "rgba(255,255,255,0.07)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>
    
                <button
                    onClick={onNext}
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
        );
    }
    
    /* ─────────────────────────────────────────
       로딩 화면
    ───────────────────────────────────────── */
    function LoadingScreen({
        title = "AI가 최적의 솔루션을 분석 중입니다",
        description = "외부 데이터를 기반으로 맞춤형 리포트를 생성하고 있어요",
        errorMessage = "",
    }: {
        title?: string;
        description?: string;
        errorMessage?: string;
    }) {
        const [dots, setDots] = useState(0);

        useEffect(() => {
            const interval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
            return () => clearInterval(interval);
        }, []);

        return (
            <div
                className="flex flex-col items-center justify-center px-6"
                style={{ ...PAGE_BG, minHeight: "100vh" }}
            >
                <div
                    className="mb-8 flex items-center justify-center"
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "rgba(16,185,129,0.18)",
                        border: "1px solid rgba(16,185,129,0.35)",
                    }}
                >
                    <Sparkles
                        style={{ width: "38px", height: "38px", color: "#34d399" }}
                        className="animate-pulse"
                    />
                </div>
                <h2
                    style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        marginBottom: "12px",
                        textAlign: "center",
                    }}
                >
                    {title}
                </h2>
                <div
                    className="flex items-center gap-2"
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.92rem" }}
                >
                    <div
                        className="w-4 h-4 rounded-full border-2 animate-spin"
                        style={{
                            borderColor: "rgba(16,185,129,0.5)",
                            borderTopColor: "#34d399",
                        }}
                    />
                    {description}
                    {"...".slice(0, dots)}
                </div>
                {errorMessage && (
                    <p
                        className="mt-6 text-center max-w-md"
                        style={{ color: "#fda4af", fontSize: "0.88rem", lineHeight: 1.6 }}
                    >
                        {errorMessage}
                    </p>
                )}
            </div>
        );
    }
    
    /* ─────────────────────────────────────────
       원형 게이지 (SVG)
    ───────────────────────────────────────── */
    
    const API_BASE =
        (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ||
        "http://localhost:8081";
    const MAX_DYNAMIC_ROUNDS = 2;
    const MAX_DEEP_FOLLOWUP_ROUNDS = 50;

    /** AI가 동적으로 생성하는 추가 질문 (신생 창업자) */
    type GeneratedQuestion = {
        key: string;
        category: string;
        question: string;
        options: string[];
    };

    const DEFAULT_NEW_DYNAMIC_QUESTIONS: GeneratedQuestion[] = [
        {
            key: "hasExperience",
            category: "창업 경험",
            question: "관련 업종 경험이 있으신가요?",
            options: [
                "경험 없음",
                "아르바이트 경험 있음",
                "유사업종 근무 경험 있음",
                "직접 운영해본 적 있음",
                "아직 미정이에요",
            ],
        },
        {
            key: "targetCustomer",
            category: "목표 고객층",
            question: "주요 목표 고객층은 어떻게 생각하고 계신가요?",
            options: ["10~20대", "20~30대 직장인", "가족 단위", "시니어층", "아직 미정이에요"],
        },
    ];

    type FlowState =
        | "analysisModeSelect"
        | "typeSelect"
        | "warningNew"
        | "evaluating"
        | "dynamicQ"
        | "existingEntry"
        | "existingNotice"
        | "exCategorySelect"
        | "existingQuestions"
        | "deepPosInput"
        | "deepCategorySelect"
        | "deepQuestions"
        | "q0new"
        | "detailedNew"
        | "q1"
        | "q2"
        | "q3"
        | "q4"
        | "q1ex"
        | "q2ex"
        | "q3ex"
        | "q4ex"
        | "q5ex"
        | "q6ex"
        | "q7ex"
        | "q8ex"
        | "q9ex"
        | "q10ex"
        | "q11ex"
        | "q12ex"
        | "q13ex"
        | "q14ex"
        | "q15ex"
        | "q16ex"
        | "q17ex"
        | "loading"
        | "dynamicQuestion"
        | "existingFollowupQuestions"
        | "result"
        | "ownerMain";
    
    type ChoiceFlowState = Exclude<
        FlowState,
        | "analysisModeSelect"
        | "typeSelect"
        | "warningNew"
        | "evaluating"
        | "dynamicQ"
        | "existingEntry"
        | "existingNotice"
        | "exCategorySelect"
        | "existingQuestions"
        | "deepPosInput"
        | "deepCategorySelect"
        | "deepQuestions"
        | "q0new"
        | "detailedNew"
        | "q2ex"
        | "loading"
        | "dynamicQuestion"
        | "existingFollowupQuestions"
        | "result"
        | "ownerMain"
    >;

    type FollowupQuestion = {
        question: string;
        reason: string;
        priority: "높음" | "중간" | "낮음";
        category?: string;
        options?: string[];
    };
    
    type ExistingQuestion = {
        question: string;
        options?: string[];
        answerKey?: string;
        type: "choice" | "address";
        category?: string;
    };
    
    const EXISTING_COMMON_QUESTIONS: ExistingQuestion[] = [
        {
            type: "address",
            question: "운영중인 매장의 지역은 어디인가요?",
            answerKey: "region",
        },
        {
            type: "choice",
            question: "운영 중인 업종은 무엇인가요?",
            options: BUSINESS_TYPES,
            answerKey: "bizType",
        },
        {
            type: "choice",
            question: "매장을 운영한 기간은 얼마나 되셨나요?",
            options: OPERATION_PERIOD_OPTIONS,
            answerKey: "operationPeriod",
        },
        {
            type: "choice",
            question: "최근 3개월간의 매출 추세는 어떤가요?",
            options: SALES_TREND_OPTIONS,
            answerKey: "revenueTrend",
        },
        {
            type: "choice",
            question: "현재 매장 운영에서 가장 부담되는 부분은 무엇인가요?",
            options: OPERATION_BURDEN_OPTIONS,
            answerKey: "challenge",
        },
    ];
    
    const EXISTING_CATEGORY_QUESTION_MAP: Record<string, ExistingQuestion[]> = {
        "매출 성과": [],
        "마케팅 역량": [],
        "단골 확보": [],
        "평판 관리": [],
        "가격 경쟁력": [],
        "운영 효율": [],
    };
    
    const DEEP_CATEGORY_QUESTION_MAP: Record<string, ExistingQuestion[]> = {
        "매출 성과": [],
        "마케팅 역량": [],
        "단골 확보": [],
        "평판 관리": [],
        "가격 경쟁력": [],
        "운영 효율": [],
    };
    
    export function AIAnalysisPage() {
        const [searchParams] = useSearchParams();
        const [flow, setFlow] = useState<FlowState>("typeSelect");
        const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("light");
        const [userType, setUserType] = useState<"new" | "existing">("new");
        const [existingEntryExpanded, setExistingEntryExpanded] = useState<string[]>([]);

        useEffect(() => {
            const view = searchParams.get("view");
            if (view === "ownerMain") {
                setUserType("existing");
                setAnalysisMode("light");
                setFlow("ownerMain");
            } else if (view === "existing") {
                setUserType("existing");
                setAnalysisMode("light");
                setFlow("existingEntry");
            }
        }, [searchParams]);
    
        // 상태 및 헬퍼 함수
        const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
        const answersRef = useRef(answers);
        useEffect(() => {
            answersRef.current = answers;
        }, [answers]);
        const set = (key: string, val: string | string[]) => setAnswers((prev) => ({ ...prev, [key]: val }));
    
        // ★ 다중 질문을 위한 새로운 상태 2개 추가!
        const [aiQIndex, setAiQIndex] = useState(0);
        const [aiAnswers, setAiAnswers] = useState<string[]>([]);
    
        const [addrQ2ex, setAddrQ2ex] = useState<RegionAddressValue>(INITIAL_REGION_ADDRESS);
        const [selectedExistingCategories, setSelectedExistingCategories] = useState<string[]>([]);
        const [selectedDeepCategories, setSelectedDeepCategories] = useState<string[]>([]);
        const [existingQuestionIndex, setExistingQuestionIndex] = useState(0);
        const [deepQuestionIndex, setDeepQuestionIndex] = useState(0);
        const [posInputMode, setPosInputMode] = useState<"manual" | "csv">("csv");
        const [posMetrics, setPosMetrics] = useState<PosMetrics>(INITIAL_POS_METRICS);
        const [posCsvReady, setPosCsvReady] = useState(false);
        const [posCsvUpload, setPosCsvUpload] = useState<PosCsvUploadPayload | null>(null);
        const [posInputError, setPosInputError] = useState("");
        const [csvError, setCsvError] = useState("");
    
        const [aiResult, setAiResult] = useState<any>(null);
        const [aiError, setAiError] = useState(false);
        const [loadingPurpose, setLoadingPurpose] = useState<"followup" | "solution">("solution");
        const [loadingErrorMessage, setLoadingErrorMessage] = useState("");
        const [followupQuestions, setFollowupQuestions] = useState<FollowupQuestion[]>([]);
        const [followupChoices, setFollowupChoices] = useState<Record<string, string>>({});
        const [followupEtcInputs, setFollowupEtcInputs] = useState<Record<string, string>>({});
        const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);
        const [followupCategoryPageRound, setFollowupCategoryPageRound] = useState(1);
        const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
        const [commercialCtx, setCommercialCtx] = useState<CommercialContext | null>(null);
        const [sbizData, setSbizData] = useState<SbizStoreData | null>(null);
        const [roneData, setRoneData] = useState<RoneRentContext | null>(null);
        const [bizinfoData, setBizinfoData] = useState<BizinfoContext | null>(null);
        const [kamisData, setKamisData] = useState<KamisMarketData | null>(null);
        const [newAiResult, setNewAiResult] = useState<AiAnalysisResult | null>(null);
        const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
        const [dynamicQIndex, setDynamicQIndex] = useState(0);
        const [dynamicQRound, setDynamicQRound] = useState(0);
    
        const deepDataFields = useMemo(() => {
            const map = new Map<
                keyof PosMetrics,
                { key: keyof PosMetrics; label: string }
            >();
            selectedDeepCategories.forEach((category) => {
                (DEEP_CATEGORY_DATA_FIELDS[category] ?? []).forEach((field) => {
                    map.set(field.key, field);
                });
            });
            return Array.from(map.values());
        }, [selectedDeepCategories]);
    
        const existingQuestionFlow = useMemo(() => {
            const selected = selectedExistingCategories.flatMap(
                (category) => EXISTING_CATEGORY_QUESTION_MAP[category] ?? [],
            );
    
            const seenKeys = new Set<string>();
            const deduped = selected.filter((q) => {
                if (!q.answerKey) return true;
                if (seenKeys.has(q.answerKey)) return false;
                seenKeys.add(q.answerKey);
                return true;
            });
    
            return [...EXISTING_COMMON_QUESTIONS, ...deduped];
        }, [selectedExistingCategories]);
    
        const deepQuestionFlow = useMemo(() => {
            const selected = selectedDeepCategories.flatMap(
                (category) => DEEP_CATEGORY_QUESTION_MAP[category] ?? [],
            );
    
            const seenKeys = new Set<string>();
            const deduped = selected.filter((q) => {
                if (!q.answerKey) return true;
                if (seenKeys.has(q.answerKey)) return false;
                seenKeys.add(q.answerKey);
                return true;
            });
    
            const excludedKeys = new Set(
                selectedDeepCategories.flatMap(
                    (category) => DEEP_CATEGORY_DUPLICATE_QUESTION_KEYS[category] ?? [],
                ),
            );
    
            return [...EXISTING_COMMON_QUESTIONS, ...deduped].filter(
                (q) => !q.answerKey || !excludedKeys.has(q.answerKey),
            );
        }, [selectedDeepCategories]);
    
        const buildAnalysisPayload = (
            inputAnswers: Record<string, string | string[]>,
            options: {
                includeFollowup?: boolean;
                forceReport?: boolean;
                followupAnswers?: Record<string, string>;
            } = {},
        ) => {
            const selectedCategories =
                analysisMode === "deep"
                    ? selectedDeepCategories
                    : selectedExistingCategories;

            let userAnswers: unknown;
            if (options.forceReport) {
                const structured = buildFinalUserAnswers(inputAnswers);
                userAnswers =
                    Array.isArray(structured) && structured.length > 0
                        ? structured
                        : inputAnswers.aiUserAnswers;
            } else if (options.includeFollowup) {
                userAnswers = inputAnswers.aiUserAnswers;
            }

            const apiFacts =
                commercialCtx || sbizData || roneData || bizinfoData || kamisData
                    ? {
                          commercial: commercialCtx,
                          sbiz: sbizData,
                          rone: roneData,
                          bizinfo: bizinfoData,
                          kamis: kamisData,
                      }
                    : undefined;

            return {
                userType: userType === "new" ? "NEW" : "EXISTING",
                businessType: (inputAnswers.bizType ||
                    inputAnswers.bizSubType ||
                    inputAnswers.businessType ||
                    "") as string,
                region: (inputAnswers.region || "") as string,
                financialScale: (inputAnswers.budget ||
                    inputAnswers.revenue ||
                    inputAnswers.revenueTrend ||
                    "") as string,
                operationScale: (inputAnswers.storeSize ||
                    inputAnswers.workers ||
                    inputAnswers.operationPeriod ||
                    "") as string,
                primaryConcern: (inputAnswers.challenge || inputAnswers.opType || "") as string,
                selectedCategories,
                analysisMode,
                forceReport: options.forceReport ?? false,
                followupPhase:
                    inputAnswers.followupPhase ?? inputAnswers.lightFollowupPhase,
                followupAnswers: options.followupAnswers,
                apiFacts,
                ...inputAnswers,
                userAnswers,
            };
        };

        const mapDynamicQuestionsToFollowup = (questions: any[]): FollowupQuestion[] =>
            (questions ?? []).map((q, idx) => ({
                question: q.title || q.question || "추가 확인이 필요합니다",
                reason: q.category || "맞춤 분석",
                priority: (idx === 0 ? "높음" : idx === 1 ? "중간" : "낮음") as
                    | "높음"
                    | "중간"
                    | "낮음",
                category: q.category,
                options: (q.options ?? []).filter((opt: string) => opt?.trim?.()),
            }));

        const parseLightPhaseQuestions = (
            data: any,
            answers: Record<string, string | string[]>,
            priorQuestions: FollowupQuestion[] = [],
        ) => parsePhaseQuestions(data, answers, priorQuestions);

        const parseDeepPhaseQuestions = (
            data: any,
            answers: Record<string, string | string[]>,
            priorQuestions: FollowupQuestion[] = [],
        ) => parsePhaseQuestions(data, answers, priorQuestions);

        const parseAnalysisResponse = async (response: Response) => {
            const text = await response.text();
            if (!text.trim()) {
                throw new Error("서버 응답이 비어 있습니다.");
            }
            try {
                return JSON.parse(text);
            } catch {
                throw new Error("서버 JSON 파싱 실패");
            }
        };

        const callAnalysisApi = async (
            inputAnswers: Record<string, string | string[]>,
            options: {
                includeFollowup?: boolean;
                forceReport?: boolean;
                followupAnswers?: Record<string, string>;
            } = {},
        ) => {
            const payload = buildAnalysisPayload(inputAnswers, options);
            let response: Response;
            try {
                response = await fetch(`${API_BASE}/api/analysis/run`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(payload),
                });
            } catch {
                throw new Error(
                    "백엔드 서버에 연결할 수 없습니다. 프로젝트 루트에서 gradlew bootRun으로 서버(8081)를 실행해주세요.",
                );
            }
            const data = await parseAnalysisResponse(response);
            if (!response.ok) {
                throw new Error(
                    (data as { message?: string })?.message ||
                        `API 통신 에러: ${response.status}`,
                );
            }
            if (data?.type === "error") {
                throw new Error(data.message || "AI 분석 서버 오류");
            }
            return data;
        };

        const runExistingAnalysisPipeline = async (
            inputAnswers: Record<string, string | string[]>,
            mode: "light" | "deep",
            opts?: { forceReport?: boolean; followupAnswers?: Record<string, string> },
        ) => {
            let pipelineAnswers: Record<string, string | string[]> = {
                ...inputAnswers,
                analysisMode: mode,
            };
            if (mode === "deep") {
                const selectedCategories = selectedDeepCategories;
                const source = resolveDeepPosSource(
                    posCsvReady,
                    posCsvUpload,
                    posInputMode,
                    inputAnswers,
                );
                const csvPayload =
                    posCsvUpload ?? csvPayloadFromAnswers(inputAnswers);
                const metrics =
                    source === "csv"
                        ? posMetrics
                        : metricsFromAnswers(
                              inputAnswers,
                              selectedCategories,
                              DEEP_CATEGORY_DATA_FIELDS,
                              posMetrics,
                          );
                pipelineAnswers = buildDeepPosPayload(
                    inputAnswers,
                    selectedCategories,
                    metrics,
                    source,
                    DEEP_CATEGORY_DATA_FIELDS,
                    source === "csv" ? csvPayload : null,
                );
            }
            const data = await callAnalysisApi(pipelineAnswers, {
                forceReport: opts?.forceReport ?? false,
                followupAnswers: opts?.followupAnswers,
            });
            setAiResult(data);
            return data;
        };

        const hasExistingAiResult = (result: any) => {
            if (result?.type !== "result") return false;
            if (result.existingSolution?.summary?.trim()) return true;
            if (
                Array.isArray(result.categoryInsights) &&
                result.categoryInsights.some(
                    (item: { summary?: string; actions?: string[] }) =>
                        item.summary?.trim() ||
                        (Array.isArray(item.actions) && item.actions.length > 0),
                )
            ) {
                return true;
            }
            return (
                Array.isArray(result.improvements) &&
                result.improvements.some((item: { solution?: string }) =>
                    item.solution?.trim(),
                )
            );
        };

        const ensureExistingFinalReport = async (
            inputAnswers: Record<string, string | string[]>,
            mode: "light" | "deep",
            inputFollowupAnswers?: Record<string, string>,
            currentResult?: any,
        ) => {
            if (hasExistingAiResult(currentResult)) return currentResult;
            return runExistingAnalysisPipeline(inputAnswers, mode, {
                forceReport: true,
                followupAnswers: inputFollowupAnswers,
            });
        };

        const showBatchPhaseFollowup = (
            phase: number,
            nextQuestions: FollowupQuestion[],
        ) => {
            setFollowupCategoryPageRound(phase);
            setFollowupQuestions(nextQuestions);
            setFollowupChoices({});
            setFollowupEtcInputs({});
            setFollowupAnswers({});
            setFlow("existingFollowupQuestions");
        };

        const fetchLightPhaseQuestions = async (
            baseAnswers: Record<string, string | string[]>,
            phase: 1 | 2,
            priorQuestions: FollowupQuestion[] = [],
        ) => {
            const payload = withLightAllPhaseContext(baseAnswers, phase);
            const result = await runExistingAnalysisPipeline(payload, "light");
            const questions = parseLightPhaseQuestions(result, payload, priorQuestions);
            return { result, questions, payload };
        };

        const fetchDeepPhaseQuestions = async (
            baseAnswers: Record<string, string | string[]>,
            phase: number,
            priorQuestions: FollowupQuestion[] = [],
        ) => {
            const payload = withDeepAllPhaseContext(baseAnswers, phase);
            const result = await runExistingAnalysisPipeline(payload, "deep");
            const questions = parseDeepPhaseQuestions(result, payload, priorQuestions);
            return { result, questions, payload };
        };

        const loadExistingOwnerApis = async (
            regionText: string,
            bizTypeText: string,
        ) => {
            if (!regionText.trim()) return;
            const bundle = await fetchExistingOwnerApiBundle(regionText, bizTypeText);
            setCommercialCtx(bundle.commercial);
            setSbizData(bundle.sbiz);
            setRoneData(bundle.rone);
            setBizinfoData(bundle.bizinfo);
            setKamisData(bundle.kamis);
        };

        useEffect(() => {
            if (flow !== "result" || userType !== "existing") return;
            const regionText = String(answers.region ?? "").trim();
            const bizTypeText = String(answers.bizType ?? "").trim();
            if (!regionText || kamisData) return;
            void loadExistingOwnerApis(regionText, bizTypeText);
        }, [flow, userType, answers.region, answers.bizType, kamisData]);

        /* 신생 창업자: 고정 설문 후 충분성 판단 → 추가 질문 또는 최종 분석 (7과 동일) */
        useEffect(() => {
            if (flow !== "evaluating") return;
            if (dynamicQRound >= MAX_DYNAMIC_ROUNDS) {
                setFlow("loading");
                return;
            }

            let cancelled = false;

            const showDynamicQuestions = (questions: GeneratedQuestion[]) => {
                const usable =
                    questions.length > 0
                        ? questions
                        : dynamicQRound === 0
                          ? DEFAULT_NEW_DYNAMIC_QUESTIONS
                          : [];
                if (usable.length === 0) {
                    setFlow("loading");
                    return;
                }
                setGeneratedQuestions(usable);
                setDynamicQIndex(0);
                setFlow("dynamicQ");
            };

            fetch(`${API_BASE}/api/analysis/evaluate`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    ...answersRef.current,
                    _userType: "new",
                    _forceGenerate: dynamicQRound === 0 ? "true" : "false",
                }),
            })
                .then(async (r) => {
                    const data = await r.json().catch(() => ({}));
                    if (cancelled) return;
                    if (!r.ok) {
                        console.warn("[evaluate] HTTP", r.status, data);
                        if (dynamicQRound === 0) {
                            showDynamicQuestions(DEFAULT_NEW_DYNAMIC_QUESTIONS);
                        } else {
                            setFlow("loading");
                        }
                        return;
                    }
                    if (
                        data.status === "needs_more" &&
                        Array.isArray(data.questions)
                    ) {
                        showDynamicQuestions(data.questions as GeneratedQuestion[]);
                        return;
                    }
                    setFlow("loading");
                })
                .catch((err) => {
                    console.warn("[evaluate] 요청 실패", err);
                    if (!cancelled && dynamicQRound === 0) {
                        showDynamicQuestions(DEFAULT_NEW_DYNAMIC_QUESTIONS);
                    } else if (!cancelled) {
                        setFlow("loading");
                    }
                });

            return () => {
                cancelled = true;
            };
        }, [flow, dynamicQRound]);

        const generateExistingFollowupQuestions = async (mode: "light" | "deep") => {
            const selectedCategories =
                mode === "deep" ? selectedDeepCategories : selectedExistingCategories;
            setLoadingPurpose("followup");
            setLoadingErrorMessage("");
            setFlow("loading");

            try {
                setAiError(false);
                const baseAnswers = {
                    ...answers,
                    selectedCategories,
                    analysisMode: mode,
                };
                setAnswers(baseAnswers);
                const regionText = String(baseAnswers.region ?? "").trim();
                const bizTypeText = String(baseAnswers.bizType ?? "").trim();
                void loadExistingOwnerApis(regionText, bizTypeText);

                if (selectedCategories.length === 0) {
                    throw new Error("선택된 카테고리가 없습니다.");
                }

                setFollowupCategoryPageRound(1);
                const { questions, result } =
                    mode === "light"
                        ? await fetchLightPhaseQuestions(baseAnswers, 1)
                        : await fetchDeepPhaseQuestions(baseAnswers, 1);

                if (questions.length > 0) {
                    showBatchPhaseFollowup(1, questions);
                    return;
                }

                if (mode === "light") {
                    const phase2 = await fetchLightPhaseQuestions(baseAnswers, 2);
                    if (phase2.questions.length > 0) {
                        showBatchPhaseFollowup(2, phase2.questions);
                        return;
                    }
                }

                const finalResult = await ensureExistingFinalReport(
                    baseAnswers,
                    mode,
                    undefined,
                    result,
                );
                setAiResult(finalResult);
                setFlow("result");
            } catch (e: unknown) {
                setAiError(true);
                setLoadingErrorMessage(
                    e instanceof Error
                        ? e.message
                        : "AI 추가 질문 생성 중 오류가 발생했습니다.",
                );
                setFlow("loading");
            }
        };

        /* 신생 창업자: LangGraph /new + 외부 API 병렬 로딩 (sosan-main 7과 동일) */
        useEffect(() => {
            if (flow !== "loading") return;
            if (userType !== "new") return;

            let cancelled = false;
            const minDelay = new Promise<void>((res) => setTimeout(res, 2800));

            const regionText = String(answers.region ?? "").trim();
            const bizTypeText = String(answers.bizType ?? "").trim();

            const bundleCall =
                regionText && bizTypeText
                    ? fetchExistingOwnerApiBundle(regionText, bizTypeText)
                          .then((bundle) => {
                              if (cancelled) return;
                              setCommercialCtx(bundle.commercial);
                              setSbizData(bundle.sbiz);
                              setRoneData(bundle.rone);
                              setBizinfoData(bundle.bizinfo);
                              setKamisData(bundle.kamis);
                          })
                          .catch(() => {})
                    : Promise.resolve();

            const apiCall = fetch(`${API_BASE}/api/analysis/new`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ ...answersRef.current, _userType: "new" }),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (cancelled) return;
                    if (data.report) {
                        try {
                            setNewAiResult(JSON.parse(data.report) as AiAnalysisResult);
                            setAiError(false);
                        } catch {
                            setAiError(true);
                            setNewAiResult(null);
                        }
                    } else if (data.error) {
                        setAiError(true);
                        setNewAiResult(null);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setAiError(true);
                        setNewAiResult(null);
                    }
                });

            const smesCall = fetch(
                `${API_BASE}/api/support/programs?bizType=${encodeURIComponent(bizTypeText)}`,
            )
                .then((r) => r.json())
                .then((data) => {
                    if (
                        !cancelled &&
                        Array.isArray(data.programs) &&
                        data.programs.length > 0
                    ) {
                        setBizinfoData({
                            items: data.programs,
                            total: data.total ?? data.programs.length,
                        });
                    }
                })
                .catch(() => {});

            Promise.all([minDelay, apiCall, bundleCall, smesCall]).then(() => {
                if (!cancelled) setFlow("result");
            });

            return () => {
                cancelled = true;
            };
        }, [flow, userType, answers]);
    
        const ans = (key: string): string => (answers[key] as string) || "";
    
        const resetAnswers = () => {
            setAnswers({});
            setAddrQ2ex(INITIAL_REGION_ADDRESS);
            setSelectedExistingCategories([]);
            setSelectedDeepCategories([]);
            setExistingQuestionIndex(0);
            setDeepQuestionIndex(0);
            setPosInputMode("csv");
            setPosMetrics(INITIAL_POS_METRICS);
            setPosCsvReady(false);
            setPosCsvUpload(null);
            setPosInputError("");
            setCsvError("");
            setAiResult(null);
            setNewAiResult(null);
            setAiError(false);
            setGeneratedQuestions([]);
            setDynamicQIndex(0);
            setDynamicQRound(0);
            setLoadingPurpose("solution");
            setLoadingErrorMessage("");
            setFollowupQuestions([]);
            setFollowupChoices({});
            setFollowupEtcInputs({});
            setFollowupCategoryPageRound(1);
            setFollowupAnswers({});
            setCommercialCtx(null);
            setSbizData(null);
            setRoneData(null);
            setBizinfoData(null);
            setKamisData(null);
            setIsSubmittingFollowup(false);
            // ★ 다중 질문 상태 초기화
            setAiQIndex(0);
            setAiAnswers([]);
        };
    
        const startFlow = (type: "new" | "existing") => {
            resetAnswers();
            setUserType(type);
            if (type === "new") {
                setFlow("warningNew");
                return;
            }
            setFlow("existingEntry");
        };
    
        const parsePercent = (v: string) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : NaN;
        };
    
        const validatePosMetrics = (
            metrics: PosMetrics,
            mode: "manual" | "csv" = "manual",
        ): string | null => {
            if (hasPosCsvData(posCsvReady, posCsvUpload, answers)) {
                return null;
            }
            if (mode === "csv") {
                return "CSV 파일을 업로드한 뒤 다음으로 진행해주세요.";
            }
            const requiredKeys = deepDataFields.map((field) => field.key);
            if (requiredKeys.length === 0)
                return "카테고리 선택 후 관련 데이터를 입력해주세요.";
            const hasEmpty = requiredKeys.some((k) => !metrics[k]?.toString().trim());
            if (hasEmpty) return "집중분석을 위해 POS 항목을 모두 입력해주세요.";

            const hasSalesCategory = selectedDeepCategories.includes("매출 성과");
            if (hasSalesCategory) {
                const dineIn = parsePercent(metrics.dineInShare);
                const delivery = parsePercent(metrics.deliveryShare);
                const takeout = parsePercent(metrics.takeoutShare);
                if ([dineIn, delivery, takeout].some((n) => Number.isNaN(n))) {
                    return "채널별 매출 비중은 숫자로 입력해주세요.";
                }
                if (Math.round(dineIn + delivery + takeout) !== 100) {
                    return "채널별 매출 비중 합계는 100이 되어야 합니다.";
                }
            }
            return null;
        };

        const handlePosCsvUpload = (file: File) => {
            const reader = new FileReader();
            reader.onload = () => {
                const buffer = reader.result;
                if (!(buffer instanceof ArrayBuffer)) {
                    setCsvError("CSV 파일을 읽지 못했습니다.");
                    setPosCsvReady(false);
                    return;
                }
                const text = decodeCsvBinary(buffer);
                const ingested = ingestGenericCsvFile(text, file.name || "upload.csv");
                if ("error" in ingested) {
                    setCsvError(ingested.error);
                    setPosCsvReady(false);
                    setPosCsvUpload(null);
                    return;
                }
                setPosCsvUpload(ingested);
                setPosCsvReady(true);
                setPosInputMode("csv");
                setCsvError("");
                setPosInputError("");
            };
            reader.onerror = () => {
                setCsvError("CSV 파일을 읽지 못했습니다.");
                setPosCsvUpload(null);
                setPosCsvReady(false);
            };
            reader.readAsArrayBuffer(file);
        };

        const handlePosInputModeChange = (mode: "manual" | "csv") => {
            setPosInputMode(mode);
            setPosInputError("");
        };
    
        if (flow === "existingEntry") {
            return (
                <ExistingOwnerEntryView
                    onBack={() => setFlow("typeSelect")}
                    onStartAnalysis={() => setFlow("analysisModeSelect")}
                    expanded={existingEntryExpanded}
                    onToggleExpanded={(title) =>
                        setExistingEntryExpanded((prev) =>
                            prev.includes(title)
                                ? prev.filter((v) => v !== title)
                                : [...prev, title],
                        )
                    }
                    pageBgStyle={PAGE_BG}
                />
            );
        }
    
        if (flow === "analysisModeSelect") {
            return (
                <ExistingOwnerAnalysisModeSelectView
                    onBack={() =>
                        setFlow(userType === "existing" ? "existingEntry" : "typeSelect")
                    }
                    onSelectMode={(mode) => {
                        setAnalysisMode(mode);
                        setAnswers((prev) => ({ ...prev, analysisMode: mode }));
                        setFlow("existingNotice");
                    }}
                    pageBgStyle={PAGE_BG}
                />
            );
        }
    
        /* ── 충분성 판단 중 (신생) ── */
        if (flow === "evaluating")
            return (
                <div
                    className="flex flex-col items-center justify-center"
                    style={{
                        background: "#141720",
                        minHeight: "100vh",
                        color: "white",
                    }}
                >
                    <div
                        className="mb-6 flex items-center justify-center"
                        style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            background: "rgba(16,185,129,0.15)",
                            border: "1px solid rgba(16,185,129,0.3)",
                        }}
                    >
                        <Sparkles
                            style={{ width: "32px", height: "32px", color: "#34d399" }}
                            className="animate-pulse"
                        />
                    </div>
                    <h2
                        style={{
                            fontSize: "1.4rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: "10px",
                        }}
                    >
                        AI가 입력 정보를 검토하고 있어요
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                        분석에 필요한 정보가 충분한지 확인 중이에요
                    </p>
                </div>
            );

        /* ── AI 동적 추가 질문 (신생) ── */
        if (flow === "dynamicQ") {
            const currentQ = generatedQuestions[dynamicQIndex];
            if (!currentQ) {
                setFlow("evaluating");
                return null;
            }
            return (
                <div style={{ background: "#141720", minHeight: "100vh" }}>
                    <div style={{ textAlign: "center", paddingTop: "20px" }}>
                        <span
                            style={{
                                display: "inline-block",
                                padding: "4px 14px",
                                borderRadius: "999px",
                                background: "rgba(16,185,129,0.12)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#34d399",
                            }}
                        >
                            AI 추가 질문 {dynamicQRound + 1} / {MAX_DYNAMIC_ROUNDS} 라운드
                        </span>
                    </div>
                    <QuestionStep
                        step={dynamicQIndex + 1}
                        total={generatedQuestions.length}
                        question={currentQ.question}
                        options={currentQ.options}
                        selected={(answers[currentQ.key] as string) || ""}
                        onSelect={(val) =>
                            setAnswers((prev) => ({ ...prev, [currentQ.key]: val }))
                        }
                        onBack={() => {
                            if (dynamicQIndex === 0) {
                                setFlow("detailedNew");
                            } else {
                                setDynamicQIndex((i) => i - 1);
                            }
                        }}
                        onNext={() => {
                            if (dynamicQIndex < generatedQuestions.length - 1) {
                                setDynamicQIndex((i) => i + 1);
                            } else {
                                setDynamicQRound((r) => r + 1);
                                setFlow("evaluating");
                            }
                        }}
                    />
                </div>
            );
        }

        /* ── 로딩 ── */
        if (flow === "loading")
            return (
                <LoadingScreen
                    title={
                        loadingPurpose === "followup"
                            ? "AI가 추가 질문을 생성중입니다"
                            : "AI가 최적의 솔루션을 분석 중입니다"
                    }
                    description={
                        loadingPurpose === "followup"
                            ? "고정 질문과 API 데이터를 기반으로 맞춤 추가 질문을 만들고 있어요"
                            : userType === "existing" && analysisMode === "deep"
                              ? "POS 데이터와 답변을 바탕으로 리포트를 생성하고 있어요"
                              : "입력하신 데이터를 기반으로 맞춤형 리포트를 생성하고 있어요"
                    }
                    errorMessage={loadingErrorMessage}
                />
            );
    
        /* ── 결과 ── */
        const handleReset = () => {
            resetAnswers();
            setUserType("new");
            setAnalysisMode("light");
            setFlow("typeSelect");
        };
        const handleExistingMain = () => {
            resetAnswers();
            setUserType("existing");
            setAnalysisMode("light");
            setFlow("existingEntry");
        };
        const handleSwitchToExisting = () => startFlow("existing");
        if (flow === "ownerMain") {
            return <ExistingOwnerMainPage />;
        }
        if (flow === "result" && userType === "existing")
            return (
                <ExistingResultReport
                    answers={answers}
                    aiResult={aiResult}
                    aiError={aiError}
                    commercialCtx={commercialCtx}
                    sbizData={sbizData}
                    kamisData={kamisData}
                    onReset={handleExistingMain}
                    onGoMain={() => setFlow("ownerMain")}
                    selectedCategories={
                        analysisMode === "deep"
                            ? selectedDeepCategories
                            : selectedExistingCategories
                    }
                />
            );
        if (flow === "result")
            return (
                <NewResultReport
                    answers={answers}
                    aiResult={newAiResult}
                    aiError={aiError}
                    sbizData={sbizData}
                    commercialCtx={commercialCtx}
                    roneData={roneData}
                    bizinfoData={bizinfoData}
                    onReset={handleReset}
                    onSwitchToExisting={handleSwitchToExisting}
                />
            );
    
        /* ── 설문 스텝 (신생 창업자) ── */
        if (flow === "q0new")
            return (
                <div style={PAGE_BG}>
                    <div className="min-h-screen flex flex-col items-center justify-start pt-24 px-4">
                        <div className="w-full max-w-xl">
                            <div className="flex items-center mb-12">
                                <button
                                    onClick={() => setFlow("typeSelect")}
                                    className="flex items-center gap-1 text-sm font-medium"
                                    style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                    <ChevronLeft className="w-4 h-4" /> 이전
                                </button>
                            </div>
    
    
                            <div className="flex items-center gap-3 mb-10">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: "linear-gradient(135deg,#f97316,#fb923c)",
                                        boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
                                    }}
                                >
                                    <Store className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                    <span className="text-xl font-black text-white leading-tight tracking-tight">
                      소상광장
                    </span>
                                    <span
                                        className="text-xs font-semibold"
                                        style={{ color: "rgba(255,255,255,0.4)" }}
                                    >
                      AI 맞춤 분석
                    </span>
                                </div>
                            </div>
    
                            <h2 className="text-2xl font-black text-white mb-10">
                                구체적인 창업 계획이 있으신가요?
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        label: "예",
                                        value: "예",
                                        desc: "업종·위치 등 어느 정도 구체적인 계획이 있어요",
                                    },
                                    {
                                        label: "아니오",
                                        value: "아니오",
                                        desc: "아직 막연하게 창업을 고려 중이에요",
                                    },
                                ].map((opt) => {
                                    const selected = ans("hasPlan") === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => set("hasPlan", opt.value)}
                                            className="flex flex-col items-start p-6 rounded-2xl border-2 text-left transition-all"
                                            style={{
                                                background: selected
                                                    ? "rgba(16,185,129,0.15)"
                                                    : "rgba(255,255,255,0.04)",
                                                borderColor: selected
                                                    ? "#10b981"
                                                    : "rgba(255,255,255,0.08)",
                                            }}
                                        >
                        <span className="text-2xl font-black text-white mb-2">
                          {opt.label}
                        </span>
                                            <span
                                                className="text-xs leading-relaxed"
                                                style={{ color: "rgba(255,255,255,0.45)" }}
                                            >
                          {opt.desc}
                        </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                disabled={!ans("hasPlan")}
                                onClick={() =>
                                    setFlow(ans("hasPlan") === "예" ? "detailedNew" : "q1")
                                }
                                className="mt-8 w-full h-14 rounded-2xl font-bold text-white transition-all"
                                style={{
                                    background: ans("hasPlan")
                                        ? "linear-gradient(135deg,#10b981,#34d399)"
                                        : "rgba(255,255,255,0.08)",
                                    color: ans("hasPlan") ? "white" : "rgba(255,255,255,0.3)",
                                    cursor: ans("hasPlan") ? "pointer" : "not-allowed",
                                }}
                            >
                                다음
                            </button>
                        </div>
                    </div>
                </div>
            );
    
        if (flow === "warningNew")
            return (
                <div style={PAGE_BG}>
                    <div className="min-h-screen flex flex-col items-center justify-start pt-24 px-4">
                        <div className="w-full max-w-xl">
                            <div className="flex items-center mb-12">
                                <button
                                    onClick={() => setFlow("typeSelect")}
                                    className="flex items-center gap-1 text-sm font-medium"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "rgba(255,255,255,0.4)",
                                    }}
                                >
                                    <ChevronLeft className="w-4 h-4" /> 이전
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mb-10">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background:
                                            "linear-gradient(135deg,#f97316,#fb923c)",
                                        boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
                                    }}
                                >
                                    <Store className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-white leading-tight tracking-tight">
                                        소상광장
                                    </span>
                                    <span
                                        className="text-xs font-semibold"
                                        style={{ color: "rgba(255,255,255,0.4)" }}
                                    >
                                        AI 맞춤 분석
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <AlertTriangle
                                    className="w-5 h-5 flex-shrink-0"
                                    style={{ color: "#f97316" }}
                                />
                                <h2 className="text-xl font-black text-white">
                                    잠깐! 창업 전 꼭 체크해 보세요.
                                </h2>
                            </div>
                            <div
                                className="rounded-2xl p-6 mb-8"
                                style={{
                                    background: "rgba(249,115,22,0.08)",
                                    border: "1px solid rgba(249,115,22,0.25)",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "0.97rem",
                                        color: "rgba(255,255,255,0.75)",
                                        lineHeight: 1.85,
                                    }}
                                >
                                    소상공인 창업 후,{" "}
                                    <span style={{ color: "#fb923c", fontWeight: 700 }}>
                                        초기 자금이 바닥나는 3~6개월 구간
                                    </span>
                                    과{" "}
                                    <span style={{ color: "#fb923c", fontWeight: 700 }}>
                                        매출이 고정비를 못 넘기는 1~3년 구간
                                    </span>
                                    은 수익보다 지출이 많을 수 있습니다.
                                    <br />
                                    <br />
                                    이{" "}
                                    <span style={{ color: "#fb923c", fontWeight: 700 }}>
                                        &apos;데스밸리&apos;
                                    </span>{" "}
                                    구간을 버틸 마음의 준비와 여유 운영 자금이
                                    계획되어 있으신가요?
                                </p>
                            </div>
                            <button
                                onClick={() => setFlow("detailedNew")}
                                className="w-full h-14 rounded-2xl font-bold text-white transition-all"
                                style={{
                                    background: "linear-gradient(135deg,#10b981,#34d399)",
                                    boxShadow: "0 8px 28px rgba(16,185,129,0.4)",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                확인했습니다
                            </button>
                        </div>
                    </div>
                </div>
            );

        if (flow === "detailedNew")
            return (
                <DetailedStartupQuestionnaire
                    onBack={() => setFlow("warningNew")}
                    onComplete={(detailedAnswers) => {
                        setAnswers((prev) => {
                            const merged = { ...prev, ...detailedAnswers };
                            answersRef.current = merged;
                            return merged;
                        });
                        setFlow("evaluating");
                    }}
                />
            );
    
        if (flow === "existingFollowupQuestions") {
            const batchFollowupCategories =
                analysisMode === "deep" ? selectedDeepCategories : selectedExistingCategories;
            const allAnswered =
                followupQuestions.length > 0 &&
                followupQuestions.every((_, idx) => {
                    const key = `followup_${idx + 1}`;
                    const options = (followupQuestions[idx]?.options ?? []).filter(
                        (opt) => opt && opt.trim().length > 0,
                    );
                    if (options.length === 0) return false;
                    const choice = followupChoices[key];
                    if (!choice) return false;
                    if (choice !== "기타(직접입력)") return true;
                    return (followupEtcInputs[key] || "").trim().length > 0;
                });

            return (
                <div style={PAGE_BG}>
                    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
                        <TopBar
                            onBack={() =>
                                setFlow(
                                    analysisMode === "deep" ? "deepQuestions" : "existingQuestions",
                                )
                            }
                            label="추가 확인 질문"
                        />
                        <div
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full mb-5"
                            style={{
                                background: "rgba(16,185,129,0.15)",
                                border: "1px solid rgba(16,185,129,0.35)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#34d399",
                            }}
                        >
                            <Sparkles style={{ width: "14px", height: "14px" }} />
                            AI가 정밀 솔루션을 위해 생성한 추가 질문
                        </div>
                        <h2
                            style={{
                                fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
                                fontWeight: 800,
                                letterSpacing: "-0.03em",
                                marginBottom: "10px",
                            }}
                        >
                            선택 카테고리 기반 추가 확인이 필요합니다
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
                            아래 질문은 고정질문 응답과 API 데이터 기반으로 생성되었습니다. (
                            {analysisMode === "deep" ? "집중분석" : "가벼운 분석"} ·{" "}
                            {followupCategoryPageRound}차 추가질문 · 질문{" "}
                            {followupQuestions.length}개 · 선택 카테고리{" "}
                            {batchFollowupCategories.length}개)
                        </p>
                        <div className="space-y-4 mb-8">
                            {followupQuestions.map((item, idx) => {
                                const key = `followup_${idx + 1}`;
                                const options = (item.options ?? []).filter(
                                    (opt) => opt && opt.trim().length > 0,
                                );
                                return (
                                    <div
                                        key={key}
                                        className="rounded-2xl p-4"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {item.category && (
                                                <span
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#a7f3d0",
                                                        fontWeight: 700,
                                                        padding: "2px 8px",
                                                        borderRadius: "999px",
                                                        border: "1px solid rgba(16,185,129,0.35)",
                                                        background: "rgba(16,185,129,0.12)",
                                                    }}
                                                >
                                                    {item.category}
                                                </span>
                                            )}
                                            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>
                                                우선순위 {item.priority}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                                                {item.reason}
                                            </span>
                                        </div>
                                        <p style={{ fontWeight: 700, marginBottom: "10px" }}>
                                            Q{idx + 1}. {item.question}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                            {options.map((option) => {
                                                const selected = followupChoices[key] === option;
                                                return (
                                                    <button
                                                        key={`${key}_${option}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setFollowupChoices((prev) => ({
                                                                ...prev,
                                                                [key]: option,
                                                            }))
                                                        }
                                                        className="text-left px-3 py-2 rounded-xl transition-all"
                                                        style={{
                                                            border: selected
                                                                ? "1.5px solid #10b981"
                                                                : "1px solid rgba(255,255,255,0.12)",
                                                            background: selected
                                                                ? "rgba(16,185,129,0.14)"
                                                                : "rgba(255,255,255,0.03)",
                                                            color: selected
                                                                ? "#34d399"
                                                                : "rgba(255,255,255,0.75)",
                                                            fontSize: "0.88rem",
                                                            fontWeight: selected ? 700 : 500,
                                                        }}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {followupChoices[key] === "기타(직접입력)" && (
                                            <textarea
                                                value={followupEtcInputs[key] ?? ""}
                                                onChange={(e) =>
                                                    setFollowupEtcInputs((prev) => ({
                                                        ...prev,
                                                        [key]: e.target.value,
                                                    }))
                                                }
                                                placeholder="기타 답변을 입력해주세요"
                                                style={{
                                                    width: "100%",
                                                    minHeight: "84px",
                                                    borderRadius: "12px",
                                                    padding: "10px 12px",
                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                    background: "rgba(0,0,0,0.2)",
                                                    color: "white",
                                                    outline: "none",
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            disabled={!allAnswered || isSubmittingFollowup}
                            onClick={async () => {
                                if (isSubmittingFollowup) return;
                                setIsSubmittingFollowup(true);
                                try {
                                    setAiError(false);
                                    const existingFollowupCount = Object.keys(answers).filter(
                                        (key) => key.startsWith("followup_question_"),
                                    ).length;
                                    const resolvedFollowup = Object.fromEntries(
                                        followupQuestions.map((_, idx) => {
                                            const uiKey = `followup_${idx + 1}`;
                                            const storeKey = `followup_${existingFollowupCount + idx + 1}`;
                                            const choice = followupChoices[uiKey] || "";
                                            if (choice === "기타(직접입력)") {
                                                const etc = (followupEtcInputs[uiKey] || "").trim();
                                                return [storeKey, `기타: ${etc}`];
                                            }
                                            return [storeKey, choice.trim()];
                                        }),
                                    );
                                    const followupQuestionMap = Object.fromEntries(
                                        followupQuestions.flatMap((item, idx) => {
                                            const num = existingFollowupCount + idx + 1;
                                            const entries: [string, string][] = [
                                                [`followup_question_${num}`, item.question],
                                            ];
                                            if (item.category?.trim()) {
                                                entries.push([
                                                    `followup_category_${num}`,
                                                    item.category.trim(),
                                                ]);
                                            }
                                            return entries;
                                        }),
                                    );
                                    const trimmedFollowup = Object.fromEntries(
                                        Object.entries(resolvedFollowup).map(([k, v]) => [
                                            k,
                                            v.trim(),
                                        ]),
                                    );
                                    setFollowupAnswers(trimmedFollowup);
                                    const merged = {
                                        ...answers,
                                        ...followupQuestionMap,
                                        ...trimmedFollowup,
                                    };
                                    setAnswers(merged);

                                    if (analysisMode === "light") {
                                        if (followupCategoryPageRound === 1) {
                                            setLoadingPurpose("followup");
                                            const phase2 = await fetchLightPhaseQuestions(
                                                merged,
                                                2,
                                                followupQuestions,
                                            );
                                            if (phase2.questions.length > 0) {
                                                showBatchPhaseFollowup(2, phase2.questions);
                                                return;
                                            }
                                        }
                                    } else {
                                        const nextPhase = followupCategoryPageRound + 1;
                                        if (nextPhase <= MAX_DEEP_FOLLOWUP_ROUNDS) {
                                            setLoadingPurpose("followup");
                                            const next = await fetchDeepPhaseQuestions(
                                                merged,
                                                nextPhase,
                                                followupQuestions,
                                            );
                                            if (next.questions.length > 0) {
                                                showBatchPhaseFollowup(nextPhase, next.questions);
                                                return;
                                            }
                                        }
                                    }

                                    setLoadingPurpose("solution");
                                    setFlow("loading");
                                    const finalResult = await ensureExistingFinalReport(
                                        merged,
                                        analysisMode,
                                        trimmedFollowup,
                                    );
                                    setAiResult(finalResult);
                                    setFlow("result");
                                } catch (e: unknown) {
                                    setAiError(true);
                                    setLoadingErrorMessage(
                                        e instanceof Error
                                            ? e.message
                                            : "AI 솔루션 생성 중 오류가 발생했습니다.",
                                    );
                                } finally {
                                    setIsSubmittingFollowup(false);
                                }
                            }}
                            className="w-full h-[56px] rounded-2xl transition-all active:scale-[0.99]"
                            style={{
                                background:
                                    allAnswered && !isSubmittingFollowup
                                        ? "linear-gradient(135deg,#10b981,#34d399)"
                                        : "rgba(255,255,255,0.06)",
                                color:
                                    allAnswered && !isSubmittingFollowup
                                        ? "white"
                                        : "rgba(255,255,255,0.25)",
                                fontSize: "1.02rem",
                                fontWeight: 700,
                                border: "none",
                                cursor:
                                    allAnswered && !isSubmittingFollowup
                                        ? "pointer"
                                        : "not-allowed",
                                boxShadow:
                                    allAnswered && !isSubmittingFollowup
                                        ? "0 8px 28px rgba(16,185,129,0.4)"
                                        : "none",
                            }}
                        >
                            {isSubmittingFollowup
                                ? "처리 중입니다..."
                                : analysisMode === "light"
                                  ? followupCategoryPageRound === 1
                                      ? "답변 제출 · 2차 질문 생성"
                                      : "답변 제출 · 솔루션 생성"
                                  : "답변 제출 · 다음 질문 생성"}
                        </button>
                    </div>
                </div>
            );
        }

        const existingOwnerFlowView = ExistingOwnerFlowViews({
            flow,
            analysisMode,
            PAGE_BG,
            TopBar,
            QuestionStep,
            ProgressBar,
            EXISTING_CATEGORY_OPTIONS,
            EXISTING_CATEGORY_VISUALS,
            DEEP_CATEGORY_DATA_FIELDS: DEEP_CATEGORY_DATA_FIELDS as any,
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
            setPosInputMode: handlePosInputModeChange,
            posCsvReady,
            posCsvUpload,
            csvError,
            posInputError,
            posMetrics: posMetrics as any,
            setPosMetrics: setPosMetrics as any,
            setPosInputError,
            setCsvError,
            handlePosCsvUpload,
            onDownloadPosCsvTemplate: () => downloadPosCsvTemplate(deepDataFields),
            validatePosMetrics: validatePosMetrics as any,
            onDeepPosContinue: () => {
                const source = resolveDeepPosSource(
                    posCsvReady,
                    posCsvUpload,
                    posInputMode,
                    answers,
                );
                const err = validatePosMetrics(posMetrics, source);
                if (err) {
                    setPosInputError(err);
                    return;
                }
                const csvPayload =
                    posCsvUpload ?? csvPayloadFromAnswers(answers);
                const payload = buildDeepPosPayload(
                    answers,
                    selectedDeepCategories,
                    posMetrics,
                    source,
                    DEEP_CATEGORY_DATA_FIELDS,
                    source === "csv" ? csvPayload : null,
                );
                setAnswers({
                    ...payload,
                    selectedCategories: selectedDeepCategories,
                });
                setPosInputError("");
                setFlow("deepQuestions");
            },
            onQuestionsComplete: generateExistingFollowupQuestions,
        });
        if (existingOwnerFlowView) return existingOwnerFlowView;
    
        // ★ 다중 질문 UI 렌더링 블록
        if (flow === "dynamicQuestion" && aiResult?.type === "dynamic_question") {
            const questions = aiResult.questions || [];
            const currentQ = questions[aiQIndex];
    
            if (!currentQ) return null; // 방어 코드
    
            return (
                <QuestionStep
                    step={aiQIndex + 1}
                    total={questions.length}
                    question={currentQ.title}
                    options={currentQ.options}
                    selected={aiAnswers[aiQIndex] || ""}
                    onSelect={(val) => {
                        const newAnswers = [...aiAnswers];
                        newAnswers[aiQIndex] = val;
                        setAiAnswers(newAnswers);
                    }}
                    onBack={() => {
                        if (aiQIndex > 0) {
                            setAiQIndex(aiQIndex - 1);
                        } else {
                            setFlow("typeSelect");
                        }
                    }}
                    onNext={() => {
                        if (aiQIndex < questions.length - 1) {
                            setAiQIndex(aiQIndex + 1); // 다음 질문으로
                        } else {
                            // 모든 질문 완료 시
                            set("aiUserAnswers", aiAnswers);
                            setFlow("loading"); // 백엔드로 전송
                        }
                    }}
                />
            );
        }
    
        /* ── 유형 선택 화면 ── */
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
                style={{ ...PAGE_BG, position: "relative" }}
            >
    
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.07) 0%, transparent 60%)",
                    }}
                />
    
    
                <Link to="/" className="flex items-center gap-2.5 mb-14 relative">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#f97316,#fb923c)" }}
                    >
                        <Store className="w-[18px] h-[18px] text-white" />
                    </div>
                    <span
                        className="text-white"
                        style={{
                            fontSize: "1.1rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                        }}
                    >
              소상<span style={{ color: "#f97316" }}>광장</span>
              <span
                  style={{
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.35)",
                      marginLeft: "8px",
                  }}
              >
                AI 맞춤 분석
              </span>
            </span>
                </Link>
    
                <div className="relative w-full" style={{ maxWidth: "740px" }}>
    
                    <div className="flex justify-center mb-5">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                                background: "rgba(16,185,129,0.12)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#34d399",
                            }}
                        >
                            <Sparkles style={{ width: "14px", height: "14px" }} />
                            맞춤형 AI 분석을 위해 가장 알맞은 유형을 알려주세요
                        </div>
                    </div>
    
                    <h1
                        className="text-center mb-3"
                        style={{
                            fontSize: "clamp(1.9rem, 5vw, 3rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        현재 상황을 선택해주세요
                    </h1>
                    <p
                        className="text-center mb-12"
                        style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)" }}
                    >
                        맞춤형 AI 분석을 위해 가장 알맞은 유형을 알려주세요
                    </p>
    
                    <div className="grid sm:grid-cols-2 gap-5">
    
                        {[
                            {
                                key: "new" as const,
                                icon: (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="28"
                                        height="28"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    >
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                        <path d="M19 8h2m-1-1v2" />
                                    </svg>
                                ),
                                title: "신생 창업자",
                                desc: "처음 가게를 시작하려고 준비 중입니다. 업종, 위치, 비용 등 전반적인 가이드가 필요해요.",
                                nextFlow: "q0new" as FlowState,
                            },
                            {
                                key: "existing" as const,
                                icon: (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="28"
                                        height="28"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    >
                                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        <polyline points="9,22 9,12 15,12 15,22" />
                                    </svg>
                                ),
                                title: "기존 사장님",
                                desc: "이미 가게를 운영 중입니다. 매출 상승, 마케팅, 트렌드 분석 등 운영 전략이 필요해요.",
                                nextFlow: "q1ex" as FlowState,
                            },
                        ].map((card) => {
                            return (
                                <button
                                    key={card.key}
                                    onClick={() => startFlow(card.key)}
                                    className="text-left rounded-2xl p-7 transition-all active:scale-[0.98] relative"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.border =
                                            "1px solid rgba(16,185,129,0.4)";
                                        e.currentTarget.style.background = "rgba(16,185,129,0.06)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.border =
                                            "1px solid rgba(255,255,255,0.1)";
                                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                    }}
                                >
    
                                    <div
                                        className="absolute top-5 right-5 w-5 h-5 rounded-full"
                                        style={{
                                            border: "1.5px solid rgba(255,255,255,0.2)",
                                            background: "rgba(255,255,255,0.06)",
                                        }}
                                    />
    
    
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                                        style={{ background: "rgba(255,255,255,0.1)" }}
                                    >
                                        {card.icon}
                                    </div>
    
                                    <h3
                                        style={{
                                            fontSize: "1.25rem",
                                            fontWeight: 800,
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {card.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "0.88rem",
                                            color: "rgba(255,255,255,0.45)",
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {card.desc}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
    
                    <p
                        className="text-center mt-8"
                        style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}
                    >
                        입력하신 정보는 분석 목적으로만 활용되며 저장되지 않습니다.
                    </p>
                </div>
            </div>
        );
    }