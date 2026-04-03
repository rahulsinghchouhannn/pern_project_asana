import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProjectById,
  fetchProjectMembers,
  clearCurrentProject,
} from "@/store/slices/projectSlice";
import ProjectHeader from "@/components/project/ProjectHeader";
import ListView from "@/components/task/views/ListView";
import BoardView from "@/components/task/views/BoardView";
import CalendarView from "@/components/task/views/CalendarView";
import TimelineView from "@/components/task/views/TimelineView";
import Spinner from "@/components/ui/Spinner";
import taskService from "@/services/taskService";
import CustomFieldsManager from "@/components/customFields/CustomFieldsManager";
import socketService from "@/services/socketService";

// ─── Placeholder ──────────────────────────────────────────────────────────────

const PlaceholderView = ({ label }) => (
  <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-20">
    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <p className="text-sm font-medium">{label} view coming soon</p>
  </div>
);

// ─── Overview tab ─────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_COLORS_OV = ["#6366F1","#8B5CF6","#EC4899","#F97316","#22C55E","#3B82F6"];
const getAvatarColorOV = (name = "") => {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS_OV[h % AVATAR_COLORS_OV.length];
};

const STATUS_OPTIONS = [
  { label: "On track", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "At risk", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "Off track", color: "bg-red-100 text-red-700 border-red-200" },
];

const OverviewTab = ({ project, members, tasks }) => {
  const [status, setStatus] = useState("On track");
  const statusConfig = STATUS_OPTIONS.find((s) => s.label === status) ?? STATUS_OPTIONS[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
      {/* Project name + description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h2>
        {project.description ? (
          <p className="text-sm text-gray-500">{project.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic cursor-pointer hover:text-gray-600">
            Click to add a description...
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
        <span>
          Created{" "}
          {new Date(project.createdAt).toLocaleDateString(undefined, {
            month: "long", day: "numeric", year: "numeric",
          })}
        </span>
        <span className="text-gray-200">|</span>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`text-xs font-medium px-2 py-0.5 rounded-full border focus:outline-none ${statusConfig.color}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Members */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Members</h3>
        <div className="flex flex-wrap gap-3">
          {(members ?? []).map((m) => (
            <div key={m.userId} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: getAvatarColorOV(m.name ?? "") }}
              >
                {getInitials(m.name ?? "")}
              </div>
              <span className="text-sm text-gray-600">{m.name}</span>
            </div>
          ))}
          {(members ?? []).length === 0 && (
            <p className="text-sm text-gray-400">No members yet</p>
          )}
        </div>
      </div>

      {/* Task summary */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tasks</h3>
        <div className="flex gap-4">
          <div className="flex flex-col items-center bg-gray-50 rounded-xl border border-gray-200 px-5 py-3">
            <span className="text-xl font-bold text-gray-800">{tasks.length}</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="flex flex-col items-center bg-green-50 rounded-xl border border-green-100 px-5 py-3">
            <span className="text-xl font-bold text-green-700">{tasks.filter((t) => t.isCompleted).length}</span>
            <span className="text-xs text-green-600">Done</span>
          </div>
          <div className="flex flex-col items-center bg-red-50 rounded-xl border border-red-100 px-5 py-3">
            <span className="text-xl font-bold text-red-600">
              {tasks.filter((t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()).length}
            </span>
            <span className="text-xs text-red-500">Overdue</span>
          </div>
        </div>
      </div>

      {/* Add a task CTA */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors p-4 text-center cursor-pointer">
        <p className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">
          + Add a task to get started
        </p>
      </div>
    </div>
  );
};

// ─── Filter / Sort / Search toolbar ──────────────────────────────────────────

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

const FilterPanel = ({ filters, onChange, statuses, projectMembers, onClose }) => (
  <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-30 p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-gray-800">Filter</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Status */}
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
      <select
        value={filters.statusId}
        onChange={(e) => onChange({ ...filters, statusId: e.target.value })}
        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All statuses</option>
        {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>

    {/* Priority */}
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All priorities</option>
        {["urgent", "high", "medium", "low", "none"].map((p) => (
          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
        ))}
      </select>
    </div>

    {/* Assignee */}
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
      <select
        value={filters.assigneeId}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All assignees</option>
        {projectMembers.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
      </select>
    </div>

    {/* Due date range */}
    <div className="mb-1">
      <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={filters.dueDateFrom}
          onChange={(e) => onChange({ ...filters, dueDateFrom: e.target.value })}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={filters.dueDateTo}
          onChange={(e) => onChange({ ...filters, dueDateTo: e.target.value })}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>

    <button
      onClick={() => onChange({ statusId: "", priority: "", assigneeId: "", dueDateFrom: "", dueDateTo: "" })}
      className="mt-3 w-full text-xs text-gray-400 hover:text-indigo-600 transition-colors"
    >
      Clear filters
    </button>
  </div>
);

const SortPanel = ({ sort, onChange, onClose }) => {
  const options = [
    { value: "position", label: "Default order" },
    { value: "dueDate", label: "Due date" },
    { value: "priority", label: "Priority" },
    { value: "createdAt", label: "Created date" },
    { value: "title", label: "Title" },
  ];
  return (
    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">Sort by</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => { onChange({ ...sort, field: o.value }); onClose(); }}
          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
            ${sort.field === o.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
        >
          {o.label}
          {sort.field === o.value && (
            <span className="ml-1 text-xs opacity-60">{sort.dir === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => onChange({ ...sort, dir: "asc" })}
          className={`flex-1 text-xs py-1 rounded-lg transition-colors ${sort.dir === "asc" ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Ascending ↑
        </button>
        <button
          onClick={() => onChange({ ...sort, dir: "desc" })}
          className={`flex-1 text-xs py-1 rounded-lg transition-colors ${sort.dir === "desc" ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Descending ↓
        </button>
      </div>
    </div>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

// Master ordered list — drives label + render order for every view key.
const ALL_TABS = [
  { key: "overview",  label: "Overview"  },
  { key: "list",      label: "List"      },
  { key: "board",     label: "Board"     },
  { key: "timeline",  label: "Timeline"  },
  { key: "dashboard", label: "Dashboard" },
  { key: "calendar",  label: "Calendar"  },
];

// Derive which tabs to show from the project's saved views array.
// "list" is always included as a safety guarantee.
const getProjectTabs = (views) => {
  if (!views || !Array.isArray(views) || views.length === 0) return ALL_TABS;
  const viewSet = new Set([...views, "list"]);
  return ALL_TABS.filter((t) => viewSet.has(t.key));
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProjectPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentProject, members, isLoading, error } = useAppSelector((s) => s.projects);
  const { token, currentOrg } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState("list");
  const [showCustomizeFields, setShowCustomizeFields] = useState(false);

  // ── Task state ─────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // ── Toolbar state (never in Redux) ─────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filters, setFilters] = useState({
    statusId: "", priority: "", assigneeId: "", dueDateFrom: "", dueDateTo: "",
  });
  const [sort, setSort] = useState({ field: "position", dir: "asc" });
  const [groupBy, setGroupBy] = useState("status");
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // ── Load project + tasks ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !currentOrg?.id || !id) return;
    dispatch(fetchProjectById(id));
    dispatch(fetchProjectMembers(id));
    return () => { dispatch(clearCurrentProject()); };
  }, [dispatch, id, token, currentOrg?.id]);

  // When the project loads, activate "list" (always visible and the required default).
  useEffect(() => {
    if (currentProject) setActiveTab("list");
  }, [currentProject?.id]);

  const loadTasks = useCallback(async () => {
    if (!id || !token || !currentOrg?.id) return;
    setTasksLoading(true);
    try {
      const res = await taskService.getProjectTasks(id, { limit: 200 });
      setTasks(res.data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  }, [id, token, currentOrg?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Socket: join project room and sync real-time task events ───────────────
  useEffect(() => {
    if (!id) return;

    socketService.emit("join_project", id);

    const handleTaskCreated = (task) => {
      setTasks((prev) => {
        if (prev.find((t) => t.id === task.id)) return prev;
        return [...prev, task];
      });
    };

    const handleTaskUpdated = (task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...task } : t))
      );
    };

    socketService.on("task:created", handleTaskCreated);
    socketService.on("task:updated", handleTaskUpdated);

    return () => {
      socketService.emit("leave_project", id);
      socketService.off("task:created", handleTaskCreated);
      socketService.off("task:updated", handleTaskUpdated);
    };
  }, [id]);

  // ── Task mutation handlers (keep shared state in sync) ─────────────────────
  const handleTaskCreated = useCallback((newTask) => {
    setTasks((prev) => {
      if (prev.find((t) => t.id === newTask.id)) return prev;
      return [...prev, newTask];
    });
  }, []);

  const handleTaskUpdated = useCallback((updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
    );
  }, []);

  // ── Filter + sort tasks ────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filters.statusId) result = result.filter((t) => t.statusId === filters.statusId);
    if (filters.priority) result = result.filter((t) => t.priority === filters.priority);
    if (filters.assigneeId) {
      result = result.filter((t) => t.assignees?.some((a) => a.userId === filters.assigneeId));
    }
    if (filters.dueDateFrom) {
      const from = new Date(filters.dueDateFrom);
      result = result.filter((t) => t.dueDate && new Date(t.dueDate) >= from);
    }
    if (filters.dueDateTo) {
      const to = new Date(filters.dueDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((t) => t.dueDate && new Date(t.dueDate) <= to);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) cmp = 0;
          else if (!a.dueDate) cmp = 1;
          else if (!b.dueDate) cmp = -1;
          else cmp = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case "priority":
          cmp = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        default:
          cmp = (a.position ?? 0) - (b.position ?? 0);
      }
      return sort.dir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [tasks, search, filters, sort]);

  const hasActiveFilters =
    search.trim() ||
    filters.statusId ||
    filters.priority ||
    filters.assigneeId ||
    filters.dueDateFrom ||
    filters.dueDateTo;

  // ── Render tab ─────────────────────────────────────────────────────────────
  const statuses = currentProject?.statuses ?? [];
  const sharedProps = {
    projectId: id,
    tasks: filteredTasks,
    statuses,
    projectMembers: members ?? [],
    onTaskCreated: handleTaskCreated,
    onTaskUpdated: handleTaskUpdated,
  };

  const renderTab = () => {
    if (tasksLoading && tasks.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-gray-400">Loading tasks…</span>
        </div>
      );
    }
    switch (activeTab) {
      case "overview":  return <OverviewTab project={currentProject} members={members ?? []} tasks={tasks} />;
      case "list":      return <ListView {...sharedProps} />;
      case "board":     return <BoardView {...sharedProps} />;
      case "calendar":  return <CalendarView {...sharedProps} />;
      case "timeline":  return <TimelineView {...sharedProps} />;
      default:
        return <PlaceholderView label={ALL_TABS.find((t) => t.key === activeTab)?.label ?? activeTab} />;
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading && !currentProject) {
    return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
        <p className="text-sm">{error}</p>
        <button onClick={() => navigate("/")} className="text-indigo-600 text-sm hover:underline">Go back home</button>
      </div>
    );
  }

  if (!currentProject) return null;

  const projectTabs = getProjectTabs(currentProject.views);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <ProjectHeader
        project={currentProject}
        members={members}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={projectTabs}
        onCustomize={() => setShowCustomizeFields(true)}
      />

      {showCustomizeFields && (
        <CustomFieldsManager
          projectId={id}
          onClose={() => setShowCustomizeFields(false)}
        />
      )}

      {/* View toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1">
          {showSearch ? (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-48 text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={() => { setShowSearch(false); setSearch(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="Search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors
              ${hasActiveFilters
                ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </button>
          {showFilter && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              statuses={statuses}
              projectMembers={members ?? []}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors
              ${sort.field !== "position"
                ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort
          </button>
          {showSort && (
            <SortPanel
              sort={sort}
              onChange={setSort}
              onClose={() => setShowSort(false)}
            />
          )}
        </div>

        {/* Group by (list view only) */}
        {activeTab === "list" && (
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="status">Group: Status</option>
              <option value="priority">Group: Priority</option>
              <option value="assignee">Group: Assignee</option>
            </select>
          </div>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {filteredTasks.length}{tasks.length !== filteredTasks.length ? `/${tasks.length}` : ""} tasks
        </span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {renderTab()}
      </div>
    </div>
  );
};

export default ProjectPage;
