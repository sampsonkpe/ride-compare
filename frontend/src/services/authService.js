import api, { setTokens, clearTokens, getAccessToken } from "./api";

const authService = {
  register: async (userData) => {
    const response = await api.post("/auth/register/", userData);
    if (response.data?.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    if (response.data?.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout/", {});
    } catch (error) {
      // Don’t block logout if backend fails
      console.error("Logout error:", error);
    } finally {
      clearTokens();
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/user/");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put("/auth/user/", userData);
    return response.data;
  },

  isAuthenticated: () => {
    return !!getAccessToken();
  },
};

export default authService;