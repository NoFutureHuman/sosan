import { BarChart3, Info } from "lucide-react";

export function BusinessInsight() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.15)" }}>
          <BarChart3 className="w-5 h-5" style={{ color: "#fb923c" }} />
        </div>
        <div>
          <h2 className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>창업·메뉴 분석</h2>
          <p className="text-gray-500" style={{ fontSize: "0.82rem" }}>지역 검색 트렌드 · 폐업률 · 추천 아이템 분석</p>
        </div>
      </div>

      <div
        className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <BarChart3 className="w-14 h-14 text-gray-600 mb-4" />
        <p className="text-gray-300" style={{ fontSize: "1rem", fontWeight: 600 }}>분석 데이터가 없습니다</p>
        <p className="text-gray-500 mt-2 max-w-md" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
          실시간 검색 트렌드와 상권 데이터가 연동되면 이곳에 표시됩니다.
        </p>
        <div
          className="flex items-center gap-2 mt-6 px-4 py-2 rounded-xl"
          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}
        >
          <Info className="w-4 h-4" style={{ color: "#60a5fa" }} />
          <span className="text-gray-400" style={{ fontSize: "0.8rem" }}>AI 맞춤 분석에서 상세 리포트를 확인할 수 있습니다</span>
        </div>
      </div>
    </div>
  );
}
