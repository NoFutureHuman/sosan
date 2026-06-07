import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Bell,
  Flame,
  Snowflake,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PriceDirection = "up" | "down" | "stable";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
  direction: PriceDirection;
  prevPrice: number;
  monthAgo: number;
  yearAgo: number;
  isVolatile: boolean;
  updatedAt: string;
  weeklyData: { day: string; price: number }[];
}

const categories = ["전체", "수산물", "축산물", "채소", "과일", "곡물/유제품"];

const CATEGORY_EMOJI: Record<string, string> = {
  채소: "🥬",
  과일: "🍎",
  축산물: "🥩",
  수산물: "🐟",
  "곡물/유제품": "🍚",
  기타: "📦",
};

function mapApiItem(raw: Record<string, unknown>, index: number): Ingredient | null {
  const price = Number(raw.price ?? 0);
  if (!price) return null;

  const prevPrice = Number(raw.prevPrice ?? 0);
  const monthAgo = Number(raw.monthAgo ?? 0);
  const yearAgo = Number(raw.yearAgo ?? 0);
  const category = String(raw.category ?? "기타");
  const direction = (String(raw.direction ?? "stable") as PriceDirection);

  const weeklyData = [
    { day: "1년전", price: yearAgo },
    { day: "1개월전", price: monthAgo },
    { day: "1일전", price: prevPrice },
    { day: "오늘", price },
  ].filter((p) => p.price > 0);

  return {
    id: String(raw.id ?? `item-${index}`),
    name: String(raw.name ?? ""),
    emoji: CATEGORY_EMOJI[category] ?? "📦",
    category,
    price,
    unit: String(raw.unit ?? ""),
    change: Number(raw.change ?? 0),
    changePercent: Number(raw.changePercent ?? 0),
    direction,
    prevPrice,
    monthAgo,
    yearAgo,
    isVolatile: Boolean(raw.isVolatile),
    updatedAt: String(raw.updatedAt ?? ""),
    weeklyData,
  };
}

export function MarketPrice() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [priceAlertItems, setPriceAlertItems] = useState<Set<string>>(new Set());
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [source, setSource] = useState("KAMIS");

  const loadPrices = useCallback(() => {
    setLoading(true);
    setFetchError(null);

    const params = new URLSearchParams();
    if (selectedCategory !== "전체") params.set("category", selectedCategory);

    fetch(`/api/market/ingredients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && (!Array.isArray(data.items) || data.items.length === 0)) {
          setFetchError(String(data.error));
          setIngredients([]);
          return;
        }
        const items = Array.isArray(data.items)
          ? data.items
              .map((raw: Record<string, unknown>, i: number) => mapApiItem(raw, i))
              .filter((item: Ingredient | null): item is Ingredient => item != null)
          : [];
        setIngredients(items);
        setUpdatedAt(String(data.updatedAt ?? ""));
        setSource(String(data.source ?? "KAMIS"));
      })
      .catch(() => {
        setFetchError("식자재 시세를 불러오지 못했습니다.");
        setIngredients([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const filtered = useMemo(() => {
    return ingredients.filter((item) => {
      const matchSearch = !searchQuery || item.name.includes(searchQuery);
      return matchSearch;
    });
  }, [ingredients, searchQuery]);

  const priceAlerts = useMemo(() => {
    return ingredients
      .filter((item) => item.isVolatile)
      .slice(0, 3)
      .map((item) => ({
        item: item.name,
        message:
          item.direction === "up"
            ? `전일 대비 ${item.changePercent > 0 ? "+" : ""}${item.changePercent}% 상승`
            : item.direction === "down"
              ? `전일 대비 ${item.changePercent}% 하락`
              : "가격 변동이 큽니다",
        type: item.direction === "down" ? ("good" as const) : ("warning" as const),
      }));
  }, [ingredients]);

  const directionIcon = (d: PriceDirection) => {
    if (d === "up") return <ArrowUpRight className="w-3.5 h-3.5" />;
    if (d === "down") return <ArrowDownRight className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const directionColor = (d: PriceDirection) => {
    if (d === "up") return "text-red-500";
    if (d === "down") return "text-blue-500";
    return "text-gray-400";
  };

  const formatUpdatedAt = updatedAt
    ? `${updatedAt.slice(0, 4)}.${updatedAt.slice(4, 6)}.${updatedAt.slice(6, 8)}`
    : "—";

  return (
    <div
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10"
      style={{
        minHeight: "100vh",
        backgroundColor: "#141720",
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 50%)`,
      }}
    >
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <h1 className="text-white" style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            식자재 시세
          </h1>
        </div>
        <p className="text-gray-400" style={{ fontSize: "0.9rem" }}>
          KAMIS 실시간 소매가격 · 전국 도매시장 기준
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-gray-400" style={{ fontSize: "0.72rem" }}>
            <RefreshCw className="w-3 h-3" />
            최종 업데이트: {formatUpdatedAt} ({source})
          </div>
          <button
            onClick={loadPrices}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            style={{ fontSize: "0.78rem" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>

        {fetchError && (
          <div className="rounded-xl p-4 flex items-start gap-2 bg-amber-900/20 ring-1 ring-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200" style={{ fontSize: "0.82rem" }}>{fetchError}</p>
          </div>
        )}

        {priceAlerts.length > 0 && (
          <div className="space-y-2">
            {priceAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 flex items-center gap-3 ring-1 ${
                  alert.type === "warning"
                    ? "bg-red-900/20 ring-red-500/30"
                    : "bg-emerald-900/20 ring-emerald-500/30"
                }`}
              >
                {alert.type === "warning" ? (
                  <Flame className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Snowflake className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <p style={{ fontSize: "0.82rem" }}>
                  <strong className={alert.type === "warning" ? "text-red-300" : "text-emerald-300"}>
                    {alert.item}
                  </strong>{" "}
                  <span className={alert.type === "warning" ? "text-red-400" : "text-emerald-400"}>
                    {alert.message}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 placeholder:text-gray-500"
            placeholder="식자재 검색 (예: 배추, 돼지고기, 대파...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
              style={{ fontSize: "0.8rem", fontWeight: 500 }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin mb-3" />
            <p className="text-gray-400" style={{ fontSize: "0.88rem" }}>KAMIS 시세를 불러오는 중...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400" style={{ fontSize: "0.95rem", fontWeight: 600 }}>표시할 시세 데이터가 없습니다</p>
          </div>
        )}

        <div className="space-y-2">
          {!loading &&
            filtered.map((item) => (
              <Card
                key={item.id}
                className={`border-0 shadow-sm ring-1 cursor-pointer transition-all hover:shadow-md bg-white/5 ${
                  selectedItem === item.id ? "ring-teal-500/50 shadow-md" : "ring-white/10"
                }`}
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0"
                      style={{ fontSize: "1.3rem" }}
                    >
                      {item.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-gray-200" style={{ fontSize: "0.92rem", fontWeight: 600 }}>
                          {item.name}
                        </span>
                        {item.isVolatile && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400"
                            style={{ fontSize: "0.6rem", fontWeight: 600 }}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 inline" /> 변동
                          </span>
                        )}
                        <span className="text-gray-500" style={{ fontSize: "0.68rem" }}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500" style={{ fontSize: "0.72rem" }}>
                          /{item.unit}
                        </span>
                        {item.updatedAt && (
                          <span className="text-gray-500" style={{ fontSize: "0.68rem" }}>
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            {item.updatedAt}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-white" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                        {item.price.toLocaleString()}원
                      </p>
                      <div
                        className={`flex items-center justify-end gap-0.5 ${directionColor(item.direction)}`}
                        style={{ fontSize: "0.78rem", fontWeight: 600 }}
                      >
                        {directionIcon(item.direction)}
                        {item.direction !== "stable" && (
                          <>
                            {Math.abs(item.change).toLocaleString()}원
                            <span style={{ fontSize: "0.7rem" }}>
                              ({item.changePercent > 0 ? "+" : ""}
                              {item.changePercent}%)
                            </span>
                          </>
                        )}
                        {item.direction === "stable" && <span>보합</span>}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPriceAlertItems((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        priceAlertItems.has(item.id)
                          ? "bg-teal-600/20 text-teal-400"
                          : "bg-white/5 text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedItem === item.id && item.weeklyData.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      <div>
                        <h5 className="mb-2 text-gray-300" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          가격 추이
                        </h5>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={item.weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" domain={["auto", "auto"]} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: "none",
                                background: "#1f2937",
                                color: "#fff",
                              }}
                              formatter={(value: number) => [`${value.toLocaleString()}원`, item.name]}
                            />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke={
                                item.direction === "up"
                                  ? "#ef4444"
                                  : item.direction === "down"
                                    ? "#3b82f6"
                                    : "#9ca3af"
                              }
                              strokeWidth={2.5}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "1일 전", value: item.prevPrice },
                          { label: "1개월 전", value: item.monthAgo },
                          { label: "1년 전", value: item.yearAgo },
                        ]
                          .filter((c) => c.value > 0)
                          .map((c) => (
                            <div key={c.label} className="text-center p-3 rounded-xl bg-white/5">
                              <p className="text-gray-400 mb-1" style={{ fontSize: "0.68rem" }}>
                                {c.label}
                              </p>
                              <p className="text-white" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                                {c.value.toLocaleString()}원
                              </p>
                              <p
                                className={
                                  item.price > c.value
                                    ? "text-red-400"
                                    : item.price < c.value
                                      ? "text-blue-400"
                                      : "text-gray-400"
                                }
                                style={{ fontSize: "0.72rem" }}
                              >
                                {c.value > 0
                                  ? `${item.price > c.value ? "+" : ""}${(((item.price - c.value) / c.value) * 100).toFixed(1)}%`
                                  : "—"}
                              </p>
                            </div>
                          ))}
                      </div>

                      <div className="bg-teal-900/20 rounded-xl p-3 flex items-start gap-2 ring-1 ring-teal-500/20">
                        <Info className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                        <p className="text-teal-200" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                          {item.direction === "up"
                            ? `${item.name} 가격이 상승 추세입니다. 대량 구매 시점을 조절하거나 대체 식재료를 검토해보세요.`
                            : item.direction === "down"
                              ? `${item.name} 가격이 하락 추세입니다. 지금이 대량 구매 적기일 수 있습니다.`
                              : `${item.name} 가격이 안정적입니다.`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="bg-white/5 rounded-xl p-4 flex items-start gap-2 ring-1 ring-white/10">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-gray-500" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
            가격 정보는 KAMIS(농산물유통정보) 서울 소매가격 기준입니다. 실제 매입가는 유통 경로와 물량에 따라
            차이가 있을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
