package com.example.sosangworkspace.existinggraph;

import org.bsc.langgraph4j.action.AsyncNodeAction;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
class ExistingOwnerFinalizeInsufficientNode implements AsyncNodeAction<ExistingOwnerGraphState> {

    @Override
    public CompletableFuture<Map<String, Object>> apply(ExistingOwnerGraphState state) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> q = state.questionResult().orElse(Map.of());
            Map<String, Object> ragScores = state.ragScores().orElse(Map.of());

            Map<String, Object> llmResult = new LinkedHashMap<>();
            llmResult.put("isAnswerSufficient", false);
            String insufficiencyReason = String.valueOf(q.getOrDefault("insufficiencyReason", "")).strip();
            if (insufficiencyReason.isEmpty()) {
                Object score = ragScores.get("overallReadinessScore");
                insufficiencyReason = "RAG 준비도 점수(" + score + "점)가 부족합니다.";
            }
            llmResult.put("insufficiencyReason", insufficiencyReason);
            llmResult.put("solutionQuestions", q.getOrDefault("solutionQuestions", List.of()));
            llmResult.put("lightFollowupPages", q.getOrDefault("lightFollowupPages", List.of()));
            llmResult.put("ragScores", ragScores);
            llmResult.putAll(ExistingOwnerEmptyReportPayload.emptyReportPayload());
            return Map.of("llmResult", llmResult);
        });
    }
}
