import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { fetchMe, isLoggedIn } from "../utils/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuthenticated(false);
      setReady(true);
      return;
    }
    fetchMe()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#141720", color: "rgba(255,255,255,0.5)" }}
      >
        로딩 중...
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
