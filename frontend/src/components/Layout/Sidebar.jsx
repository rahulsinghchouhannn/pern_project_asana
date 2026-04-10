import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrgProjects, updateProject, deleteProject } from "@/store/slices/projectSlice";
import {
  switchOrganization,
  setOrganizations,
  setCurrentOrg,
} from "@/store/slices/authSlice";
import usePermissions from "@/hooks/usePermissions";
import organizationService from "@/services/organizationService";
import projectService from "@/services/projectService";
import { useToast } from "@/components/ui/Toast";
import ShareProjectModal from "@/components/project/ShareProjectModal";
import ProjectContextMenu from "@/components/project/ProjectContextMenu";
import ArchiveProjectDialog from "@/components/project/ArchiveProjectDialog";
import DeleteProjectDialog from "@/components/project/DeleteProjectDialog";

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
const DotsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
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
  const location = useLocation();
  const { show: showToast } = useToast();
  const { projects } = useAppSelector((s) => s.projects);
  const { token, currentOrg, organizations } = useAppSelector((s) => s.auth);
  const { can, denyToast } = usePermissions();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Context menu state ──────────────────────────────────────────────────────
  const [menuState, setMenuState] = useState(null); // { project, x, y }
  const [dialog, setDialog] = useState(null);        // { type: 'share'|'archive'|'delete', project }

  // ── Inline rename state ─────────────────────────────────────────────────────
  const [renaming, setRenaming] = useState(null);    // { id, value, original }
  const renamingRef = useRef(null);
  const renameTimerRef = useRef(null);

  useEffect(() => {
    if (!token || !currentOrg?.id) return;
    dispatch(fetchOrgProjects());
  }, [dispatch, token, currentOrg?.id]);

  // ── Context menu handlers ───────────────────────────────────────────────────

  const openMenu = (project, x, y) => {
    setMenuState({ project, x, y });
  };

  const handleContextMenu = (e, project) => {
    e.preventDefault();
    openMenu(project, e.clientX, e.clientY);
  };

  const handleThreeDotClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    openMenu(project, rect.right + 4, rect.top);
  };

  // ── Menu action handlers (permission-gated) ─────────────────────────────────

  const handleShare = (project) => {
    if (!can("manage_project_members")) { denyToast(); return; }
    setDialog({ type: "share", project });
  };

  const handleRename = (project) => {
    if (!can("manage_project_settings")) { denyToast(); return; }
    const r = { id: project.id, value: project.name, original: project.name };
    renamingRef.current = r;
    setRenaming(r);
  };

  const handleArchive = (project) => {
    if (!can("archive_project")) { denyToast(); return; }
    setDialog({ type: "archive", project });
  };

  const handleDelete = (project) => {
    if (!can("delete_project")) { denyToast(); return; }
    setDialog({ type: "delete", project });
  };

  // ── Inline rename handlers ──────────────────────────────────────────────────

  const handleRenameInput = (value) => {
    const next = { ...renamingRef.current, value };
    renamingRef.current = next;
    setRenaming(next);
    clearTimeout(renameTimerRef.current);
    renameTimerRef.current = setTimeout(() => {
      const r = renamingRef.current;
      if (r && r.value.trim()) {
        dispatch(updateProject({ projectId: r.id, data: { name: r.value.trim() } }));
      }
    }, 600);
  };

  const handleRenameCommit = () => {
    clearTimeout(renameTimerRef.current);
    const r = renamingRef.current;
    if (r) {
      const trimmed = r.value.trim();
      if (trimmed && trimmed !== r.original) {
        dispatch(updateProject({ projectId: r.id, data: { name: trimmed } }));
      } else if (!trimmed) {
        // revert to original if cleared
        dispatch(updateProject({ projectId: r.id, data: { name: r.original } }));
      }
    }
    renamingRef.current = null;
    setRenaming(null);
  };

  const handleRenameCancel = () => {
    clearTimeout(renameTimerRef.current);
    const r = renamingRef.current;
    if (r && r.value !== r.original) {
      dispatch(updateProject({ projectId: r.id, data: { name: r.original } }));
    }
    renamingRef.current = null;
    setRenaming(null);
  };

  // ── Dialog confirm handlers ─────────────────────────────────────────────────

  const handleConfirmArchive = async () => {
    const project = dialog.project;
    setDialog(null);
    try {
      await projectService.archiveProject(project.id);
      dispatch(updateProject({ projectId: project.id, data: { isArchived: true } }));
    } catch {
      showToast("Failed to archive project", "error");
    }
  };

  const handleConfirmDelete = async () => {
    const project = dialog.project;
    setDialog(null);
    const wasViewing = location.pathname.startsWith(`/projects/${project.id}`);
    try {
      await dispatch(deleteProject(project.id)).unwrap();
      if (wasViewing) navigate("/");
    } catch {
      showToast("Failed to delete project", "error");
    }
  };

  // ── Workspace helpers ───────────────────────────────────────────────────────

  const handleSwitchOrg = async (orgId) => {
    if (orgId === currentOrg?.id || isSwitching) return;
    setIsSwitching(true);
    try {
      await dispatch(switchOrganization(orgId)).unwrap();
      navigate("/");
    } catch {
      showToast("Failed to switch workspace", "error");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleWorkspaceCreated = (newOrg) => {
    setShowCreateModal(false);
    const newOrgWithRole = { ...newOrg, role: "owner" };
    const updated = [...organizations, newOrgWithRole];
    dispatch(setOrganizations(updated));
    dispatch(setCurrentOrg(newOrgWithRole));
    navigate("/");
  };

  const sortedOrgs = [...organizations].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (b.role === "owner" && a.role !== "owner") return 1;
    return a.name.localeCompare(b.name);
  });

  const orgInitial = (name) => name?.[0]?.toUpperCase() ?? "W";

  const AVATAR_BG = ["#EC4899", "#6366F1", "#8B5CF6", "#F97316", "#22C55E", "#3B82F6", "#EF4444"];
  const orgColor = (name = "") => {
    let h = 0;
    for (const c of name) h += c.charCodeAt(0);
    return AVATAR_BG[h % AVATAR_BG.length];
  };

  const visibleProjects = projects.filter((p) => !p.isArchived);

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

        {/* Projects section */}
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
            {visibleProjects.length === 0 ? (
              <p className="px-3 text-xs text-gray-600">No projects yet</p>
            ) : (
              visibleProjects.map((p) => {
                const isRenaming = renaming?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className="relative group"
                    onContextMenu={(e) => handleContextMenu(e, p)}
                  >
                    {isRenaming ? (
                      // ── Inline rename input ──────────────────────────────
                      <div
                        className="flex items-center gap-2.5 px-3"
                        style={{
                          paddingTop: "6px",
                          paddingBottom: "6px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        <ProjectDot color={p.color} />
                        <input
                          autoFocus
                          value={renaming.value}
                          onChange={(e) => handleRenameInput(e.target.value)}
                          onBlur={handleRenameCommit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameCommit();
                            if (e.key === "Escape") handleRenameCancel();
                          }}
                          className="flex-1 min-w-0 bg-transparent text-[14px] text-[#F1F1F1] outline-none border-b border-indigo-400 pb-px"
                          style={{ caretColor: "#fff" }}
                        />
                      </div>
                    ) : (
                      // ── Normal project row ───────────────────────────────
                      <div className="relative flex items-center">
                        <NavLink
                          to={`/projects/${p.id}`}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 transition-colors text-[14px] text-[#F1F1F1] flex-1 min-w-0 ${
                              isActive
                                ? "bg-[rgba(255,255,255,0.1)]"
                                : "hover:bg-[rgba(255,255,255,0.08)]"
                            }`
                          }
                          style={{
                            paddingTop: "6px",
                            paddingBottom: "6px",
                            borderRadius: "4px",
                            paddingRight: "28px",
                          }}
                        >
                          <ProjectDot color={p.color} />
                          <span className="truncate">{p.name}</span>
                        </NavLink>
                        <button
                          onClick={(e) => handleThreeDotClick(e, p)}
                          className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/50 hover:text-white/90 hover:bg-white/10 transition-all shrink-0"
                          aria-label="Project options"
                        >
                          <DotsIcon />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Workspaces section */}
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

      {/* ── Modals & Dialogs ───────────────────────────────────────────────── */}

      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleWorkspaceCreated}
        />
      )}

      {menuState && (
        <ProjectContextMenu
          position={{ x: menuState.x, y: menuState.y }}
          onClose={() => setMenuState(null)}
          onShare={() => handleShare(menuState.project)}
          onRename={() => handleRename(menuState.project)}
          onArchive={() => handleArchive(menuState.project)}
          onDelete={() => handleDelete(menuState.project)}
        />
      )}

      {dialog?.type === "share" && (
        <ShareProjectModal
          project={dialog.project}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "archive" && (
        <ArchiveProjectDialog
          project={dialog.project}
          onConfirm={handleConfirmArchive}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "delete" && (
        <DeleteProjectDialog
          project={dialog.project}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDialog(null)}
        />
      )}
    </aside>
  );
};

export default Sidebar;
