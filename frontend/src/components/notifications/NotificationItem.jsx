import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { markNotificationRead } from "@/store/slices/appSlice";
import notificationService from "@/services/notificationService";

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

const getInitials = (name = "") =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const NotificationItem = ({ notification, onRead }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!notification.isRead) {
      try {
        await notificationService.markRead(notification.id);
        dispatch(markNotificationRead(notification.id));
        onRead?.(notification.id);
      } catch {
        // ignore
      }
    }

    if (notification.entityType === "task" && notification.entityId) {
      // Navigation to task would require knowing the projectId — navigate to inbox instead
      navigate("/inbox");
    } else if (notification.entityType === "project" && notification.entityId) {
      navigate(`/projects/${notification.entityId}`);
    }
  };

  return (
    <li
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? "bg-blue-50/40" : ""
      }`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-1.5">
        <span
          className={`block w-2 h-2 rounded-full ${
            notification.isRead ? "bg-transparent" : "bg-blue-500"
          }`}
        />
      </div>

      {/* Actor avatar or system icon */}
      {notification.actorName ? (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {notification.actorAvatar ? (
            <img src={notification.actorAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            getInitials(notification.actorName)
          )}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{notification.title}</p>
        {notification.body && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{notification.body}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{relativeTime(notification.createdAt)}</p>
      </div>
    </li>
  );
};

export default NotificationItem;
