package com.example.sosangworkspace.service;

import com.example.sosangworkspace.domain.SosangState;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.StateGraph;
import org.springframework.stereotype.Service;

/**
 * 신생 창업자 전용 LangGraph4j 파이프라인 (sosan-main 7과 동일).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NewStartupAnalysisService {

    private final EvaluateNode evaluateNode;
    private final QuestionGeneratorNode questionGeneratorNode;
    private final ApiRetrievalNode apiRetrievalNode;
    private final LlmSynthesisNode llmSynthesisNode;
    private final AnalysisHistorySaver historySaver;

    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluate(Map<String, String> answers) {
        try {
            log.info("[NewStartup] evaluate - 답변 수: {}", answers.size());

            StateGraph<SosangState> workflow = new StateGraph<>(SosangState::new)
                    .addNode("evaluate", evaluateNode)
                    .addNode("generateQuestions", questionGeneratorNode)
                    .addEdge(StateGraph.START, "evaluate")
                    .addConditionalEdges(
                            "evaluate",
                            state -> CompletableFuture.completedFuture(
                                    "sufficient".equals(state.evaluationStatus().orElse("insufficient"))
                                            ? StateGraph.END
                                            : "generateQuestions"
                            ),
                            Map.of(
                                    StateGraph.END, StateGraph.END,
                                    "generateQuestions", "generateQuestions"
                            )
                    )
                    .addEdge("generateQuestions", StateGraph.END);

            CompiledGraph<SosangState> app = workflow.compile();
            Optional<SosangState> result = app.invoke(Map.of("answers", answers));

            if (result.isEmpty()) {
                return Map.of("status", "ready");
            }

            SosangState finalState = result.get();
            String status = finalState.evaluationStatus().orElse("sufficient");

            if ("sufficient".equals(status)) {
                return Map.of("status", "ready");
            }

            List<Map<String, Object>> questions = finalState.generatedQuestions().orElse(List.of());
            if (questions.isEmpty()) {
                questions = defaultNewQuestions();
            }
            return Map.of("status", "needs_more", "questions", questions);

        } catch (Exception e) {
            log.error("[NewStartup] evaluate 오류 - 기본 추가 질문 반환", e);
            return Map.of("status", "needs_more", "questions", defaultNewQuestions());
        }
    }

    private List<Map<String, Object>> defaultNewQuestions() {
        List<Map<String, Object>> qs = new ArrayList<>();

        Map<String, Object> q1 = new LinkedHashMap<>();
        q1.put("key", "hasExperience");
        q1.put("category", "창업 경험");
        q1.put("question", "관련 업종 경험이 있으신가요?");
        q1.put("options", List.of(
                "경험 없음", "아르바이트 경험 있음", "유사업종 근무 경험 있음", "직접 운영해본 적 있음", "아직 미정이에요"
        ));
        qs.add(q1);

        Map<String, Object> q2 = new LinkedHashMap<>();
        q2.put("key", "targetCustomer");
        q2.put("category", "목표 고객층");
        q2.put("question", "주요 목표 고객층은 어떻게 생각하고 계신가요?");
        q2.put("options", List.of(
                "10~20대", "20~30대 직장인", "가족 단위", "시니어층", "아직 미정이에요"
        ));
        qs.add(q2);

        return qs;
    }

    public Map<String, Object> analyzeNew(Map<String, String> answers, Long userId) {
        try {
            log.info("[NewStartup] 분석 - 업종: {}, 지역: {}",
                    answers.get("bizType"), answers.get("region"));

            StateGraph<SosangState> workflow = new StateGraph<>(SosangState::new)
                    .addNode("apiRetrieval", apiRetrievalNode)
                    .addNode("llmSynthesis", llmSynthesisNode)
                    .addEdge(StateGraph.START, "apiRetrieval")
                    .addEdge("apiRetrieval", "llmSynthesis")
                    .addEdge("llmSynthesis", StateGraph.END);

            CompiledGraph<SosangState> app = workflow.compile();
            Optional<SosangState> result = app.invoke(Map.of("answers", answers));

            if (result.isEmpty()) {
                return Map.of("error", "분석 결과를 생성하지 못했습니다.");
            }

            SosangState finalState = result.get();
            String report = finalState.report().orElse("");
            String apiContext = finalState.apiContext().orElse("");

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("report", report);
            response.put("apiContext", apiContext);
            response.put("answers", answers);

            if (!report.isBlank() && userId != null) {
                Long historyId = historySaver.saveNewStartupReport(answers, report, userId);
                if (historyId != null) {
                    response.put("historyId", historyId);
                }
            }

            return response;

        } catch (Exception e) {
            log.error("[NewStartup] analyzeNew 오류", e);
            return Map.of("error", e.getMessage() != null ? e.getMessage() : "분석 오류");
        }
    }
}
