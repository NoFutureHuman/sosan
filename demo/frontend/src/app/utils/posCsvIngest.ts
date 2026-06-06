export type PosMetrics = {
  monthlyRevenue: string;
  monthlyOrders: string;
  averageTicket: string;
  peakSalesShare: string;
  dineInShare: string;
  deliveryShare: string;
  takeoutShare: string;
  topMenuShare: string;
  adBudget: string;
  conversionRate: string;
  repeatCustomerRate: string;
  reviewAverageScore: string;
  negativeReviewRatio: string;
  competitorPriceGap: string;
  bundleOrderRatio: string;
  laborCost: string;
  tableTurnoverRate: string;
};

export const INITIAL_POS_METRICS: PosMetrics = {
  monthlyRevenue: "",
  monthlyOrders: "",
  averageTicket: "",
  peakSalesShare: "",
  dineInShare: "",
  deliveryShare: "",
  takeoutShare: "",
  topMenuShare: "",
  adBudget: "",
  conversionRate: "",
  repeatCustomerRate: "",
  reviewAverageScore: "",
  negativeReviewRatio: "",
  competitorPriceGap: "",
  bundleOrderRatio: "",
  laborCost: "",
  tableTurnoverRate: "",
};

export type DeepPosField = { key: keyof PosMetrics; label: string };

export type PosCsvUploadPayload = {
  fileName: string;
  rowCount: number;
  columns: string[];
  summaryJson: string;
  sampleText: string;
};

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function normalizeCsvHeaderToken(value: string): string {
  return stripBom(value)
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(/[()（）［］\[\]％%·]/g, "")
    .replace(/원$/g, "")
    .toLowerCase();
}

const POS_FIELD_HEADER_ALIASES: Partial<Record<keyof PosMetrics, string[]>> = {
  monthlyRevenue: ["월매출", "매출", "월매출액", "sales", "revenue"],
  monthlyOrders: ["월주문", "주문건수", "주문수", "orders"],
  averageTicket: ["객단가", "평균객단가", "객단가원", "ticket"],
  peakSalesShare: ["피크매출비중", "피크시간비중", "피크비중", "peaksales"],
  dineInShare: ["매장비중", "홀비중", "내점비중", "dinein"],
  deliveryShare: ["배달비중", "delivery"],
  takeoutShare: ["포장비중", "takeout"],
  topMenuShare: ["상위메뉴비중", "메뉴비중", "topmenu"],
  adBudget: ["광고비", "월광고비", "adbudget"],
  conversionRate: ["전환율", "유입전환율", "conversion"],
  repeatCustomerRate: ["재방문비중", "단골비중", "repeat"],
  reviewAverageScore: ["리뷰평점", "평균평점", "reviewscore"],
  negativeReviewRatio: ["부정리뷰", "부정리뷰비중", "negativereview"],
  competitorPriceGap: ["가격차이", "경쟁가격차", "pricegap"],
  bundleOrderRatio: ["번들비중", "세트비중", "bundle"],
  laborCost: ["인건비", "월인건비", "labor"],
  tableTurnoverRate: ["테이블회전율", "회전율", "turnover"],
};

function headerTokensForField(field: DeepPosField): string[] {
  const tokens = new Set<string>([
    normalizeCsvHeaderToken(field.key),
    normalizeCsvHeaderToken(field.label),
  ]);
  (POS_FIELD_HEADER_ALIASES[field.key] ?? []).forEach((alias) =>
    tokens.add(normalizeCsvHeaderToken(alias)),
  );
  return Array.from(tokens).filter(Boolean);
}

function countCsvFieldMatches(headers: string[], fields: DeepPosField[]): number {
  return fields.filter((field) => resolvePosCsvColumnIndex(headers, field) >= 0).length;
}

function detectCsvDelimiter(line: string): "," | ";" | "\t" {
  const comma = (line.match(/,/g) ?? []).length;
  const semi = (line.match(/;/g) ?? []).length;
  const tab = (line.match(/\t/g) ?? []).length;
  if (tab >= semi && tab > comma && tab > 0) return "\t";
  if (semi > comma) return ";";
  return ",";
}

function expandSingleColumnRow(cells: string[]): string[] {
  if (cells.length !== 1) return cells;
  const raw = cells[0]?.trim() ?? "";
  if (!raw) return cells;
  for (const delimiter of [",", ";", "\t"] as const) {
    const expanded = parseCsvRow(raw, delimiter);
    if (expanded.length > 1) return expanded;
  }
  return cells;
}

function parseCsvRow(line: string, delimiter: "," | ";" | "\t"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line.charAt(i);
    if (ch === '"') {
      if (inQuotes && line.charAt(i + 1) === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(stripBom(current).trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(stripBom(current).trim());
  return expandSingleColumnRow(result);
}

function resolvePosCsvColumnIndex(headers: string[], field: DeepPosField): number {
  const expected = headerTokensForField(field);

  for (let i = 0; i < headers.length; i += 1) {
    const norm = normalizeCsvHeaderToken(headers[i]);
    if (expected.includes(norm)) return i;
  }

  for (let i = 0; i < headers.length; i += 1) {
    const norm = normalizeCsvHeaderToken(headers[i]);
    if (
      expected.some(
        (token) => token.length >= 2 && (norm.includes(token) || token.includes(norm)),
      )
    ) {
      return i;
    }
  }

  return -1;
}

function scoreDecodedCsvText(text: string): number {
  const hangul = (text.match(/[\uAC00-\uD7A3]/g) ?? []).length;
  const bad = (text.match(/\uFFFD/g) ?? []).length;
  const nulls = (text.match(/\u0000/g) ?? []).length;
  return hangul * 3 - bad * 8 - nulls * 12;
}

export function decodeCsvBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer);
  }

  const candidates: Array<{ enc: string; text: string }> = [
    { enc: "utf-8", text: new TextDecoder("utf-8").decode(buffer) },
  ];
  for (const enc of ["euc-kr", "windows-949", "iso-8859-1"]) {
    try {
      candidates.push({ enc, text: new TextDecoder(enc).decode(buffer) });
    } catch {
      /* ignore unsupported encodings */
    }
  }

  return candidates.reduce((best, cur) =>
    scoreDecodedCsvText(cur.text) > scoreDecodedCsvText(best.text) ? cur : best,
  ).text;
}

function csvLinesFromText(text: string): string[] {
  return stripBom(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^sep\s*=/i.test(line));
}

function isLikelyDataRow(
  values: string[],
  fields: DeepPosField[],
  headers: string[],
): boolean {
  let checked = 0;
  let numeric = 0;
  fields.forEach((field) => {
    const idx = resolvePosCsvColumnIndex(headers, field);
    if (idx < 0) return;
    checked += 1;
    const raw = (values[idx] ?? "").replace(/,/g, "").trim();
    if (!raw) return;
    const num = Number(raw);
    if (!Number.isNaN(num)) numeric += 1;
  });
  return checked > 0 && numeric >= Math.ceil(checked * 0.5);
}

function findBestCsvTable(
  lines: string[],
  fields: DeepPosField[],
): { headers: string[]; values: string[]; matchCount: number } | null {
  const delimiters: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  let best: { headers: string[]; values: string[]; matchCount: number } | null = null;

  const maxHeaderScan = Math.min(lines.length - 1, 12);
  for (let headerIdx = 0; headerIdx < maxHeaderScan; headerIdx += 1) {
    for (const delimiter of delimiters) {
      const headers = parseCsvRow(lines[headerIdx], delimiter);
      if (headers.length < 2) continue;

      const matchCount = countCsvFieldMatches(headers, fields);
      if (matchCount === 0) continue;

      for (
        let dataIdx = headerIdx + 1;
        dataIdx < Math.min(lines.length, headerIdx + 8);
        dataIdx += 1
      ) {
        const values = parseCsvRow(lines[dataIdx], delimiter);
        if (!isLikelyDataRow(values, fields, headers)) continue;

        if (!best || matchCount > best.matchCount) {
          best = { headers, values, matchCount };
        }
        if (matchCount === fields.length) {
          return best;
        }
        break;
      }
    }
  }
  return best;
}

const POS_CSV_SAMPLE_VALUES: Partial<Record<keyof PosMetrics, string>> = {
  monthlyRevenue: "8500000",
  monthlyOrders: "1200",
  averageTicket: "12000",
  peakSalesShare: "42",
  dineInShare: "35",
  deliveryShare: "45",
  takeoutShare: "20",
  topMenuShare: "38",
  adBudget: "300000",
  conversionRate: "4.5",
  repeatCustomerRate: "32",
  reviewAverageScore: "4.3",
  negativeReviewRatio: "8",
  competitorPriceGap: "-5",
  bundleOrderRatio: "18",
  laborCost: "2800000",
  tableTurnoverRate: "3.2",
};

export function downloadPosCsvTemplate(fields: DeepPosField[]) {
  if (fields.length === 0) return;
  const headers = fields.map((f) => f.label);
  const keys = fields.map((f) => f.key);
  const values = fields.map((f) => POS_CSV_SAMPLE_VALUES[f.key] ?? "");
  const escape = (v: string) =>
    v.includes(";") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  const csv = [keys, headers, values]
    .map((row) => row.map(escape).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pos_집중분석_샘플.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function stripPosMetricKeys(
  answers: Record<string, string | string[]>,
): Record<string, string | string[]> {
  const next = { ...answers };
  (Object.keys(INITIAL_POS_METRICS) as (keyof PosMetrics)[]).forEach((key) => {
    delete next[key];
  });
  delete next.posMetricsLabeled;
  delete next.posCsvSummary;
  delete next.posCsvSample;
  delete next.posCsvFileName;
  delete next.posCsvRowCount;
  delete next.posCsvColumns;
  return next;
}

function findLargestCsvTable(
  lines: string[],
): { headers: string[]; rows: string[][] } | null {
  const delimiters: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  let best: { headers: string[]; rows: string[][]; score: number } | null = null;

  const maxHeaderScan = Math.min(lines.length - 1, 15);
  for (let headerIdx = 0; headerIdx < maxHeaderScan; headerIdx += 1) {
    for (const delimiter of delimiters) {
      const headers = parseCsvRow(lines[headerIdx], delimiter);
      if (headers.length < 2) continue;

      const rows: string[][] = [];
      for (let i = headerIdx + 1; i < lines.length; i += 1) {
        const row = parseCsvRow(lines[i], delimiter);
        if (row.every((cell) => !cell.trim())) continue;
        rows.push(row);
      }
      if (rows.length === 0) continue;

      const score = headers.length * rows.length;
      if (!best || score > best.score) {
        best = { headers, rows, score };
      }
    }
  }
  return best ? { headers: best.headers, rows: best.rows } : null;
}

function parseCsvNumber(value: string): number {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function findCsvColumnIndex(headers: string[], keywords: string[]): number {
  return headers.findIndex((header) => {
    const norm = header.trim().toLowerCase();
    return keywords.some((keyword) => norm.includes(keyword.toLowerCase()));
  });
}

function buildGenericCsvSummary(headers: string[], rows: string[][], fileName: string) {
  const amountIdx = [
    findCsvColumnIndex(headers, ["실결제", "실결제금액", "순매출"]),
    findCsvColumnIndex(headers, ["거래금액", "매출액", "매출", "결제금액"]),
    findCsvColumnIndex(headers, ["amount", "sales", "total", "revenue"]),
    findCsvColumnIndex(headers, ["금액"]),
  ].find((idx) => idx >= 0);

  const dateIdx = findCsvColumnIndex(headers, [
    "거래일",
    "일시",
    "날짜",
    "date",
    "time",
    "datetime",
  ]);
  const productIdx = findCsvColumnIndex(headers, [
    "상품",
    "메뉴",
    "품목",
    "product",
    "item",
    "menu",
  ]);
  const paymentIdx = findCsvColumnIndex(headers, ["결제수단", "결제", "payment", "수단"]);

  const amountCol = amountIdx != null && amountIdx >= 0 ? amountIdx : -1;
  const amounts =
    amountCol >= 0
      ? rows
          .map((row) => parseCsvNumber(row[amountCol]))
          .filter((n) => !Number.isNaN(n))
      : [];

  const monthly: Record<string, { count: number; revenue: number }> = {};
  if (dateIdx >= 0 && amountCol >= 0) {
    rows.forEach((row) => {
      const rawDate = (row[dateIdx] ?? "").trim();
      const month = rawDate.slice(0, 7).replace(/\./g, "-");
      const amt = parseCsvNumber(row[amountCol]);
      if (!month || Number.isNaN(amt)) return;
      if (!monthly[month]) monthly[month] = { count: 0, revenue: 0 };
      monthly[month].count += 1;
      monthly[month].revenue += amt;
    });
  }

  const productStats: Record<string, { count: number; revenue: number }> = {};
  if (productIdx >= 0) {
    rows.forEach((row) => {
      const name = (row[productIdx] ?? "").trim() || "(미분류)";
      const amt = amountCol >= 0 ? parseCsvNumber(row[amountCol]) : 0;
      if (!productStats[name]) productStats[name] = { count: 0, revenue: 0 };
      productStats[name].count += 1;
      if (!Number.isNaN(amt)) productStats[name].revenue += amt;
    });
  }

  const paymentStats: Record<string, number> = {};
  if (paymentIdx >= 0) {
    rows.forEach((row) => {
      const method = (row[paymentIdx] ?? "").trim() || "기타";
      paymentStats[method] = (paymentStats[method] ?? 0) + 1;
    });
  }

  return {
    fileName,
    totalRows: rows.length,
    columns: headers,
    primaryAmountColumn: amountCol >= 0 ? headers[amountCol] : null,
    revenue:
      amounts.length > 0
        ? {
            sum: Math.round(amounts.reduce((a, b) => a + b, 0)),
            avg: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
            min: Math.round(Math.min(...amounts)),
            max: Math.round(Math.max(...amounts)),
            orderCount: amounts.length,
          }
        : null,
    dateRange:
      dateIdx >= 0
        ? {
            from: rows[0]?.[dateIdx] ?? "",
            to: rows[rows.length - 1]?.[dateIdx] ?? "",
          }
        : null,
    monthlyBreakdown: Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stat]) => ({
        month,
        orders: stat.count,
        revenue: Math.round(stat.revenue),
      })),
    topProducts: Object.entries(productStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 12)
      .map(([name, stat]) => ({
        name,
        orders: stat.count,
        revenue: Math.round(stat.revenue),
      })),
    paymentMethodMix: Object.entries(paymentStats)
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => ({
        method,
        count,
        sharePct: Math.round((count / rows.length) * 1000) / 10,
      })),
    note: "POS·결제·매출 등 임의 형식 CSV를 자동 해석한 요약입니다.",
  };
}

export function ingestGenericCsvFile(
  text: string,
  fileName: string,
): PosCsvUploadPayload | { error: string } {
  if (text.length > 6_000_000) {
    return {
      error:
        "CSV 파일이 너무 큽니다(약 6MB 초과). 기간을 나누거나 행 수를 줄여 주세요.",
    };
  }

  const lines = csvLinesFromText(text);
  if (lines.length < 2) {
    return { error: "CSV에 헤더와 데이터 행이 최소 1줄 이상 필요합니다." };
  }

  const table = findLargestCsvTable(lines);
  if (!table || table.rows.length === 0) {
    return {
      error:
        "CSV 표 형식을 읽지 못했습니다. 1행은 컬럼명, 2행부터 데이터인지 확인해 주세요.",
    };
  }

  const summary = buildGenericCsvSummary(table.headers, table.rows, fileName);
  const sampleCount = Math.min(15, table.rows.length);
  const sampleLines = [
    `파일: ${fileName}`,
    `컬럼(${table.headers.length}개): ${table.headers.join(" | ")}`,
    `총 ${table.rows.length.toLocaleString()}행 · 아래 샘플 ${sampleCount}행`,
    "",
    table.headers.join(","),
    ...table.rows.slice(0, sampleCount).map((row) => row.join(",")),
  ];

  return {
    fileName,
    rowCount: table.rows.length,
    columns: table.headers,
    summaryJson: JSON.stringify(summary, null, 0),
    sampleText: sampleLines.join("\n").slice(0, 14_000),
  };
}

function stripDeepCategoryFieldKeys(
  answers: Record<string, string | string[]>,
  categories: string[],
  categoryFieldsMap: Record<string, DeepPosField[]>,
): Record<string, string | string[]> {
  const next = { ...answers };
  const seen = new Set<string>();
  categories.forEach((category) => {
    (categoryFieldsMap[category] ?? []).forEach((field) => {
      if (seen.has(field.key)) return;
      seen.add(field.key);
      delete next[field.key];
    });
  });
  return next;
}

function buildPosMetricsLabeled(
  answers: Record<string, string | string[]>,
  categories: string[],
  categoryFieldsMap: Record<string, DeepPosField[]>,
): Record<string, string> {
  const labeled: Record<string, string> = {};
  const seen = new Set<string>();
  categories.forEach((category) => {
    (categoryFieldsMap[category] ?? []).forEach((field) => {
      if (seen.has(field.key)) return;
      seen.add(field.key);
      const raw = answers[field.key];
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (value != null && String(value).trim()) {
        labeled[field.label] = String(value).trim();
      }
    });
  });
  return labeled;
}

export function buildDeepPosPayload(
  inputAnswers: Record<string, string | string[]>,
  categories: string[],
  metrics: PosMetrics,
  source: "csv" | "manual",
  categoryFieldsMap: Record<string, DeepPosField[]>,
  csvUpload?: PosCsvUploadPayload | null,
): Record<string, string | string[]> {
  const strippedInput =
    source === "csv"
      ? stripDeepCategoryFieldKeys(inputAnswers, categories, categoryFieldsMap)
      : inputAnswers;
  const base = stripPosMetricKeys(strippedInput);

  if (source === "csv") {
    if (!csvUpload) {
      return {
        ...base,
        analysisMode: "deep",
        posInputSource: "csv",
      };
    }
    return {
      ...base,
      analysisMode: "deep",
      posInputSource: "csv",
      posCsvFileName: csvUpload.fileName,
      posCsvRowCount: String(csvUpload.rowCount),
      posCsvColumns: csvUpload.columns.join("|"),
      posCsvSummary: csvUpload.summaryJson,
      posCsvSample: csvUpload.sampleText,
      posMetricsLabeled: csvUpload.summaryJson,
    };
  }

  const posFields: Record<string, string> = {};
  const seen = new Set<string>();
  categories.forEach((category) => {
    (categoryFieldsMap[category] ?? []).forEach((field) => {
      if (seen.has(field.key)) return;
      seen.add(field.key);
      posFields[field.key] = String(metrics[field.key] ?? "").trim();
    });
  });
  const merged = {
    ...base,
    ...posFields,
    analysisMode: "deep",
    posInputSource: source,
  };
  return {
    ...merged,
    posMetricsLabeled: JSON.stringify(
      buildPosMetricsLabeled(merged, categories, categoryFieldsMap),
    ),
  };
}

/** CSV 업로드 또는 answers에 CSV 요약이 있으면 true */
export function hasPosCsvData(
  posCsvReady: boolean,
  upload: PosCsvUploadPayload | null,
  answers?: Record<string, string | string[]>,
): boolean {
  if (posCsvReady && upload) return true;
  const summary = answers?.posCsvSummary;
  return (
    String(answers?.posInputSource ?? "") === "csv" &&
    (typeof summary === "string" ? summary.trim().length > 0 : Boolean(summary))
  );
}

export function resolveDeepPosSource(
  posCsvReady: boolean,
  upload: PosCsvUploadPayload | null,
  posInputMode: "manual" | "csv",
  answers?: Record<string, string | string[]>,
): "csv" | "manual" {
  if (hasPosCsvData(posCsvReady, upload, answers)) return "csv";
  return posInputMode === "csv" ? "csv" : "manual";
}

export function csvPayloadFromAnswers(
  answers: Record<string, string | string[]>,
): PosCsvUploadPayload | null {
  const summary = answers.posCsvSummary;
  if (typeof summary !== "string" || !summary.trim()) return null;
  const columnsRaw = answers.posCsvColumns;
  const columns =
    typeof columnsRaw === "string"
      ? columnsRaw.split("|").filter(Boolean)
      : [];
  const rowCount = Number(answers.posCsvRowCount ?? 0);
  const sample = answers.posCsvSample;
  return {
    fileName: String(answers.posCsvFileName ?? "upload.csv"),
    rowCount: Number.isFinite(rowCount) ? rowCount : 0,
    columns,
    summaryJson: summary,
    sampleText: typeof sample === "string" ? sample : "",
  };
}

export function metricsFromAnswers(
  answers: Record<string, string | string[]>,
  categories: string[],
  categoryFieldsMap: Record<string, DeepPosField[]>,
  fallback: PosMetrics,
): PosMetrics {
  const metrics = { ...INITIAL_POS_METRICS };
  const seen = new Set<string>();
  categories.forEach((category) => {
    (categoryFieldsMap[category] ?? []).forEach((field) => {
      if (seen.has(field.key)) return;
      seen.add(field.key);
      const raw = answers[field.key];
      const fromAnswer = Array.isArray(raw) ? raw[0] : raw;
      metrics[field.key] = String(fromAnswer ?? fallback[field.key] ?? "").trim();
    });
  });
  return metrics;
}
