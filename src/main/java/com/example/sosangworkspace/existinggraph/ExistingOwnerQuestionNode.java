package com.example.sosangworkspace.existinggraph;

import org.bsc.langgraph4j.action.AsyncNodeAction;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

@Component
class ExistingOwnerQuestionNode implements AsyncNodeAction<ExistingOwnerGraphState> {

    private final ExistingOwnerOpenAiClient openAiClient;
    private final ExistingOwnerParallelExecutor parallelExecutor;

    ExistingOwnerQuestionNode(ExistingOwnerOpenAiClient openAiClient,
                              ExistingOwnerParallelExecutor parallelExecutor) {
        this.openAiClient = openAiClient;
        this.parallelExecutor = parallelExecutor;
    }

    @Override
    public CompletableFuture<Map<String, Object>> apply(ExistingOwnerGraphState state) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> answers = state.answers().orElse(Map.of());
            String mode = ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase();
            boolean isDeep = "deep".equals(mode);
            boolean isLight = "light".equals(mode);
            List<String> categories = state.selectedCategories().orElse(List.of());

            Map<String, Object> questionResult;
            if (isDeep && !categories.isEmpty() && "existing".equals(state.flowType().orElse("new"))) {
                if (ExistingOwnerQuestionLogic.isDeepAllScope(answers)) {
                    questionResult = questionNodeDeepAllPhase(state, ExistingOwnerQuestionLogic.deepFollowupPhase(answers));
                } else {
                    questionResult = questionNodeDeepParallel(state);
                }
            } else if (isLight && "existing".equals(state.flowType().orElse("new"))
                    && ExistingOwnerQuestionLogic.isLightAllScope(answers)) {
                questionResult = questionNodeLightAllPhase(state, ExistingOwnerQuestionLogic.lightFollowupPhase(answers));
            } else {
                questionResult = questionNodeSingle(state);
            }
            return Map.of("questionResult", questionResult);
        });
    }

    private Map<String, Object> questionNodeSingle(ExistingOwnerGraphState state) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        boolean isDeep = "deep".equals(ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase());
        Map<String, Object> parsed = openAiClient.invokeJson(
                ExistingOwnerPromptBuilder.buildQuestionPrompt(state),
                "QUESTION",
                isDeep ? 3800 : 2600
        );
        Set<String> prior = ExistingOwnerContextBuilder.extractPriorFollowupQuestions(answers);
        parsed = ExistingOwnerQuestionLogic.normalizeQuestions(parsed, prior);
        if (isDeep) {
            parsed = ExistingOwnerQuestionLogic.finalizeDeepQuestionResult(state, parsed, prior, openAiClient);
        }
        return parsed;
    }

    private Map<String, Object> questionNodeLightAllPhase(ExistingOwnerGraphState state, int phase) {
        List<String> categories = state.selectedCategories().orElse(List.of());
        if (categories.isEmpty()) {
            return questionNodeSingle(state);
        }

        Set<String> prior = ExistingOwnerContextBuilder.extractPriorFollowupQuestions(state.answers().orElse(Map.of()));
        List<Map<String, Object>> results = parallelCategoryCalls(
                categories,
                cat -> {
                    String prompt = ExistingOwnerPromptBuilder.buildLightPhasePrompt(state, cat, phase);
                    return openAiClient.invokeJson(prompt, "QL_ALL_" + cat + "_P" + phase, 2400);
                }
        );

        Map<String, Object> merged = ExistingOwnerQuestionLogic.mergeQuestionResults(results);
        merged = ExistingOwnerQuestionLogic.normalizeQuestions(merged, prior, true, true);
        Object questionsRaw = merged.get("solutionQuestions");
        List<?> questions = questionsRaw instanceof List<?> list ? list : List.of();
        merged.put("lightFollowupPages", List.of(Map.of(
                "page", phase,
                "solutionQuestions", questions
        )));
        merged.put("isAnswerSufficient", false);
        return merged;
    }

    private Map<String, Object> questionNodeDeepAllPhase(ExistingOwnerGraphState state, int phase) {
        List<String> categories = state.selectedCategories().orElse(List.of());
        if (categories.isEmpty()) {
            return questionNodeSingle(state);
        }

        List<Map<String, Object>> results = parallelCategoryCalls(
                categories,
                cat -> {
                    String prompt = ExistingOwnerPromptBuilder.buildDeepPhasePrompt(state, cat, phase);
                    Map<String, Object> parsed = openAiClient.invokeJson(
                            prompt, "QD_ALL_" + cat + "_P" + phase, 3200
                    );
                    return ExistingOwnerQuestionLogic.normalizeQuestions(
                            parsed, Set.of(), false, false
                    );
                }
        );

        Map<String, Object> merged = ExistingOwnerQuestionLogic.mergeQuestionResults(results);
        merged = ExistingOwnerQuestionLogic.normalizeQuestions(merged, Set.of(), false, false);
        Object questionsRaw = merged.get("solutionQuestions");
        List<?> questions = questionsRaw instanceof List<?> list ? list : List.of();
        merged.put("lightFollowupPages", List.of(Map.of(
                "page", phase,
                "solutionQuestions", questions
        )));
        merged.put("isAnswerSufficient", false);
        return merged;
    }

    private Map<String, Object> questionNodeDeepParallel(ExistingOwnerGraphState state) {
        List<String> categories = state.selectedCategories().orElse(List.of());
        if (categories.isEmpty()) {
            return questionNodeSingle(state);
        }

        Set<String> prior = ExistingOwnerContextBuilder.extractPriorFollowupQuestions(state.answers().orElse(Map.of()));
        List<Map<String, Object>> results = parallelCategoryCalls(
                categories,
                cat -> {
                    String prompt = ExistingOwnerPromptBuilder.buildDeepCategoryQuestionPrompt(state, cat);
                    Map<String, Object> parsed = openAiClient.invokeJson(prompt, "Q_" + cat, 2200);
                    return ExistingOwnerQuestionLogic.normalizeQuestions(parsed, prior);
                }
        );

        Map<String, Object> merged = ExistingOwnerQuestionLogic.mergeQuestionResults(results);
        merged = ExistingOwnerQuestionLogic.normalizeQuestions(merged, prior);
        merged = ExistingOwnerQuestionLogic.finalizeDeepQuestionResult(state, merged, prior, openAiClient);
        return merged;
    }

    private List<Map<String, Object>> parallelCategoryCalls(
            List<String> categories,
            CategoryGenerator generator
    ) {
        ExecutorService executor = parallelExecutor.getExecutor();
        List<Future<Map<String, Object>>> futures = new ArrayList<>();

        for (String cat : categories) {
            String category = String.valueOf(cat);
            futures.add(executor.submit(() -> generator.generate(category)));
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (Future<Map<String, Object>> future : futures) {
            try {
                results.add(future.get());
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return results;
    }

    @FunctionalInterface
    private interface CategoryGenerator {
        Map<String, Object> generate(String category) throws Exception;
    }
}
