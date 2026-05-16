import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, meApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("ft_access_token"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("ft_refresh_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    meApi().then(setUser).catch(() => logout());
  }, [token]);

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      localStorage.setItem("ft_access_token", data.access_token);
      localStorage.setItem("ft_refresh_token", data.refresh_token);
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(data.user ?? (await meApi()));
      return true;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("ft_access_token");
    localStorage.removeItem("ft_refresh_token");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, refreshToken, user, loading, isAuthenticated: Boolean(token), login, logout }),
    [token, refreshToken, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
