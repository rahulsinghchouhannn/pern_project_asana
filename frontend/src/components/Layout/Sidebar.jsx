import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrgProjects } from "@/store/slices/projectSlice";
import {
  switchOrganization,
  setOrganizations,
  setCurrentOrg,
} from "@/store/slices/authSlice";
import usePermissions from "@/hooks/usePermissions";
import organizationService from "@/services/organizationService";
import { useToast } from "@/components/ui/Toast";

// ─── Icons ────────────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const TaskIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const InboxIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);
const ChartIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const FolderIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);
const GoalIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const TeamIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Small Components ─────────────────────────────────────────────────────────

const TeamNavItem = ({ to, orgName }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 rounded transition-colors text-[14px] ${
        isActive
          ? "bg-[rgba(255,255,255,0.1)] text-[#F1F1F1]"
          : "text-[#F1F1F1] hover:bg-[rgba(255,255,255,0.08)]"
      }`
    }
    style={{ paddingTop: "6px", paddingBottom: "6px", borderRadius: "4px" }}
  >
    <TeamIcon />
    <span className="flex-1 truncate">{orgName}</span>
    <span style={{ color: "rgba(255,255,255,0.35)" }}>
      <ChevronRightIcon />
    </span>
  </NavLink>
);

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 rounded transition-colors text-[14px] ${
        isActive
          ? "bg-[rgba(255,255,255,0.1)] text-[#F1F1F1]"
          : "text-[#F1F1F1] hover:bg-[rgba(255,255,255,0.08)]"
      }`
    }
    style={{ paddingTop: "6px", paddingBottom: "6px", borderRadius: "4px" }}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const SectionLabel = ({ children }) => (
  <p
    className="px-3 pb-1 font-semibold uppercase tracking-wider"
    style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}
  >
    {children}
  </p>
);

const ProjectDot = ({ color }) => (
  <span
    className="w-2.5 h-2.5 rounded-full shrink-0"
    style={{ backgroundColor: color ?? "#6C63FF" }}
  />
);

// ─── Create Workspace Modal ───────────────────────────────────────────────────

const CreateWorkspaceModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { show: showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await organizationService.createOrganization({ name: name.trim() });
      onCreated(res.data.data);
    } catch {
      showToast("Failed to create workspace", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create new workspace</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Company"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const { projects } = useAppSelector((s) => s.projects);
  const { token, currentOrg, organizations } = useAppSelector((s) => s.auth);
  const { can } = usePermissions();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!token || !currentOrg?.id) return;
    dispatch(fetchOrgProjects());
  }, [dispatch, token, currentOrg?.id]);

  const handleSwitchOrg = async (orgId) => {
    if (orgId === currentOrg?.id || isSwitching) return;
    setIsSwitching(true);
    try {
      await dispatch(switchOrganization(orgId)).unwrap();
      // fetchOrgProjects fires via the useEffect above when currentOrg.id changes
      navigate("/");
    } catch {
      showToast("Failed to switch workspace", "error");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleWorkspaceCreated = (newOrg) => {
    setShowCreateModal(false);
    // Add to orgs list with owner role, switch to it
    const newOrgWithRole = { ...newOrg, role: "owner" };
    const updated = [...organizations, newOrgWithRole];
    dispatch(setOrganizations(updated));
    dispatch(setCurrentOrg(newOrgWithRole));
    navigate("/");
  };

  // Sort: owned workspaces first, then joined alphabetically
  const sortedOrgs = [...organizations].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (b.role === "owner" && a.role !== "owner") return 1;
    return a.name.localeCompare(b.name);
  });

  const orgInitial = (name) => name?.[0]?.toUpperCase() ?? "W";

  // Colour based on name hash for workspace avatar
  const AVATAR_BG = ["#EC4899", "#6366F1", "#8B5CF6", "#F97316", "#22C55E", "#3B82F6", "#EF4444"];
  const orgColor = (name = "") => {
    let h = 0;
    for (const c of name) h += c.charCodeAt(0);
    return AVATAR_BG[h % AVATAR_BG.length];
  };

  return (
    <aside
      className="w-[260px] shrink-0 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#2A2C2E" }}
    >
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: orgColor(currentOrg?.name) }}
        >
          {orgInitial(currentOrg?.name)}
        </div>
        <span className="text-sm font-semibold text-gray-200 truncate">
          {currentOrg?.name ?? "My Workspace"}
        </span>
      </div>

      <nav className="flex flex-col flex-1 overflow-hidden px-2 py-2">
        {/* Static: Main navigation + Insights */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <NavItem to="/" icon={<HomeIcon />} label="Home" />
          <NavItem to="/my-tasks" icon={<TaskIcon />} label="My Tasks" />
          <NavItem to="/inbox" icon={<InboxIcon />} label="Inbox" />

          <SectionLabel>Insights</SectionLabel>
          <NavItem to="/reporting" icon={<ChartIcon />} label="Reporting" />
          <NavItem to="/portfolios" icon={<FolderIcon />} label="Portfolios" />
          <NavItem to="/goals" icon={<GoalIcon />} label="Goals" />
        </div>

        {/* Projects section — grows to fill space, scrolls independently */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-3 pb-1 shrink-0" style={{ marginTop: "8px" }}>
            <span className="font-semibold uppercase tracking-wider" style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              Projects
            </span>
            {can("create_project") && (
              <button
                onClick={() => navigate("/projects/new")}
                className="text-white/50 hover:text-[#F1F1F1] transition-colors"
                aria-label="New project"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 scrollbar-sidebar">
            {projects.length === 0 ? (
              <p className="px-3 text-xs text-gray-600">No projects yet</p>
            ) : (
              projects.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 transition-colors text-[14px] text-[#F1F1F1] ${
                      isActive
                        ? "bg-[rgba(255,255,255,0.1)]"
                        : "hover:bg-[rgba(255,255,255,0.08)]"
                    }`
                  }
                  style={{ paddingTop: "6px", paddingBottom: "6px", borderRadius: "4px" }}
                >
                  <ProjectDot color={p.color} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))
            )}
          </div>
        </div>

        {/* Workspaces section — separate, scrolls independently */}
        <div className="flex flex-col shrink-0">
          <SectionLabel>Workspaces</SectionLabel>
          <div className="overflow-y-auto scrollbar-sidebar" style={{ maxHeight: "140px" }}>
            {sortedOrgs.map((org) => {
              const isActive = org.id === currentOrg?.id;
              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  disabled={isSwitching}
                  className={`flex items-center justify-between w-full px-3 rounded text-[13px] text-left transition-colors ${
                    isActive
                      ? "bg-[rgba(255,255,255,0.12)] text-[#F1F1F1]"
                      : "text-[#C0C0C0] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F1F1F1]"
                  }`}
                  style={{ paddingTop: "5px", paddingBottom: "5px", borderRadius: "4px" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-white shrink-0"
                      style={{ fontSize: "9px", fontWeight: 700, backgroundColor: orgColor(org.name) }}
                    >
                      {orgInitial(org.name)}
                    </div>
                    <span className="truncate">{org.name}</span>
                  </div>
                  <span
                    className="shrink-0 ml-2 capitalize"
                    style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}
                  >
                    {org.role}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 text-[13px] text-[rgba(255,255,255,0.4)] hover:text-[#F1F1F1] transition-colors"
            style={{ paddingTop: "5px", paddingBottom: "5px" }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create new workspace</span>
          </button>
        </div>

        {/* Static: Team + Settings */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <SectionLabel>Team</SectionLabel>
          <TeamNavItem to="/team" orgName={currentOrg?.name ?? "Team"} />

          {can("view_org_settings") && (
            <>
              <SectionLabel>Settings</SectionLabel>
              <NavItem to="/settings/organization" icon={<SettingsIcon />} label="Org Settings" />
            </>
          )}
        </div>
      </nav>

      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleWorkspaceCreated}
        />
      )}
    </aside>
  );
};

export default Sidebar;
