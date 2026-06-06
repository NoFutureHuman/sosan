package com.example.sosangworkspace.existinggraph;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class ExistingOwnerPromptBuilder {

    private ExistingOwnerPromptBuilder() {
    }

    static String followupCountRules(ExistingOwnerGraphState state) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        String mode = ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase();
        List<String> categories = state.selectedCategories().orElse(List.of());
        int catCount = categories.size();

        if ("deep".equals(mode)) {
            int minTotal = Math.max(12, catCount * 3);
            return """
                    - **집중분석(deep)**: 추가질문 개수 **상한 없음**. 이번 라운드 **최소 %d개** 목표.
                    - 선택 카테고리 **각각 최소 3개**씩, 서로 다른 주제의 질문 필수 (category 필드에 카테고리명 표기).
                    - 매장 현재 상태(매출·운영·고객·비용·경쟁)를 **확실히** 파악할 수 있게 구체적으로 질문.
                    - 5개 이하로 묶지 말 것. CSV·고정질문에 없는 **결정적 공백**만 물을 것.
                    """.formatted(minTotal).strip();
        }
        return """
                - **가벼운 분석(light)**: 선택 카테고리 **각각** 추가질문 **최대 %d페이지**.
                - 이번 호출은 answers.lightFollowupTargetCategory에 지정된 **단일 카테고리**만 대상으로 %d~%d개 생성.
                """.formatted(
                ExistingOwnerConstants.LIGHT_FOLLOWUP_MAX_ROUNDS,
                ExistingOwnerConstants.FOLLOWUP_QUESTIONS_MIN_LIGHT,
                ExistingOwnerConstants.FOLLOWUP_QUESTIONS_MAX_LIGHT
        ).strip();
    }

    static String buildQuestionPrompt(ExistingOwnerGraphState state) {
        String ctx = ExistingOwnerContextBuilder.baseContext(state, true);
        String priorBlock = ExistingOwnerContextBuilder.priorFollowupBlock(state);
        Map<String, Object> ragScores = state.ragScores().orElse(Map.of());
        Object insufficientAxesRaw = ragScores.get("insufficientAxes");
        List<String> insufficientAxes = new ArrayList<>();
        if (insufficientAxesRaw instanceof List<?> list) {
            for (Object axis : list) {
                insufficientAxes.add(String.valueOf(axis));
            }
        }
        String ragHint = ExistingOwnerJsonUtils.toCompactJson(ragScores);
        String countRules = followupCountRules(state);
        String axesJoined = insufficientAxes.isEmpty() ? "없음" : String.join(", ", insufficientAxes);

        return """
                당신은 소상공인 컨설팅 AI입니다.
                현재 목표는 "추가질문 필요 여부 판단"입니다.

                %s
                %s

                [RAG 준비도 점수]
                %s

                출력은 반드시 JSON 객체 하나:
                {
                  "isAnswerSufficient": true 또는 false,
                  "insufficiencyReason": "부족 시 한 문장",
                  "solutionQuestions": [
                    {
                      "question":"...",
                      "category":"선택 카테고리명(집중분석 시 필수)",
                      "reason":"...",
                      "priority":"높음|중간|낮음",
                      "options":["선택지1","선택지2","선택지3","기타(직접입력)"]
                    }
                  ]
                }

                규칙:
                %s
                - 답변이 충분하지 않으면 isAnswerSufficient=false, solutionQuestions를 위 규칙에 맞게 생성.
                - 부족 축(%s)이 여러 개면 **서로 다른 주제**의 질문을 우선 생성.
                - 답변이 충분하면 isAnswerSufficient=true, solutionQuestions=[].
                - solutionQuestions의 각 문항마다 options는 3~6개, 마지막은 반드시 "기타(직접입력)".
                - 같은 응답·이전 추가질문 라운드와 동일·유사한 질문은 생성하지 말 것.
                - [이미 제출한 추가질문] 목록이 있으면 그 문장과 겹치지 않게 생성.
                - 예: "월 매출 규모"와 "현재 매출 수준"처럼 같은 정보를 다시 묻는 질문 금지.
                - 반드시 RAG 비교 점수에서 낮은 항목(특히 70 미만)을 우선 보완하는 질문만 생성.
                - 이미 충분한(80 이상) 항목을 다시 묻는 질문 금지.
                - existing + 선택 카테고리가 있으면 질문/솔루션은 해당 카테고리 범위만 다룬다(집중분석 시 category 필드로 명시).
                - 집중분석(deep)이면 isAnswerSufficient=true는 **추가질문이 정말 0개일 때만**. 질문이 있으면 반드시 false.
                - generic한 질문 금지, 반드시 사용자 답변/API팩트를 근거로 만든다.
                - posInputSource=csv 이면 [집중분석 POS/CSV 데이터]의 CSV 자동 요약·샘플 행을 근거로 사용한다. 컬럼명이 표준 지표와 달라도(토스·배민·POS 등) 요약·샘플에 있는 수치를 해석해 활용한다.
                - CSV에 이미 드러난 정보(월별 매출, 상품별 매출, 결제수단 비중 등)는 같은 내용을 다시 묻지 말 것.
                - POS 수치와 모순되는 일반론 질문 금지.
                """.formatted(ctx, priorBlock, ragHint, countRules, axesJoined).strip();
    }

    static String buildLightPhasePrompt(ExistingOwnerGraphState state, String category, int phase) {
        String ctx = ExistingOwnerContextBuilder.baseContext(state, true);
        String priorBlock = ExistingOwnerContextBuilder.priorFollowupBlock(state);
        String ragHint = ExistingOwnerJsonUtils.toCompactJson(state.ragScores().orElse(Map.of()));
        String phaseLabel = phase == 1 ? "1차(1페이지)" : "2차(2페이지)";
        String phaseExtra = "";
        if (phase == 2) {
            phaseExtra = """
                    - answers에 포함된 **1차 추가질문 답변**을 반영해, 1차와 다른 주제의 심화·후속만 생성.
                    - 1차에서 이미 파악된 내용은 다시 묻지 말 것.
                    """;
        }

        return """
                당신은 소상공인 가벼운 분석 컨설턴트입니다.
                선택 카테고리 중 **'%s'** 에 대한 **%s** 추가질문만 생성합니다.

                %s
                %s

                [RAG 준비도]
                %s

                출력 JSON:
                {
                  "isAnswerSufficient": false,
                  "insufficiencyReason": "",
                  "solutionQuestions": [
                    {
                      "question":"...",
                      "category":"%s",
                      "reason":"...",
                      "priority":"높음|중간|낮음",
                      "options":["선택지1","선택지2","선택지3","기타(직접입력)"]
                    }
                  ]
                }

                규칙:
                - **%s** 범위에서 %d~%d개를 **이번 호출에서 한 번에 모두** 생성.
                - category 필드는 반드시 "%s".
                - 이미 제출한 추가질문·다른 카테고리 주제와 동일·유사 질문 금지.
                - isAnswerSufficient는 항상 false.
                %s
                """.formatted(
                category, phaseLabel, ctx, priorBlock, ragHint,
                category, category,
                ExistingOwnerConstants.FOLLOWUP_QUESTIONS_MIN_LIGHT,
                ExistingOwnerConstants.FOLLOWUP_QUESTIONS_MAX_LIGHT,
                category, phaseExtra
        ).strip();
    }

    static String buildDeepPhasePrompt(ExistingOwnerGraphState state, String category, int phase) {
        String ctx = ExistingOwnerContextBuilder.baseContext(state, true);
        String priorBlock = ExistingOwnerContextBuilder.priorFollowupBlock(state);
        String ragHint = ExistingOwnerJsonUtils.toCompactJson(state.ragScores().orElse(Map.of()));
        String phaseLabel = phase + "차(페이지)";
        String phaseExtra;
        if (phase > 1) {
            phaseExtra = """
                    - 이전 라운드 추가질문 답변을 반영해 **새로운 주제**의 심화·후속만 생성.
                    - [이미 제출한 추가질문]과 동일·유사한 질문은 **절대 생성 금지**.
                    """;
        } else {
            phaseExtra = """
                    - 집중분석 1차: 선택 카테고리·POS(CSV)·API 팩트 기반 핵심 공백을 넓게 파악.
                    - [이미 제출한 추가질문]과 동일·유사한 질문은 **절대 생성 금지**.
                    """;
        }

        return """
                당신은 소상공인 집중분석 컨설턴트입니다.
                **'%s'** 카테고리 **%s** 추가질문을 **한 번에 모두** 생성합니다.

                %s
                %s

                [RAG 준비도]
                %s

                출력 JSON:
                {
                  "isAnswerSufficient": false,
                  "insufficiencyReason": "",
                  "solutionQuestions": [
                    {
                      "question":"...",
                      "category":"%s",
                      "reason":"...",
                      "priority":"높음|중간|낮음",
                      "options":["선택지1","선택지2","선택지3","기타(직접입력)"]
                    }
                  ]
                }

                규칙:
                - **%s** 범위에서 **5~10개** 질문을 이번 호출에서 **전부** 생성.
                - category 필드는 반드시 "%s".
                - isAnswerSufficient는 항상 false.
                - CSV·answers에 이미 있는 수치는 다시 묻지 말 것.
                - 질문 간 주제·표현이 겹치는 **중복 질문 금지**.
                %s
                """.formatted(
                category, phaseLabel, ctx, priorBlock, ragHint,
                category, category, category, phaseExtra
        ).strip();
    }

    static String buildDeepCategoryQuestionPrompt(ExistingOwnerGraphState state, String category) {
        String ctx = ExistingOwnerContextBuilder.baseContext(state, true);
        String priorBlock = ExistingOwnerContextBuilder.priorFollowupBlock(state);
        String ragHint = ExistingOwnerJsonUtils.toCompactJson(state.ragScores().orElse(Map.of()));

        return """
                당신은 소상공인 집중분석 컨설턴트입니다.
                **이번 호출은 '%s' 카테고리 전용 추가질문만** 생성합니다.

                %s
                %s

                [RAG 준비도]
                %s

                출력 JSON:
                {
                  "isAnswerSufficient": false,
                  "insufficiencyReason": "",
                  "solutionQuestions": [
                    {
                      "question":"...",
                      "category":"%s",
                      "reason":"...",
                      "priority":"높음|중간|낮음",
                      "options":["선택지1","선택지2","선택지3","기타(직접입력)"]
                    }
                  ]
                }

                규칙:
                - **%s** 범위에서만 **3~5개** 질문 생성 (다른 카테고리 금지).
                - 모든 question의 category는 반드시 "%s".
                - isAnswerSufficient는 항상 false.
                - 이미 제출한 추가질문·CSV에 있는 정보는 다시 묻지 말 것.
                - [이미 제출한 추가질문]과 동일·유사한 질문은 **절대 생성 금지**.
                - 매장 상태를 확실히 파악할 수 있는 **구체적** 질문만.
                """.formatted(category, ctx, priorBlock, ragHint, category, category, category).strip();
    }

    static String buildBoostDeepQuestionsPrompt(ExistingOwnerGraphState state, List<Map<String, Object>> existing,
                                                List<String> categories, int need) {
        StringBuilder existingText = new StringBuilder();
        for (Map<String, Object> q : existing) {
            String question = String.valueOf(q.getOrDefault("question", "")).strip();
            if (!question.isEmpty()) {
                existingText.append("- ").append(question).append("\n");
            }
        }
        String cats = String.join(", ", categories);
        String ctx = ExistingOwnerContextBuilder.baseContext(state, true);

        return """
                집중분석 추가질문 보강. 이미 %d개 있음. **새 질문만 %d개 이상** 추가 생성.

                선택 카테고리: %s
                카테고리별 최소 1개 이상 포함. category 필드 필수.

                [이미 생성된 질문 - 중복 금지]
                %s

                %s

                출력 JSON: { "isAnswerSufficient": false, "solutionQuestions": [ ... ] }
                """.formatted(
                existing.size(), need, cats,
                existingText.isEmpty() ? "(없음)" : existingText.toString().strip(),
                ctx
        ).strip();
    }

    static String buildExistingReportPrompt(ExistingOwnerGraphState state) {
        String ctx = ExistingOwnerContextBuilder.baseContext(state, false);
        List<String> categories = state.selectedCategories().orElse(List.of());
        String categoriesText = categories.isEmpty() ? "없음" : String.join(", ", categories);

        return """
                당신은 기존 매장 운영 중인 소상공인 사장님을 위한 컨설팅 AI입니다.
                현재 목표는 "고정질문 + 추가질문 답변 + API 팩트(+ 집중분석 POS/CSV)"를 바탕으로 최종 실행 솔루션을 생성하는 것입니다.

                %s

                선택 카테고리(반드시 categoryInsights에 각각 1개씩 생성): %s

                출력은 반드시 JSON 객체 하나:
                {
                  "isAnswerSufficient": true,
                  "insufficiencyReason": "",
                  "solutionQuestions": [],
                  "existingSolution": {
                    "summary": "사장님의 매장 상황을 반영한 종합 진단 2~3문장",
                    "actionItems": ["즉시 실행 가능한 과제1", "과제2", "과제3", "과제4"],
                    "detailedGuide": "고정질문/추가질문/POS 수치를 근거로 한 상세 실행 가이드 4~6문장"
                  },
                  "categoryInsights": [
                    {
                      "category": "선택 카테고리명",
                      "summary": "해당 카테고리 한 줄 진단",
                      "signals": ["POS/답변/API 근거 신호1", "신호2"],
                      "actions": ["실행 과제1", "실행 과제2", "실행 과제3"]
                    }
                  ],
                  "fundingComparison": [],
                  "sbizAnalysis": {"summary":"","storeBreakdown":[],"competitionLevel":"","overallScore":70,"locationRecommendations":[]},
                  "riskFactors": [],
                  "actionPlan": [],
                  "profitability": [],
                  "budgetBreakdown": [],
                  "rentEstimation": {"basis":"","estimatedDeposit":"","estimatedMonthlyRent":"","bySize":[],"tips":[]},
                  "interiorPlan": {"style":"","styleDesc":"","estimatedCost":"","items":[],"aiTips":[]},
                  "trialRunPlan": {"phases":[],"feedbackChannels":[],"warningSignals":[]}
                }

                규칙(매우 중요):
                - answers에 있는 고정질문 답변과 followup_* 추가질문 답변을 반드시 인용해 개인화한다.
                - insufficiencyReason에는 최종 솔루션을 쓰지 말고, existingSolution에만 최종 솔루션을 작성한다.
                - existingSolution.actionItems는 4~6개, 각 항목은 "무엇을/언제/어떤 지표로"가 포함된 실행 문장.
                - existingSolution.detailedGuide는 사장님의 매장 맥락(업종/지역/고민/추가답변/POS)을 반영한 장문 가이드.
                - categoryInsights는 선택 카테고리마다 **정확히 1개씩 필수**, category 필드는 아래 목록과 **글자 그대로** 일치: %s
                - 각 categoryInsights 항목에 signals **최소 2개**, actions **최소 3개** (POS/CSV/답변/API 근거 문장).
                - categoryInsights 배열을 생략하거나 비우지 말 것.
                - posInputSource=csv 이면 [집중분석 POS/CSV 데이터]의 요약·샘플만 근거로 사용(임의 형식 CSV·거래내역 포함). 표준 지표 키가 없어도 요약의 월별/상품/결제수단 수치를 인용한다.
                - "OO시의 한 업종은..." 같은 일반론·템플릿 문장 금지. 반드시 "사장님의 매장" 2인칭 컨설팅 문체.
                - 선택 카테고리가 있으면 해당 카테고리 범위에서만 솔루션을 작성한다.
                - RAG 비교 점수에서 낮은 항목을 우선 보완한다.
                - analysisMode=deep 이고 [집중분석 POS/CSV 데이터]가 있으면, CSV 요약·샘플의 구체 수치(매출 합계, 월별 추이, 상위 메뉴, 결제수단 비중 등)를 반드시 인용한다.
                - POS/CSV 수치와 맞지 않는 추상적 조언 금지.
                """.formatted(ctx, categoriesText, categoriesText).strip();
    }

    static String buildNewReportPrompt(ExistingOwnerGraphState state) {
        String ctx = ExistingOwnerContextBuilder.baseContext(state, false);

        return """
                당신은 소상공인 컨설팅 AI입니다.
                현재 목표는 "최종 실행 리포트 생성"입니다.

                %s

                출력은 반드시 JSON 객체 하나:
                {
                  "isAnswerSufficient": true,
                  "insufficiencyReason": "",
                  "solutionQuestions": [],
                  "fundingComparison": [
                    {
                      "method": "...",
                      "amount": "...",
                      "pros": ["..."],
                      "cons": ["..."],
                      "recommended": true,
                      "suitability": "..."
                    }
                  ],
                  "sbizAnalysis": {
                    "summary":"...",
                    "storeBreakdown":[{"category":"...", "count":1, "competition":"중간"}],
                    "competitionLevel":"...",
                    "overallScore":70,
                    "locationRecommendations":[{"rank":1,"area":"...","reason":"...","score":80,"pros":["..."],"cons":["..."]}]
                  },
                  "riskFactors": [{"category":"...","level":"중간","description":"...","mitigation":"..."}],
                  "actionPlan": [{"period":"1~2개월차","focus":"...","tasks":["..."]}],
                  "profitability": [{"bizType":"...","monthlyProfit":"...","profitValue":300,"isTarget":true,"aiTip":"..."}],
                  "budgetBreakdown": [{"label":"...","amount":"...","note":"..."}],
                  "rentEstimation": {
                    "basis":"...",
                    "estimatedDeposit":"...",
                    "estimatedMonthlyRent":"...",
                    "bySize":[{"size":"...","deposit":"...","monthlyRent":"...","note":"..."}],
                    "tips":["..."]
                  },
                  "interiorPlan": {
                    "style":"...",
                    "styleDesc":"...",
                    "estimatedCost":"...",
                    "items":[{"category":"...","detail":"...","cost":"...","priority":"필수"}],
                    "aiTips":["..."]
                  },
                  "trialRunPlan": {
                    "phases":[{"period":"...","name":"...","goals":["..."],"kpis":[{"metric":"...","target":"..."}]}],
                    "feedbackChannels":["..."],
                    "warningSignals":["..."]
                  }
                }

                문체 규칙(매우 중요):
                - "OO시의 한식 업종은..." 같은 제3자/일반론 문장 금지.
                - 반드시 "사장님의 매장", "현재 매장 상황", "사장님 운영 데이터" 같은 2인칭 컨설팅 문체.
                - 추상어 금지. "무엇을/언제/얼마나/어떤 지표로" 포함한 실행 문장 사용.
                - 요약은 원인+영향+우선순위 순서로 2~3문장.
                - actionPlan은 각 period마다 tasks 최소 4개.
                - riskFactors.mitigation은 즉시 실행 1개 + 2주 내 실행 1개 수준으로 구체화.
                - 허황된 표현 금지.
                - RAG 비교 점수를 근거로 핵심 리스크/기회 3개를 반드시 반영.
                """.formatted(ctx).strip();
    }

    static String buildReportPrompt(ExistingOwnerGraphState state) {
        if ("existing".equals(state.flowType().orElse("new"))) {
            return buildExistingReportPrompt(state);
        }
        return buildNewReportPrompt(state);
    }
}
