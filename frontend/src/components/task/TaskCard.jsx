import React from "react";
import TaskPriorityBadge from "./TaskPriorityBadge";

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TaskCard = React.forwardRef(({ task, onClick, dragHandleProps, draggableProps, style, isDragging }, ref) => {
  const isOverdue = !task.isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={ref}
      {...draggableProps}
      {...dragHandleProps}
      style={style}
      onClick={() => onClick?.(task)}
      className={`bg-white rounded-lg border border-gray-200 p-3 mb-2 cursor-pointer select-none
        hover:border-indigo-300 hover:shadow-sm transition-all
        ${isDragging ? "shadow-lg rotate-1 border-indigo-400 opacity-90" : ""}
        ${task.isCompleted ? "opacity-60" : ""}`}
    >
      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: (tag.color ?? "#E0E0E0") + "33", color: tag.color ?? "#666" }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className={`text-sm font-medium leading-snug mb-2 ${task.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>
        {task.title}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {task.priority && task.priority !== "none" && (
            <TaskPriorityBadge priority={task.priority} />
          )}

          {/* Due date */}
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {formatDate(task.dueDate)}
            </span>
          )}

          {/* Subtask count */}
          {task.subtaskCount > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 rounded px-1">
              {task.subtaskCount} sub
            </span>
          )}
        </div>

        {/* Assignee avatars */}
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1 flex-shrink-0">
            {task.assignees.slice(0, 2).map((a) =>
              a.avatarUrl ? (
                <img
                  key={a.userId}
                  src={a.avatarUrl}
                  alt={a.name}
                  className="w-5 h-5 rounded-full border border-white object-cover"
                  title={a.name}
                />
              ) : (
                <div
                  key={a.userId}
                  className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center flex-shrink-0"
                  title={a.name}
                >
                  <span className="text-xs font-medium text-indigo-700 leading-none">
                    {a.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )
            )}
            {task.assignees.length > 2 && (
              <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-500 leading-none">+{task.assignees.length - 2}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
