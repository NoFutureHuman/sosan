export type FollowupQuestion = {
  question: string;
  reason: string;
  priority: "높음" | "중간" | "낮음";
  category?: string;
  options?: string[];
};

const QUESTION_STOP_WORDS = new Set([
  "은", "는", "이", "가", "을", "를", "의", "에", "에서", "으로", "로", "와", "과",
  "도", "만", "요", "인", "하나요", "인가요", "습니까", "있나요", "어떤", "무엇",
  "어느", "정도", "현재", "최근", "어떻게",
]);

const QUESTION_TOPIC_KEYWORDS = [
  ["매출", "객단가", "월매출"],
  ["마케팅", "광고", "홍보", "sns"],
  ["리뷰", "평점", "평판"],
  ["단골", "재방문"],
  ["원가", "식재료", "인건비"],
  ["가격", "메뉴가"],
  ["운영", "피크"],
];

function normalizeFollowupQuestion(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[?!.,~·"'()[\]]/g, " ")
    .replace(/\s+/g, " ");
}

function sharesSameQuestionTopic(a: string, b: string): boolean {
  const left = normalizeFollowupQuestion(a).replace(/\s+/g, "");
  const right = normalizeFollowupQuestion(b).replace(/\s+/g, "");
  return QUESTION_TOPIC_KEYWORDS.some((group) => {
    const leftHit = group.some((k) => left.includes(k));
    const rightHit = group.some((k) => right.includes(k));
    return leftHit && rightHit;
  });
}

function questionTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  normalizeFollowupQuestion(text)
    .split(" ")
    .forEach((token) => {
      if (token.length >= 2 && !QUESTION_STOP_WORDS.has(token)) tokens.add(token);
    });
  return tokens;
}

export function isSimilarFollowupQuestion(
  left: string,
  right: string,
  allowTopicMatch = true,
): boolean {
  const l = normalizeFollowupQuestion(left);
  const r = normalizeFollowupQuestion(right);
  if (!l || !r) return false;
  if (l === r) return true;
  if (l.includes(r) || r.includes(l)) return true;

  const leftTokens = questionTokens(left);
  const rightTokens = questionTokens(right);
  let overlap = 0;
  leftTokens.forEach((t) => {
    if (rightTokens.has(t)) overlap += 1;
  });
  const union = new Set([...leftTokens, ...rightTokens]).size;
  if (union > 0 && overlap / union >= 0.42) return true;
  if (allowTopicMatch && sharesSameQuestionTopic(left, right) && overlap >= 1) return true;
  return false;
}

export function collectAskedFollowupQuestions(
  answers: Record<string, string | string[]>,
  extra: FollowupQuestion[] = [],
): string[] {
  const asked: string[] = [];
  Object.entries(answers).forEach(([key, value]) => {
    if (!key.startsWith("followup_question_")) return;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) asked.push(String(text));
  });
  extra.forEach((item) => {
    if (item.question.trim()) asked.push(item.question.trim());
  });
  return asked;
}

export function filterUniqueFollowupQuestions(
  questions: FollowupQuestion[],
  asked: string[],
  allowTopicMatch = true,
): FollowupQuestion[] {
  const unique: FollowupQuestion[] = [];
  questions.forEach((item) => {
    const question = item.question.trim();
    if (!question) return;
    if (asked.some((prior) => isSimilarFollowupQuestion(question, prior, allowTopicMatch))) return;
    if (unique.some((ex) => isSimilarFollowupQuestion(question, ex.question, false))) return;
    unique.push(item);
  });
  return unique;
}

export function mapDynamicQuestionsToFollowup(questions: any[]): FollowupQuestion[] {
  return (questions ?? []).map((q, idx) => ({
    question: q.title || q.question || "추가 확인이 필요합니다",
    reason: q.category || "맞춤 분석",
    priority: idx === 0 ? "높음" : idx === 1 ? "중간" : "낮음",
    category: q.category,
    options: (q.options ?? []).filter((opt: string) => opt?.trim?.()),
  }));
}

export function parsePhaseQuestions(
  data: any,
  priorQuestions: FollowupQuestion[] = [],
): FollowupQuestion[] {
  const mapped = mapDynamicQuestionsToFollowup(data?.questions ?? []);
  return filterUniqueFollowupQuestions(
    mapped,
    collectAskedFollowupQuestions({}, priorQuestions),
    false,
  );
}

export function withLightAllPhaseContext(
  base: Record<string, string | string[]>,
  phase: 1 | 2,
): Record<string, string | string[]> {
  return {
    ...base,
    followupPhase: String(phase),
    lightFollowupPhase: String(phase),
    lightFollowupBatchScope: "all",
    lightFollowupBatchMode: "true",
  };
}

export function withDeepAllPhaseContext(
  base: Record<string, string | string[]>,
  phase: 1 | 2,
): Record<string, string | string[]> {
  return {
    ...base,
    analysisMode: "deep",
    followupPhase: String(phase),
    deepFollowupPhase: String(phase),
    deepFollowupBatchScope: "all",
    lightFollowupPhase: String(phase),
    lightFollowupBatchScope: "all",
    lightFollowupBatchMode: "true",
  };
}

export function buildFinalUserAnswers(
  answers: Record<string, string | string[]>,
): unknown[] {
  const items: Array<{ question: string; answer: string }> = [];
  Object.keys(answers)
    .filter((k) => k.startsWith("followup_question_"))
    .sort((a, b) => {
      const na = Number(a.replace("followup_question_", ""));
      const nb = Number(b.replace("followup_question_", ""));
      return na - nb;
    })
    .forEach((qKey) => {
      const num = qKey.replace("followup_question_", "");
      const aKey = `followup_${num}`;
      items.push({
        question: String(answers[qKey] ?? ""),
        answer: String(answers[aKey] ?? ""),
      });
    });
  return items;
}
