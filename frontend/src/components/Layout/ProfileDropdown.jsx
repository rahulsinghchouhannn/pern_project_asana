import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import Spinner from "@/components/ui/Spinner";
import { useState } from "react";

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#E879A0",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#F97316",
];

export const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// ─── Component ─────────────────────────────────────────────────────────────────

const ProfileDropdown = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutUser());
    } finally {
      navigate("/login");
    }
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-xl border border-[#3A3A3A] bg-[#2A2A2A] z-50 py-1"
    >
      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
        </div>
      </div>

      <div className="border-t border-[#3A3A3A] my-1" />

      {/* Profile & settings */}
      <button
        onClick={() => handleNavigate("/settings/profile")}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A] transition-colors cursor-pointer"
      >
        <span className="text-gray-400"><UserIcon /></span>
        Profile &amp; settings
      </button>

      {/* My workspace */}
      <button
        onClick={() => handleNavigate("/team")}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A] transition-colors cursor-pointer"
      >
        <span className="text-gray-400"><BuildingIcon /></span>
        My workspace
      </button>

      <div className="border-t border-[#3A3A3A] my-1" />

      {/* Log out */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-[#3A3A3A] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoggingOut ? (
          <Spinner size="sm" />
        ) : (
          <span><LogoutIcon /></span>
        )}
        {isLoggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
};

export default ProfileDropdown;
