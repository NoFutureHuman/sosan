package com.example.sosangworkspace.existinggraph;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class ExistingOwnerQuestionLogic {

    private ExistingOwnerQuestionLogic() {
    }

    static boolean isLightAllScope(Map<String, Object> answers) {
        String scope = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupBatchScope")).strip().toLowerCase();
        String cat = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupTargetCategory")).strip().toLowerCase();
        return "all".equals(scope) || "all".equals(cat);
    }

    static int lightFollowupPhase(Map<String, Object> answers) {
        String raw = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupPhase")).strip();
        if (raw.isEmpty()) {
            raw = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupCategoryPage")).strip();
        }
        return "2".equals(raw) ? 2 : 1;
    }

    static boolean isDeepAllScope(Map<String, Object> answers) {
        String scope = ExistingOwnerTextUtils.toStr(answers.get("deepFollowupBatchScope")).strip().toLowerCase();
        String cat = ExistingOwnerTextUtils.toStr(answers.get("deepFollowupTargetCategory")).strip().toLowerCase();
        String lightScope = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupBatchScope")).strip().toLowerCase();
        if ("deep".equals(ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase())
                && ("all".equals(scope) || "all".equals(cat) || "all".equals(lightScope))) {
            return true;
        }
        return "all".equals(scope) || "all".equals(cat);
    }

    static int deepFollowupPhase(Map<String, Object> answers) {
        String raw = ExistingOwnerTextUtils.toStr(answers.get("deepFollowupPhase")).strip();
        if (raw.isEmpty()) {
            raw = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupPhase")).strip();
        }
        if (raw.isEmpty()) {
            raw = ExistingOwnerTextUtils.toStr(answers.get("lightFollowupCategoryPage")).strip();
        }
        if (raw.isEmpty()) {
            raw = ExistingOwnerTextUtils.toStr(answers.get("followupPhase")).strip();
        }
        try {
            return Math.max(1, Integer.parseInt(raw));
        } catch (NumberFormatException ignored) {
            return 1;
        }
    }

    static Map<String, Object> mergeQuestionResults(List<Map<String, Object>> results) {
        List<Map<String, Object>> mergedQuestions = new ArrayList<>();
        for (Map<String, Object> item : results) {
            Object qs = item.get("solutionQuestions");
            if (qs instanceof List<?> list) {
                for (Object q : list) {
                    if (q instanceof Map<?, ?> map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> question = (Map<String, Object>) map;
                        mergedQuestions.add(question);
                    }
                }
            }
        }
        Map<String, Object> merged = new LinkedHashMap<>();
        merged.put("isAnswerSufficient", false);
        merged.put("insufficiencyReason", "");
        merged.put("solutionQuestions", mergedQuestions);
        return merged;
    }

    static Map<String, Object> normalizeQuestions(
            Map<String, Object> result,
            Set<String> priorQuestions,
            boolean strictPriorDedup,
            boolean enableDedup
    ) {
        Object questionsRaw = result.get("solutionQuestions");
        List<?> questions = questionsRaw instanceof List<?> list ? list : List.of();
        Set<String> prior = priorQuestions != null ? priorQuestions : Set.of();
        List<Map<String, Object>> deduped = new ArrayList<>();
        List<String> seen = new ArrayList<>();

        for (Object item : questions) {
            if (!(item instanceof Map<?, ?> rawMap)) {
                continue;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> questionItem = (Map<String, Object>) rawMap;
            String q = String.valueOf(questionItem.getOrDefault("question", "")).strip();
            if (q.isEmpty()) {
                continue;
            }
            if (enableDedup) {
                String norm = ExistingOwnerTextUtils.normalizeQuestionText(q);
                boolean duplicateSeen = seen.stream()
                        .anyMatch(existing -> ExistingOwnerTextUtils.isSimilarQuestion(norm, existing, false));
                if (duplicateSeen) {
                    continue;
                }
                boolean duplicatePrior = prior.stream()
                        .anyMatch(existing -> ExistingOwnerTextUtils.isSimilarQuestion(
                                norm, existing, !strictPriorDedup
                        ));
                if (duplicatePrior) {
                    continue;
                }
                seen.add(norm);
            }

            Object optionsRaw = questionItem.get("options");
            List<String> options = new ArrayList<>();
            if (optionsRaw instanceof List<?> optList) {
                for (Object opt : optList) {
                    String s = String.valueOf(opt).strip();
                    if (!s.isEmpty()) {
                        options.add(s);
                    }
                }
            }
            if (options.size() < 3) {
                options = new ArrayList<>(List.of("예", "아니오", "잘 모르겠음", "기타(직접입력)"));
            }
            if (!"기타(직접입력)".equals(options.get(options.size() - 1))) {
                options.add("기타(직접입력)");
            }
            while (options.size() > 6) {
                options.remove(options.size() - 2);
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("question", q);
            entry.put("reason", String.valueOf(questionItem.getOrDefault("reason", "")).strip());
            String priority = String.valueOf(questionItem.getOrDefault("priority", "중간")).strip();
            entry.put("priority", priority.isEmpty() ? "중간" : priority);
            entry.put("options", options);
            String category = String.valueOf(questionItem.getOrDefault("category", "")).strip();
            if (!category.isEmpty()) {
                entry.put("category", category);
            }
            deduped.add(entry);
        }

        result.put("solutionQuestions", deduped);
        return result;
    }

    static Map<String, Object> normalizeQuestions(Map<String, Object> result, Set<String> priorQuestions) {
        return normalizeQuestions(result, priorQuestions, true, true);
    }

    static Map<String, Object> boostDeepQuestions(
            ExistingOwnerGraphState state,
            Map<String, Object> result,
            Set<String> prior,
            ExistingOwnerOpenAiClient openAiClient
    ) {
        List<String> categories = state.selectedCategories().orElse(List.of());
        int minTotal = Math.max(12, categories.size() * 3);
        Object existingRaw = result.get("solutionQuestions");
        List<Map<String, Object>> existing = new ArrayList<>();
        if (existingRaw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> q = (Map<String, Object>) map;
                    existing.add(q);
                }
            }
        }
        if (existing.size() >= minTotal) {
            return result;
        }

        int need = minTotal - existing.size();
        String boostPrompt = ExistingOwnerPromptBuilder.buildBoostDeepQuestionsPrompt(state, existing, categories, need);
        Map<String, Object> boost = openAiClient.invokeJson(boostPrompt, "BOOST", 2800);
        Object boostQsRaw = boost.get("solutionQuestions");
        if (boostQsRaw instanceof List<?> boostList) {
            for (Object item : boostList) {
                if (item instanceof Map<?, ?> map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> q = (Map<String, Object>) map;
                    existing.add(q);
                }
            }
        }
        Map<String, Object> merged = new LinkedHashMap<>();
        merged.put("isAnswerSufficient", false);
        merged.put("solutionQuestions", existing);
        return normalizeQuestions(merged, prior);
    }

    static Map<String, Object> finalizeDeepQuestionResult(
            ExistingOwnerGraphState state,
            Map<String, Object> result,
            Set<String> prior,
            ExistingOwnerOpenAiClient openAiClient
    ) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        if (!"deep".equals(ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase())) {
            return result;
        }

        List<String> categories = state.selectedCategories().orElse(List.of());
        int minTotal = Math.max(12, categories.size() * 3);
        int minAnswered = Math.max(10, categories.size() * 2);

        Object questionsRaw = result.get("solutionQuestions");
        List<?> questions = questionsRaw instanceof List<?> list ? list : List.of();
        int answered = ExistingOwnerTextUtils.countFollowupAnswers(answers);

        if (!questions.isEmpty()) {
            result.put("isAnswerSufficient", false);
        } else if (answered < minAnswered) {
            result.put("isAnswerSufficient", false);
        }

        if (questions.size() < minTotal && answered < minAnswered) {
            result = boostDeepQuestions(state, result, prior, openAiClient);
        }

        Object finalQs = result.get("solutionQuestions");
        if (finalQs instanceof List<?> finalList && !finalList.isEmpty()) {
            result.put("isAnswerSufficient", false);
        }

        return result;
    }
}
