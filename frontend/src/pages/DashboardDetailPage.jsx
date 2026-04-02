import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import reportingService from "@/services/reportingService";
import Spinner from "@/components/ui/Spinner";
import CompletionDonut from "@/components/reporting/CompletionDonut";
import PriorityBarChart from "@/components/reporting/PriorityBarChart";
import StatusBarChart from "@/components/reporting/StatusBarChart";
import MemberWorkload from "@/components/reporting/MemberWorkload";

// ─── Filter bar ───────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "All time", value: "all" },
];

const FilterBar = ({ projects, filters, onChange }) => (
  <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
    {/* Project selector */}
    <select
      value={filters.projectId}
      onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <option value="">All projects</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>

    {/* Date range */}
    <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-white p-0.5">
      {DATE_RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange({ ...filters, dateRange: r.value })}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            filters.dateRange === r.value
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  </div>
);

// ─── Chart card wrapper ───────────────────────────────────────────────────────

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
    {children}
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color = "text-gray-800" }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
  </div>
);

// ─── Activity item ────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_COLORS = ["#6366F1","#8B5CF6","#EC4899","#F97316","#22C55E","#06B6D4"];
const getAvatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const ActivityItem = ({ item }) => {
  const time = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-0.5"
        style={{ backgroundColor: getAvatarColor(item.actorName ?? "") }}
      >
        {getInitials(item.actorName ?? "")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{item.actorName}</span>{" "}
          <span className="text-gray-500">{item.action?.replace(/_/g, " ")}</span>
          {item.metadata?.taskTitle && (
            <span className="font-medium"> "{item.metadata.taskTitle}"</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const buildDateFilter = (range) => {
  const now = new Date();
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  if (range === "month") {
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  return {};
};

const DashboardDetailPage = () => {
  const { projects } = useAppSelector((s) => s.projects);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ projectId: "", dateRange: "all" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const dateFilters = buildDateFilter(filters.dateRange);
        const res = await reportingService.getOrgDashboard({
          projectId: filters.projectId || undefined,
          ...dateFilters,
        });
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  return (
    <div className="flex flex-col h-full bg-gray-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">My first dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">owned by you</p>
      </div>

      {/* Filter bar */}
      <FilterBar projects={projects ?? []} filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Failed to load data
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Tasks" value={data.totalTasks} />
            <StatCard label="Completed" value={data.completedTasks} color="text-green-600" />
            <StatCard label="Overdue" value={data.overdueTasks} color="text-red-600" />
            <StatCard label="Due This Week" value={data.tasksDueThisWeek?.length ?? 0} color="text-amber-600" />
          </div>

          {/* Two-column charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left col */}
            <div className="flex flex-col gap-6">
              <ChartCard title="Task Completion Rate">
                <div className="flex justify-center">
                  <CompletionDonut
                    completionRate={data.completionRate}
                    completedTasks={data.completedTasks}
                    totalTasks={data.totalTasks}
                  />
                </div>
              </ChartCard>

              <ChartCard title="Tasks by Priority">
                <PriorityBarChart tasksByPriority={data.tasksByPriority} />
              </ChartCard>
            </div>

            {/* Right col */}
            <div className="flex flex-col gap-6">
              <ChartCard title="Tasks by Status">
                <StatusBarChart tasksByStatus={data.tasksByStatus} />
              </ChartCard>

              <ChartCard title="Tasks by Project">
                {data.tasksByProject?.length === 0 ? (
                  <p className="text-sm text-gray-400">No project data</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.tasksByProject?.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-32 truncate">{p.projectName}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: p.total > 0 ? `${Math.round((p.completed / p.total) * 100)}%` : "0%" }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {p.completed}/{p.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>
            </div>
          </div>

          {/* Recent activity */}
          <ChartCard title="Recent Activity">
            {data.recentActivity?.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentActivity?.map((item) => (
                  <ActivityItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default DashboardDetailPage;
