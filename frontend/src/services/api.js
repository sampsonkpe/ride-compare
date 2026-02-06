import axios from "axios";

const ACCESS_KEY = "ridecompare_access_token";
const REFRESH_KEY = "ridecompare_refresh_token";

let accessToken = null;
let refreshToken = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const setTokens = (access, refresh) => {
  accessToken = access || null;
  refreshToken = refresh || null;

  if (accessToken) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    localStorage.removeItem(ACCESS_KEY);
    delete api.defaults.headers.common.Authorization;
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
};

export const loadTokens = () => {
  accessToken = localStorage.getItem(ACCESS_KEY);
  refreshToken = localStorage.getItem(REFRESH_KEY);

  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  delete api.defaults.headers.common.Authorization;
};

// Restore tokens immediately on app load
loadTokens();

// Attach token on every request (safety net)
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Decide which endpoints REQUIRE auth (API-level)
// NOTE: Compare endpoints remain public; no compare here.
const isProtectedEndpoint = (url = "") => {
  const path = String(url);
  return (
    path.includes("/auth/user/") ||
    path.includes("/rides/history") ||
    path.includes("/favourites") ||
    path.includes("/alerts") ||
    path.includes("/profile")
  );
};

// Decide which UI routes are protected (UI-level)
const isProtectedRoute = (pathname = "") => {
  const p = String(pathname);
  return (
    p === "/profile" ||
    p.startsWith("/profile/") ||
    p === "/favourites" ||
    p.startsWith("/favourites/") ||
    p === "/history" ||
    p.startsWith("/history/") ||
    p === "/alerts" ||
    p.startsWith("/alerts/")
  );
};

// Handle auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401) {
      const currentPath = window.location.pathname;

      // Always clear tokens on 401 so we don’t loop with a bad token
      clearTokens();

      // IMPORTANT:
      // Do NOT globally redirect just because a protected API endpoint was hit.
      // Redirect ONLY if the user is currently on a protected UI route.
      if (
        isProtectedEndpoint(requestUrl) &&
        isProtectedRoute(currentPath) &&
        currentPath !== "/auth"
      ) {
        const next = encodeURIComponent(currentPath + window.location.search);
        window.location.href = `/auth?next=${next}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
