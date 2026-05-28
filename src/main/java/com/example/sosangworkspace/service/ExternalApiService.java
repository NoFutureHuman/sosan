package com.example.sosangworkspace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

@Service
public class ExternalApiService {

    // API 키는 application.properties 또는 환경변수로 주입
    private final String molitKey;
    private final String sbizKey;
    private final String roneKey;
    private final String bizinfoKey;
    private final String ntsKey;
    private final String kamisKey;

    private final HttpClient httpClient = HttpClient.newBuilder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExternalApiService(
            @Value("${external.api.molit-key:}") String molitKey,
            @Value("${external.api.sbiz-key:}") String sbizKey,
            @Value("${external.api.rone-key:}") String roneKey,
            @Value("${external.api.bizinfo-key:}") String bizinfoKey,
            @Value("${external.api.nts-key:}") String ntsKey,
            @Value("${external.api.kamis-key:}") String kamisKey
    ) {
        this.molitKey = molitKey;
        this.sbizKey = sbizKey;
        this.roneKey = roneKey;
        this.bizinfoKey = bizinfoKey;
        this.ntsKey = ntsKey;
        this.kamisKey = kamisKey;
    }

    public Map<String, Object> fetchCommercialContext(String regionText, String sigunguCode) {
        List<String> ymds = buildRecentYearMonths();
        for (String dealYmd : ymds) {
            try {
                String url = "https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade"
                        + "?serviceKey=" + encode(molitKey)
                        + "&LAWD_CD=" + encode(sigunguCode)
                        + "&DEAL_YMD=" + encode(dealYmd)
                        + "&numOfRows=30&pageNo=1";

                HttpResponse<String> response = get(url);
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    continue;
                }

                Document xml = parseXml(response.body());
                NodeList items = xml.getElementsByTagName("item");
                if (items.getLength() == 0) {
                    continue;
                }

                List<Map<String, Object>> trades = new ArrayList<>();
                double totalPerPyeong = 0.0;
                int validCount = 0;

                for (int i = 0; i < items.getLength(); i++) {
                    var item = items.item(i);
                    String buildingName = getTagValue(item, "buildingName", "건물명");
                    String use = getTagValue(item, "buildingUse", "건물주용도");
                    String floor = getTagValue(item, "floor", "층");
                    String area = getTagValue(item, "buildingArea", "건물면적");
                    String amount = getTagValue(item, "dealAmount", "거래금액");
                    String dong = getTagValue(item, "umdNm", "법정동");

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("buildingName", buildingName);
                    row.put("use", use);
                    row.put("floor", floor);
                    row.put("area", area);
                    row.put("amount", amount);
                    row.put("dong", dong);
                    trades.add(row);

                    double amt = parseDouble(amount.replace(",", ""));
                    double areaNum = parseDouble(area);
                    if (amt > 0 && areaNum > 0) {
                        totalPerPyeong += amt / (areaNum / 3.3);
                        validCount++;
                    }
                }

                Map<String, Object> out = new LinkedHashMap<>();
                out.put("sigunguCode", sigunguCode);
                out.put("regionName", regionText);
                out.put("latestYearMonth", dealYmd.substring(0, 4) + "년 " + Integer.parseInt(dealYmd.substring(4, 6)) + "월");
                out.put("trades", trades.subList(0, Math.min(10, trades.size())));
                out.put("avgAmountPerPyeong", validCount > 0 ? Math.round(totalPerPyeong / validCount) : 0);
                out.put("sampleCount", trades.size());
                return out;
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    public Map<String, Object> fetchSbizStores(String regionText, String sigunguCode, String bizCategory) {
        String indsLclsCd = mapBizLclsCode(bizCategory);
        try {
            String url = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong"
                    + "?serviceKey=" + encode(sbizKey)
                    + "&pageNo=1&numOfRows=50"
                    + "&divId=signguCd"
                    + "&key=" + encode(sigunguCode)
                    + "&indsLclsCd=" + encode(indsLclsCd);

            HttpResponse<String> response = get(url);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }

            List<Map<String, Object>> stores = response.body().trim().startsWith("{")
                    ? parseSbizJson(response.body())
                    : parseSbizXml(response.body());

            return buildSbizResult(regionText, stores);
        } catch (Exception e) {
            return null;
        }
    }

    public Map<String, Object> fetchRoneRentData(String regionText) {
        // 구조 유지용 응답. 실제 R-ONE 연결은 운영 URL/스펙 확정 후 확장.
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("period", "");
        out.put("items", List.of());
        out.put("source", "한국부동산원 R-ONE 상업용부동산 임대동향조사");
        out.put("region", regionText);
        out.put("apiKeyLoaded", !roneKey.isBlank());
        return out;
    }

    public Map<String, Object> fetchBizinfoSupport(String bizType) {
        // 기존 파이프라인 연동용 기본 응답. 키는 서버에 보관됨.
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalCount", 0);
        out.put("items", List.of());
        out.put("bizType", bizType);
        out.put("apiKeysLoaded", Map.of(
                "bizinfo", !bizinfoKey.isBlank(),
                "nts", !ntsKey.isBlank(),
                "kamis", !kamisKey.isBlank()
        ));
        return out;
    }

    private HttpResponse<String> get(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static List<String> buildRecentYearMonths() {
        LocalDate now = LocalDate.now();
        List<String> ymds = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            LocalDate d = now.minusMonths(i);
            ymds.add(String.format("%d%02d", d.getYear(), d.getMonthValue()));
        }
        return ymds;
    }

    private static String mapBizLclsCode(String bizCategory) {
        if (bizCategory == null) return "Q09";
        return switch (bizCategory) {
            case "식당", "배달전문", "주점" -> "Q09";
            case "카페", "디저트" -> "Q12";
            default -> "Q09";
        };
    }

    private List<Map<String, Object>> parseSbizJson(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        JsonNode items = root.path("body").path("items").path("item");
        List<Map<String, Object>> out = new ArrayList<>();
        if (items.isArray()) {
            for (JsonNode node : items) {
                out.add(readStoreNode(node));
            }
        }
        return out;
    }

    private List<Map<String, Object>> parseSbizXml(String body) throws Exception {
        Document xml = parseXml(body);
        NodeList items = xml.getElementsByTagName("item");
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < items.getLength(); i++) {
            var item = items.item(i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("bizesNm", getTagValue(item, "bizesNm"));
            row.put("rdnmAdr", getTagValue(item, "rdnmAdr"));
            row.put("lnoAdr", getTagValue(item, "lnoAdr"));
            row.put("bldNm", getTagValue(item, "bldNm"));
            row.put("flrNo", getTagValue(item, "flrNo"));
            row.put("indsSclsNm", getTagValue(item, "indsSclsNm"));
            row.put("indsMclsNm", getTagValue(item, "indsMclsNm"));
            row.put("adongNm", getTagValue(item, "adongNm"));
            row.put("lon", getTagValue(item, "lon"));
            row.put("lat", getTagValue(item, "lat"));
            out.add(row);
        }
        return out;
    }

    private static Map<String, Object> readStoreNode(JsonNode node) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("bizesNm", node.path("bizesNm").asText(""));
        row.put("rdnmAdr", node.path("rdnmAdr").asText(""));
        row.put("lnoAdr", node.path("lnoAdr").asText(""));
        row.put("bldNm", node.path("bldNm").asText(""));
        row.put("flrNo", node.path("flrNo").asText(""));
        row.put("indsSclsNm", node.path("indsSclsNm").asText(""));
        row.put("indsMclsNm", node.path("indsMclsNm").asText(""));
        row.put("adongNm", node.path("adongNm").asText(""));
        row.put("lon", node.path("lon").asText(""));
        row.put("lat", node.path("lat").asText(""));
        return row;
    }

    private static Map<String, Object> buildSbizResult(String regionName, List<Map<String, Object>> stores) {
        Map<String, List<Map<String, Object>>> grouped = new HashMap<>();
        for (Map<String, Object> store : stores) {
            String bldNm = asString(store.get("bldNm"));
            String rdnmAdr = asString(store.get("rdnmAdr"));
            String key = !bldNm.isBlank() ? bldNm : rdnmAdr;
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(store);
        }

        List<Map<String, Object>> buildingGroups = grouped.entrySet().stream()
                .map(entry -> {
                    List<Map<String, Object>> list = entry.getValue();
                    Map<String, Object> first = list.get(0);
                    List<String> floors = list.stream().map(v -> asString(v.get("flrNo"))).filter(v -> !v.isBlank()).distinct().toList();
                    List<String> bizTypes = list.stream().map(v -> asString(v.get("indsSclsNm"))).filter(v -> !v.isBlank()).distinct().toList();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("bldNm", entry.getKey());
                    item.put("address", asString(first.get("rdnmAdr")).isBlank() ? asString(first.get("lnoAdr")) : asString(first.get("rdnmAdr")));
                    item.put("floors", floors);
                    item.put("bizTypes", bizTypes);
                    item.put("count", list.size());
                    return item;
                })
                .sorted(Comparator.comparingInt((Map<String, Object> m) -> (Integer) m.get("count")).reversed())
                .limit(10)
                .toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("regionName", regionName);
        out.put("totalCount", stores.size());
        out.put("stores", stores);
        out.put("buildingGroups", buildingGroups);
        return out;
    }

    private static Document parseXml(String body) throws Exception {
        var factory = DocumentBuilderFactory.newInstance();
        var builder = factory.newDocumentBuilder();
        return builder.parse(new InputSource(new StringReader(body)));
    }

    private static String getTagValue(org.w3c.dom.Node node, String... tags) {
        if (node == null) return "-";
        for (String tag : tags) {
            var list = ((org.w3c.dom.Element) node).getElementsByTagName(tag);
            if (list.getLength() > 0 && list.item(0).getTextContent() != null) {
                String value = list.item(0).getTextContent().trim();
                if (!value.isBlank()) return value;
            }
        }
        return "-";
    }

    private static double parseDouble(String value) {
        try {
            return Double.parseDouble(value.trim());
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    private static String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
