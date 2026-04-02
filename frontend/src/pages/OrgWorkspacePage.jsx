import React, { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import Button from "@/components/ui/Button";

const TABS = ["Overview", "Members", "All work", "Messages", "Calendar", "Knowledge", "Note", "+"];

// ─── helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_COLORS = ["#6366F1","#8B5CF6","#EC4899","#F97316","#22C55E","#3B82F6"];
const getAvatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const Avatar = ({ name, size = "md" }) => {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

// ─── Setup step cards ─────────────────────────────────────────────────────────

const SetupCard = ({ title, done }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        done ? "border-green-500 bg-green-500" : "border-gray-300"
      }`}
    >
      {done && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className={`text-sm ${done ? "line-through text-gray-400" : "text-gray-700"}`}>{title}</span>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrgWorkspacePage = () => {
  const { currentOrg, user } = useAppSelector((s) => s.auth);
  const { projects } = useAppSelector((s) => s.projects);
  const [activeTab, setActiveTab] = useState("Overview");
  const [showPopup, setShowPopup] = useState(false);

  const orgName = currentOrg?.name ?? "My workspace";
  const orgInitial = orgName[0]?.toUpperCase() ?? "M";

  return (
    <div
      className="flex flex-col h-full bg-white"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* Team header */}
      <div className="px-6 pt-5 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* M circle */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: "#6366F1" }}
            >
              {orgInitial}
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{orgName}</h1>
            {/* Favorite */}
            <button className="text-gray-400 hover:text-yellow-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>

            {/* Member avatars */}
            <div className="flex -space-x-1 ml-2">
              {["RC", "Mo", "RS"].map((n, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: AVATAR_COLORS[i] }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Invite button */}
          <Button variant="primary" size="sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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

      {/* Overview tab content */}
      {activeTab === "Overview" && (
        <div className="flex-1 overflow-y-auto">
          {/* Hero section */}
          <div className="flex flex-col items-center py-10 px-6 border-b border-gray-100">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-sm"
              style={{ backgroundColor: "#6366F1" }}
            >
              {orgInitial}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{orgName}</h2>
            <p className="text-sm text-gray-400 mt-1 cursor-pointer hover:text-gray-600 transition-colors">
              Click to add team description...
            </p>
            <button className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Create work
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Finish setup widget */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Finish setting up your team</h3>
              <span className="text-xs text-gray-500">1 of 3 steps completed</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: "33%" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SetupCard title="Add team description" done={false} />
              <SetupCard title="Add work" done={false} />
              <SetupCard title="Add teammates" done={true} />
            </div>
          </div>

          {/* Two-column lower section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Curated work */}
            <div className="lg:col-span-2 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Curated work</h3>
              <div className="flex flex-col gap-2">
                {projects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color ?? "#6C63FF" }}
                    />
                    <span className="text-sm text-gray-700 truncate">{p.name}</span>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-sm text-gray-400">No projects yet. Create one to get started.</p>
                )}
              </div>
            </div>

            {/* Right panel: Members + Goals */}
            <div className="p-6 flex flex-col gap-6">
              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Members</h3>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-indigo-600 hover:underline">View all 3</button>
                    <button className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {["RC", "Mo", "RS"].map((n, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: AVATAR_COLORS[i] }}
                      title={n}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Goals</h3>
                <p className="text-sm text-gray-400 mb-3">
                  This team hasn't created any goals yet.
                </p>
                <Button variant="secondary" size="sm">Create goal</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "Overview" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          {activeTab} coming soon
        </div>
      )}
    </div>
  );
};

export default OrgWorkspacePage;
