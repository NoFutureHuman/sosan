package com.example.sosangworkspace.existinggraph;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.StateGraph;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * 기존 사장님 LangGraph4j 파이프라인.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExistingOwnerAnalysisService {

    private final ExistingOwnerApiNode apiNode;
    private final ExistingOwnerScoreNode scoreNode;
    private final ExistingOwnerQuestionNode questionNode;
    private final ExistingOwnerReportNode reportNode;
    private final ExistingOwnerFinalizeInsufficientNode finalizeInsufficientNode;
    private final ExistingOwnerFinalizeReportNode finalizeReportNode;

    public Map<String, Object> run(
            Map<String, Object> answers,
            Map<String, Object> apiFacts,
            String flowType,
            List<String> selectedCategories,
            boolean forceReport
    ) {
        try {
            if (forceReport) {
                return runForceReport(answers, apiFacts, flowType, selectedCategories);
            }

            Map<String, Object> init = new LinkedHashMap<>();
            init.put("answers", answers != null ? answers : Map.of());
            init.put("apiFacts", apiFacts != null ? apiFacts : Map.of());
            init.put("flowType", flowType != null ? flowType : "new");
            init.put("selectedCategories", selectedCategories != null ? selectedCategories : List.of());

            CompiledGraph<ExistingOwnerGraphState> graph;
            try {
                graph = buildGraph();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            Optional<ExistingOwnerGraphState> result = graph.invoke(init);

            if (result.isEmpty()) {
                throw new RuntimeException("INVALID_LLM_RESULT");
            }

            Map<String, Object> llmResult = result.get().llmResult().orElse(null);
            if (llmResult == null) {
                throw new RuntimeException("INVALID_LLM_RESULT");
            }
            return llmResult;

        } catch (RuntimeException e) {
            if ("AI_NOT_CONNECTED".equals(e.getMessage())) {
                throw e;
            }
            log.error("[ExistingOwner] run 오류", e);
            throw e;
        }
    }

    private Map<String, Object> runForceReport(
            Map<String, Object> answers,
            Map<String, Object> apiFacts,
            String flowType,
            List<String> selectedCategories
    ) {
        ExistingOwnerGraphState state = new ExistingOwnerGraphState(new LinkedHashMap<>(Map.of(
                "answers", answers != null ? answers : Map.of(),
                "apiFacts", apiFacts != null ? apiFacts : Map.of(),
                "flowType", flowType != null ? flowType : "new",
                "selectedCategories", selectedCategories != null ? selectedCategories : List.of()
        )));

        Map<String, Object> scoreUpdate = scoreNode.apply(state).join();
        state = mergeState(state, scoreUpdate);

        Map<String, Object> reportUpdate = reportNode.apply(state).join();
        state = mergeState(state, reportUpdate);

        if ("existing".equals(flowType)) {
            Map<String, Object> report = new LinkedHashMap<>(state.reportResult().orElse(Map.of()));
            List<String> cats = selectedCategories != null
                    ? selectedCategories.stream().map(String::valueOf).toList()
                    : List.of();
            report = ExistingOwnerCategoryInsightsNormalizer.normalizeCategoryInsights(report, cats);
            state = mergeState(state, Map.of("reportResult", report));
        }

        Map<String, Object> finalizeUpdate = finalizeReportNode.apply(state).join();
        state = mergeState(state, finalizeUpdate);

        Map<String, Object> llmResult = state.llmResult().orElse(null);
        if (llmResult == null) {
            throw new RuntimeException("INVALID_LLM_RESULT");
        }
        return llmResult;
    }

    private CompiledGraph<ExistingOwnerGraphState> buildGraph() throws Exception {
        StateGraph<ExistingOwnerGraphState> workflow = new StateGraph<>(ExistingOwnerGraphState::new)
                .addNode("api_node", apiNode)
                .addNode("score_node", scoreNode)
                .addNode("question_node", questionNode)
                .addNode("report_node", reportNode)
                .addNode("finalize_insufficient_node", finalizeInsufficientNode)
                .addNode("finalize_report_node", finalizeReportNode)
                .addEdge(StateGraph.START, "api_node")
                .addEdge("api_node", "score_node")
                .addEdge("score_node", "question_node")
                .addConditionalEdges(
                        "question_node",
                        state -> CompletableFuture.completedFuture(
                                ExistingOwnerGraphRouter.shouldGenerateReport(state)
                        ),
                        Map.of(
                                "report_node", "report_node",
                                "finalize_insufficient_node", "finalize_insufficient_node"
                        )
                )
                .addEdge("report_node", "finalize_report_node")
                .addEdge("finalize_insufficient_node", StateGraph.END)
                .addEdge("finalize_report_node", StateGraph.END);

        return workflow.compile();
    }

    private ExistingOwnerGraphState mergeState(ExistingOwnerGraphState state, Map<String, Object> update) {
        Map<String, Object> merged = new LinkedHashMap<>(state.data());
        merged.putAll(update);
        return new ExistingOwnerGraphState(merged);
    }
}
