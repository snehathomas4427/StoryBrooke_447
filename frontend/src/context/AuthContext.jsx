import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "../api/auth.js";
import { extractApiError } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchMe();
        if (!active) return;
        setUser(data?.user || null);
        setStatus("ready");
      } catch {
        if (!active) return;
        setUser(null);
        setStatus("ready");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async ({ username, name }) => {
    try {
      const data = await loginRequest({ username, name });
      setUser(data?.user || null);
      return { ok: true, user: data?.user || null };
    } catch (err) {
      return { ok: false, error: extractApiError(err, "Could not sign in.") };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: !!user?.username,
      login,
      logout
    }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
