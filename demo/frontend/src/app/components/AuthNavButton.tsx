import { useNavigate } from "react-router";
import { LogIn, User } from "lucide-react";
import { Button } from "./ui/button";
import { getUserInitial } from "../utils/auth";
import { useAuthStatus } from "../hooks/useAuthStatus";

type AuthNavButtonProps = {
  /** 로그인 전에도 아이콘만 표시 (텍스트 숨김) */
  iconOnly?: boolean;
  className?: string;
};

export function AuthNavButton({ iconOnly = true, className = "" }: AuthNavButtonProps) {
  const navigate = useNavigate();
  const { loggedIn, user } = useAuthStatus();

  if (loggedIn) {
    const initial = getUserInitial(user?.name);
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`w-9 h-9 rounded-full p-0 hover:bg-white/10 ${className}`}
        title={`${user?.name || "사장님"} · 마이페이지`}
        aria-label="마이페이지"
        onClick={() => navigate("/mypage")}
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
          style={{
            fontSize: "0.9rem",
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            boxShadow: "0 0 0 2px rgba(16,185,129,0.35)",
          }}
        >
          {initial}
        </span>
      </Button>
    );
  }

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 ${className}`}
        title="로그인"
        aria-label="로그인"
        onClick={() => navigate("/login")}
      >
        <LogIn className="w-[18px] h-[18px]" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={`h-9 px-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 ${className}`}
      onClick={() => navigate("/login")}
    >
      <LogIn className="w-4 h-4 mr-1.5" />
      로그인
    </Button>
  );
}

/** 랜딩 페이지용 — 주황 테마 */
export function AuthNavButtonLanding() {
  const navigate = useNavigate();
  const { loggedIn, user } = useAuthStatus();

  if (loggedIn) {
    const initial = getUserInitial(user?.name);
    return (
      <button
        type="button"
        onClick={() => navigate("/mypage")}
        title={`${user?.name || "사장님"} · 마이페이지`}
        aria-label="마이페이지"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid rgba(16,185,129,0.5)",
          background: "linear-gradient(135deg,#10b981,#34d399)",
          color: "white",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {initial}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/login")}
      title="로그인"
      aria-label="로그인"
      style={{
        width: 40,
        height: 40,
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.75)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <User size={18} />
    </button>
  );
}
