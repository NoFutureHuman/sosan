import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  AUTH_CHANGE_EVENT,
  AuthUser,
  getStoredUser,
  isLoggedIn,
} from "../utils/auth";

export function useAuthStatus() {
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const sync = useCallback(() => {
    setLoggedIn(isLoggedIn());
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync, location.pathname]);

  return { loggedIn, user, sync };
}
