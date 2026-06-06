package com.example.sosangworkspace.existinggraph;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class ExistingOwnerConstants {

    static final int FOLLOWUP_QUESTIONS_MIN_LIGHT = 4;
    static final int FOLLOWUP_QUESTIONS_MAX_LIGHT = 8;
    static final int LIGHT_FOLLOWUP_MAX_ROUNDS = 2;

    static final Set<String> QUESTION_STOP_WORDS = Set.of(
            "은", "는", "이", "가", "을", "를", "의", "에", "에서", "으로", "로", "와", "과",
            "도", "만", "요", "인", "하", "하나요", "인가요", "습니까", "있나요", "계신",
            "계시", "하시", "되나", "어떤", "무엇", "어느", "정도", "현재", "최근", "어떻게",
            "무엇인", "알고", "있", "없", "더", "및", "등", "때", "중", "내", "외"
    );

    static final List<List<String>> QUESTION_TOPIC_KEYWORDS = List.of(
            List.of("매출", "객단가", "매장매출", "월매출"),
            List.of("마케팅", "광고", "홍보", "프로모션", "sns", "채널"),
            List.of("리뷰", "평점", "평판", "부정"),
            List.of("단골", "재방문", "고객유지", "충성"),
            List.of("원가", "식재료", "재료비", "인건비", "비용"),
            List.of("인력", "직원", "근무", "인원", "알바"),
            List.of("임대", "월세", "보증금", "임차"),
            List.of("가격", "메뉴가", "할인"),
            List.of("운영", "피크", "좌석", "테이블")
    );

    static final Map<String, String> POS_METRIC_LABELS = new LinkedHashMap<>();

    static {
        POS_METRIC_LABELS.put("monthlyRevenue", "월 매출(원)");
        POS_METRIC_LABELS.put("monthlyOrders", "월 주문건수");
        POS_METRIC_LABELS.put("averageTicket", "객단가(원)");
        POS_METRIC_LABELS.put("peakSalesShare", "피크시간 매출 비중(%)");
        POS_METRIC_LABELS.put("dineInShare", "매장 비중(%)");
        POS_METRIC_LABELS.put("deliveryShare", "배달 비중(%)");
        POS_METRIC_LABELS.put("takeoutShare", "포장 비중(%)");
        POS_METRIC_LABELS.put("topMenuShare", "상위메뉴 매출 비중(%)");
        POS_METRIC_LABELS.put("adBudget", "월 광고비(원)");
        POS_METRIC_LABELS.put("conversionRate", "유입 대비 전환율(%)");
        POS_METRIC_LABELS.put("repeatCustomerRate", "재방문 고객 비중(%)");
        POS_METRIC_LABELS.put("reviewAverageScore", "평균 리뷰 평점");
        POS_METRIC_LABELS.put("negativeReviewRatio", "부정 리뷰 비중(%)");
        POS_METRIC_LABELS.put("competitorPriceGap", "경쟁점 대비 가격 차이(%)");
        POS_METRIC_LABELS.put("bundleOrderRatio", "세트/번들 주문 비중(%)");
        POS_METRIC_LABELS.put("laborCost", "월 인건비(원)");
        POS_METRIC_LABELS.put("tableTurnoverRate", "평균 테이블 회전율(일)");
    }

    private ExistingOwnerConstants() {
    }
}
