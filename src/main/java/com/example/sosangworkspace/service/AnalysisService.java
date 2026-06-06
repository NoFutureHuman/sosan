package com.example.sosangworkspace.service;

import com.example.sosangworkspace.existinggraph.ExistingOwnerAnalysisService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final ExistingOwnerAnalysisService existingOwnerAnalysisService;
    private final LangGraphResponseMapper langGraphResponseMapper;
    private final AnalysisHistorySaver historySaver;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public String runWorkflow(Map<String, Object> payload, Long userId) throws Exception {
        String userType = String.valueOf(payload.getOrDefault("userType", "NEW"));
        boolean forceReport = Boolean.TRUE.equals(payload.get("forceReport"));
        boolean hasUserAnswers =
                payload.containsKey("userAnswers") && payload.get("userAnswers") != null;
        boolean existingFlow = "EXISTING".equalsIgnoreCase(userType);

        System.out.println("\n🚀 [ExistingOwner/Java] 유저=" + userType
                + ", forceReport=" + forceReport
                + ", hasUserAnswers=" + hasUserAnswers);

        Map<String, Object> answers = new LinkedHashMap<>(payload);
        Map<String, Object> apiFacts = buildApiFacts(payload);
        List<String> selectedCategories = extractCategories(payload);
        String flowType = existingFlow ? "existing" : "new";
        boolean runForceReport = forceReport || hasUserAnswers;

        Map<String, Object> llmResult = existingOwnerAnalysisService.run(
                answers,
                apiFacts,
                flowType,
                selectedCategories,
                runForceReport
        );
        JsonNode langGraphResult = objectMapper.valueToTree(llmResult);
        String resultJson = langGraphResponseMapper.toFrontendJson(langGraphResult, existingFlow);

        return saveHistoryAndEnrich(payload, resultJson, forceReport || hasUserAnswers, userId);
    }

    private List<String> extractCategories(Map<String, Object> payload) {
        Object raw = payload.get("selectedCategories");
        List<String> categories = new ArrayList<>();
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    String text = String.valueOf(item).trim();
                    if (!text.isEmpty()) {
                        categories.add(text);
                    }
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

    private Map<String, Object> buildApiFacts(Map<String, Object> payload) {
        Map<String, Object> apiFacts = new LinkedHashMap<>();
        Object fromClient = payload.get("apiFacts");
        if (fromClient instanceof Map<?, ?> map) {
            map.forEach((k, v) -> apiFacts.put(String.valueOf(k), v));
        }
        if (apiFacts.isEmpty()) {
            apiFacts.put("ragSummary", fetchRagSummary(payload));
            apiFacts.put("region", firstString(payload, "region"));
            apiFacts.put("bizType", firstString(payload, "bizType", "bizSubType", "businessType"));
        }
        return apiFacts;
    }

    private String fetchRagSummary(Map<String, Object> payload) {
        String userType = String.valueOf(payload.getOrDefault("userType", "NEW"));
        StringBuilder rag = new StringBuilder();
        if ("NEW".equals(userType)) {
            rag.append("해당 지역 보증금 시세 3000만, 월세 150만. 소상공인 정책 대출 최고 5000만 원 한도 가능.");
        } else {
            rag.append("상권 평균 객단가 18,000원, 인근 경쟁점 42개 포화. 배달 앱 수수료 9.8%.");
            String region = firstString(payload, "region");
            String biz = firstString(payload, "bizType", "businessType");
            if (!region.isEmpty()) {
                rag.append(" 지역=").append(region);
            }
            if (!biz.isEmpty()) {
                rag.append(" 업종=").append(biz);
            }
            Object cats = payload.get("selectedCategories");
            if (cats != null) {
                rag.append(" 선택카테고리=").append(cats);
            }
        }
        return rag.toString().trim();
    }

    private String saveHistoryAndEnrich(
            Map<String, Object> payload,
            String resultJson,
            boolean completed,
            Long userId
    ) {
        String jsonToStore = enrichResultForStorage(payload, resultJson);
        Long historyId = historySaver.saveFromRunPayload(payload, jsonToStore, completed, userId);

        try {
            Map<String, Object> body = objectMapper.readValue(
                    jsonToStore,
                    new TypeReference<LinkedHashMap<String, Object>>() {}
            );
            body.put("historyId", historyId);
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            System.out.println("⚠️ historyId 병합 실패: " + e.getMessage());
            return jsonToStore;
        }
    }

    private String enrichResultForStorage(Map<String, Object> payload, String resultJson) {
        try {
            Map<String, Object> body = objectMapper.readValue(
                    resultJson,
                    new TypeReference<LinkedHashMap<String, Object>>() {}
            );
            Object categories = payload.get("selectedCategories");
            if (categories != null) {
                body.put("selectedCategories", categories);
            }
            if (payload.get("analysisMode") != null) {
                body.put("analysisMode", payload.get("analysisMode"));
            }
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            System.out.println("⚠️ selectedCategories 병합 실패: " + e.getMessage());
            return resultJson;
        }
    }

    private String firstString(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
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
}
