import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "@/services/authService";
import organizationService from "@/services/organizationService";

// ─── Async thunks ──────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { getState }) => {
    try {
      const { refreshToken } = getState().auth;
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // Proceed with local logout even if server call fails
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  "auth/refreshToken",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { refreshToken } = getState().auth;
      const response = await authService.refreshToken(refreshToken);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Token refresh failed");
    }
  }
);

export const requestMagicLink = createAsyncThunk(
  "auth/requestMagicLink",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.requestMagicLink(email);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to send magic link");
    }
  }
);

export const verifyMagicLink = createAsyncThunk(
  "auth/verifyMagicLink",
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyMagicLink(token);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Magic link verification failed");
    }
  }
);

export const switchOrganization = createAsyncThunk(
  "auth/switchOrganization",
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await organizationService.switchOrganization(orgId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to switch organization");
    }
  }
);

// ─── localStorage helpers ──────────────────────────────────────────────────────

const persistAuthToStorage = ({ accessToken, refreshToken, user }) => {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (user) localStorage.setItem("user", JSON.stringify(user));
};

const clearAuthFromStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("currentOrg");
  localStorage.removeItem("organizations");
};

// ─── Hydrate initial state from localStorage ───────────────────────────────────

const tokenFromStorage = localStorage.getItem("accessToken");
const userFromStorage = localStorage.getItem("user");
const refreshTokenFromStorage = localStorage.getItem("refreshToken");
const currentOrgFromStorage = localStorage.getItem("currentOrg");
const organizationsFromStorage = localStorage.getItem("organizations");

const initialState = {
  user: userFromStorage ? JSON.parse(userFromStorage) : null,
  token: tokenFromStorage || null,
  refreshToken: refreshTokenFromStorage || null,
  organizations: organizationsFromStorage ? JSON.parse(organizationsFromStorage) : [],
  currentOrg: currentOrgFromStorage ? JSON.parse(currentOrgFromStorage) : null,
  isLoading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      persistAuthToStorage({
        accessToken: action.payload.token,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user,
      });
    },
    setCurrentOrg: (state, action) => {
      state.currentOrg = action.payload;
      if (action.payload) {
        localStorage.setItem("currentOrg", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("currentOrg");
      }
    },
    setOrganizations: (state, action) => {
      state.organizations = action.payload;
    },
    tokenRefreshed: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.organizations = [];
      state.currentOrg = null;
      state.error = null;
      clearAuthFromStorage();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── register ──
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuthToStorage({
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          user: action.payload.user,
        });
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── login ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.organizations = action.payload.organizations ?? [];
        // Auto-set currentOrg to lastActiveOrgId or first org
        const lastId = action.payload.user?.lastActiveOrgId;
        const orgs = action.payload.organizations ?? [];
        const resolvedOrg = orgs.find((o) => o.id === lastId) ?? orgs[0] ?? null;
        state.currentOrg = resolvedOrg;
        persistAuthToStorage({
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          user: action.payload.user,
        });
        localStorage.setItem("organizations", JSON.stringify(orgs));
        if (resolvedOrg) localStorage.setItem("currentOrg", JSON.stringify(resolvedOrg));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── logout ──
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.organizations = [];
        state.currentOrg = null;
        state.error = null;
        clearAuthFromStorage();
      });

    // ── magic link ──
    builder
      .addCase(requestMagicLink.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestMagicLink.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestMagicLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(verifyMagicLink.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyMagicLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.organizations = action.payload.organizations ?? [];
        const orgs = action.payload.organizations ?? [];
        const resolvedOrg = orgs[0] ?? null;
        state.currentOrg = resolvedOrg;
        persistAuthToStorage({
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          user: action.payload.user,
        });
        localStorage.setItem("organizations", JSON.stringify(orgs));
        if (resolvedOrg) localStorage.setItem("currentOrg", JSON.stringify(resolvedOrg));
      })
      .addCase(verifyMagicLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── switch org ──
    builder
      .addCase(switchOrganization.fulfilled, (state, action) => {
        state.currentOrg = action.payload;
        if (action.payload) {
          localStorage.setItem("currentOrg", JSON.stringify(action.payload));
        }
      });
  },
});

export const {
  setCredentials,
  setCurrentOrg,
  setOrganizations,
  tokenRefreshed,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
