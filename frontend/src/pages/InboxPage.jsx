import React, { useEffect, useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import activityService from "@/services/activityService";

const TABS = ["Activity", "Bookmarks", "Archive", "@Mentioned"];

const ACTION_LABELS = {
  task_created: (m) => `created task "${m?.taskTitle ?? "a task"}"`,
  task_completed: () => `marked a task complete`,
  task_assigned: (m) => `assigned ${m?.assigneeName ?? "someone"} to a task`,
  comment_added: () => `added a comment`,
  status_changed: (m) =>
    m?.from && m?.to ? `changed status from "${m.from}" to "${m.to}"` : `changed status`,
  priority_changed: () => `changed priority`,
  due_date_changed: () => `changed due date`,
  project_created: (m) => `created project "${m?.projectName ?? ""}"`,
  member_invited: (m) => m?.email ? `invited ${m.email}` : `invited a member`,
  member_joined: () => `joined the organization`,
};

const activityDescription = (action, metadata) => {
  const fn = ACTION_LABELS[action];
  return fn ? fn(metadata) : action.replace(/_/g, " ");
};

const activityIcon = (action) => {
  if (action === "task_created" || action === "task_completed") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  }
  if (action === "comment_added") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (action === "status_changed" || action === "priority_changed") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );
  }
  if (action === "member_invited" || action === "member_joined") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TIMEFRAMES = ["Last 7 days", "Last 30 days", "Last 3 months", "All time"];
const SORT_OPTIONS = ["Newest", "Oldest"];

const InboxPage = () => {
  const { user } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState("Activity");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("Newest");
  const [density, setDensity] = useState("Detailed");
  const [timeframe, setTimeframe] = useState("Last 7 days");
  const [archiving, setArchiving] = useState(false);

  const fetchActivity = useCallback(() => {
    setLoading(true);
    activityService
      .getUserActivity()
      .then((res) => setItems(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleMarkRead = async (id) => {
    try {
      await activityService.markRead(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveAll = async () => {
    setArchiving(true);
    try {
      await activityService.archiveAll();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setArchiving(false);
    }
  };

  const displayedItems = sort === "Newest" ? [...items] : [...items].reverse();
  const unreadCount = items.filter((i) => !i.isRead).length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter
            </button>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            {/* Density */}
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Detailed</option>
              <option>Compact</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
              {tab === "Activity" && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          ))}
          <button className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent">
            +
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "Activity" && (
          <>
            {/* Inbox Summary Banner */}
            <div className="mx-6 mt-4 mb-2 flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Inbox Summary</p>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0
                      ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                      : "You're all caught up"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {TIMEFRAMES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                  View summary
                </button>
              </div>
            </div>

            {/* Activity list */}
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : displayedItems.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No activity yet.</p>
                <p className="text-xs text-gray-400 mt-1">Actions in your organization will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {displayedItems.map((item) => (
                  <li
                    key={item.id}
                    className={`group flex items-start gap-3 px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !item.isRead ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => !item.isRead && handleMarkRead(item.id)}
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-500">
                      {activityIcon(item.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.actorName}
                          </p>
                          {density === "Detailed" && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {activityDescription(item.action, item.metadata)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {relativeTime(item.createdAt)}
                          </span>
                          {/* Unread dot */}
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          {/* Hover actions */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              title="Bookmark"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                            <button
                              title="Archive"
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(item.id); }}
                              className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Archive all link */}
            {items.length > 0 && (
              <div className="px-6 py-4 text-center">
                <button
                  onClick={handleArchiveAll}
                  disabled={archiving}
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  {archiving ? "Archiving…" : "Archive all notifications"}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab !== "Activity" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">{activeTab}</p>
            <p className="text-xs text-gray-400 mt-1">Nothing here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
