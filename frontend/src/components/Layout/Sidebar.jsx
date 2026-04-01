import React, { useState } from "react";
import { NavLink } from "react-router-dom";

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

const Sidebar = () => {
  const [projects] = useState([]);

  return (
    <aside
      className="w-[196px] shrink-0 flex flex-col h-full overflow-y-auto"
      style={{ backgroundColor: "#1F1F1F" }}
    >
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#3A3A3A]">
        <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          A
        </div>
        <span className="text-sm font-semibold text-gray-200 truncate">My Workspace</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 py-2 flex-1">
        {/* Main navigation */}
        <NavItem to="/" icon={<HomeIcon />} label="Home" />
        <NavItem to="/my-tasks" icon={<TaskIcon />} label="My Tasks" />
        <NavItem to="/inbox" icon={<InboxIcon />} label="Inbox" />

        {/* Insights section */}
        <SectionLabel>Insights</SectionLabel>
        <NavItem to="/reporting" icon={<ChartIcon />} label="Reporting" />
        <NavItem to="/portfolios" icon={<FolderIcon />} label="Portfolios" />
        <NavItem to="/goals" icon={<GoalIcon />} label="Goals" />

        {/* Projects section */}
        <div className="flex items-center justify-between px-3 pt-4 pb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Projects
          </span>
          <button
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="New project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {projects.length === 0 ? (
          <p className="px-3 text-xs text-gray-600">No projects yet</p>
        ) : (
          projects.map((p) => (
            <NavItem key={p.id} to={`/projects/${p.id}`} icon={<FolderIcon />} label={p.name} />
          ))
        )}

        {/* Team section */}
        <SectionLabel>Team</SectionLabel>
        <NavItem to="/team" icon={<TeamIcon />} label="Team" />
      </nav>
    </aside>
  );
};

export default Sidebar;
