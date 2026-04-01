import api from "./api";

const register = async (data) => api.post("/auth/register", data);

const login = async (credentials) => api.post("/auth/login", credentials);

const requestMagicLink = async (email) =>
  api.post("/auth/magic-link", { email });

const verifyMagicLink = async (token) =>
  api.post("/auth/magic-link/verify", { token });

const refreshToken = async (token) =>
  api.post("/auth/refresh", { refreshToken: token });

const logout = async (token) =>
  api.post("/auth/logout", { refreshToken: token });

const getMe = async () => api.get("/auth/me");

export default {
  register,
  login,
  requestMagicLink,
  verifyMagicLink,
  refreshToken,
  logout,
  getMe,
};
