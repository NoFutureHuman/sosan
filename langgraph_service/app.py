from __future__ import annotations

import json
import os
from typing import Any, Dict, List, TypedDict

from fastapi import FastAPI, HTTPException
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    answers: Dict[str, Any] = Field(default_factory=dict)
    apiFacts: Dict[str, Any] = Field(default_factory=dict)
    flowType: str = "new"
    selectedCategories: List[str] = Field(default_factory=list)


class GraphState(TypedDict, total=False):
    answers: Dict[str, Any]
    apiFacts: Dict[str, Any]
    flowType: str
    selectedCategories: List[str]
    ragScores: Dict[str, Any]
    questionResult: Dict[str, Any]
    reportResult: Dict[str, Any]
    llmResult: Dict[str, Any]


app = FastAPI()


def _new_llm() -> ChatOpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("AI_NOT_CONNECTED")
    return ChatOpenAI(model="gpt-4o-mini", temperature=0.4, api_key=api_key)


def _base_context(state: GraphState) -> str:
    answers_json = json.dumps(state.get("answers", {}), ensure_ascii=False, indent=2)
    api_json = json.dumps(state.get("apiFacts", {}), ensure_ascii=False, indent=2)
    score_json = json.dumps(state.get("ragScores", {}), ensure_ascii=False, indent=2)
    categories_json = json.dumps(state.get("selectedCategories", []), ensure_ascii=False)
    flow_type = state.get("flowType", "new")
    return f"""
분석 유형(flowType): {flow_type}
선택 카테고리(existing일 때만 제약): {categories_json}

[사용자 답변]
{answers_json}

[API 팩트 데이터]
{api_json}

[RAG 비교 점수]
{score_json}
""".strip()


def _build_question_prompt(state: GraphState) -> str:
    ctx = _base_context(state)
    return f"""
당신은 소상공인 컨설팅 AI입니다.
현재 목표는 "추가질문 필요 여부 판단"입니다.

{ctx}

출력은 반드시 JSON 객체 하나:
{{
  "isAnswerSufficient": true 또는 false,
  "insufficiencyReason": "부족 시 한 문장",
  "solutionQuestions": [
    {{
      "question":"...",
      "reason":"...",
      "priority":"높음|중간|낮음",
      "options":["선택지1","선택지2","선택지3","기타(직접입력)"]
    }}
  ],
  ]
}}

규칙:
- 답변이 충분하지 않으면 isAnswerSufficient=false, solutionQuestions 2~5개를 생성.
- 답변이 충분하면 isAnswerSufficient=true, solutionQuestions=[].
- solutionQuestions의 각 문항마다 options는 3~6개, 마지막은 반드시 "기타(직접입력)".
- 질문 중복 금지(표현만 다른 유사 질문 포함).
- 반드시 RAG 비교 점수에서 낮은 항목(특히 70 미만)을 우선 보완하는 질문만 생성.
- 이미 충분한(80 이상) 항목을 다시 묻는 질문 금지.
- existing + 선택 카테고리가 있으면 질문/솔루션은 해당 카테고리 범위만 다룬다.
- generic한 질문 금지, 반드시 사용자 답변/API팩트를 근거로 만든다.
""".strip()


def _build_report_prompt(state: GraphState) -> str:
    ctx = _base_context(state)
    return f"""
당신은 소상공인 컨설팅 AI입니다.
현재 목표는 "최종 실행 리포트 생성"입니다.

{ctx}

출력은 반드시 JSON 객체 하나:
{{
  "isAnswerSufficient": true,
  "insufficiencyReason": "",
  "solutionQuestions": [],
  "fundingComparison": [
    {{
      "method": "...",
      "amount": "...",
      "pros": ["..."],
      "cons": ["..."],
      "recommended": true,
      "suitability": "..."
    }}
  ],
  "sbizAnalysis": {{
    "summary":"...",
    "storeBreakdown":[{{"category":"...", "count":1, "competition":"중간"}}],
    "competitionLevel":"...",
    "overallScore":70,
    "locationRecommendations":[{{"rank":1,"area":"...","reason":"...","score":80,"pros":["..."],"cons":["..."]}}]
  }},
  "riskFactors": [{{"category":"...","level":"중간","description":"...","mitigation":"..."}}],
  "actionPlan": [{{"period":"1~2개월차","focus":"...","tasks":["..."]}}],
  "profitability": [{{"bizType":"...","monthlyProfit":"...","profitValue":300,"isTarget":true,"aiTip":"..."}}],
  "budgetBreakdown": [{{"label":"...","amount":"...","note":"..."}}],
  "rentEstimation": {{
    "basis":"...",
    "estimatedDeposit":"...",
    "estimatedMonthlyRent":"...",
    "bySize":[{{"size":"...","deposit":"...","monthlyRent":"...","note":"..."}}],
    "tips":["..."]
  }},
  "interiorPlan": {{
    "style":"...",
    "styleDesc":"...",
    "estimatedCost":"...",
    "items":[{{"category":"...","detail":"...","cost":"...","priority":"필수"}}],
    "aiTips":["..."]
  }},
  "trialRunPlan": {{
    "phases":[{{"period":"...","name":"...","goals":["..."],"kpis":[{{"metric":"...","target":"..."}}]}}],
    "feedbackChannels":["..."],
    "warningSignals":["..."]
  }}
}}

문체 규칙(매우 중요):
- "OO시의 한식 업종은..." 같은 제3자/일반론 문장 금지.
- 반드시 "사장님의 매장", "현재 매장 상황", "사장님 운영 데이터" 같은 2인칭 컨설팅 문체.
- 추상어 금지. "무엇을/언제/얼마나/어떤 지표로" 포함한 실행 문장 사용.
- 요약은 원인+영향+우선순위 순서로 2~3문장.
- actionPlan은 각 period마다 tasks 최소 4개.
- riskFactors.mitigation은 즉시 실행 1개 + 2주 내 실행 1개 수준으로 구체화.
- 허황된 표현 금지.
- RAG 비교 점수를 근거로 핵심 리스크/기회 3개를 반드시 반영.
""".strip()


def _to_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(str(v) for v in value if str(v).strip())
    return str(value)


def _score_presence(*values: Any) -> int:
    non_empty = 0
    for v in values:
        if _to_str(v).strip():
            non_empty += 1
    return int((non_empty / max(1, len(values))) * 100)


def _score_node(state: GraphState) -> GraphState:
    answers = state.get("answers", {})
    api_facts = state.get("apiFacts", {})

    fixed_score = _score_presence(
        answers.get("region"),
        answers.get("bizType"),
        answers.get("challenge"),
    )

    followup_pairs = []
    for k, v in answers.items():
        if isinstance(k, str) and k.startswith("followup_") and not k.startswith("followup_question_"):
            followup_pairs.append((_to_str(v).strip(), _to_str(answers.get(f"followup_question_{k.split('_')[-1]}")).strip()))
    followup_answered = sum(1 for ans, q in followup_pairs if ans and q)
    followup_score = 100 if not followup_pairs else int((followup_answered / len(followup_pairs)) * 100)

    commercial = api_facts.get("commercial")
    sbiz = api_facts.get("sbiz")
    rone = api_facts.get("rone")
    bizinfo = api_facts.get("bizinfo")
    api_score = _score_presence(
        commercial if commercial else "",
        sbiz if sbiz else "",
        rone if rone else "",
        bizinfo if bizinfo else "",
    )

    weighted_total = int(fixed_score * 0.35 + followup_score * 0.30 + api_score * 0.35)
    state["ragScores"] = {
        "fixedQuestionCoverage": fixed_score,
        "generatedQuestionCoverage": followup_score,
        "apiFactCoverage": api_score,
        "overallReadinessScore": weighted_total,
        "insufficientAxes": [
            axis
            for axis, score in [
                ("fixed", fixed_score),
                ("followup", followup_score),
                ("api", api_score),
            ]
            if score < 70
        ],
    }
    return state


def _invoke_json(llm: ChatOpenAI, prompt: str, error_prefix: str) -> Dict[str, Any]:
    message = llm.invoke(prompt)
    raw = message.content if isinstance(message.content, str) else str(message.content)
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
        raise RuntimeError(f"{error_prefix}_NOT_OBJECT")
    except Exception as exc:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = raw[start : end + 1]
            try:
                parsed = json.loads(snippet)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass
        raise RuntimeError(f"{error_prefix}_JSON_PARSE_ERROR: {exc}") from exc


def _normalize_questions(result: Dict[str, Any]) -> Dict[str, Any]:
    questions = result.get("solutionQuestions", [])
    if not isinstance(questions, list):
        questions = []

    deduped = []
    seen = set()
    for item in questions:
        if not isinstance(item, dict):
            continue
        q = str(item.get("question", "")).strip()
        if not q:
            continue
        norm = " ".join(q.lower().split())
        if norm in seen:
            continue
        seen.add(norm)

        options = item.get("options", [])
        if not isinstance(options, list):
            options = []
        normalized_options = [str(opt).strip() for opt in options if str(opt).strip()]
        if len(normalized_options) < 3:
            continue
        if normalized_options[-1] != "기타(직접입력)":
            normalized_options.append("기타(직접입력)")
        while len(normalized_options) > 6:
            normalized_options.pop(-2)

        deduped.append(
            {
                "question": q,
                "reason": str(item.get("reason", "")).strip(),
                "priority": str(item.get("priority", "중간")).strip() or "중간",
                "options": normalized_options,
            }
        )
    result["solutionQuestions"] = deduped[:6]
    return result


def _empty_report_payload() -> Dict[str, Any]:
    return {
        "fundingComparison": [],
        "sbizAnalysis": {
            "summary": "",
            "storeBreakdown": [],
            "competitionLevel": "",
            "overallScore": 70,
            "locationRecommendations": [],
        },
        "riskFactors": [],
        "actionPlan": [],
        "profitability": [],
        "budgetBreakdown": [],
        "rentEstimation": {
            "basis": "",
            "estimatedDeposit": "",
            "estimatedMonthlyRent": "",
            "bySize": [],
            "tips": [],
        },
        "interiorPlan": {
            "style": "",
            "styleDesc": "",
            "estimatedCost": "",
            "items": [],
            "aiTips": [],
        },
        "trialRunPlan": {"phases": [], "feedbackChannels": [], "warningSignals": []},
    }


def api_node(state: GraphState) -> GraphState:
    # Spring 백엔드에서 API 수집 완료 후 넘겨주므로 상태 전달만 수행
    return state


def question_node(state: GraphState) -> GraphState:
    llm = _new_llm()
    parsed = _invoke_json(llm, _build_question_prompt(state), "QUESTION")
    parsed = _normalize_questions(parsed)
    state["questionResult"] = parsed
    return state


def should_generate_report(state: GraphState) -> str:
    result = state.get("questionResult", {})
    rag_scores = state.get("ragScores", {})
    readiness = int(rag_scores.get("overallReadinessScore", 0))
    is_sufficient = bool(result.get("isAnswerSufficient", False)) and readiness >= 70
    return "report_node" if is_sufficient else "finalize_insufficient_node"


def report_node(state: GraphState) -> GraphState:
    llm = _new_llm()
    parsed = _invoke_json(llm, _build_report_prompt(state), "REPORT")
    state["reportResult"] = parsed
    return state


def finalize_insufficient_node(state: GraphState) -> GraphState:
    q = state.get("questionResult", {})
    rag_scores = state.get("ragScores", {})
    state["llmResult"] = {
        "isAnswerSufficient": False,
        "insufficiencyReason": (
            str(q.get("insufficiencyReason", "")).strip()
            or f"RAG 준비도 점수({rag_scores.get('overallReadinessScore', 0)}점)가 부족합니다."
        ),
        "solutionQuestions": q.get("solutionQuestions", []),
        "ragScores": rag_scores,
        **_empty_report_payload(),
    }
    return state


def finalize_report_node(state: GraphState) -> GraphState:
    report = state.get("reportResult", {})
    rag_scores = state.get("ragScores", {})
    # 질문 단계에서 충분하다고 판단되었으므로 최종은 충분으로 강제
    state["llmResult"] = {
        "isAnswerSufficient": True,
        "insufficiencyReason": "",
        "solutionQuestions": [],
        "ragScores": rag_scores,
        **_empty_report_payload(),
        **report,
    }
    return state


def build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("api_node", api_node)
    graph.add_node("score_node", _score_node)
    graph.add_node("question_node", question_node)
    graph.add_node("report_node", report_node)
    graph.add_node("finalize_insufficient_node", finalize_insufficient_node)
    graph.add_node("finalize_report_node", finalize_report_node)

    graph.set_entry_point("api_node")
    graph.add_edge("api_node", "score_node")
    graph.add_edge("score_node", "question_node")
    graph.add_conditional_edges(
        "question_node",
        should_generate_report,
        {
            "report_node": "report_node",
            "finalize_insufficient_node": "finalize_insufficient_node",
        },
    )
    graph.add_edge("report_node", "finalize_report_node")
    graph.add_edge("finalize_insufficient_node", END)
    graph.add_edge("finalize_report_node", END)
    return graph.compile()


compiled_graph = build_graph()


@app.post("/run")
def run_analysis(request: AnalysisRequest):
    try:
        result = compiled_graph.invoke(
            {
                "answers": request.answers,
                "apiFacts": request.apiFacts,
                "flowType": request.flowType,
                "selectedCategories": request.selectedCategories,
            }
        )
        llm_result = result.get("llmResult")
        if not isinstance(llm_result, dict):
            raise RuntimeError("INVALID_LLM_RESULT")
        return llm_result
    except RuntimeError as exc:
        if str(exc) == "AI_NOT_CONNECTED":
            raise HTTPException(status_code=503, detail="AI_NOT_CONNECTED")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
