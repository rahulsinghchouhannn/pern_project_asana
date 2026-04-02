import React from "react";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F97316",
  "#EAB308", "#22C55E", "#06B6D4", "#3B82F6",
];

const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const MemberWorkload = ({ memberWorkload = [] }) => {
  if (memberWorkload.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No member data
      </div>
    );
  }

  const max = Math.max(...memberWorkload.map((m) => m.taskCount), 1);

  return (
    <div className="flex flex-col gap-3">
      {memberWorkload.map((member) => (
        <div key={member.userId} className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ backgroundColor: getAvatarColor(member.name) }}
          >
            {getInitials(member.name)}
          </div>

          {/* Name */}
          <span className="text-sm text-gray-700 w-28 truncate shrink-0">{member.name}</span>

          {/* Progress bar */}
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((member.taskCount / max) * 100)}%` }}
            />
          </div>

          {/* Count */}
          <span className="text-xs text-gray-500 w-8 text-right shrink-0">
            {member.taskCount}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MemberWorkload;
