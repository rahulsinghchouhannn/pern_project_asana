import React, { useEffect, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchNotifications, markNotificationRead, markAllRead } from "@/store/slices/appSlice";
import notificationService from "@/services/notificationService";
import NotificationItem from "@/components/notifications/NotificationItem";

const TABS = ["Activity", "Bookmarks", "Archive", "@Mentioned"];
const SORT_OPTIONS = ["Newest", "Oldest"];
const TIMEFRAMES = ["Last 7 days", "Last 30 days", "Last 3 months", "All time"];

const InboxPage = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector((s) => s.app);
  const [activeTab, setActiveTab] = useState("Activity");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("Newest");
  const [density, setDensity] = useState("Detailed");
  const [timeframe, setTimeframe] = useState("Last 7 days");
  const [archiving, setArchiving] = useState(false);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    dispatch(fetchNotifications({ limit: 50 })).finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      dispatch(markNotificationRead(id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveAll = async () => {
    setArchiving(true);
    try {
      await notificationService.markAllRead();
      dispatch(markAllRead());
    } catch (err) {
      console.error(err);
    } finally {
      setArchiving(false);
    }
  };

  const displayedItems = sort === "Newest" ? [...notifications] : [...notifications].reverse();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
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
          <button className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent">+</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "Activity" && (
          <>
            {/* Summary Banner */}
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
                  {TIMEFRAMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Notification list */}
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : displayedItems.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">You're all caught up.</p>
                <p className="text-xs text-gray-400 mt-1">Notifications will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {displayedItems.map((item) => (
                  <NotificationItem
                    key={item.id}
                    notification={item}
                    onRead={handleMarkRead}
                  />
                ))}
              </ul>
            )}

            {/* Archive all */}
            {notifications.length > 0 && (
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
