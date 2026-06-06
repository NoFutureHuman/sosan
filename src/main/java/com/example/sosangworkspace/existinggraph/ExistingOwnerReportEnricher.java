package com.example.sosangworkspace.existinggraph;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AI 리포트 JSON에 existingSolution이 비어 있을 때 categoryInsights로 보강한다.
 */
final class ExistingOwnerReportEnricher {

    private ExistingOwnerReportEnricher() {
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> enrichExistingSolution(Map<String, Object> report) {
        if (report == null) {
            return Map.of();
        }
        Map<String, Object> next = new LinkedHashMap<>(report);

        Map<String, Object> existing = new LinkedHashMap<>();
        Object esRaw = next.get("existingSolution");
        if (esRaw instanceof Map<?, ?> esMap) {
            esMap.forEach((k, v) -> existing.put(String.valueOf(k), v));
        }

        String summary = ExistingOwnerTextUtils.toStr(existing.get("summary")).strip();
        List<String> actionItems = stringList(existing.get("actionItems"));
        String detailedGuide = ExistingOwnerTextUtils.toStr(existing.get("detailedGuide")).strip();

        Object insightsRaw = next.get("categoryInsights");
        List<Map<String, Object>> insights = new ArrayList<>();
        if (insightsRaw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    insights.add((Map<String, Object>) map);
                }
            }
        }

        if (summary.isEmpty() && !insights.isEmpty()) {
            summary = insights.stream()
                    .map(i -> ExistingOwnerTextUtils.toStr(i.get("summary")).strip())
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(" "));
        }

        if (actionItems.isEmpty() && !insights.isEmpty()) {
            for (Map<String, Object> insight : insights) {
                actionItems.addAll(stringList(insight.get("actions")));
                if (actionItems.size() >= 6) {
                    break;
                }
            }
            actionItems = actionItems.stream().limit(6).collect(Collectors.toList());
        }

        if (detailedGuide.isEmpty() && !insights.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> insight : insights) {
                String cat = ExistingOwnerTextUtils.toStr(insight.get("category")).strip();
                String catSummary = ExistingOwnerTextUtils.toStr(insight.get("summary")).strip();
                if (sb.length() > 0) {
                    sb.append("\n\n");
                }
                sb.append("【").append(cat.isEmpty() ? "분석" : cat).append("】");
                if (!catSummary.isEmpty()) {
                    sb.append("\n").append(catSummary);
                }
                for (String signal : stringList(insight.get("signals"))) {
                    sb.append("\n· ").append(signal);
                }
                for (String action : stringList(insight.get("actions"))) {
                    sb.append("\n→ ").append(action);
                }
            }
            detailedGuide = sb.toString().strip();
        }

        if (!summary.isEmpty() || !actionItems.isEmpty() || !detailedGuide.isEmpty()) {
            existing.put("summary", summary);
            existing.put("actionItems", actionItems);
            existing.put("detailedGuide", detailedGuide);
            next.put("existingSolution", existing);
        }

        return next;
    }

    private static List<String> stringList(Object raw) {
        List<String> out = new ArrayList<>();
        if (!(raw instanceof List<?> list)) {
            return out;
        }
        for (Object item : list) {
            String text = String.valueOf(item).strip();
            if (!text.isEmpty()) {
                out.add(text);
            }
        }
        return out;
    }
}
