package com.example.sosangworkspace.existinggraph;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class ExistingOwnerEmptyReportPayload {

    private ExistingOwnerEmptyReportPayload() {
    }

    static Map<String, Object> emptyReportPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("existingSolution", Map.of(
                "summary", "",
                "actionItems", List.of(),
                "detailedGuide", ""
        ));
        payload.put("categoryInsights", List.of());
        payload.put("fundingComparison", List.of());
        payload.put("sbizAnalysis", Map.of(
                "summary", "",
                "storeBreakdown", List.of(),
                "competitionLevel", "",
                "overallScore", 70,
                "locationRecommendations", List.of()
        ));
        payload.put("riskFactors", List.of());
        payload.put("actionPlan", List.of());
        payload.put("profitability", List.of());
        payload.put("budgetBreakdown", List.of());
        payload.put("rentEstimation", Map.of(
                "basis", "",
                "estimatedDeposit", "",
                "estimatedMonthlyRent", "",
                "bySize", List.of(),
                "tips", List.of()
        ));
        payload.put("interiorPlan", Map.of(
                "style", "",
                "styleDesc", "",
                "estimatedCost", "",
                "items", List.of(),
                "aiTips", List.of()
        ));
        payload.put("trialRunPlan", Map.of(
                "phases", List.of(),
                "feedbackChannels", List.of(),
                "warningSignals", List.of()
        ));
        return payload;
    }
}
