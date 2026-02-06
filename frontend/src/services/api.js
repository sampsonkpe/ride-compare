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

  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
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

// Restore tokens when app loads
loadTokens();

api.interceptors.request.use(
  (config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;