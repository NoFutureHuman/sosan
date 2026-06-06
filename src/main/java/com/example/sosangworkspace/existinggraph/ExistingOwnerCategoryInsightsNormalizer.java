package com.example.sosangworkspace.existinggraph;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class ExistingOwnerCategoryInsightsNormalizer {

    private ExistingOwnerCategoryInsightsNormalizer() {
    }

    static Map<String, Object> normalizeCategoryInsights(Map<String, Object> report, List<String> categories) {
        if (categories == null || categories.isEmpty()) {
            return report;
        }

        Object raw = report.get("categoryInsights");
        List<?> rawList = raw instanceof List<?> list ? list : List.of();

        Map<String, Map<String, Object>> byNorm = new LinkedHashMap<>();
        for (Object item : rawList) {
            if (!(item instanceof Map<?, ?> rawMap)) {
                continue;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> insight = (Map<String, Object>) rawMap;
            String cat = ExistingOwnerTextUtils.toStr(insight.get("category")).strip();
            if (cat.isEmpty()) {
                continue;
            }
            byNorm.put(ExistingOwnerTextUtils.normalizeCategoryLabel(cat), insight);
        }

        List<Map<String, Object>> normalized = new ArrayList<>();
        for (String cat : categories) {
            String key = ExistingOwnerTextUtils.normalizeCategoryLabel(cat);
            Map<String, Object> picked = byNorm.get(key);
            if (picked == null) {
                for (Map.Entry<String, Map<String, Object>> entry : byNorm.entrySet()) {
                    String normKey = entry.getKey();
                    if (key.contains(normKey) || normKey.contains(key)) {
                        picked = entry.getValue();
                        break;
                    }
                }
            }

            String summary = ExistingOwnerTextUtils.toStr((picked != null ? picked.get("summary") : null)).strip();
            Object signalsRaw = picked != null ? picked.get("signals") : null;
            Object actionsRaw = picked != null ? picked.get("actions") : null;

            List<String> signals = new ArrayList<>();
            if (signalsRaw instanceof List<?> signalList) {
                for (Object s : signalList) {
                    String text = String.valueOf(s).strip();
                    if (!text.isEmpty()) {
                        signals.add(text);
                    }
                }
            }

            List<String> actions = new ArrayList<>();
            if (actionsRaw instanceof List<?> actionList) {
                for (Object a : actionList) {
                    String text = String.valueOf(a).strip();
                    if (!text.isEmpty()) {
                        actions.add(text);
                    }
                }
            }

            if (summary.isEmpty() && !signals.isEmpty()) {
                summary = signals.get(0).length() > 160 ? signals.get(0).substring(0, 160) : signals.get(0);
            }
            if (summary.isEmpty() && !actions.isEmpty()) {
                summary = actions.get(0).length() > 160 ? actions.get(0).substring(0, 160) : actions.get(0);
            }
            if (summary.isEmpty()) {
                summary = cat + " 영역 맞춤 진단";
            }

            if (signals.isEmpty()) {
                if (!actions.isEmpty()) {
                    signals.add("핵심 실행: " + (actions.get(0).length() > 100 ? actions.get(0).substring(0, 100) : actions.get(0)));
                    if (actions.size() > 1) {
                        signals.add("보완 실행: " + (actions.get(1).length() > 100 ? actions.get(1).substring(0, 100) : actions.get(1)));
                    }
                } else {
                    signals.add(cat + " 영역은 현재 응답·POS/CSV·API 데이터를 바탕으로 우선순위 실행이 필요합니다.");
                }
            }

            if (actions.isEmpty()) {
                actions.add(cat + " 1순위: " + (signals.get(0).length() > 90 ? signals.get(0).substring(0, 90) : signals.get(0)));
                actions.add(cat + " 2주 내 점검 지표를 정하고 실행 일정을 고정하세요.");
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", cat);
            entry.put("summary", summary);
            entry.put("signals", signals.size() > 5 ? signals.subList(0, 5) : signals);
            entry.put("actions", actions.size() > 6 ? actions.subList(0, 6) : actions);
            normalized.add(entry);
        }

        report.put("categoryInsights", normalized);
        return report;
    }
}
