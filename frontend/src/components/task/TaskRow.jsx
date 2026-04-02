import React from "react";
import TaskPriorityBadge from "./TaskPriorityBadge";

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const AvatarIcon = () => (
  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const TaskRow = ({ task, statuses = [], onClick }) => {
  const status = statuses.find((s) => s.id === task.statusId);
  const hasAssignees = task.assignees?.length > 0;
  const dateLabel =
    task.startDate && task.dueDate
      ? `${formatDate(task.startDate)} – ${formatDate(task.dueDate)}`
      : formatDate(task.dueDate) || formatDate(task.startDate) || null;

  const isOverdue =
    !task.isCompleted &&
    task.dueDate &&
    new Date(task.dueDate) < new Date();

  return (
    <tr
      className="group border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick?.(task)}
    >
      {/* Checkbox + Title */}
      <td className="py-2 pl-4 pr-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          {/* Completion circle */}
          <button
            className={`flex-shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
              task.isCompleted
                ? "bg-indigo-500 border-indigo-500"
                : "border-gray-300 hover:border-indigo-400"
            }`}
            onClick={(e) => {
              e.stopPropagation();
            }}
            title={task.isCompleted ? "Reopen task" : "Complete task"}
          />
          {/* Subtask indent indicator */}
          {task.parentTaskId && <span className="w-4 flex-shrink-0" />}
          <span
            className={`text-sm truncate ${
              task.isCompleted ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {task.title}
          </span>
          {task.subtaskCount > 0 && (
            <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 rounded px-1">
              {task.subtaskCount}
            </span>
          )}
        </div>
      </td>

      {/* Assignee */}
      <td className="py-2 px-2 w-20">
        <div className="flex items-center">
          {hasAssignees ? (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 2).map((a) =>
                a.avatarUrl ? (
                  <img
                    key={a.userId}
                    src={a.avatarUrl}
                    alt={a.name}
                    className="w-6 h-6 rounded-full border border-white object-cover"
                    title={a.name}
                  />
                ) : (
                  <div
                    key={a.userId}
                    className="w-6 h-6 rounded-full bg-indigo-100 border border-white flex items-center justify-center"
                    title={a.name}
                  >
                    <span className="text-xs font-medium text-indigo-700">
                      {a.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <AvatarIcon />
          )}
        </div>
      </td>

      {/* Due date */}
      <td className="py-2 px-2 w-28">
        {dateLabel && (
          <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-500"}`}>
            {dateLabel}
          </span>
        )}
      </td>

      {/* Priority */}
      <td className="py-2 px-2 w-24">
        {task.priority && task.priority !== "none" && (
          <TaskPriorityBadge priority={task.priority} />
        )}
      </td>

      {/* Status */}
      <td className="py-2 px-2 w-24">
        {status && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: (status.color ?? "#E0E0E0") + "22",
              color: status.color ?? "#666",
            }}
          >
            {status.name}
          </span>
        )}
      </td>
    </tr>
  );
};

export default TaskRow;
