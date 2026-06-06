package com.example.sosangworkspace.existinggraph;

import org.bsc.langgraph4j.action.AsyncNodeAction;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
class ExistingOwnerReportNode implements AsyncNodeAction<ExistingOwnerGraphState> {

    private final ExistingOwnerOpenAiClient openAiClient;

    ExistingOwnerReportNode(ExistingOwnerOpenAiClient openAiClient) {
        this.openAiClient = openAiClient;
    }

    @Override
    public CompletableFuture<Map<String, Object>> apply(ExistingOwnerGraphState state) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> parsed = openAiClient.invokeJson(
                    ExistingOwnerPromptBuilder.buildReportPrompt(state),
                    "REPORT",
                    4800
            );
            if ("existing".equals(state.flowType().orElse("new"))) {
                List<String> categories = state.selectedCategories().orElse(List.of());
                parsed = ExistingOwnerCategoryInsightsNormalizer.normalizeCategoryInsights(
                        new LinkedHashMap<>(parsed),
                        categories.stream().map(String::valueOf).toList()
                );
            }
            return Map.of("reportResult", parsed);
        });
    }
}
