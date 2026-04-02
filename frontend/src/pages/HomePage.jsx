import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import Button from "@/components/ui/Button";
import taskService from "@/services/taskService";

// ─── helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_COLORS = ["#6366F1","#8B5CF6","#EC4899","#F97316","#22C55E","#3B82F6"];
const getAvatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const Avatar = ({ name, size = "sm" }) => {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: getAvatarColor(name) }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

const getDayName = () => {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date().getDay()];
};

const getMonthDay = () => {
  const d = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const PRIORITY_COLORS = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  low: { bg: "bg-blue-100", text: "text-blue-700" },
  none: { bg: "bg-gray-100", text: "text-gray-600" },
};

const PriorityBadge = ({ priority }) => {
  const c = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.none;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "None"}
    </span>
  );
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, action, tabs, activeTab, onTabChange }) => (
  <div className="px-4 pt-4 pb-0">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-gray-800">{title}</span>
      {action}
    </div>
    {tabs && (
      <div className="flex gap-4 border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    )}
  </div>
);

// ─── My Tasks card ────────────────────────────────────────────────────────────

const MY_TASK_TABS = ["Upcoming", "Overdue", "Completed"];

const MyTasksCard = ({ myTasks, user }) => {
  const [tab, setTab] = useState("Upcoming");
  const now = new Date();

  const filtered = myTasks.filter((t) => {
    if (tab === "Completed") return t.isCompleted;
    if (tab === "Overdue") return !t.isCompleted && t.dueDate && new Date(t.dueDate) < now;
    return !t.isCompleted && (!t.dueDate || new Date(t.dueDate) >= now);
  });

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Avatar name={user?.name ?? "RC"} size="sm" />
            <span>My tasks</span>
          </div>
        }
        tabs={MY_TASK_TABS}
        activeTab={tab}
        onTabChange={setTab}
      />
      <div className="p-4 min-h-[120px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-400">
            {tab === "Completed" ? (
              <>
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-center text-gray-400">
                  Your completed tasks will appear here, so you can reference them later.
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400">No {tab.toLowerCase()} tasks</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1 group">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-indigo-400 transition-colors shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{t.title}</span>
                {t.priority && t.priority !== "none" && <PriorityBadge priority={t.priority} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Projects card ────────────────────────────────────────────────────────────

const ProjectsCard = ({ projects }) => (
  <Card>
    <CardHeader
      title="Projects"
      action={
        <button className="text-xs text-gray-500 border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
          Recents ▾
        </button>
      }
    />
    <div className="p-4 grid grid-cols-2 gap-2 min-h-[120px]">
      {/* Create project card */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer p-4 gap-1">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-xs text-gray-500">Create project</span>
      </div>

      {/* Project cards */}
      {projects.slice(0, 5).map((p) => (
        <Link
          key={p.id}
          to={`/projects/${p.id}`}
          className="flex flex-col justify-between rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors min-h-[72px]"
        >
          <div
            className="w-6 h-6 rounded-md mb-2"
            style={{ backgroundColor: p.color ?? "#6C63FF" }}
          />
          <span className="text-xs font-medium text-gray-700 truncate">{p.name}</span>
        </Link>
      ))}
    </div>
  </Card>
);

// ─── Tasks I've assigned card ─────────────────────────────────────────────────

const ASSIGNED_TABS = ["This week", "Upcoming", "Overdue", "Completed"];

const AssignedTasksCard = ({ assignedTasks }) => {
  const [tab, setTab] = useState("This week");
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filtered = assignedTasks.filter((t) => {
    if (tab === "Completed") return t.isCompleted;
    if (tab === "Overdue") return !t.isCompleted && t.dueDate && new Date(t.dueDate) < now;
    if (tab === "This week") return !t.isCompleted && t.dueDate && new Date(t.dueDate) <= weekEnd;
    return !t.isCompleted;
  });

  return (
    <Card>
      <CardHeader
        title="Tasks I've assigned"
        tabs={ASSIGNED_TABS}
        activeTab={tab}
        onTabChange={setTab}
        action={
          <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign task
          </button>
        }
      />
      <div className="p-4 min-h-[120px]">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No tasks in this view</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{t.title}</span>
                {t.projectName && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {t.projectName}
                  </span>
                )}
                {t.dueDate && (
                  <span className="text-[10px] text-gray-400">
                    {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Goals card ───────────────────────────────────────────────────────────────

const GOAL_TABS = ["My goals", "Team"];

const MOCK_GOALS = [
  { id: 1, title: "Q2 Revenue target", progress: 90, color: "#6366F1" },
  { id: 2, title: "Product launch readiness", progress: 75, color: "#22C55E" },
];

const GoalsCard = () => {
  const [tab, setTab] = useState("My goals");

  return (
    <Card>
      <CardHeader
        title="Goals"
        tabs={GOAL_TABS}
        activeTab={tab}
        onTabChange={setTab}
      />
      <div className="p-4 min-h-[120px]">
        {tab === "Team" ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <p className="text-xs text-gray-400">You haven't added team goals yet.</p>
            <Button variant="secondary" size="sm">Create goal</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {MOCK_GOALS.map((g) => (
              <div key={g.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{g.title}</span>
                  <span className="text-xs text-gray-500">{g.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${g.progress}%`, backgroundColor: g.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { user } = useAppSelector((s) => s.auth);
  const { projects } = useAppSelector((s) => s.projects);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);

  useEffect(() => {
    taskService.getMyTasks?.({ limit: 50 })
      .then((res) => setMyTasks(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  const name = user?.name ?? "there";

  return (
    <div
      className="flex-1 overflow-y-auto bg-white"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              {getDayName()}, {getMonthDay()}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {name}
            </h1>
          </div>

          {/* My week widget */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">My week</span>
              <button className="text-xs text-indigo-600 hover:underline">▾</button>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-gray-800">0</span>
              <span className="text-[11px] text-gray-500">tasks completed</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-gray-800">2</span>
              <span className="text-[11px] text-gray-500">collaborators</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <button className="text-xs text-gray-500 border border-gray-200 rounded-md px-2 py-1 hover:bg-white transition-colors">
              Customize
            </button>
          </div>
        </div>

        {/* Top row: My Tasks + Projects */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MyTasksCard myTasks={myTasks} user={user} />
          <ProjectsCard projects={projects ?? []} />
        </div>

        {/* Bottom row: Assigned + Goals */}
        <div className="grid grid-cols-2 gap-4">
          <AssignedTasksCard assignedTasks={assignedTasks} />
          <GoalsCard />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
