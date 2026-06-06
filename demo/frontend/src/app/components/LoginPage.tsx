import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Store, ArrowRight, Eye, EyeOff,
  Mail, Lock,
} from "lucide-react";
import { isLoggedIn, login } from "../utils/auth";

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/mypage", { replace: true });
    }
  }, [navigate]);
  const [email, setEmail]   = useState("");
  const [password, setPw]   = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/mypage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%", height: "52px", padding: "0 48px 0 44px",
    borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.07)", color: "white",
    fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(16,185,129,0.6)";
    e.target.style.boxShadow   = "0 0 0 3px rgba(16,185,129,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)";
    e.target.style.boxShadow   = "none";
  };

  return (
      <div
          className="min-h-screen flex items-center justify-center px-4 py-10"
          style={{ background: "#141720" }}
      >
        <div
            className="pointer-events-none fixed inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.07) 0%, transparent 60%)" }}
        />

        <div className="relative w-full" style={{ maxWidth: "440px" }}>
          <Link to="/" className="flex items-center gap-2.5 mb-9">
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg,#10b981,#34d399)" }}
            >
              <Store className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-white" style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            소상<span style={{ color: "#10b981" }}>광장</span>
          </span>
          </Link>

          <h1 className="text-white mb-1.5" style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em" }}>
            다시 오셨군요!
          </h1>
          <p className="mb-8" style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.42)" }}>
            소상광장에 로그인하고 서비스를 이용하세요.
          </p>

          {error && (
            <p
              className="mb-4 px-4 py-3 rounded-xl"
              style={{
                fontSize: "0.88rem",
                color: "#fca5a5",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>이메일로 로그인</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소" required
                  style={{ ...inputBase, paddingRight: "18px" }}
                  onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                  type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호" required minLength={8}
                  style={inputBase}
                  onFocus={onFocus} onBlur={onBlur}
              />
              <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                style={{
                  height: "56px", borderRadius: "14px",
                  background: loading
                    ? "rgba(16,185,129,0.4)"
                    : "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  color: "white", fontSize: "1.05rem", fontWeight: 700,
                  border: "none", cursor: loading ? "wait" : "pointer",
                }}
            >
              {loading ? "로그인 중..." : <>로그인 <ArrowRight style={{ width: "18px", height: "18px" }} /></>}
            </button>
          </form>

          <p className="mt-6 text-center" style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.3)" }}>
            아직 계정이 없으신가요?{" "}
            <Link to="/register" style={{ color: "#10b981", fontWeight: 600, textDecoration: "none" }}>
              무료 가입
            </Link>
          </p>
        </div>
      </div>
  );
}
