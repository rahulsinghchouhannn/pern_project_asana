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

// ─── Placeholder ──────────────────────────────────────────────────────────────

const PlaceholderView = ({ label }) => (
  <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-20">
    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <p className="text-sm font-medium">{label} view coming soon</p>
  </div>
);

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
  const { currentProject, members, isLoading, error } = useAppSelector((s) => s.projects);
  const { token, currentOrg } = useAppSelector((s) => s.auth);

  const defaultView = currentProject?.defaultView ?? "list";
  const [activeTab, setActiveTab] = useState(defaultView);
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

  useEffect(() => {
    if (currentProject?.defaultView) setActiveTab(currentProject.defaultView);
  }, [currentProject?.defaultView]);

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

  // ── Task mutation handlers (keep shared state in sync) ─────────────────────
  const handleTaskCreated = useCallback((newTask) => {
    setTasks((prev) => [...prev, newTask]);
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
      case "list":      return <ListView {...sharedProps} />;
      case "board":     return <BoardView {...sharedProps} />;
      case "calendar":  return <CalendarView {...sharedProps} />;
      case "timeline":  return <TimelineView {...sharedProps} />;
      default:
        return <PlaceholderView label={TABS.find((t) => t.key === activeTab)?.label ?? activeTab} />;
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <ProjectHeader
        project={currentProject}
        members={members}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={TABS}
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
