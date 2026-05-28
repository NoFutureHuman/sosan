import {
  type BizinfoContext,
  type CommercialContext,
  type RoneRentContext,
  type SbizStoreData,
} from "./budongsan";

export interface AiAnalysisResult {
  isAnswerSufficient?: boolean;
  insufficiencyReason?: string;
  solutionQuestions?: {
    question: string;
    reason: string;
    priority: "높음" | "중간" | "낮음";
    options?: string[];
  }[];
  fundingComparison: {
    method: string;
    amount: string;
    pros: string[];
    cons: string[];
    recommended: boolean;
    suitability: string;
  }[];
  sbizAnalysis: {
    summary: string;
    storeBreakdown: {
      category: string;
      count: number;
      competition: "높음" | "중간" | "낮음";
    }[];
    competitionLevel: string;
    overallScore: number;
    locationRecommendations: {
      rank: number;
      area: string;
      reason: string;
      score: number;
      pros: string[];
      cons: string[];
    }[];
  };
  riskFactors: {
    category: string;
    level: "높음" | "중간" | "낮음";
    description: string;
    mitigation: string;
  }[];
  actionPlan: {
    period: string;
    focus: string;
    tasks: string[];
  }[];
  profitability: {
    bizType: string;
    monthlyProfit: string;
    profitValue: number;
    isTarget: boolean;
    aiTip: string;
  }[];
  budgetBreakdown: {
    label: string;
    amount: string;
    note: string;
  }[];
  rentEstimation: {
    basis: string;
    estimatedDeposit: string;
    estimatedMonthlyRent: string;
    bySize: {
      size: string;
      deposit: string;
      monthlyRent: string;
      note: string;
    }[];
    tips: string[];
  };
  interiorPlan: {
    style: string;
    styleDesc: string;
    estimatedCost: string;
    items: {
      category: string;
      detail: string;
      cost: string;
      priority: "필수" | "권장" | "선택";
    }[];
    aiTips: string[];
  };
  trialRunPlan: {
    phases: {
      period: string;
      name: string;
      goals: string[];
      kpis: { metric: string; target: string }[];
    }[];
    feedbackChannels: string[];
    warningSignals: string[];
  };
}

function sbizContextToText(sbizData: SbizStoreData): string {
  const catMap = new Map<string, number>();
  sbizData.stores.forEach((s) => {
    const cat = s.indsMclsNm || s.indsSclsNm || "기타";
    catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
  });
  const sorted = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const catLines = sorted.slice(0, 8).map(([cat, cnt]) => `  · ${cat}: ${cnt}개`).join("\n");

  const bldLines = sbizData.buildingGroups.slice(0, 5).map((b) =>
    `  · ${b.bldNm || "건물명 미상"} (${b.address}) - ${b.count}개 상가, 업종: ${b.bizTypes.slice(0, 3).join(", ")}`
  ).join("\n");

  return `[소상공인시장진흥공단 상가정보 - ${sbizData.regionName}]
- 총 상가 수: ${sbizData.totalCount}개
- 업종 분포 (상위):
${catLines}
- 주요 건물별 현황:
${bldLines}
(위 상가정보를 기반으로 상권 분석과 입지 추천을 해주세요.)`;
}

function buildPrompt(
  answers: Record<string, string | string[]>,
  rentContext?: string,
  sbizContext?: string,
  flowType: "new" | "existing" = "new",
  roneContext?: string,
  bizinfoContext?: string,
  selectedCategories: string[] = [],
): string {
  const lines = Object.entries(answers)
    .filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : v.trim() !== ""))
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`);

  const rentSection = rentContext
    ? `\n[국토교통부 상업업무용 실거래가 데이터]\n${rentContext}\n`
    : "";
  const sbizSection = sbizContext
    ? `\n[소상공인 상가정보 데이터]\n${sbizContext}\n`
    : "";
  const roneSection = roneContext
    ? `\n[한국부동산원 R-ONE 데이터]\n${roneContext}\n`
    : "";
  const bizinfoSection = bizinfoContext
    ? `\n[중소벤처24/기타 지원사업 데이터]\n${bizinfoContext}\n`
    : "";

  const flowLabel =
    flowType === "existing" ? "기존 사장님(운영 개선)" : "신생 창업자(창업 준비)";
  const categorySection =
    flowType === "existing" && selectedCategories.length > 0
      ? `\n[사용자 선택 카테고리]\n- ${selectedCategories.join(", ")}\n`
      : "";

  return `당신은 소상공인 전문 AI 컨설턴트입니다. 음식·외식업 분야를 중심으로 분석합니다.

분석 대상 유형: ${flowLabel}

아래는 사용자 고정 질문 응답입니다:
${lines.join("\n")}${categorySection}${rentSection}${sbizSection}${roneSection}${bizinfoSection}

위 응답을 바탕으로 다음 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:

{
  "solutionQuestions": [
    {
      "question": "솔루션 정확도를 높이기 위한 추가 질문",
      "reason": "왜 필요한 질문인지",
      "priority": "높음"
    }
  ],
  "fundingComparison": [
    {
      "method": "자금 조달 방법명 (예: 소상공인 정책자금, 은행 대출, 자기자본, 지인 투자)",
      "amount": "조달 가능 금액 범위 (예: 최대 7,000만 원)",
      "pros": ["장점 2~3가지"],
      "cons": ["단점 1~2가지"],
      "recommended": true,
      "suitability": "이 창업자에게 적합한 이유 한 문장"
    }
  ],
  "sbizAnalysis": {
    "summary": "소상공인 상가정보 기반 해당 상권 전체 요약 한 문장 (데이터 없으면 지역 일반 지식 기반 분석)",
    "storeBreakdown": [
      { "category": "업종 카테고리명", "count": 12, "competition": "높음" }
    ],
    "competitionLevel": "창업자 업종의 해당 상권 내 경쟁 강도 한 문장 설명",
    "overallScore": 75,
    "locationRecommendations": [
      {
        "rank": 1,
        "area": "추천 입지 유형 또는 구체적 위치 (예: 역세권 이면도로 1~2층)",
        "reason": "추천 이유 한 문장",
        "score": 82,
        "pros": ["장점 2가지"],
        "cons": ["단점 1가지"]
      }
    ]
  },
  "riskFactors": [
    {
      "category": "위험 카테고리 (예: 초기 자금 소진, 계절성, 임대료 인상)",
      "level": "높음",
      "description": "위험 상세 설명 한 문장",
      "mitigation": "대응 방안 한 문장"
    }
  ],
  "actionPlan": [
    {
      "period": "1~2개월차",
      "focus": "이 단계의 핵심 목표 한 문장",
      "tasks": ["구체적인 할 일 3~4가지"]
    }
  ],
  "profitability": [
    {
      "bizType": "업종명",
      "monthlyProfit": "약 XXX만원",
      "profitValue": 320,
      "isTarget": true,
      "aiTip": "수익 개선 조언 (isTarget이 true인 항목만)"
    }
  ],
  "budgetBreakdown": [
    { "label": "보증금", "amount": "XXXX만원", "note": "월세 기준 설명" }
  ],
  "rentEstimation": {
    "basis": "국토교통부 실거래가 또는 지역 시세 기반 추정 근거 한 문장",
    "estimatedDeposit": "3,000~6,000만원",
    "estimatedMonthlyRent": "월 120~200만원",
    "bySize": [
      { "size": "15평", "deposit": "2,000~3,000만원", "monthlyRent": "80~120만원", "note": "초소형 창업 적합" },
      { "size": "20평", "deposit": "3,000~5,000만원", "monthlyRent": "120~180만원", "note": "소규모 카페·음식점 적합" },
      { "size": "30평", "deposit": "5,000~8,000만원", "monthlyRent": "180~280만원", "note": "중형 음식점·카페 적합" }
    ],
    "tips": ["임대료 협상 팁 또는 절감 전략 1", "팁 2", "팁 3"]
  },
  "interiorPlan": {
    "style": "인테리어 스타일명 (예: 모던 미니멀)",
    "styleDesc": "스타일 설명 한 문장",
    "estimatedCost": "총 예상 비용 범위",
    "items": [
      { "category": "카테고리", "detail": "세부 항목", "cost": "예상 비용", "priority": "필수" }
    ],
    "aiTips": ["절감·차별화 팁 1", "팁 2", "팁 3"]
  },
  "trialRunPlan": {
    "phases": [
      {
        "period": "소프트오픈 1~2주",
        "name": "단계명",
        "goals": ["목표1", "목표2"],
        "kpis": [{ "metric": "지표명", "target": "목표치" }]
      }
    ],
    "feedbackChannels": ["채널1", "채널2"],
    "warningSignals": ["경고 신호1", "경고 신호2"]
  }
}

규칙:
- isAnswerSufficient:
  - 현재 정보만으로 실행 가능한 솔루션이 충분하면 true
  - 추가 확인이 필요하면 false
- insufficiencyReason:
  - isAnswerSufficient가 false일 때만, 부족한 이유를 한 문장으로 작성
- solutionQuestions:
  - isAnswerSufficient가 false일 때만 2~5개 생성
  - isAnswerSufficient가 true이면 빈 배열 []
  - 반드시 '고정 질문 응답 + API 팩트 데이터 + 이미 받은 추가답변'을 근거로 작성. generic 질문 금지.
- flowType이 existing이고 사용자 선택 카테고리가 있으면, solutionQuestions는 반드시 해당 카테고리 범위 내에서만 생성.
- fundingComparison: 3~4가지 방법 비교, recommended는 최대 1개만 true
- sbizAnalysis: 소상공인 API 데이터가 제공된 경우 해당 데이터 기반으로 분석. 없으면 지역 일반 지식 기반. storeBreakdown은 3~5개 업종 (count는 제공 데이터 기반 or 추정치), competition은 "높음"/"중간"/"낮음" 중 하나. overallScore는 50~95. locationRecommendations는 3개 (rank 1~3)
- riskFactors: 4~5개, level은 "높음"/"중간"/"낮음" 중 하나
- actionPlan: 6단계 (1~2개월차 ~ 11~12개월차)
- profitability: 창업자의 업종 포함 3개 업종 수익성 비교, profitValue는 100~600 사이 숫자(만원), isTarget은 창업자 업종만 true, aiTip은 isTarget인 항목에만 구체적인 수익 개선 조언
- budgetBreakdown: 보증금/인테리어/초도물품/홍보예비금 등 5~6개 항목별 예상 비용 (창업자 답변 기반으로 현실적으로)
- rentEstimation: 국토교통부 실거래가 데이터가 제공된 경우 해당 데이터 기반으로 추정, 없으면 지역 시세 기반 추정. bySize는 반드시 3개 (15평/20평/30평). tips는 3가지
- interiorPlan: 업종에 맞는 인테리어 스타일 추천. items는 6~8개, priority는 "필수"/"권장"/"선택" 중 하나. aiTips는 비용 절감·차별화 팁 3가지
- trialRunPlan: phases는 3단계(소프트오픈 1~2주 / 정식오픈 1~2개월 / 안정화 3개월). kpis는 단계별 2~3개 측정 지표와 목표치. feedbackChannels는 3~4개. warningSignals는 철수·재검토 판단 기준 3개`;
}

function roneContextToText(rone?: RoneRentContext | null): string | undefined {
  if (!rone) return undefined;
  const lines = (rone.items ?? [])
    .slice(0, 6)
    .map((item) => `- ${item.region} ${item.type}: 임대지수 ${item.rentIndex}, 공실률 ${item.vacancyRate}%`)
    .join("\n");
  return `[${rone.source}] ${rone.period}\n${lines || "- 데이터 없음"}`;
}

function bizinfoContextToText(bizinfo?: BizinfoContext | null): string | undefined {
  if (!bizinfo) return undefined;
  const lines = (bizinfo.items ?? [])
    .slice(0, 6)
    .map((item) => `- ${item.pblancNm} (${item.institution}) / ${item.period}`)
    .join("\n");
  return `[지원사업 요약] 총 ${bizinfo.totalCount}건\n${lines || "- 데이터 없음"}`;
}

export async function analyzeStartup(
  answers: Record<string, string | string[]>,
  _sbizData?: SbizStoreData | null,
  _commercialCtx?: CommercialContext | null,
  flowType: "new" | "existing" = "new",
  _roneCtx?: RoneRentContext | null,
  _bizinfoCtx?: BizinfoContext | null,
  selectedCategories: string[] = [],
  reportId?: number | null,
  followupAnswers?: Record<string, string>,
): Promise<AiAnalysisResult & { reportId: number; status: string }> {
  const response = await fetch("/api/analysis/next", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reportId,
      flowType,
      answers,
      followupAnswers,
      selectedCategories,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({} as any));
    if (err?.error === "AI_NOT_CONNECTED") {
      throw new Error("AI_NOT_CONNECTED");
    }
    throw new Error(
      err?.error
        ? `분석 파이프라인 오류: ${response.status} (${err.error})`
        : `분석 파이프라인 오류: ${response.status}`,
    );
  }

  return (await response.json()) as AiAnalysisResult & {
    reportId: number;
    status: string;
  };
}
