// global auth state for the whole app
// tracks the current user and exposes login and logout helpers
// any component can grab this with the useAuth hook below

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "../api/auth.js";
import { extractApiError } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // status starts as loading until we ask the backend if we already have a session
  const [status, setStatus] = useState("loading");

  // on first mount ask the server who we are based on the session cookie
  // active flag prevents setting state after unmount if the request is slow
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

// little hook so components dont have to import useContext every time
// also throws a clearer error if someone forgets to wrap with the provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
