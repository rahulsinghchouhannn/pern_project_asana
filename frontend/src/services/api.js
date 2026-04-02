import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Injected after store creation to avoid circular imports
let _store = null;

export const injectStore = (store) => {
  _store = store;
};

export const getOrgHeader = () => {
  const orgId = _store?.getState().auth.currentOrg?.id;
  return orgId ? { "x-org-id": orgId } : {};
};

// ─── Request interceptor — attach Bearer token + x-org-id ─────────────────────
api.interceptors.request.use(
  (config) => {
    // Fall back to localStorage during the brief hydration window before Redux is populated
    const token = _store?.getState().auth.token || localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach org header — store first, localStorage as fallback
    const currentOrg =
      _store?.getState().auth.currentOrg ||
      JSON.parse(localStorage.getItem("currentOrg") || "null");
    if (currentOrg?.id) {
      config.headers["x-org-id"] = currentOrg.id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 with refresh ───────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken =
        _store?.getState().auth.refreshToken || localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");

      // Use a plain axios call (not api) to avoid interceptor loop
      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken } = response.data.data;

      // Update token in store (tokenRefreshed reducer also persists to localStorage)
      _store?.dispatch({ type: "auth/tokenRefreshed", payload: accessToken });

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Logout user on refresh failure (logout reducer clears localStorage)
      _store?.dispatch({ type: "auth/logout" });
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
