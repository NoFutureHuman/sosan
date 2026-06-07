import { Sparkles, RotateCcw } from "lucide-react";

interface Props {
  answers: Record<string, string | string[]>;
  onReset: () => void;
  onDetailedAnalysis: () => void;
}

export function SimpleResultReport({ onReset, onDetailedAnalysis }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#141720", color: "white", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#34d399)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: "#34d399" }}>AI 업종 추천 결과</span>
        </div>
        <h1 className="mb-2" style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.2 }}>
          분석 결과를 준비 중입니다
        </h1>
        <p className="mb-10" style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
          AI 분석 API 연동 후 실제 추천 결과가 이곳에 표시됩니다.
        </p>

        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 mb-10 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Sparkles className="w-12 h-12 mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm font-bold text-white mb-1">추천 업종 데이터 없음</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>상세 분석을 진행하면 맞춤 추천을 받을 수 있습니다</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl flex-1 font-bold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: "0.95rem" }}
          >
            <RotateCcw className="w-4 h-4" /> 처음부터 다시
          </button>
          <button
            onClick={onDetailedAnalysis}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl flex-1 font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#10b981,#34d399)", boxShadow: "0 8px 24px rgba(16,185,129,0.35)", fontSize: "0.95rem" }}
          >
            <Sparkles className="w-4 h-4" /> 상세 분석 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
