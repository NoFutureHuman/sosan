const BACKEND_BASE_URL = "";

function buildBackendUrl(path: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params);
  return `${BACKEND_BASE_URL}${path}?${search.toString()}`;
}

/* ── 시도+시군구 조합 → 5자리 법정동 코드 ── */
const SIGUNGU_CODE_MAP: Record<string, string> = {
  // 서울
  "서울 종로구": "11110", "서울 중구": "11140", "서울 용산구": "11170", "서울 성동구": "11200",
  "서울 광진구": "11215", "서울 동대문구": "11230", "서울 중랑구": "11260", "서울 성북구": "11290",
  "서울 강북구": "11305", "서울 도봉구": "11320", "서울 노원구": "11350", "서울 은평구": "11380",
  "서울 서대문구": "11410", "서울 마포구": "11440", "서울 양천구": "11470", "서울 강서구": "11500",
  "서울 구로구": "11530", "서울 금천구": "11545", "서울 영등포구": "11560", "서울 동작구": "11590",
  "서울 관악구": "11620", "서울 서초구": "11650", "서울 강남구": "11680", "서울 송파구": "11710",
  "서울 강동구": "11740",
  // 부산
  "부산 중구": "26110", "부산 서구": "26140", "부산 동구": "26170", "부산 영도구": "26200",
  "부산 부산진구": "26230", "부산 동래구": "26260", "부산 남구": "26290", "부산 북구": "26320",
  "부산 해운대구": "26350", "부산 사하구": "26380", "부산 금정구": "26410", "부산 강서구": "26440",
  "부산 연제구": "26470", "부산 수영구": "26500", "부산 사상구": "26530", "부산 기장군": "26710",
  // 대구
  "대구 중구": "27110", "대구 동구": "27140", "대구 서구": "27170", "대구 남구": "27200",
  "대구 북구": "27230", "대구 수성구": "27260", "대구 달서구": "27290", "대구 달성군": "27710",
  // 인천
  "인천 중구": "28110", "인천 동구": "28140", "인천 미추홀구": "28177", "인천 연수구": "28185",
  "인천 남동구": "28245", "인천 부평구": "28237", "인천 계양구": "28247", "인천 서구": "28260",
  // 광주
  "광주 동구": "29110", "광주 서구": "29140", "광주 남구": "29155", "광주 북구": "29170", "광주 광산구": "29200",
  // 대전
  "대전 동구": "30110", "대전 중구": "30140", "대전 서구": "30170", "대전 유성구": "30230", "대전 대덕구": "30200",
  // 울산
  "울산 중구": "31110", "울산 남구": "31140", "울산 동구": "31170", "울산 북구": "31200", "울산 울주군": "31710",
  // 세종
  "세종시": "36110",
  // 경기
  "수원 장안구": "41111", "수원 권선구": "41113", "수원 팔달구": "41115", "수원 영통구": "41117",
  "성남 수정구": "41131", "성남 중원구": "41133", "성남 분당구": "41135",
  "의정부시": "41150", "안양 만안구": "41171", "안양 동안구": "41173",
  "부천시": "41190", "광명시": "41210", "평택시": "41220", "동두천시": "41250",
  "안산 상록구": "41271", "안산 단원구": "41273",
  "고양 덕양구": "41281", "고양 일산동구": "41285", "고양 일산서구": "41287",
  "과천시": "41290", "구리시": "41310", "남양주시": "41360", "오산시": "41370",
  "시흥시": "41390", "군포시": "41410", "의왕시": "41430", "하남시": "41450",
  "용인 처인구": "41461", "용인 기흥구": "41463", "용인 수지구": "41465",
  "파주시": "41480", "이천시": "41500", "안성시": "41550", "김포시": "41570",
  "화성시": "41590", "광주시": "41610", "양주시": "41630", "포천시": "41650", "여주시": "41670",
  // 강원
  "춘천시": "42110", "원주시": "42130", "강릉시": "42150", "동해시": "42170",
  "태백시": "42190", "속초시": "42210", "삼척시": "42230",
  // 충북
  "청주 상당구": "43111", "청주 서원구": "43112", "청주 흥덕구": "43113", "청주 청원구": "43114",
  "충주시": "43130", "제천시": "43150",
  // 충남
  "천안 동남구": "44131", "천안 서북구": "44133",
  "공주시": "44150", "보령시": "44180", "아산시": "44200", "서산시": "44210",
  "논산시": "44230", "계룡시": "44250", "당진시": "44270",
  // 전북
  "전주 완산구": "45111", "전주 덕진구": "45113",
  "군산시": "45130", "익산시": "45140", "정읍시": "45180", "남원시": "45190", "김제시": "45210",
  // 전남
  "목포시": "46110", "여수시": "46130", "순천시": "46150", "나주시": "46170", "광양시": "46230",
  // 경북
  "포항 남구": "47111", "포항 북구": "47113",
  "경주시": "47130", "김천시": "47150", "안동시": "47170", "구미시": "47190",
  "영주시": "47210", "영천시": "47230", "상주시": "47250", "문경시": "47280", "경산시": "47290",
  // 경남
  "창원 의창구": "48121", "창원 성산구": "48123", "창원 마산합포구": "48125",
  "창원 마산회원구": "48127", "창원 진해구": "48129",
  "진주시": "48170", "통영시": "48220", "사천시": "48240",
  "김해시": "48250", "밀양시": "48270", "거제시": "48310", "양산시": "48330",
  // 제주
  "제주시": "50110", "서귀포시": "50130",
};

export function getSigunguCode(regionText: string): string | null {
  const normalized = regionText
    .replace("특별시", "").replace("광역시", "").replace("특별자치시", "")
    .replace("특별자치도", "").replace(/[도도]\s/, " ").replace("도", "")
    .replace(/시$/, "시").trim();

  // 1. 전체 문자열 직접 탐색
  if (SIGUNGU_CODE_MAP[normalized]) return SIGUNGU_CODE_MAP[normalized];

  const parts = normalized.split(/\s+/);
  const last = parts[parts.length - 1];

  // 2. 마지막 단어만으로 탐색 (단독 시 - 예: "수원시", "전주시")
  if (SIGUNGU_CODE_MAP[last]) return SIGUNGU_CODE_MAP[last];

  // 3. 앞 두 단어 조합 ("서울 강남구", "대구 달서구")
  if (parts.length >= 2) {
    const twoWord = `${parts[0]} ${last}`;
    if (SIGUNGU_CODE_MAP[twoWord]) return SIGUNGU_CODE_MAP[twoWord];
  }

  // 4. 도시명 + 구 조합 ("전주시 완산구" → "전주 완산구", "수원시 장안구" → "수원 장안구")
  if (parts.length >= 2) {
    const cityBase = parts[0].replace(/시$/, "");
    const twoWordCity = `${cityBase} ${last}`;
    if (SIGUNGU_CODE_MAP[twoWordCity]) return SIGUNGU_CODE_MAP[twoWordCity];
  }

  // 5. 가운데 단어(시 이름)와 마지막 단어(구) 조합 ("경기도 수원시 장안구" → "수원 장안구")
  if (parts.length >= 3) {
    const midBase = parts[parts.length - 2].replace(/시$/, "");
    const midKey = `${midBase} ${last}`;
    if (SIGUNGU_CODE_MAP[midKey]) return SIGUNGU_CODE_MAP[midKey];
    // 중간 단어 그대로도 시도
    const midRaw = `${parts[parts.length - 2]} ${last}`;
    if (SIGUNGU_CODE_MAP[midRaw]) return SIGUNGU_CODE_MAP[midRaw];
  }

  return null;
}

/* ── 상업업무용 실거래 항목 ── */
export interface CommercialContext {
  sigunguCode: string;
  regionName: string;
  latestYearMonth: string;
  trades: {
    buildingName: string;
    use: string;
    floor: string;
    area: string;
    amount: string;
    dong: string;
  }[];
  avgAmountPerPyeong: number;
  sampleCount: number;
}

/* ── 국토교통부 상업업무용 부동산 실거래가 API ── */
export async function fetchCommercialContext(
  regionText: string
): Promise<CommercialContext | null> {
  const sigunguCode = getSigunguCode(regionText);
  if (!sigunguCode) return null;

  try {
    const res = await fetch(
      buildBackendUrl("/api/external/commercial", { regionText, sigunguCode }),
    );
    if (!res.ok) return null;
    return (await res.json()) as CommercialContext;
  } catch {
    return null;
  }
}

/* ── 소상공인 상가정보 타입 ── */
export interface SbizStore {
  bizesNm: string;    // 상가업소명
  rdnmAdr: string;    // 도로명주소
  lnoAdr: string;     // 지번주소
  bldNm: string;      // 건물명
  flrNo: string;      // 층
  indsSclsNm: string; // 업종 소분류명
  indsMclsNm: string; // 업종 중분류명
  adongNm: string;    // 행정동명
  lon: string;
  lat: string;
}

export interface SbizStoreData {
  regionName: string;
  totalCount: number;
  stores: SbizStore[];
  buildingGroups: {
    bldNm: string;
    address: string;
    floors: string[];
    bizTypes: string[];
    count: number;
  }[];
}

/* ── 소상공인시장진흥공단 상가(상권)정보 API ── */
export async function fetchSbizStores(
  regionText: string,
  bizCategory?: string  // 업종 (예: "카페", "식당")
): Promise<SbizStoreData | null> {
  try {
    const sigunguCode = getSigunguCode(regionText);
    if (!sigunguCode) return null;
    const res = await fetch(
      buildBackendUrl("/api/external/sbiz", {
        regionText,
        sigunguCode,
        bizCategory: bizCategory ?? "",
      }),
    );
    if (!res.ok) return null;
    return (await res.json()) as SbizStoreData;
  } catch {
    return null;
  }
}

/* ── 실거래가 → 프롬프트 텍스트 ── */
export function commercialContextToText(ctx: CommercialContext): string {
  const lines = ctx.trades
    .map((t) => `  • ${t.dong} ${t.buildingName} ${t.floor}층 / ${t.area}㎡ / ${t.use} / ${t.amount}만원`)
    .join("\n");

  return `[국토교통부 상업업무용 실거래가 - ${ctx.latestYearMonth} 기준]
- 지역: ${ctx.regionName} (코드: ${ctx.sigunguCode})
- 조회 건수: ${ctx.sampleCount}건
- 평당 평균 거래금액: 약 ${ctx.avgAmountPerPyeong.toLocaleString()}만원/평
- 실거래 목록:
${lines}
(위 실거래 데이터를 기반으로 현실적인 매물 보증금·임대료를 추천하세요.)`;
}

/* ── 한국부동산원 R-ONE 상업용부동산 임대동향 ── */
export interface RoneRentItem {
  region: string;       // 지역명
  type: string;         // 상가 유형 (집합상가 / 소규모상가)
  rentIndex: number;    // 임대가격지수 (2021Q4=100)
  vacancyRate: number;  // 공실률 (%)
  period: string;       // 기준 분기 (예: 2024Q3)
}

export interface RoneRentContext {
  period: string;
  items: RoneRentItem[];
  source: string;
}


export async function fetchRoneRentData(
  regionText: string
): Promise<RoneRentContext | null> {
  try {
    const res = await fetch(
      buildBackendUrl("/api/external/rone", { regionText }),
    );
    if (!res.ok) return null;
    return (await res.json()) as RoneRentContext;
  } catch {
    return null;
  }
}

/* ── 중소벤처24 정부 지원사업 공고 ── */
export interface BizinfoItem {
  pblancId: string;       // 공고 ID
  pblancNm: string;       // 공고명
  bizAreaNm: string;      // 지원 분야 (창업, 융자, 기술개발 등)
  supportType: string;    // 지원 유형 (보조금, 융자 등)
  period: string;         // 접수 기간
  institution: string;    // 주관 기관
  target: string;         // 지원 대상
  detailUrl: string;      // 상세 링크
}

export interface BizinfoContext {
  totalCount: number;
  items: BizinfoItem[];
}

/* 업종 → 검색 키워드 매핑 */
function getBizKeyword(bizType: string): string {
  if (bizType.includes("카페") || bizType.includes("음료")) return "카페";
  if (bizType.includes("음식") || bizType.includes("식당") || bizType.includes("한식") || bizType.includes("외식")) return "외식";
  if (bizType.includes("디저트") || bizType.includes("베이커리")) return "베이커리";
  if (bizType.includes("소매") || bizType.includes("편의점")) return "소매";
  return "소상공인";
}

export async function fetchBizinfoSupport(
  bizType = "",
): Promise<BizinfoContext | null> {
  try {
    const res = await fetch(
      buildBackendUrl("/api/external/bizinfo", { bizType }),
    );
    if (!res.ok) return null;
    return (await res.json()) as BizinfoContext;
  } catch {
    return null;
  }
}

