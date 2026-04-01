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
  async (_, { getState, rejectWithValue }) => {
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

// ─── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    refreshToken: null,
    organizations: [],
    currentOrg: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
    },
    setCurrentOrg: (state, action) => {
      state.currentOrg = action.payload;
    },
    setOrganizations: (state, action) => {
      state.organizations = action.payload;
    },
    tokenRefreshed: (state, action) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.organizations = [];
      state.currentOrg = null;
      state.error = null;
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
        state.currentOrg =
          orgs.find((o) => o.id === lastId) ?? orgs[0] ?? null;
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
        state.currentOrg = orgs[0] ?? null;
      })
      .addCase(verifyMagicLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ── switch org ──
    builder
      .addCase(switchOrganization.fulfilled, (state, action) => {
        state.currentOrg = action.payload;
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
