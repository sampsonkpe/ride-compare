import api, { setTokens, clearTokens, getAccessToken, loadTokens } from "./api";

const authService = {
  register: async (userData) => {
    const response = await api.post("/auth/register/", userData);
    if (response.data.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    if (response.data.tokens) {
      setTokens(response.data.tokens.access, response.data.tokens.refresh);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout/", {});
    } catch (error) {
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

  // Checks stored token + ensures loadTokens ran
  isAuthenticated: () => {
    loadTokens();
    return !!getAccessToken();
  },
};

export default authService;