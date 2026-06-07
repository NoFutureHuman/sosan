import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  AUTH_CHANGE_EVENT,
  AuthUser,
  fetchMe,
  getStoredUser,
  isLoggedIn,
} from "../utils/auth";

export function useAuthStatus() {
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const sync = useCallback(() => {
    setLoggedIn(isLoggedIn());
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isLoggedIn()) {
        if (!cancelled) {
          setLoggedIn(false);
          setUser(null);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (!cancelled) {
          setLoggedIn(true);
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setLoggedIn(false);
          setUser(null);
        }
      }
    }

    init();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync, location.pathname]);

  return { loggedIn, user, sync };
}
