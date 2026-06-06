package com.example.sosangworkspace.existinggraph;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

final class ExistingOwnerContextBuilder {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ExistingOwnerContextBuilder() {
    }

    static Map<String, Object> compactApiFacts(Map<String, Object> apiFacts) {
        Map<String, Object> compact = new LinkedHashMap<>();
        if (apiFacts == null) {
            return compact;
        }
        for (Map.Entry<String, Object> entry : apiFacts.entrySet()) {
            Object value = entry.getValue();
            if (value == null) {
                compact.put(entry.getKey(), null);
                continue;
            }
            String text;
            if (value instanceof Map || value instanceof List) {
                text = ExistingOwnerJsonUtils.toCompactJson(value);
            } else {
                text = String.valueOf(value);
            }
            compact.put(entry.getKey(), text.length() > 600 ? text.substring(0, 600) + "..." : text);
        }
        return compact;
    }

    static Map<String, Object> compactAnswersForPrompt(Map<String, Object> answers) {
        Map<String, Object> compact = new LinkedHashMap<>();
        if (answers != null) {
            compact.putAll(answers);
        }
        compact.remove("posCsvSample");
        String summary = ExistingOwnerTextUtils.toStr(compact.get("posCsvSummary")).strip();
        if (summary.length() > 3200) {
            compact.put("posCsvSummary", summary.substring(0, 3200) + "...(요약 일부)");
        }
        return compact;
    }

    static String baseContext(ExistingOwnerGraphState state, boolean compact) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        Object answersPayload = compact ? compactAnswersForPrompt(answers) : answers;
        String answersJson = ExistingOwnerJsonUtils.toCompactJson(answersPayload);
        if (compact && answersJson.length() > 14000) {
            answersJson = answersJson.substring(0, 14000) + "...(답변 일부)";
        }
        String apiJson = ExistingOwnerJsonUtils.toCompactJson(
                compactApiFacts(state.apiFacts().orElse(Map.of()))
        );
        String scoreJson = ExistingOwnerJsonUtils.toCompactJson(state.ragScores().orElse(Map.of()));
        String categoriesJson = ExistingOwnerJsonUtils.toCompactJson(state.selectedCategories().orElse(List.of()));
        String flowType = state.flowType().orElse("new");
        String posBlock = posMetricsBlock(answers, compact);

        return """
                분석 유형(flowType): %s
                선택 카테고리(existing일 때만 제약): %s

                [사용자 답변]
                %s
                %s

                [API 팩트 데이터]
                %s

                [RAG 비교 점수]
                %s
                """.formatted(flowType, categoriesJson, answersJson, posBlock, apiJson, scoreJson).strip();
    }

    static Set<String> extractPriorFollowupQuestions(Map<String, Object> answers) {
        Set<String> prior = new java.util.HashSet<>();
        if (answers == null) {
            return prior;
        }
        for (Map.Entry<String, Object> entry : answers.entrySet()) {
            String key = entry.getKey();
            if (key == null || !key.startsWith("followup_question_")) {
                continue;
            }
            String norm = ExistingOwnerTextUtils.normalizeQuestionText(entry.getValue());
            if (!norm.isEmpty()) {
                prior.add(norm);
            }
        }
        return prior;
    }

    static String priorFollowupBlock(ExistingOwnerGraphState state) {
        Map<String, Object> answers = state.answers().orElse(Map.of());
        List<String> lines = new ArrayList<>();
        Set<String> seen = new java.util.HashSet<>();

        TreeMap<String, Object> sorted = new TreeMap<>(answers);
        for (Map.Entry<String, Object> entry : sorted.entrySet()) {
            String key = entry.getKey();
            if (key == null || !key.startsWith("followup_question_")) {
                continue;
            }
            String text = String.valueOf(entry.getValue()).strip();
            String norm = ExistingOwnerTextUtils.normalizeQuestionText(text);
            if (text.isEmpty() || seen.contains(norm)) {
                continue;
            }
            seen.add(norm);
            lines.add("- " + text);
        }
        if (lines.isEmpty()) {
            return "";
        }
        return "\n[이미 제출한 추가질문 - 아래와 동일·유사한 문장은 다시 생성하지 말 것]\n"
                + String.join("\n", lines);
    }

    static String posMetricsBlock(Map<String, Object> answers, boolean compact) {
        if (!"deep".equals(ExistingOwnerTextUtils.toStr(answers.get("analysisMode")).strip().toLowerCase())) {
            return "";
        }

        String source = ExistingOwnerTextUtils.toStr(answers.getOrDefault("posInputSource", "manual")).strip().toLowerCase();
        String sourceLabel = "csv".equals(source) ? "CSV 업로드" : "수기 입력";
        String header = "\n[집중분석 POS/CSV 데이터 (" + sourceLabel + ") — 추가질문·최종 솔루션 생성 시 반드시 근거로 활용]\n";

        String csvSummary = ExistingOwnerTextUtils.toStr(answers.get("posCsvSummary")).strip();
        if ("csv".equals(source) && !csvSummary.isEmpty()) {
            List<String> parts = new ArrayList<>();
            String fileName = ExistingOwnerTextUtils.toStr(answers.get("posCsvFileName")).strip();
            String rowCount = ExistingOwnerTextUtils.toStr(answers.get("posCsvRowCount")).strip();
            String columns = ExistingOwnerTextUtils.toStr(answers.get("posCsvColumns")).strip();
            if (!fileName.isEmpty()) {
                parts.add("- 파일명: " + fileName);
            }
            if (!rowCount.isEmpty()) {
                parts.add("- 데이터 행 수: " + rowCount);
            }
            if (!columns.isEmpty()) {
                parts.add("- 컬럼: " + columns.replace("|", ", "));
            }
            parts.add("- CSV 자동 요약(임의 형식 POS·결제·매출 파일 해석):");
            int summaryLimit = compact ? 2800 : 7000;
            parts.add(csvSummary.length() > summaryLimit ? csvSummary.substring(0, summaryLimit) : csvSummary);
            if (!compact) {
                String sample = ExistingOwnerTextUtils.toStr(answers.get("posCsvSample")).strip();
                if (!sample.isEmpty()) {
                    parts.add("\n- CSV 원본 샘플(일부 행):");
                    parts.add(sample.length() > 4500 ? sample.substring(0, 4500) : sample);
                }
            }
            return header + String.join("\n", parts);
        }

        List<String> lines = new ArrayList<>();
        Object rawLabeled = answers.get("posMetricsLabeled");
        if (rawLabeled instanceof String labeledStr && !labeledStr.strip().isEmpty()) {
            try {
                Map<String, Object> labeled = MAPPER.readValue(labeledStr, new TypeReference<>() {});
                for (Map.Entry<String, Object> entry : labeled.entrySet()) {
                    String text = ExistingOwnerTextUtils.toStr(entry.getValue()).strip();
                    if (!text.isEmpty()) {
                        lines.add("- " + entry.getKey() + ": " + text);
                    }
                }
            } catch (Exception ignored) {
                // pass
            }
        }

        if (lines.isEmpty()) {
            for (Map.Entry<String, String> entry : ExistingOwnerConstants.POS_METRIC_LABELS.entrySet()) {
                String text = ExistingOwnerTextUtils.toStr(answers.get(entry.getKey())).strip();
                if (!text.isEmpty()) {
                    lines.add("- " + entry.getValue() + ": " + text);
                }
            }
        }

        if (lines.isEmpty()) {
            return "";
        }
        return header + String.join("\n", lines);
    }
}
