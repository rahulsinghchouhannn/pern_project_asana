import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MyTasksPage from "@/pages/MyTasksPage";
import InboxPage from "@/pages/InboxPage";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — wrapped by Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
        <Route path="/inbox" element={<InboxPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
