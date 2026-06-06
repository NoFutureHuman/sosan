import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, Store } from "lucide-react";
import { ExistingResultReport } from "./ExistingResultReport";
import { NewResultReport } from "./NewResultReport";
import type { AiAnalysisResult } from "../utils/openai";
import { AnalysisHistoryDetail, fetchHistoryDetail } from "../utils/auth";

export function AnalysisHistoryDetailPage() {
  const { historyId } = useParams<{ historyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<AnalysisHistoryDetail | null>(null);

  useEffect(() => {
    const id = Number(historyId);
    if (!id || Number.isNaN(id)) {
      setError("잘못된 분석 기록입니다.");
      setLoading(false);
      return;
    }
    fetchHistoryDetail(id)
      .then(setDetail)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "불러오기 실패");
      })
      .finally(() => setLoading(false));
  }, [historyId]);

  const goBack = () => navigate("/mypage");

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#141720", color: "rgba(255,255,255,0.5)" }}
      >
        분석 결과 불러오는 중...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen px-4 py-10" style={{ background: "#141720" }}>
        <div className="max-w-lg mx-auto text-center">
          <p className="text-red-300 mb-6">{error || "결과를 찾을 수 없습니다."}</p>
          <button
            type="button"
            onClick={goBack}
            className="px-5 py-2.5 rounded-xl text-white"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            마이페이지로
          </button>
        </div>
      </div>
    );
  }

  const isExisting =
    detail.userType?.toUpperCase() === "EXISTING" ||
    detail.result?.type === "result" ||
    Boolean(detail.result?.existingSolution);

  const selectedCategories = Array.isArray(detail.selectedCategories)
    ? detail.selectedCategories
    : Array.isArray(detail.result?.selectedCategories)
      ? (detail.result.selectedCategories as string[])
      : [];

  const answers: Record<string, string | string[]> = {
    ...(detail.answers ?? {}),
    ...(selectedCategories.length > 0 ? { selectedCategories } : {}),
    ...(detail.result?.analysisMode
      ? { analysisMode: String(detail.result.analysisMode) }
      : {}),
  };

  if (isExisting) {
    return (
      <div style={{ background: "#141720", minHeight: "100vh" }}>
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <Link
            to="/mypage"
            className="inline-flex items-center gap-1.5 mb-4 text-sm"
            style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
          >
            <ChevronLeft className="w-4 h-4" />
            마이페이지로
          </Link>
        </div>
        <ExistingResultReport
          answers={answers}
          aiResult={detail.result}
          aiError={false}
          commercialCtx={null}
          sbizData={null}
          kamisData={null}
          onReset={goBack}
          onGoMain={goBack}
          selectedCategories={selectedCategories}
        />
      </div>
    );
  }

  return (
    <div style={{ background: "#141720", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <Link
          to="/mypage"
          className="inline-flex items-center gap-2 mb-2"
          style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "0.85rem" }}
        >
          <Store className="w-4 h-4" />
          <ChevronLeft className="w-4 h-4" />
          마이페이지 · 저장된 분석
        </Link>
      </div>
      <NewResultReport
        answers={answers}
        aiResult={detail.result as unknown as AiAnalysisResult}
        aiError={false}
        sbizData={null}
        commercialCtx={null}
        roneData={null}
        bizinfoData={null}
        onReset={goBack}
        onSwitchToExisting={() => navigate("/ai-analysis")}
      />
    </div>
  );
}
