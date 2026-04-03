import React, { useState, useEffect, useRef } from "react";
import projectService from "@/services/projectService";

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F97316", "#22C55E", "#3B82F6"];
const getAvatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const AssigneeDropdown = ({ projectId, members: initialMembers, onSelect, onClose }) => {
  const [members, setMembers] = useState(initialMembers ?? []);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (initialMembers?.length > 0) {
      setMembers(initialMembers);
      return;
    }
    projectService
      .getMembers(projectId)
      .then((res) => setMembers(res.data.data ?? []))
      .catch(() => {});
  }, [projectId, initialMembers]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const filtered = search
    ? members.filter(
        (m) =>
          (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (m.email ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-72 py-2"
      style={{ top: "100%", left: 0, marginTop: 4 }}
    >
      <div className="px-3 pb-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="max-h-60 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-2">No members found</p>
        )}
        {filtered.map((m) => (
          <button
            key={m.userId}
            onClick={() => onSelect(m)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            {m.avatarUrl ? (
              <img
                src={m.avatarUrl}
                alt={m.name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: getAvatarColor(m.name ?? "") }}
              >
                {getInitials(m.name ?? "")}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
              <p className="text-xs text-gray-400 truncate">{m.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssigneeDropdown;
