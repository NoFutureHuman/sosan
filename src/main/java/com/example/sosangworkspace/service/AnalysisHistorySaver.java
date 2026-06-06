package com.example.sosangworkspace.service;

import com.example.sosangworkspace.entity.AnalysisHistory;
import com.example.sosangworkspace.repository.AnalysisHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** analysis_history 저장 (기존 /run · 신생 /new 공통) */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalysisHistorySaver {

    private final AnalysisHistoryRepository historyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Long saveFromRunPayload(
            Map<String, Object> payload,
            String resultJson,
            boolean completed,
            Long userId
    ) {
        AnalysisHistory history = new AnalysisHistory();
        history.setUserId(userId);
        history.setUserType(stringValue(payload.get("userType"), "NEW"));
        history.setBusinessType(firstString(payload, "businessType", "bizType", "bizSubType"));
        history.setRegion(firstString(payload, "region"));
        history.setBudgetOrRevenue(firstString(payload, "financialScale", "budget", "revenue", "revenueTrend"));
        history.setOperationType(firstString(payload, "operationScale", "storeSize", "workers", "analysisMode", "operationPeriod"));
        history.setTargetOrDistrict(firstString(payload, "targetOrDistrict", "areaType", "region"));
        history.setPrimaryConcern(firstString(payload, "primaryConcern", "challenge", "opType"));
        history.setLlmResultJson(resultJson);
        history.setSelectedCategoriesJson(serializeCategories(extractCategories(payload)));
        history.setStatus(resolveRunStatus(resultJson, completed));
        return persist(history);
    }

    public Long saveNewStartupReport(Map<String, String> answers, String reportJson, Long userId) {
        AnalysisHistory history = new AnalysisHistory();
        history.setUserId(userId);
        history.setUserType("NEW");
        history.setBusinessType(firstString(answers, "bizType", "bizSubType", "businessType"));
        history.setRegion(firstString(answers, "region"));
        history.setBudgetOrRevenue(firstString(answers, "budget", "financialScale"));
        history.setOperationType(firstString(answers, "storeSize", "opType", "operationScale"));
        history.setTargetOrDistrict(firstString(answers, "areaType", "targetOrDistrict"));
        history.setPrimaryConcern(firstString(answers, "challenge", "opType", "primaryConcern"));
        history.setLlmResultJson(reportJson != null ? reportJson : "");
        history.setStatus(reportJson != null && !reportJson.isBlank() ? "COMPLETED" : "FAILED");
        return persist(history);
    }

    private Long persist(AnalysisHistory history) {
        AnalysisHistory saved = historyRepository.save(history);
        log.info("[DB] analysis_history 저장 id={}, userType={}", saved.getId(), saved.getUserType());
        return saved.getId();
    }

    private String resolveRunStatus(String resultJson, boolean completed) {
        if (!completed || !resultJson.contains("\"type\"")) {
            return "NEED_MORE_INPUT";
        }
        return resultJson.contains("\"type\":\"result\"") || resultJson.contains("\"type\": \"result\"")
                ? "COMPLETED"
                : "NEED_MORE_INPUT";
    }

    private String firstString(Map<?, ?> map, String... keys) {
        for (String key : keys) {
            Object value = map.get(key);
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }
        return "";
    }

    private String stringValue(Object value, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? defaultValue : text;
    }

    private List<String> extractCategories(Map<String, Object> payload) {
        List<String> categories = new ArrayList<>();
        Object raw = payload.get("selectedCategories");
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item == null) {
                    continue;
                }
                String text = String.valueOf(item).trim();
                if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                    categories.add(text);
                }
            }
        } else if (raw != null) {
            String text = String.valueOf(raw).trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                categories.add(text);
            }
        }
        return categories;
    }

    private String serializeCategories(List<String> categories) {
        if (categories == null || categories.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(categories);
        } catch (Exception e) {
            log.warn("[DB] selectedCategories 직렬화 실패: {}", e.getMessage());
            return null;
        }
    }
}
