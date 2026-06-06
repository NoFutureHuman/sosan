package com.example.sosangworkspace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * LangGraph 응답 → 프론트 계약.
 * 기존 사장님 최종 리포트는 (6)과 같이 existingSolution·categoryInsights 전체를 전달한다.
 */
@Component
public class LangGraphResponseMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String toFrontendJson(JsonNode langGraph, boolean existingFlow) throws Exception {
        List<JsonNode> questions = collectSolutionQuestions(langGraph);
        if (!questions.isEmpty()) {
            ObjectNode dynamic = buildDynamicQuestion(questions);
            if (dynamic.path("questions").size() > 0) {
                return objectMapper.writeValueAsString(dynamic);
            }
        }
        return objectMapper.writeValueAsString(buildResult(langGraph, existingFlow));
    }

    private List<JsonNode> collectSolutionQuestions(JsonNode root) {
        List<JsonNode> out = new ArrayList<>();
        JsonNode direct = root.path("solutionQuestions");
        if (direct.isArray()) {
            direct.forEach(out::add);
        }
        JsonNode pages = root.path("lightFollowupPages");
        if (pages.isArray()) {
            for (JsonNode page : pages) {
                JsonNode qs = page.path("solutionQuestions");
                if (qs.isArray()) {
                    qs.forEach(out::add);
                }
            }
        }
        return out;
    }

    private ObjectNode buildDynamicQuestion(List<JsonNode> solutionQuestions) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("type", "dynamic_question");
        ArrayNode questions = body.putArray("questions");
        for (JsonNode q : solutionQuestions) {
            String title = q.path("question").asText("").trim();
            if (title.isEmpty()) {
                continue;
            }
            ObjectNode item = questions.addObject();
            item.put("title", title);
            if (q.hasNonNull("category")) {
                item.put("category", q.path("category").asText());
            }
            if (q.has("options") && q.get("options").isArray()) {
                ArrayNode opts = item.putArray("options");
                q.get("options").forEach(opt -> {
                    String text = opt.asText("").trim();
                    if (!text.isEmpty()) {
                        opts.add(text);
                    }
                });
            }
        }
        return body;
    }

    private ObjectNode buildResult(JsonNode langGraph, boolean existingFlow) {
        if (existingFlow && langGraph.isObject()) {
            ObjectNode body = ((ObjectNode) langGraph).deepCopy();
            body.put("type", "result");
            body.put("isAnswerSufficient", true);
            if (!body.has("score") || body.get("score").isNull()) {
                int score = body.path("ragScores").path("overallReadinessScore").asInt(0);
                if (score <= 0) {
                    score = body.path("sbizAnalysis").path("overallScore").asInt(85);
                }
                if (score <= 0) {
                    score = 85;
                }
                body.put("score", score);
            }
            ensureImprovements(body);
            return body;
        }

        if (langGraph.isObject() && langGraph.has("fundingComparison")) {
            ObjectNode body = ((ObjectNode) langGraph).deepCopy();
            body.put("type", "result");
            return body;
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("type", "result");
        int score = langGraph.path("ragScores").path("overallReadinessScore").asInt(85);
        if (score <= 0) {
            score = langGraph.path("sbizAnalysis").path("overallScore").asInt(85);
        }
        if (score <= 0) {
            score = 85;
        }
        body.put("score", score);
        copyIfPresent(langGraph, body, "fundingComparison");
        copyIfPresent(langGraph, body, "sbizAnalysis");
        copyIfPresent(langGraph, body, "riskFactors");
        copyIfPresent(langGraph, body, "actionPlan");
        copyIfPresent(langGraph, body, "profitability");
        copyIfPresent(langGraph, body, "budgetBreakdown");
        copyIfPresent(langGraph, body, "rentEstimation");
        copyIfPresent(langGraph, body, "interiorPlan");
        copyIfPresent(langGraph, body, "trialRunPlan");
        copyIfPresent(langGraph, body, "steps");
        copyIfPresent(langGraph, body, "progressPercent");
        return body;
    }

    private void ensureImprovements(ObjectNode body) {
        if (body.has("improvements") && body.get("improvements").isArray()
                && body.get("improvements").size() > 0) {
            return;
        }
        ArrayNode improvements = body.putArray("improvements");
        JsonNode insights = body.path("categoryInsights");
        if (insights.isArray() && insights.size() > 0) {
            for (JsonNode insight : insights) {
                ObjectNode row = improvements.addObject();
                row.put("category", insight.path("category").asText("운영 개선"));
                row.put("solution", buildSolutionText(insight));
            }
            return;
        }
        if (body.has("existingSolution")) {
            JsonNode existing = body.get("existingSolution");
            ObjectNode row = improvements.addObject();
            row.put("category", "종합");
            row.put(
                    "solution",
                    existing.path("detailedGuide").asText(existing.path("summary").asText(""))
            );
        }
    }

    private String buildSolutionText(JsonNode insight) {
        StringBuilder sb = new StringBuilder();
        String summary = insight.path("summary").asText("").trim();
        if (!summary.isEmpty()) {
            sb.append(summary);
        }
        Iterator<JsonNode> actions = insight.path("actions").elements();
        int i = 0;
        while (actions.hasNext() && i < 3) {
            String action = actions.next().asText("").trim();
            if (!action.isEmpty()) {
                if (sb.length() > 0) {
                    sb.append("\n");
                }
                sb.append("• ").append(action);
                i++;
            }
        }
        return sb.length() > 0 ? sb.toString() : "선택 카테고리 맞춤 개선안을 적용하세요.";
    }

    private void copyIfPresent(JsonNode from, ObjectNode to, String field) {
        if (from.has(field) && !from.get(field).isNull()) {
            to.set(field, from.get(field));
        }
    }
}
