import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import appReducer from "./slices/appSlice";
import projectReducer from "./slices/projectSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    projects: projectReducer,
  },
});
