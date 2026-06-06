package com.example.sosangworkspace.existinggraph;

import java.util.List;
import java.util.Map;

final class ExistingOwnerGraphRouter {

    private ExistingOwnerGraphRouter() {
    }

    static String shouldGenerateReport(ExistingOwnerGraphState state) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        String mode = ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase();
        Map<String, Object> result = state.questionResult().orElse(Map.of());
        Object questionsRaw = result.get("solutionQuestions");
        List<?> qList = questionsRaw instanceof List<?> list ? list : List.of();

        if ("deep".equals(mode)) {
            Object pagesRaw = result.get("lightFollowupPages");
            if (pagesRaw instanceof List<?> pages) {
                for (Object pageObj : pages) {
                    if (pageObj instanceof Map<?, ?> pageMap) {
                        Object pqsRaw = pageMap.get("solutionQuestions");
                        if (pqsRaw instanceof List<?> pqs && !pqs.isEmpty()) {
                            return "finalize_insufficient_node";
                        }
                    }
                }
            }
            if (!qList.isEmpty()) {
                return "finalize_insufficient_node";
            }
            List<String> categories = state.selectedCategories().orElse(List.of());
            int minAnswered = Math.max(10, categories.size() * 2);
            int answered = ExistingOwnerTextUtils.countFollowupAnswers(answers);
            boolean sufficient = Boolean.TRUE.equals(result.get("isAnswerSufficient"));
            if (sufficient && answered >= minAnswered) {
                return "report_node";
            }
            return "finalize_insufficient_node";
        }

        if ("light".equals(mode)) {
            Object pagesRaw = result.get("lightFollowupPages");
            if (pagesRaw instanceof List<?> pages) {
                for (Object pageObj : pages) {
                    if (pageObj instanceof Map<?, ?> pageMap) {
                        Object pqsRaw = pageMap.get("solutionQuestions");
                        if (pqsRaw instanceof List<?> pqs && !pqs.isEmpty()) {
                            return "finalize_insufficient_node";
                        }
                    }
                }
            }
            if (!qList.isEmpty()) {
                return "finalize_insufficient_node";
            }
            if (Boolean.TRUE.equals(result.get("isAnswerSufficient"))) {
                return "report_node";
            }
            return "finalize_insufficient_node";
        }

        Map<String, Object> ragScores = state.ragScores().orElse(Map.of());
        Object readinessRaw = ragScores.get("overallReadinessScore");
        int readiness = readinessRaw instanceof Number n ? n.intValue() : 0;
        boolean isSufficient = Boolean.TRUE.equals(result.get("isAnswerSufficient")) && readiness >= 70;
        return isSufficient ? "report_node" : "finalize_insufficient_node";
    }
}
