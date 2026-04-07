import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrgProjects } from "@/store/slices/projectSlice";
import usePermissions from "@/hooks/usePermissions";

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
        isActive
          ? "bg-[#3A3A3A] text-white"
          : "text-gray-400 hover:bg-[#2D2D2D] hover:text-gray-200"
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const SectionLabel = ({ children }) => (
  <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {children}
  </p>
);

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

const ProjectDot = ({ color }) => (
  <span
    className="w-2.5 h-2.5 rounded-full shrink-0"
    style={{ backgroundColor: color ?? "#6C63FF" }}
  />
);

const SettingsIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects } = useAppSelector((s) => s.projects);
  const { token, currentOrg } = useAppSelector((s) => s.auth);
  const { can } = usePermissions();

  useEffect(() => {
    if (!token || !currentOrg?.id) return;
    dispatch(fetchOrgProjects());
  }, [dispatch, token, currentOrg?.id]);

  return (
    <aside
        className="w-[196px] shrink-0 flex flex-col h-full overflow-hidden"
        style={{ backgroundColor: "#1F1F1F" }}
      >
        {/* Workspace header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-[#3A3A3A] shrink-0">
          <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentOrg?.name?.[0]?.toUpperCase() ?? "W"}
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

          {/* Projects section — scrollable */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-3 pt-4 pb-1 shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Projects
              </span>
              {can("create_project") && (
                <button
                  onClick={() => navigate("/projects/new")}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
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
                      `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-[#3A3A3A] text-white"
                          : "text-gray-400 hover:bg-[#2D2D2D] hover:text-gray-200"
                      }`
                    }
                  >
                    <ProjectDot color={p.color} />
                    <span className="truncate">{p.name}</span>
                  </NavLink>
                ))
              )}
            </div>
          </div>

          {/* Static: Team + Settings */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <SectionLabel>Team</SectionLabel>
            <NavItem to="/team" icon={<TeamIcon />} label="Team" />

            <SectionLabel>Settings</SectionLabel>
            <NavItem to="/settings/organization" icon={<SettingsIcon />} label="Org Settings" />
          </div>
        </nav>
      </aside>
  );
};

export default Sidebar;
