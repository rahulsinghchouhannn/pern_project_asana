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

      {/* Custom field values (first 2 with a value) */}
      {(() => {
        const values = (task.customFieldValues ?? []).filter((v) =>
          v.valueText != null || v.valueNumber != null || v.valueDate != null ||
          v.valueUserId != null || v.valueOption != null
        ).slice(0, 2);
        if (values.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1 mb-2">
            {values.map((v) => {
              if (v.valueOption) {
                const options = v.fieldOptions ?? [];
                const opt = options.find((o) => o.value === v.valueOption);
                return (
                  <span
                    key={v.customFieldId}
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: opt?.color ? opt.color + "22" : "#e5e7eb",
                      color: opt?.color ?? "#6b7280",
                    }}
                  >
                    {v.fieldName}: {v.valueOption}
                  </span>
                );
              }
              if (v.valueNumber != null) {
                return (
                  <span key={v.customFieldId} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {v.fieldName}: {v.valueNumber}
                  </span>
                );
              }
              if (v.valueDate) {
                return (
                  <span key={v.customFieldId} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {v.fieldName}: {new Date(v.valueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                );
              }
              if (v.valueText) {
                return (
                  <span key={v.customFieldId} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 truncate max-w-28">
                    {v.fieldName}: {v.valueText}
                  </span>
                );
              }
              return null;
            })}
          </div>
        );
      })()}

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
