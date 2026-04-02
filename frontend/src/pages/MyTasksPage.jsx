import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import taskService from "@/services/taskService";
import TaskPriorityBadge from "@/components/task/TaskPriorityBadge";
import TaskDetailModal from "@/components/task/TaskDetailModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isToday = (d) => {
  if (!d) return false;
  const now = new Date();
  const date = new Date(d);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const isThisWeek = (d) => {
  if (!d) return false;
  const now = new Date();
  const date = new Date(d);
  const diff = date - now;
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
};

const isNextWeek = (d) => {
  if (!d) return false;
  const now = new Date();
  const date = new Date(d);
  const diff = date - now;
  const week = 7 * 24 * 60 * 60 * 1000;
  return diff > week && diff <= 2 * week;
};

// ─── Sections ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key: "recently_assigned",
    label: "Recently assigned",
    filter: (tasks) =>
      [...tasks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10),
  },
  {
    key: "do_today",
    label: "Do today",
    filter: (tasks) => tasks.filter((t) => isToday(t.dueDate)),
  },
  {
    key: "do_next_week",
    label: "Do next week",
    filter: (tasks) => tasks.filter((t) => isNextWeek(t.dueDate)),
  },
  {
    key: "do_later",
    label: "Do later",
    filter: (tasks) =>
      tasks.filter((t) => {
        if (!t.dueDate) return true;
        const diff = new Date(t.dueDate) - new Date();
        return diff > 14 * 24 * 60 * 60 * 1000;
      }),
  },
];

// ─── Section component ────────────────────────────────────────────────────────

const Section = ({ label, tasks, onTaskClick }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-gray-100">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left"
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="text-xs text-gray-400">({tasks.length})</span>
      </button>

      {open && (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_120px_140px_80px_120px] border-b border-gray-100 px-10 py-1">
            <span className="text-xs font-medium text-gray-500">Name</span>
            <span className="text-xs font-medium text-gray-500">Due date</span>
            <span className="text-xs font-medium text-gray-500">Collaborators</span>
            <span className="text-xs font-medium text-gray-500">Priority</span>
            <span className="text-xs font-medium text-gray-500">Projects</span>
          </div>

          {tasks.length === 0 ? (
            <div className="px-10 py-3 text-xs text-gray-400">No tasks here yet.</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className="grid grid-cols-[1fr_120px_140px_80px_120px] items-center border-b border-gray-50 hover:bg-gray-50 cursor-pointer px-4 py-2"
              >
                {/* Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      task.isCompleted ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                    }`}
                  />
                  <span
                    className={`text-sm truncate ${
                      task.isCompleted ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Due date */}
                <span className="text-xs text-gray-500 pl-6">
                  {formatDate(task.dueDate) ?? "—"}
                </span>

                {/* Collaborators */}
                <div className="flex items-center gap-0.5 pl-6">
                  {task.assignees?.slice(0, 3).map((a) => (
                    <div
                      key={a.userId}
                      className="w-6 h-6 rounded-full bg-indigo-100 border border-white flex items-center justify-center"
                      title={a.name}
                    >
                      <span className="text-xs font-medium text-indigo-700">
                        {a.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Priority */}
                <div>
                  {task.priority && task.priority !== "none" && (
                    <TaskPriorityBadge priority={task.priority} showLabel={false} />
                  )}
                </div>

                {/* Project (task visibility placeholder) */}
                <span className="text-xs text-gray-400 pl-6 truncate">—</span>
              </div>
            ))
          )}

          {/* Add task row */}
          <div className="px-10 py-2">
            <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["List", "Board", "Calendar", "Dashboard", "Files"];

// ─── Page ─────────────────────────────────────────────────────────────────────

const MyTasksPage = () => {
  const { token, currentOrg } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState("List");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    if (!token || !currentOrg?.id) return;
    setLoading(true);
    taskService
      .getMyTasks()
      .then((res) => setTasks(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, currentOrg?.id]);

  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Page header */}
      <div className="px-6 pt-5 pb-0 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">My Tasks</h1>

        {/* Tabs */}
        <div className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "List" ? (
        <div className="flex-1 overflow-y-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-end gap-2 px-6 py-2 border-b border-gray-100">
            {["Filter", "Sort", "Group", "Options"].map((btn) => (
              <button
                key={btn}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                {btn}
              </button>
            ))}
            <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Loading tasks…
            </div>
          ) : (
            <>
              {SECTIONS.map((section) => (
                <Section
                  key={section.key}
                  label={section.label}
                  tasks={section.filter(tasks)}
                  onTaskClick={setSelectedTaskId}
                />
              ))}

              {/* Add section */}
              <div className="px-6 py-3">
                <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add section
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          {activeTab} view coming soon
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          statuses={[]}
          projectMembers={[]}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default MyTasksPage;
