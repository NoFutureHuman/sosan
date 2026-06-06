package com.example.sosangworkspace.existinggraph;

import org.bsc.langgraph4j.action.AsyncNodeAction;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
class ExistingOwnerFinalizeReportNode implements AsyncNodeAction<ExistingOwnerGraphState> {

    @Override
    public CompletableFuture<Map<String, Object>> apply(ExistingOwnerGraphState state) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> report = new LinkedHashMap<>(state.reportResult().orElse(Map.of()));
            Map<String, Object> ragScores = state.ragScores().orElse(Map.of());

            Map<String, Object> llmResult = new LinkedHashMap<>();
            llmResult.put("isAnswerSufficient", true);
            llmResult.put("insufficiencyReason", "");
            llmResult.put("solutionQuestions", List.of());
            llmResult.put("ragScores", ragScores);
            llmResult.putAll(ExistingOwnerEmptyReportPayload.emptyReportPayload());
            llmResult.putAll(report);
            return Map.of("llmResult", llmResult);
        });
    }
}
