import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationService from "@/services/notificationService";

export const fetchNotifications = createAsyncThunk(
  "app/fetchNotifications",
  async (params = {}) => {
    const res = await notificationService.getNotifications(params);
    return res.data.data;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "app/fetchUnreadCount",
  async () => {
    const res = await notificationService.getUnreadCount();
    return res.data.data.count;
  }
);

const appSlice = createSlice({
  name: "app",
  initialState: {
    theme: "light",
    notifications: [],
    unreadCount: 0,
    isGlobalLoading: false,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    markNotificationRead: (state, action) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    setGlobalLoading: (state, action) => {
      state.isGlobalLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  setTheme,
  addNotification,
  setNotifications,
  markNotificationRead,
  markAllRead,
  setUnreadCount,
  setGlobalLoading,
} = appSlice.actions;

export default appSlice.reducer;
