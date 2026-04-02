import React from "react";
import Button from "@/components/ui/Button";

const ChevronIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const AvatarStack = ({ members }) => {
  const shown = members.slice(0, 3);
  const overflow = members.length - shown.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((m) => (
        <div
          key={m.userId}
          className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold uppercase shrink-0"
          title={m.name}
        >
          {m.name?.[0] ?? "?"}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
          +{overflow}
        </div>
      )}
    </div>
  );
};

const ProjectHeader = ({ project, members = [], activeTab, onTabChange, tabs = [] }) => {
  const isArchived = project.isArchived;
  const isCompleted = project.isCompleted;

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white">
      {/* Top row: name + actions */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color dot */}
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color ?? "#6C63FF" }}
          />
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {project.name}
          </h1>
          <button className="shrink-0 p-0.5 hover:bg-gray-100 rounded">
            <ChevronIcon />
          </button>

          {/* Status badges */}
          {isArchived && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
              Archived
            </span>
          )}
          {isCompleted && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
              Completed
            </span>
          )}
          {project.isPrivate && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              Private
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <AvatarStack members={members} />
          <Button variant="secondary" size="sm">
            <ShareIcon />
            Share
          </Button>
          <Button variant="ghost" size="sm">
            Customize
          </Button>
        </div>
      </div>

      {/* Tab row */}
      <div className="flex items-center gap-0 px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectHeader;
