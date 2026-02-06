import { createContext, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

const AUTH_USER_KEY = "ridecompare:auth_user_v1";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setUser(null);
          try {
            localStorage.removeItem(AUTH_USER_KEY);
          } catch {}
          return;
        }

        const userData = await authService.getCurrentUser();
        setUser(userData);
        try {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        } catch {}
      } catch (error) {
        console.error("Failed to load user:", error);
        await authService.logout();
        setUser(null);
        try {
          localStorage.removeItem(AUTH_USER_KEY);
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    } catch {}
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.user);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    } catch {}
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};