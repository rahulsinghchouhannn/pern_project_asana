import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import Layout from "@/components/Layout/Layout";
import ProjectListPage from "@/pages/ProjectListPage";
import ProjectPage from "@/pages/ProjectPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MyTasksPage from "@/pages/MyTasksPage";
import InboxPage from "@/pages/InboxPage";
import OrgSelectorPage from "@/pages/OrgSelectorPage";
import InvitationAcceptPage from "@/pages/InvitationAcceptPage";

// ─── Auth guard — redirects unauthenticated users to /login ────────────────────
const RequireAuth = ({ children }) => {
  const { token } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// ─── Org guard — redirects authenticated users with no currentOrg to /select-org
const RequireOrg = ({ children }) => {
  const { token, currentOrg } = useAppSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (!currentOrg) return <Navigate to="/select-org" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* ── Public routes ──────────────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/invitations/accept/:token"
        element={<InvitationAcceptPage />}
      />

      {/* ── Auth required, no org required ────────────────────────────────── */}
      <Route
        path="/select-org"
        element={
          <RequireAuth>
            <OrgSelectorPage />
          </RequireAuth>
        }
      />

      {/* ── Org-scoped routes — wrapped by Layout ─────────────────────────── */}
      <Route
        element={
          <RequireOrg>
            <Layout />
          </RequireOrg>
        }
      >
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
        <Route path="/inbox" element={<InboxPage />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
