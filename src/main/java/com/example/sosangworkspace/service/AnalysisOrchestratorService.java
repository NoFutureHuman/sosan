package com.example.sosangworkspace.service;

import com.example.sosangworkspace.domain.AnalysisStatus;
import com.example.sosangworkspace.entity.AnalysisReport;
import com.example.sosangworkspace.repository.AnalysisReportRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class AnalysisOrchestratorService {

    private final AnalysisReportRepository repository;
    private final ExternalApiService externalApiService;
    private final LangGraphClientService langGraphClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AnalysisOrchestratorService(
            AnalysisReportRepository repository,
            ExternalApiService externalApiService,
            LangGraphClientService langGraphClientService
    ) {
        this.repository = repository;
        this.externalApiService = externalApiService;
        this.langGraphClientService = langGraphClientService;
    }

    public Map<String, Object> runNextStep(Map<String, Object> request) throws Exception {
        Long reportId = parseLong(request.get("reportId"));
        String flowType = String.valueOf(request.getOrDefault("flowType", "new"));

        Map<String, Object> answers = castMap(request.get("answers"));
        if (answers == null) answers = new LinkedHashMap<>();

        Map<String, Object> followupAnswers = castMap(request.get("followupAnswers"));
        if (followupAnswers != null) {
            answers.putAll(followupAnswers);
        }

        List<String> selectedCategories = castStringList(request.get("selectedCategories"));

        AnalysisReport report = getOrCreateReport(reportId, flowType, answers, followupAnswers);

        // 1) PENDING 저장 완료 후 API 수집
        Map<String, Object> apiFacts = collectApiFacts(answers, flowType);
        report.setApiFactsJson(objectMapper.writeValueAsString(apiFacts));
        report.setStatus(AnalysisStatus.API_COLLECTED);
        report.setUpdatedAt(LocalDateTime.now());
        repository.save(report);

        // 2) LLM 판단
        JsonNode llmJson = runLangGraph(answers, apiFacts, flowType, selectedCategories);
        llmJson = deduplicateSolutionQuestions(llmJson);

        boolean isSufficient = llmJson.path("isAnswerSufficient").asBoolean(false);
        String resultJson = objectMapper.writeValueAsString(llmJson);
        report.setResultJson(resultJson);
        report.setStatus(isSufficient ? AnalysisStatus.COMPLETED : AnalysisStatus.NEED_MORE_INPUT);
        report.setUpdatedAt(LocalDateTime.now());
        repository.save(report);

        Map<String, Object> response = objectMapper.convertValue(llmJson, new TypeReference<>() {});
        response.put("reportId", report.getId());
        response.put("status", report.getStatus().name());
        return response;
    }

    private AnalysisReport getOrCreateReport(
            Long reportId,
            String flowType,
            Map<String, Object> answers,
            Map<String, Object> followupAnswers
    ) throws Exception {
        if (reportId != null) {
            Optional<AnalysisReport> existing = repository.findById(reportId);
            if (existing.isPresent()) {
                AnalysisReport report = existing.get();
                report.setFixedAnswersJson(objectMapper.writeValueAsString(answers));
                if (followupAnswers != null) {
                    report.setFollowupAnswersJson(objectMapper.writeValueAsString(followupAnswers));
                }
                report.setUpdatedAt(LocalDateTime.now());
                return repository.save(report);
            }
        }

        AnalysisReport report = new AnalysisReport();
        report.setFlowType(flowType);
        report.setStatus(AnalysisStatus.PENDING);
        report.setFixedAnswersJson(objectMapper.writeValueAsString(answers));
        report.setFollowupAnswersJson(followupAnswers == null ? "{}" : objectMapper.writeValueAsString(followupAnswers));
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        return repository.save(report);
    }

    private Map<String, Object> collectApiFacts(Map<String, Object> answers, String flowType) {
        String region = String.valueOf(answers.getOrDefault("region", ""));
        String bizType = String.valueOf(answers.getOrDefault("bizType", ""));
        String challenge = String.valueOf(answers.getOrDefault("challenge", ""));

        Map<String, Object> apiFacts = new LinkedHashMap<>();
        apiFacts.put("flowType", flowType);
        apiFacts.put("region", region);
        apiFacts.put("bizType", bizType);
        apiFacts.put("challenge", challenge);
        apiFacts.put("commercial", region.isBlank() ? null : externalApiService.fetchCommercialContext(region, fallbackSigunguCode()));
        apiFacts.put("sbiz", region.isBlank() ? null : externalApiService.fetchSbizStores(region, fallbackSigunguCode(), bizType));
        apiFacts.put("rone", region.isBlank() ? null : externalApiService.fetchRoneRentData(region));
        apiFacts.put("bizinfo", externalApiService.fetchBizinfoSupport(bizType));
        return apiFacts;
    }

    private JsonNode runLangGraph(
            Map<String, Object> answers,
            Map<String, Object> apiFacts,
            String flowType,
            List<String> selectedCategories
    ) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("answers", answers);
        payload.put("apiFacts", apiFacts);
        payload.put("flowType", flowType);
        payload.put("selectedCategories", selectedCategories);
        return langGraphClientService.runAnalysis(payload);
    }

    private JsonNode deduplicateSolutionQuestions(JsonNode llmJson) {
        if (!(llmJson instanceof ObjectNode root)) {
            return llmJson;
        }

        JsonNode questionsNode = root.path("solutionQuestions");
        if (!questionsNode.isArray()) {
            return llmJson;
        }

        ArrayNode source = (ArrayNode) questionsNode;
        ArrayNode deduped = objectMapper.createArrayNode();
        Set<String> seen = new HashSet<>();

        for (JsonNode questionNode : source) {
            if (!(questionNode instanceof ObjectNode qObj)) {
                continue;
            }
            String question = qObj.path("question").asText("").trim();
            if (question.isBlank()) {
                continue;
            }
            String normalized = question.replaceAll("\\s+", " ").toLowerCase();
            if (seen.contains(normalized)) {
                continue;
            }
            seen.add(normalized);
            deduped.add(qObj);
        }

        root.set("solutionQuestions", deduped);
        return root;
    }

    private static String fallbackSigunguCode() {
        // 프론트에서도 코드를 계산하지만, 백엔드 수집 실패를 줄이기 위한 최소 폴백
        // 맵 매칭 실패 시 서울 강남구 코드 사용
        return "11680";
    }

    private static Long parseLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (!(value instanceof String text)) {
            return null;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<String> castStringList(Object value) {
        if (value instanceof List<?> list) {
            return (List<String>) list;
        }
        return List.of();
    }
}
