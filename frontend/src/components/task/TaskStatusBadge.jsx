import React from "react";

const TaskStatusBadge = ({ status, className = "" }) => {
  if (!status) return null;
  const bg = status.color ?? "#E0E0E0";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bg + "22", color: bg, border: `1px solid ${bg}44` }}
    >
      {status.name}
    </span>
  );
};

export default TaskStatusBadge;
