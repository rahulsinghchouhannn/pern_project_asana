import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrgProjects } from "@/store/slices/projectSlice";
import ProjectCard from "@/components/project/ProjectCard";
import CreateProjectModal from "@/components/project/CreateProjectModal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const TAB_UPCOMING = "upcoming";
const TAB_OVERDUE = "overdue";
const TAB_COMPLETED = "completed";

const MyTasksWidget = () => {
  const [activeTab, setActiveTab] = useState(TAB_UPCOMING);

  const tabs = [
    { key: TAB_UPCOMING, label: "Upcoming" },
    { key: TAB_OVERDUE, label: "Overdue" },
    { key: TAB_COMPLETED, label: "Completed" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-3">My Tasks</h2>
      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              activeTab === t.key
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-6 text-center text-sm text-gray-400">
        {activeTab === TAB_UPCOMING && "No upcoming tasks — you're all caught up!"}
        {activeTab === TAB_OVERDUE && "No overdue tasks."}
        {activeTab === TAB_COMPLETED && "No completed tasks yet."}
      </div>
    </div>
  );
};

const ProjectListPage = () => {
  const dispatch = useAppDispatch();
  const { projects, isLoading } = useAppSelector((s) => s.projects);
  const { user, currentOrg } = useAppSelector((s) => s.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (currentOrg?.id) {
      dispatch(fetchOrgProjects());
    }
  }, [dispatch, currentOrg?.id]);

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatDate()}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* My Tasks widget — spans 1 col */}
        <div className="xl:col-span-1">
          <MyTasksWidget />
        </div>

        {/* Projects widget — spans 2 cols */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Projects</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                + New project
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}

                {/* Create project card */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-5 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors min-h-[96px]"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Create project</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </main>
  );
};

export default ProjectListPage;
