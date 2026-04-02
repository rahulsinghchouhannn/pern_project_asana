import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

// Placeholder dashboard cards data
const MOCK_DASHBOARDS = [
  {
    id: "1",
    name: "My first dashboard",
    color: "#6366F1",
    icon: "📊",
    owner: "you",
  },
];

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const DashboardCard = ({ dashboard }) => (
  <Link
    to={`/reporting/dashboards/${dashboard.id}`}
    className="group flex flex-col rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden"
  >
    {/* Color header */}
    <div
      className="h-20 flex items-center justify-center text-3xl"
      style={{ backgroundColor: dashboard.color + "20" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
        style={{ backgroundColor: dashboard.color }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    </div>

    {/* Info */}
    <div className="p-4">
      <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
        {dashboard.name}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">owned by {dashboard.owner}</p>
    </div>
  </Link>
);

const CreateDashboardCard = () => (
  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer p-8 gap-2">
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </div>
    <p className="text-sm font-medium text-gray-500">Create dashboard</p>
  </div>
);

const ReportingPage = () => {
  const [activeTab, setActiveTab] = useState("Dashboards");
  const [viewMode, setViewMode] = useState("grid");

  return (
    <div className="flex flex-col h-full bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Page header */}
      <div className="px-8 pt-6 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Reporting</h1>
          <Button variant="secondary" size="sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6">
          {["Dashboards"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Recents section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recents</h2>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <ListIcon />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {MOCK_DASHBOARDS.map((d) => (
                <DashboardCard key={d.id} dashboard={d} />
              ))}
              <CreateDashboardCard />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {MOCK_DASHBOARDS.map((d) => (
                <Link
                  key={d.id}
                  to={`/reporting/dashboards/${d.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: d.color }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.name}</p>
                    <p className="text-xs text-gray-500">owned by {d.owner}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportingPage;
