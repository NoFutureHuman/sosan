package com.example.sosangworkspace.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * KAMIS (농산물유통정보) API 프록시.
 * 식재료 실시간 시세를 반환한다.
 *
 * GET /api/market/ingredients  — 서울 기준 주요 품목 시세 (KAMIS dailyCountyList)
 */
@Slf4j
@RestController
@RequestMapping("/api/market")
public class MarketController {

    @Value("${kamis.api.key:}")
    private String kamisApiKey;

    @Value("${kamis.api.cert-id:2024}")
    private String kamisCertId;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<String, String> CATEGORY_CODE_MAP = Map.of(
            "채소", "200",
            "과일", "400",
            "축산물", "500",
            "수산물", "600",
            "곡물/유제품", "100"
    );

    private static final Map<String, String> CODE_CATEGORY_MAP = Map.of(
            "100", "곡물/유제품",
            "200", "채소",
            "400", "과일",
            "500", "축산물",
            "600", "수산물"
    );

    @GetMapping("/ingredients")
    public ResponseEntity<Map<String, Object>> getIngredients(
            @RequestParam(defaultValue = "전체") String category,
            @RequestParam(defaultValue = "1101") String countyCode) {
        try {
            if (kamisApiKey == null || kamisApiKey.isBlank()) {
                return ResponseEntity.ok(Map.of("items", List.of(), "error", "KAMIS API 키 미설정"));
            }

            List<Map<String, Object>> rawItems = fetchKamisCountyPrices(countyCode);
            if (rawItems.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "items", List.of(),
                        "updatedAt", "",
                        "error", "KAMIS 시세 데이터를 불러오지 못했습니다."
                ));
            }

            String categoryCode = CATEGORY_CODE_MAP.get(category);
            List<Map<String, Object>> result = new ArrayList<>();

            for (Map<String, Object> raw : rawItems) {
                String code = String.valueOf(raw.getOrDefault("category_code", ""));
                if (categoryCode != null && !categoryCode.equals(code)) continue;

                String name = firstNonBlank(
                        getStr(raw, "item_name"),
                        getStr(raw, "productName")
                );
                if (name.isBlank()) continue;

                long price = parseLong(getStr(raw, "dpr1"));
                if (price <= 0) continue;

                long prevPrice = parseLong(getStr(raw, "dpr2"));
                long monthAgo = parseLong(getStr(raw, "dpr3"));
                long yearAgo = parseLong(getStr(raw, "dpr4"));
                long change = price - prevPrice;
                double changePercent = prevPrice > 0
                        ? Math.round(change * 1000.0 / prevPrice) / 10.0
                        : 0.0;

                String direction = mapDirection(getStr(raw, "direction"), change);

                Map<String, Object> normalized = new LinkedHashMap<>();
                normalized.put("id", getStr(raw, "productno", "productName", "item_name"));
                normalized.put("name", name);
                normalized.put("category", CODE_CATEGORY_MAP.getOrDefault(code, "기타"));
                normalized.put("unit", getStr(raw, "unit"));
                normalized.put("price", price);
                normalized.put("prevPrice", prevPrice);
                normalized.put("monthAgo", monthAgo);
                normalized.put("yearAgo", yearAgo);
                normalized.put("change", change);
                normalized.put("changePercent", changePercent);
                normalized.put("direction", direction);
                normalized.put("updatedAt", getStr(raw, "lastest_day", "latest_day"));
                normalized.put("isVolatile", Math.abs(changePercent) >= 5.0);
                result.add(normalized);
            }

            String updatedAt = result.stream()
                    .map(i -> String.valueOf(i.get("updatedAt")))
                    .filter(s -> !s.isBlank())
                    .findFirst()
                    .orElse("");

            log.info("[MarketController] KAMIS 식재료 시세 {}건 조회 (category={})", result.size(), category);
            return ResponseEntity.ok(Map.of("items", result, "updatedAt", updatedAt, "source", "KAMIS"));

        } catch (Exception e) {
            log.error("[MarketController] KAMIS 오류", e);
            return ResponseEntity.ok(Map.of("items", List.of(), "error", e.getMessage()));
        }
    }

    @GetMapping("/ingredients/daily")
    public ResponseEntity<Map<String, Object>> getDailyIngredients(
            @RequestParam(defaultValue = "전체") String category) {
        return getIngredients(category, "1101");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchKamisCountyPrices(String countyCode) {
        String url = "https://www.kamis.or.kr/service/price/xml.do"
                + "?action=dailyCountyList"
                + "&p_cert_key=" + kamisApiKey
                + "&p_cert_id=" + kamisCertId
                + "&p_returntype=json"
                + "&p_countycode=" + countyCode;

        String body = restClient.get()
                .uri(url)
                .retrieve()
                .body(String.class);

        if (body == null || body.isBlank()) return List.of();

        Map<String, Object> response;
        try {
            response = objectMapper.readValue(body, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("[MarketController] KAMIS JSON 파싱 실패: {}", e.getMessage());
            return List.of();
        }

        Object errorCode = response.get("error_code");
        if (errorCode != null && !"000".equals(errorCode.toString())) {
            log.warn("[MarketController] KAMIS error_code={}", errorCode);
            return List.of();
        }

        Object priceField = response.get("price");
        if (priceField instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
    }

    private String mapDirection(String kamisDirection, long change) {
        if ("1".equals(kamisDirection)) return "up";
        if ("0".equals(kamisDirection)) return "down";
        if (change > 0) return "up";
        if (change < 0) return "down";
        return "stable";
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return "";
    }

    private String getStr(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null && !val.toString().isBlank() && !"-".equals(val.toString())) {
                return val.toString().trim();
            }
        }
        return "";
    }

    private long parseLong(String s) {
        if (s == null || s.isBlank() || "-".equals(s)) return 0;
        try {
            return Long.parseLong(s.replace(",", "").replace(" ", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
