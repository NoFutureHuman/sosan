package com.example.sosangworkspace.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 기업마당(bizinfo.go.kr) 지원사업·행사 API 프록시.
 *
 * GET /api/support/programs  — 지원사업 공고
 * GET /api/support/events    — 행사 정보
 * GET /api/support/debug     — 원시 응답 확인용
 */
@Slf4j
@RestController
@RequestMapping("/api/support")
public class SupportController {

    private static final String BIZINFO_PROGRAMS_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";
    private static final String BIZINFO_EVENTS_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoEventApi.do";

    private static final Map<String, String> REALM_CATEGORY_MAP = Map.ofEntries(
            Map.entry("금융", "자금 지원"),
            Map.entry("경영", "교육/컨설팅"),
            Map.entry("인력", "교육/컨설팅"),
            Map.entry("기술", "디지털 전환"),
            Map.entry("수출", "수출"),
            Map.entry("내수", "마케팅"),
            Map.entry("창업", "교육/컨설팅")
    );

    private static final List<String> REGION_NAMES = List.of(
            "서울", "경기", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
            "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    );

    @Value("${bizinfo.api.key:${smes.api.key:}}")
    private String bizinfoApiKey;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/programs")
    public ResponseEntity<Map<String, Object>> getPrograms(
            @RequestParam(defaultValue = "") String bizType,
            @RequestParam(defaultValue = "") String region) {
        try {
            if (bizinfoApiKey == null || bizinfoApiKey.isBlank()) {
                return ResponseEntity.ok(Map.of("programs", List.of(), "error", "기업마당 API 키 미설정"));
            }

            BizinfoFetchResult result = fetchBizinfoPrograms(bizType, region, 30);
            if (result.error() != null && result.items().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "programs", List.of(),
                        "total", 0,
                        "error", result.error(),
                        "source", "bizinfo"
                ));
            }

            log.info("[SupportController] 기업마당 지원사업 {}건 조회", result.items().size());
            return ResponseEntity.ok(Map.of(
                    "programs", result.items(),
                    "total", result.total(),
                    "source", "bizinfo"
            ));
        } catch (Exception e) {
            log.error("[SupportController] 기업마당 API 오류", e);
            return ResponseEntity.ok(Map.of("programs", List.of(), "error", e.getMessage(), "source", "bizinfo"));
        }
    }

    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getEvents(
            @RequestParam(defaultValue = "") String region) {
        try {
            if (bizinfoApiKey == null || bizinfoApiKey.isBlank()) {
                return ResponseEntity.ok(Map.of("events", List.of(), "error", "기업마당 API 키 미설정"));
            }

            BizinfoFetchResult result = fetchBizinfoEvents(region, 20);
            if (result.error() != null && result.items().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "events", List.of(),
                        "total", 0,
                        "error", result.error(),
                        "source", "bizinfo"
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "events", result.items(),
                    "total", result.total(),
                    "source", "bizinfo"
            ));
        } catch (Exception e) {
            log.error("[SupportController] 기업마당 행사 API 오류", e);
            return ResponseEntity.ok(Map.of("events", List.of(), "error", e.getMessage()));
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debug() {
        if (bizinfoApiKey == null || bizinfoApiKey.isBlank()) {
            return ResponseEntity.ok(Map.of("error", "기업마당 API 키 미설정"));
        }
        try {
            String url = buildBizinfoUrl(BIZINFO_PROGRAMS_URL, "", "", 3);
            Map<String, Object> parsed = fetchJson(url);
            if (parsed == null) {
                return ResponseEntity.ok(Map.of("error", "응답 null"));
            }
            return ResponseEntity.ok(Map.of(
                    "topKeys", new ArrayList<>(parsed.keySet()),
                    "raw", parsed,
                    "source", "bizinfo"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", e.getMessage()));
        }
    }

    private record BizinfoFetchResult(List<Map<String, Object>> items, int total, String error) {}

    private BizinfoFetchResult fetchBizinfoPrograms(String bizType, String region, int searchCnt) {
        String url = buildBizinfoUrl(BIZINFO_PROGRAMS_URL, bizType, region, searchCnt);
        return fetchAndNormalize(url, true);
    }

    private BizinfoFetchResult fetchBizinfoEvents(String region, int searchCnt) {
        String url = UriComponentsBuilder.fromUriString(BIZINFO_EVENTS_URL)
                .queryParam("crtfcKey", bizinfoApiKey)
                .queryParam("dataType", "json")
                .queryParam("searchCnt", searchCnt)
                .build()
                .toUriString();
        return fetchAndNormalize(url, false);
    }

    private String buildBizinfoUrl(String baseUrl, String bizType, String region, int searchCnt) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("crtfcKey", bizinfoApiKey)
                .queryParam("dataType", "json")
                .queryParam("searchCnt", searchCnt);

        List<String> tags = new ArrayList<>();
        tags.add("소상공인");
        if (bizType != null && !bizType.isBlank()) {
            if (bizType.contains("카페") || bizType.contains("음료")) tags.add("카페");
            else if (bizType.contains("음식") || bizType.contains("외식") || bizType.contains("식당")) tags.add("외식");
            else if (bizType.contains("창업")) tags.add("창업");
        }
        if (region != null && !region.isBlank() && !"전국".equals(region)) {
            tags.add(region);
        }
        builder.queryParam("hashtags", String.join(",", tags));
        return builder.build().toUriString();
    }

    @SuppressWarnings("unchecked")
    private BizinfoFetchResult fetchAndNormalize(String url, boolean programs) {
        try {
            log.info("[SupportController] 기업마당 호출: {}", url);
            Map<String, Object> response = fetchJson(url);
            if (response == null) {
                return new BizinfoFetchResult(List.of(), 0, "기업마당 API 응답이 없습니다.");
            }

            if (response.containsKey("reqErr")) {
                return new BizinfoFetchResult(List.of(), 0, String.valueOf(response.get("reqErr")));
            }

            Object arrayField = response.get("jsonArray");
            if (!(arrayField instanceof List<?> rawList) || rawList.isEmpty()) {
                return new BizinfoFetchResult(List.of(), 0, "등록된 공고가 없습니다.");
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) rawList;
            int total = items.stream()
                    .map(i -> i.get("totCnt"))
                    .filter(Objects::nonNull)
                    .map(v -> {
                        try { return Integer.parseInt(v.toString()); }
                        catch (NumberFormatException e) { return items.size(); }
                    })
                    .findFirst()
                    .orElse(items.size());

            List<Map<String, Object>> normalized = programs
                    ? normalizePrograms(items)
                    : normalizeEvents(items);

            return new BizinfoFetchResult(normalized, total, null);
        } catch (Exception e) {
            log.warn("[SupportController] 기업마당 호출 실패: {}", e.getMessage());
            return new BizinfoFetchResult(List.of(), 0, e.getMessage());
        }
    }

    private Map<String, Object> fetchJson(String url) throws Exception {
        String body = restClient.get()
                .uri(url)
                .retrieve()
                .body(String.class);
        if (body == null || body.isBlank()) return null;
        return objectMapper.readValue(body, new TypeReference<>() {});
    }

    private List<Map<String, Object>> normalizePrograms(List<Map<String, Object>> items) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> item : items) {
            String title = getStr(item, "pblancNm");
            if (title.isBlank()) continue;

            String period = getStr(item, "reqstBeginEndDe");
            String endDate = extractEndDate(period);
            String realm = getStr(item, "pldirSportRealmLclasCodeNm");
            String org = firstNonBlank(
                    getStr(item, "jrsdInsttNm"),
                    getStr(item, "excInsttNm")
            );

            Map<String, Object> normalized = new LinkedHashMap<>();
            normalized.put("id", getStr(item, "pblancId"));
            normalized.put("title", title);
            normalized.put("org", org);
            normalized.put("category", REALM_CATEGORY_MAP.getOrDefault(realm, realm.isBlank() ? "기타" : realm));
            normalized.put("region", detectRegion(item, org, title));
            normalized.put("amount", firstNonBlank(getStr(item, "trgetNm"), "공고 참조"));
            normalized.put("deadline", endDate.isBlank() ? period : endDate);
            normalized.put("status", deriveStatus(period));
            normalized.put("desc", stripHtml(getStr(item, "bsnsSumryCn")));
            normalized.put("url", firstNonBlank(
                    getStr(item, "pblancUrl"),
                    getStr(item, "rceptEngnHmpgUrl")
            ));
            normalized.put("period", period);
            normalized.put("target", getStr(item, "trgetNm"));
            result.add(normalized);
        }
        return result;
    }

    private List<Map<String, Object>> normalizeEvents(List<Map<String, Object>> items) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> item : items) {
            String title = firstNonBlank(getStr(item, "eventNm"), getStr(item, "pblancNm"));
            if (title.isBlank()) continue;

            Map<String, Object> normalized = new LinkedHashMap<>();
            normalized.put("id", getStr(item, "eventId", "pblancId"));
            normalized.put("title", title);
            normalized.put("org", firstNonBlank(getStr(item, "jrsdInsttNm"), getStr(item, "excInsttNm")));
            normalized.put("period", getStr(item, "eventBeginEndDe", "reqstBeginEndDe"));
            normalized.put("place", getStr(item, "eventPlace"));
            normalized.put("url", getStr(item, "eventUrl", "pblancUrl"));
            normalized.put("desc", stripHtml(firstNonBlank(getStr(item, "eventCn"), getStr(item, "bsnsSumryCn"))));
            result.add(normalized);
        }
        return result;
    }

    private String deriveStatus(String period) {
        if (period == null || period.isBlank()) return "접수중";
        if (period.contains("상시")) return "상시";

        Matcher matcher = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})\\s*~\\s*(\\d{4}-\\d{2}-\\d{2})").matcher(period);
        if (!matcher.find()) return "접수중";

        try {
            LocalDate start = LocalDate.parse(matcher.group(1));
            LocalDate end = LocalDate.parse(matcher.group(2));
            LocalDate today = LocalDate.now();
            if (today.isBefore(start)) return "접수예정";
            if (today.isAfter(end)) return "마감";
            return "접수중";
        } catch (Exception e) {
            return "접수중";
        }
    }

    private String extractEndDate(String period) {
        if (period == null || period.isBlank()) return "";
        Matcher matcher = Pattern.compile("~\\s*(\\d{4}-\\d{2}-\\d{2})").matcher(period);
        if (matcher.find()) {
            return matcher.group(1).replace("-", ".");
        }
        return period;
    }

    private String detectRegion(Map<String, Object> item, String org, String title) {
        String hashtags = getStr(item, "hashtags");
        String combined = hashtags + " " + org + " " + title;
        for (String region : REGION_NAMES) {
            if (combined.contains(region)) return region;
        }
        return "전국";
    }

    private String stripHtml(String html) {
        if (html == null || html.isBlank()) return "";
        return html.replaceAll("<[^>]+>", " ")
                .replace("&nbsp;", " ")
                .replaceAll("\\s+", " ")
                .trim();
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
            if (val != null && !val.toString().isBlank()) return val.toString().trim();
        }
        return "";
    }
}
