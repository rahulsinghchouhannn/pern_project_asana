import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import authService from "@/services/authService";
import useSocket from "@/hooks/useSocket";
import Spinner from "@/components/ui/Spinner";
import Layout from "@/components/Layout/Layout";
import ProjectListPage from "@/pages/ProjectListPage";
import ProjectPage from "@/pages/ProjectPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MyTasksPage from "@/pages/MyTasksPage";
import InboxPage from "@/pages/InboxPage";
import OrgSelectorPage from "@/pages/OrgSelectorPage";
import InvitationAcceptPage from "@/pages/InvitationAcceptPage";
import OrgSettingsPage from "@/pages/OrgSettingsPage";

// ─── Auth guard — redirects unauthenticated users to /login ────────────────────
const RequireAuth = ({ children, isHydrated }) => {
  const { token } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (!isHydrated) return null;
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// ─── Org guard — redirects authenticated users with no currentOrg to /select-org
const RequireOrg = ({ children, isHydrated }) => {
  const { token, currentOrg } = useAppSelector((s) => s.auth);
  if (!isHydrated) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!currentOrg) return <Navigate to="/select-org" replace />;
  return children;
};

const App = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const dispatch = useAppDispatch();
  useSocket();

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) {
      setIsHydrated(true);
      return;
    }
    authService
      .getMe()
      .then(() => setIsHydrated(true))
      .catch(() => {
        dispatch(logout());
        setIsHydrated(true);
      });
  }, [dispatch]);

  if (!isHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1F1F1F]">
        <Spinner size="lg" />
      </div>
    );
  }

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
          <RequireAuth isHydrated={isHydrated}>
            <OrgSelectorPage />
          </RequireAuth>
        }
      />

      {/* ── Org-scoped routes — wrapped by Layout ─────────────────────────── */}
      <Route
        element={
          <RequireOrg isHydrated={isHydrated}>
            <Layout />
          </RequireOrg>
        }
      >
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/settings/organization" element={<OrgSettingsPage />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
