import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProjectById,
  fetchProjectMembers,
  clearCurrentProject,
} from "@/store/slices/projectSlice";
import ProjectHeader from "@/components/project/ProjectHeader";
import TaskListView from "@/components/task/TaskListView";
import Spinner from "@/components/ui/Spinner";

// ─── Placeholder view ─────────────────────────────────────────────────────────

const PlaceholderView = ({ label }) => (
  <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-20">
    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <p className="text-sm font-medium">{label} view coming soon</p>
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",  label: "Overview"  },
  { key: "list",      label: "List"      },
  { key: "board",     label: "Board"     },
  { key: "timeline",  label: "Timeline"  },
  { key: "dashboard", label: "Dashboard" },
  { key: "calendar",  label: "Calendar"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProjectPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentProject, members, isLoading, error } = useAppSelector(
    (s) => s.projects
  );

  const defaultView = currentProject?.defaultView ?? "list";
  const [activeTab, setActiveTab] = useState(defaultView);

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchProjectMembers(id));
    return () => { dispatch(clearCurrentProject()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject?.defaultView) {
      setActiveTab(currentProject.defaultView);
    }
  }, [currentProject?.defaultView]);

  if (isLoading && !currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
        <p className="text-sm">{error}</p>
        <button onClick={() => navigate("/")} className="text-indigo-600 text-sm hover:underline">
          Go back home
        </button>
      </div>
    );
  }

  if (!currentProject) return null;

  const statuses = currentProject.statuses ?? [];

  const renderTab = () => {
    switch (activeTab) {
      case "list":
        return (
          <TaskListView
            project={currentProject}
            statuses={statuses}
            projectMembers={members ?? []}
          />
        );
      default:
        return (
          <PlaceholderView
            label={TABS.find((t) => t.key === activeTab)?.label ?? activeTab}
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <ProjectHeader
        project={currentProject}
        members={members}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={TABS}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderTab()}
      </div>
    </div>
  );
};

export default ProjectPage;
