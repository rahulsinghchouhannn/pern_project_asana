import { createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    theme: "light",
    notifications: [],
    isGlobalLoading: false,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    setGlobalLoading: (state, action) => {
      state.isGlobalLoading = action.payload;
    },
  },
});

export const { setTheme, addNotification, removeNotification, setGlobalLoading } =
  appSlice.actions;
export default appSlice.reducer;
