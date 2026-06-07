import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  MapPin,
  Clock,
  Heart,
  MessageCircle,
  Eye,
  Plus,
  Filter,
  ChevronDown,
  Gift,
  ShoppingCart,
  Camera,
  Tag,
  Users,
  ShoppingBag,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

const marketCategories = ["전체", "주방기기", "인테리어", "포스/결제", "냉장/냉동", "테이블/의자", "간판/사인", "기타"];

interface MarketItem {
  id: number; title: string; price: number; location: string; condition: "중고" | "새상품";
  category: string; posted: string; views: number; chats: number; likes: number;
  image: string; seller: string; desc: string;
}

const mockItems: MarketItem[] = [];

interface SharingItem {
  id: number; title: string; category: string; condition: "중고" | "새상품";
  location: string; posted: string; image: string; seller: string; desc: string;
}

const sharingItems: SharingItem[] = [];

const groupBuyItems: {
  id: number;
  title: string;
  participants: number;
  target: number;
  price: string;
  originalPrice: string;
  deadline: string;
}[] = [];

export function Marketplace() {
  const [tab, setTab] = useState("trade");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showPost, setShowPost] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [priceInput, setPriceInput] = useState("");
  const [itemCondition, setItemCondition] = useState<"중고" | "새상품">("중고");
  const [postType, setPostType] = useState<"판매" | "나눔">("판매");

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setPriceInput(digits === "" ? "" : Number(digits).toLocaleString("ko-KR"));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - uploadedImages.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const filteredItems = mockItems.filter((item) => {
    const matchCat = selectedCategory === "전체" || item.category === selectedCategory;
    const matchSearch = !searchQuery || item.title.includes(searchQuery) || item.desc.includes(searchQuery);
    return matchCat && matchSearch;
  });

  return (
    <div 
      className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10"
      style={{
        minHeight: '100vh',
        backgroundColor: '#141720',
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 50%)`,
      }}
    >
      <div className="flex items-start sm:items-center justify-between gap-4 mb-8 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
            </div>
            <h1 className="text-white" style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em' }}>중고 거래소</h1>
          </div>
          <p className="text-gray-400" style={{ fontSize: '0.9rem' }}>B2B 식자재 · 집기 직거래 및 나눔</p>
        </div>
        <Button className="bg-primary text-white rounded-xl h-10 px-5 shadow-sm" onClick={() => setShowPost(!showPost)}>
          <Plus className="w-4 h-4 mr-1" /> 등록하기
        </Button>
      </div>

      {/* Post Form */}
      {showPost && (
        <Card className="mb-6 border-primary/30 bg-white/5">
          <CardContent className="p-6">
            <h3 className="mb-4 text-white" style={{ fontWeight: 600 }}>물품 등록</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>유형</label>
                <select
                  className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as "판매" | "나눔")}
                >
                  <option style={{ background: '#1a1d2a', color: 'white' }}>판매</option>
                  <option style={{ background: '#1a1d2a', color: 'white' }}>나눔</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>카테고리</label>
                <select className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {marketCategories.filter((c) => c !== "전체").map((c) => (
                    <option key={c} style={{ background: '#1a1d2a', color: 'white' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>제목</label>
                <Input placeholder="물품명을 입력하세요" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
              </div>
              <div>
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>
                  가격
                  {postType === "나눔" && <span className="ml-2 text-xs text-gray-600">(나눔 시 비활성)</span>}
                </label>
                <div
                  className="flex items-center border rounded-md px-3"
                  style={{
                    background: postType === "나눔" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                    borderColor: postType === "나눔" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                    opacity: postType === "나눔" ? 0.4 : 1,
                  }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={postType === "나눔" ? "나눔" : "0"}
                    value={postType === "나눔" ? "" : priceInput}
                    onChange={handlePriceChange}
                    disabled={postType === "나눔"}
                    className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none py-2 text-sm min-w-0 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-400 text-sm ml-1 shrink-0">원</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>위치</label>
                <Input placeholder="거래 희망 지역" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>상세 설명</label>
                <textarea className="w-full border border-white/10 rounded-lg p-3 min-h-[100px] text-sm bg-white/5 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="상품 정보, 사용 기간 등을 작성해주세요" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-gray-400" style={{ fontSize: '0.875rem' }}>상품 상태</label>
                <div className="flex gap-3">
                  {(["중고", "새상품"] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-lg border transition-all"
                      style={{
                        border: itemCondition === option ? "1.5px solid #10b981" : "1px solid rgba(255,255,255,0.1)",
                        background: itemCondition === option ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <input
                        type="radio"
                        name="itemCondition"
                        value={option}
                        checked={itemCondition === option}
                        onChange={() => setItemCondition(option)}
                        className="hidden"
                      />
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: itemCondition === option ? "#10b981" : "rgba(255,255,255,0.25)" }}
                      >
                        {itemCondition === option && (
                          <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.875rem', color: itemCondition === option ? "#34d399" : "rgba(255,255,255,0.6)", fontWeight: itemCondition === option ? 600 : 400 }}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2" style={{ opacity: postType === "나눔" ? 0.4 : 1 }}>
                <label className="mb-1 block text-gray-400" style={{ fontSize: '0.875rem' }}>
                  사진 <span className="text-gray-600">({uploadedImages.length}/5)</span>
                  {postType === "나눔" && <span className="ml-2 text-xs text-gray-600">(나눔 시 비활성)</span>}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                  disabled={postType === "나눔"}
                />
                {/* 업로드 버튼 */}
                {uploadedImages.length < 5 && (
                  <div
                    className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center bg-white/5 transition-colors"
                    style={{ cursor: postType === "나눔" ? "not-allowed" : "pointer" }}
                    onClick={() => postType !== "나눔" && fileInputRef.current?.click()}
                  >
                    <Camera className="w-7 h-7 text-gray-500 mx-auto mb-1.5" />
                    <p className="text-gray-500" style={{ fontSize: '0.825rem' }}>
                      {postType === "나눔" ? "나눔 시 사진 업로드 불가" : `클릭하여 사진 추가 (${5 - uploadedImages.length}장 더 추가 가능)`}
                    </p>
                  </div>
                )}
                {/* 미리보기 그리드 */}
                {uploadedImages.length > 0 && postType !== "나눔" && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                        <img src={img.url} alt={`업로드 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" className="rounded-lg border-white/10 text-gray-400 hover:bg-white/5" onClick={() => setShowPost(false)}>취소</Button>
              <Button className="bg-primary text-white rounded-lg" onClick={() => setShowPost(false)}>등록</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-white/5 rounded-lg">
          <TabsTrigger value="trade" className="rounded-md gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white text-gray-400">
            <ShoppingCart className="w-4 h-4" /> 직거래 장터
          </TabsTrigger>
          <TabsTrigger value="groupbuy" className="rounded-md gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white text-gray-400">
            <ShoppingBag className="w-4 h-4" /> 공동구매
          </TabsTrigger>
          <TabsTrigger value="share" className="rounded-md gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white text-gray-400">
            <Gift className="w-4 h-4" /> 나눔 섹션
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "trade" && (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input placeholder="물품 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
          </div>
          <div className="flex gap-2 flex-wrap mb-6">
            {marketCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-4 py-1 h-auto ${selectedCategory === cat ? "bg-primary text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ fontSize: '0.825rem' }}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* 상품 상세 페이지 */}
          {selectedItem ? (
            <div>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-1.5 mb-6 text-gray-400 hover:text-white transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                ← 목록으로
              </button>
              <div className="grid md:grid-cols-2 gap-8">
                {/* 이미지 */}
                <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-square">
                  {selectedItem.image ? (
                    <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-16 h-16 text-gray-600/40" />
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedItem.condition === '새상품' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {selectedItem.condition}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h2 className="text-white mb-3" style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {selectedItem.title}
                  </h2>
                  <p className="text-primary mb-5" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    {selectedItem.price.toLocaleString()}원
                  </p>
                  <p className="text-gray-400 mb-6 leading-relaxed" style={{ fontSize: '0.9rem' }}>
                    {selectedItem.desc}
                  </p>
                  <div className="flex flex-col gap-2 mb-6 text-gray-500" style={{ fontSize: '0.83rem' }}>
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedItem.location}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {selectedItem.posted}</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {selectedItem.likes + (favorites.has(selectedItem.id) ? 1 : 0)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {selectedItem.chats}</span>
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {selectedItem.views}</span>
                    </span>
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); setFavorites((prev) => { const next = new Set(prev); next.has(selectedItem.id) ? next.delete(selectedItem.id) : next.add(selectedItem.id); return next; }); }}
                      className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center transition-colors hover:bg-white/10"
                      style={{ background: favorites.has(selectedItem.id) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', flexShrink: 0 }}
                    >
                      <Heart className={`w-5 h-5 ${favorites.has(selectedItem.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                    <Button
                      className="flex-1 h-12 bg-primary text-white rounded-xl"
                      style={{ fontSize: '0.95rem', fontWeight: 600 }}
                      onClick={() => navigate("/chat", { state: { sellerName: selectedItem.seller, itemTitle: selectedItem.title } })}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> 채팅하기
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Items Grid */}
              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400" style={{ fontSize: '0.95rem', fontWeight: 600 }}>등록된 물품이 없습니다</p>
                  <p className="text-gray-600 mt-1" style={{ fontSize: '0.82rem' }}>첫 번째로 물품을 등록해보세요</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* 이미지 */}
                    <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-2.5" style={{ aspectRatio: '1/1' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-10 h-10 text-gray-600/40" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setFavorites((prev) => { const next = new Set(prev); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; }); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
                      >
                        <Heart className={`w-3.5 h-3.5 ${favorites.has(item.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
                      </button>
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${item.condition === '새상품' ? 'bg-emerald-500/80 text-white' : 'bg-black/50 text-gray-200'}`}>
                        {item.condition}
                      </span>
                    </div>
                    {/* 텍스트 정보 */}
                    <h4 className="text-white group-hover:text-primary transition-colors line-clamp-2 mb-1" style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4 }}>
                      {item.title}
                    </h4>
                    <p className="text-primary mb-2" style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {item.price.toLocaleString()}원
                    </p>
                    <div className="flex items-center justify-between text-gray-500" style={{ fontSize: '0.72rem' }}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.location}</span>
                        <span className="shrink-0">· {item.posted}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-1">
                        <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{item.likes + (favorites.has(item.id) ? 1 : 0)}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{item.chats}</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "groupbuy" && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingBag className="w-10 h-10 text-green-600 shrink-0" />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }} className="text-green-800">공동구매로 저렴한 가격에 물품 구매하기</p>
                <p className="text-green-600" style={{ fontSize: '0.8rem' }}>필요한 물품을 공동으로 구매하여 저렴한 가격에 얻으세요</p>
              </div>
            </CardContent>
          </Card>

          {groupBuyItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400" style={{ fontSize: "0.95rem", fontWeight: 600 }}>진행 중인 공동구매가 없습니다</p>
              <p className="text-gray-600 mt-1" style={{ fontSize: "0.82rem" }}>새 공동구매가 등록되면 여기에 표시됩니다</p>
            </div>
          )}
          {groupBuyItems.map((item) => (
            <Card key={item.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                        <ShoppingBag className="w-3 h-3 mr-0.5" /> 공동구매
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{item.target}명 참여</Badge>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.title}</h4>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: '0.825rem' }}>현재 {item.participants}명 참여 중</p>
                    <div className="flex items-center gap-3 mt-2 text-muted-foreground" style={{ fontSize: '0.8rem' }}>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.target}명 참여 시</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.deadline}</span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Tag className="w-3.5 h-3.5" /> {item.price} (원가 {item.originalPrice})
                      </span>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg shrink-0" style={{ fontSize: '0.825rem' }}>
                    참여하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "share" && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Gift className="w-10 h-10 text-green-600 shrink-0" />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }} className="text-green-800">나눔으로 따뜻한 사장님 커뮤니티</p>
                <p className="text-green-600" style={{ fontSize: '0.8rem' }}>유통기한 임박 식자재나 불필요한 물품을 이웃 사장님께 나눠주세요</p>
              </div>
            </CardContent>
          </Card>

          {sharingItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Gift className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400" style={{ fontSize: "0.95rem", fontWeight: 600 }}>등록된 나눔 물품이 없습니다</p>
              <p className="text-gray-600 mt-1" style={{ fontSize: "0.82rem" }}>첫 번째로 나눔 물품을 등록해보세요</p>
            </div>
          )}
          {sharingItems.map((item) => (
            <Card key={item.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                        <Gift className="w-3 h-3 mr-0.5" /> 나눔
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{item.seller}</Badge>
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.title}</h4>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: '0.825rem' }}>{item.desc}</p>
                    <div className="flex items-center gap-3 mt-2 text-muted-foreground" style={{ fontSize: '0.8rem' }}>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.posted}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.condition === '새상품' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {item.condition}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg shrink-0"
                    style={{ fontSize: '0.825rem' }}
                    onClick={() => navigate("/chat", { state: { sellerName: item.seller, itemTitle: item.title } })}
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> 채팅하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}