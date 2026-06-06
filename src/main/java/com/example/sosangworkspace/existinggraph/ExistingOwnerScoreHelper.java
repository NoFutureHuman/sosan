package com.example.sosangworkspace.existinggraph;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class ExistingOwnerScoreHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ExistingOwnerScoreHelper() {
    }

    static Map<String, Object> computeRagScores(ExistingOwnerGraphState state) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        Map<String, Object> apiFacts = state.apiFacts().orElse(Map.of());

        int fixedScore = ExistingOwnerTextUtils.scorePresence(
                answers.get("region"),
                answers.get("bizType"),
                answers.get("challenge")
        );

        List<String[]> followupPairs = new ArrayList<>();
        for (Map.Entry<String, Object> entry : answers.entrySet()) {
            String key = entry.getKey();
            if (key != null && key.startsWith("followup_") && !key.startsWith("followup_question_")) {
                String suffix = key.substring("followup_".length());
                String ans = ExistingOwnerTextUtils.toStr(entry.getValue()).strip();
                String q = ExistingOwnerTextUtils.toStr(answers.get("followup_question_" + suffix)).strip();
                followupPairs.add(new String[]{ans, q});
            }
        }
        int followupAnswered = 0;
        for (String[] pair : followupPairs) {
            if (!pair[0].isEmpty() && !pair[1].isEmpty()) {
                followupAnswered++;
            }
        }
        int followupScore = followupPairs.isEmpty()
                ? 100
                : (int) ((double) followupAnswered / followupPairs.size() * 100);

        Object commercial = apiFacts.get("commercial");
        Object sbiz = apiFacts.get("sbiz");
        Object rone = apiFacts.get("rone");
        Object bizinfo = apiFacts.get("bizinfo");
        int apiScore = ExistingOwnerTextUtils.scorePresence(
                commercial != null ? commercial : "",
                sbiz != null ? sbiz : "",
                rone != null ? rone : "",
                bizinfo != null ? bizinfo : ""
        );

        String analysisMode = ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase();
        int posScore = 100;
        if ("deep".equals(analysisMode)) {
            if ("csv".equals(ExistingOwnerTextUtils.toStr(answers.get("posInputSource")).strip().toLowerCase())) {
                String csvSummary = ExistingOwnerTextUtils.toStr(answers.get("posCsvSummary")).strip();
                String rowRaw = ExistingOwnerTextUtils.toStr(answers.get("posCsvRowCount")).strip();
                if (!csvSummary.isEmpty() && rowRaw.matches("\\d+")) {
                    int rows = Integer.parseInt(rowRaw);
                    posScore = Math.min(100, 75 + Math.min(25, rows / 80));
                } else if (!csvSummary.isEmpty()) {
                    posScore = 85;
                } else {
                    posScore = 35;
                }
            } else {
                List<String> posValues = new ArrayList<>();
                for (String key : ExistingOwnerConstants.POS_METRIC_LABELS.keySet()) {
                    posValues.add(ExistingOwnerTextUtils.toStr(answers.get(key)));
                }
                Object labeledRaw = answers.get("posMetricsLabeled");
                if (labeledRaw instanceof String labeledStr && !labeledStr.strip().isEmpty()) {
                    try {
                        Map<String, Object> labeled = MAPPER.readValue(labeledStr, new TypeReference<>() {});
                        if (labeled != null && !labeled.isEmpty()) {
                            posScore = (int) ((double) labeled.size()
                                    / Math.max(1, ExistingOwnerConstants.POS_METRIC_LABELS.size()) * 100);
                        }
                    } catch (Exception e) {
                        posScore = ExistingOwnerTextUtils.scorePresence(posValues.toArray());
                    }
                } else {
                    posScore = ExistingOwnerTextUtils.scorePresence(posValues.toArray());
                }
            }
        }

        int weightedTotal;
        List<String[]> axisScores = new ArrayList<>();
        if ("deep".equals(analysisMode)) {
            weightedTotal = (int) (fixedScore * 0.25 + followupScore * 0.25 + apiScore * 0.25 + posScore * 0.25);
            axisScores.add(new String[]{"fixed", String.valueOf(fixedScore)});
            axisScores.add(new String[]{"followup", String.valueOf(followupScore)});
            axisScores.add(new String[]{"api", String.valueOf(apiScore)});
            axisScores.add(new String[]{"pos", String.valueOf(posScore)});
        } else {
            weightedTotal = (int) (fixedScore * 0.35 + followupScore * 0.30 + apiScore * 0.35);
            axisScores.add(new String[]{"fixed", String.valueOf(fixedScore)});
            axisScores.add(new String[]{"followup", String.valueOf(followupScore)});
            axisScores.add(new String[]{"api", String.valueOf(apiScore)});
        }

        List<String> insufficientAxes = new ArrayList<>();
        for (String[] axis : axisScores) {
            if (Integer.parseInt(axis[1]) < 70) {
                insufficientAxes.add(axis[0]);
            }
        }

        Map<String, Object> ragScores = new LinkedHashMap<>();
        ragScores.put("fixedQuestionCoverage", fixedScore);
        ragScores.put("generatedQuestionCoverage", followupScore);
        ragScores.put("apiFactCoverage", apiScore);
        ragScores.put("posMetricsCoverage", "deep".equals(analysisMode) ? posScore : null);
        ragScores.put("overallReadinessScore", weightedTotal);
        ragScores.put("insufficientAxes", insufficientAxes);
        return ragScores;
    }
}
