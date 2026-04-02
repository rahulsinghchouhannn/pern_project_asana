import React from "react";

const PRIORITY_CONFIG = {
  none:   { label: "None",   color: "bg-gray-100 text-gray-500",    dot: "bg-gray-400"   },
  low:    { label: "Low",    color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"   },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700",dot: "bg-yellow-500" },
  high:   { label: "High",   color: "bg-orange-100 text-orange-700",dot: "bg-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700",      dot: "bg-red-500"    },
};

const TaskPriorityBadge = ({ priority = "none", showLabel = true, className = "" }) => {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.none;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {showLabel && cfg.label}
    </span>
  );
};

export default TaskPriorityBadge;
