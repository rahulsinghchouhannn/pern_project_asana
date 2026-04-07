import { useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import ProfileDropdown, { getAvatarColor, getInitials } from "./ProfileDropdown";
import NotificationPanel from "@/components/notifications/NotificationPanel";

const Navbar = () => {
  const { user } = useAppSelector((s) => s.auth);
  const { unreadCount } = useAppSelector((s) => s.app);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const name = user?.name ?? "";
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);

  return (
    <header
      className="flex items-center gap-3 px-4 h-14 shrink-0 relative z-30"
      style={{ backgroundColor: "#1F1F1F" }}
    >
      {/* Create button */}
      <button
        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors shrink-0"
        aria-label="Create new item"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Create</span>
      </button>

      {/* Search bar — centered */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-4 py-1.5 rounded-md text-sm bg-[#3A3A3A] text-gray-200 placeholder-gray-400 border border-transparent focus:outline-none focus:border-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative p-1.5 rounded hover:bg-[#3A3A3A] text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={closeNotif} />}
        </div>

        {/* Help */}
        <button className="p-1.5 rounded hover:bg-[#3A3A3A] text-gray-400 hover:text-gray-200 transition-colors" aria-label="Help">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold hover:ring-2 hover:ring-white/30 transition-all"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </button>

          {dropdownOpen && <ProfileDropdown onClose={closeDropdown} />}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
