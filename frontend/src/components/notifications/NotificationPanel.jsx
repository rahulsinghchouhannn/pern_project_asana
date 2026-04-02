import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { markAllRead, fetchNotifications } from "@/store/slices/appSlice";
import notificationService from "@/services/notificationService";
import NotificationItem from "./NotificationItem";

const NotificationPanel = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { notifications, unreadCount } = useAppSelector((s) => s.app);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 20 }));
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      dispatch(markAllRead());
    } catch {
      // ignore
    }
  };

  const handleSeeAll = () => {
    navigate("/inbox");
    onClose();
  };

  const recent = notifications.slice(0, 20);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden"
      style={{ maxHeight: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <ul className="overflow-y-auto flex-1">
        {recent.length === 0 ? (
          <li className="flex flex-col items-center justify-center py-10 text-center px-4">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">You're all caught up</p>
            <p className="text-xs text-gray-400 mt-0.5">No new notifications</p>
          </li>
        ) : (
          recent.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={() => onClose()}
            />
          ))
        )}
      </ul>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
        <button
          onClick={handleSeeAll}
          className="w-full text-xs text-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          See all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
