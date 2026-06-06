export type AuthUser = {
  id: number;
  email: string;
  name: string;
  businessType: string;
  createdAt?: string;
};

const TOKEN_KEY = "sosang_access_token";
const USER_KEY = "sosang_user";

export function getApiBase(): string {
  return (
    (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ||
    "http://localhost:8081"
  );
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

export const AUTH_CHANGE_EVENT = "sosang-auth-change";

export function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function setAuthSession(accessToken: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");
  notifyAuthChange();
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("isLoggedIn");
  notifyAuthChange();
}

export function getUserInitial(name?: string): string {
  const trimmed = (name || "사").trim();
  return trimmed.charAt(0).toUpperCase();
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (extra instanceof Headers) {
    extra.forEach((v, k) => {
      headers[k] = v;
    });
  } else if (Array.isArray(extra)) {
    extra.forEach(([k, v]) => {
      headers[k] = v;
    });
  } else if (extra) {
    Object.assign(headers, extra);
  }
  return headers;
}

export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith("http") ? path : `${getApiBase()}${path}`;
  const headers = authHeaders(init?.headers);
  return fetch(url, { ...init, headers });
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let message = (err as { message?: string }).message || "로그인에 실패했습니다.";
    if (message.includes("No static resource") && message.includes("/api/auth")) {
      message =
        "인증 API가 아직 로드되지 않았습니다. 백엔드(8081)를 중지한 뒤 sosan-main에서 gradlew bootRun으로 다시 실행해 주세요.";
    }
    throw new Error(message);
  }
  const data = await res.json();
  setAuthSession(data.accessToken, data.user);
  return data.user;
}

export async function register(params: {
  email: string;
  password: string;
  name: string;
  businessType: string;
}): Promise<AuthUser> {
  const res = await authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    let message = "회원가입에 실패했습니다.";
    try {
      const err = await res.json();
      if (typeof err.message === "string") message = err.message;
      else if (typeof err.error === "string") message = err.error;
      if (message.includes("No static resource") && message.includes("/api/auth")) {
        message =
          "인증 API가 아직 로드되지 않았습니다. 백엔드(8081)를 중지한 뒤 sosan-main에서 gradlew bootRun으로 다시 실행해 주세요.";
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const data = await res.json();
  setAuthSession(data.accessToken, data.user);
  return data.user;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await authFetch("/api/auth/me");
  if (!res.ok) {
    clearAuthSession();
    throw new Error("세션이 만료되었습니다.");
  }
  const user = (await res.json()) as AuthUser;
  const token = getAccessToken();
  if (token) {
    setAuthSession(token, user);
  }
  return user;
}

export type AnalysisHistoryItem = {
  id: number;
  userType: string;
  businessType: string;
  region: string;
  status: string;
  createdAt: string;
};

export async function fetchMyHistory(): Promise<AnalysisHistoryItem[]> {
  const res = await authFetch("/api/auth/me/history");
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export type AnalysisHistoryDetail = AnalysisHistoryItem & {
  answers: Record<string, string>;
  result: Record<string, unknown>;
  selectedCategories?: string[];
};

function authApiUnavailableMessage(raw: string): string {
  if (raw.includes("No static resource") && raw.includes("/api/auth")) {
    return "백엔드가 최신 버전이 아닙니다. sosan-main 폴더에서 gradlew bootRun으로 서버(8081)를 다시 실행해 주세요.";
  }
  return raw;
}

export async function fetchHistoryDetail(historyId: number): Promise<AnalysisHistoryDetail> {
  const res = await authFetch(`/api/auth/me/history/${historyId}`);
  if (!res.ok) {
    let message = "분석 결과를 불러오지 못했습니다.";
    try {
      const err = await res.json();
      if (typeof err.message === "string") message = authApiUnavailableMessage(err.message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}
