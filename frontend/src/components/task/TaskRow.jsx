const getDueDateDisplay = (task) => {
  if (!task.dueDate && !task.startDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatShort = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let label;
  if (task.startDate && task.dueDate) {
    label = `${formatShort(task.startDate)} – ${formatShort(task.dueDate)}`;
  } else {
    label = formatShort(task.dueDate || task.startDate);
  }

  const due = task.dueDate ? new Date(task.dueDate) : null;
  if (due) {
    due.setHours(0, 0, 0, 0);
    if (due.getTime() === today.getTime()) return { label: "Today", color: "text-green-600 font-medium" };
    if (!task.isCompleted && due < today) return { label, color: "text-red-500 font-medium" };
  }
  return { label, color: "text-gray-500" };
};

const renderFieldValue = (field, value) => {
  if (!value) return <span className="text-gray-300">—</span>;
  switch (field.type) {
    case "text":
      return <span className="truncate max-w-[100px] block">{value.valueText ?? "—"}</span>;
    case "number":
      return <span>{value.valueNumber ?? "—"}</span>;
    case "date":
      return (
        <span>
          {value.valueDate
            ? new Date(value.valueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—"}
        </span>
      );
    case "dropdown": {
      if (!value.valueOption) return <span className="text-gray-300">—</span>;
      const options = field.options ?? [];
      const opt = options.find((o) => o.value === value.valueOption);
      return (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: opt?.color ? opt.color + "22" : "#e5e7eb",
            color: opt?.color ?? "#6b7280",
          }}
        >
          {value.valueOption}
        </span>
      );
    }
    default:
      return <span className="text-gray-300">—</span>;
  }
};

const TaskRow = ({ task, customFields = [], visibleFieldIds = [], onClick }) => {
  const hasAssignees = task.assignees?.length > 0;
  const dateDisplay = getDueDateDisplay(task);

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
            onClick={(e) => e.stopPropagation()}
            title={task.isCompleted ? "Reopen task" : "Complete task"}
          />
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
          {/* Arrow on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.(task); }}
            className="flex-shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
              {task.assignees.length > 2 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{task.assignees.length - 2}</span>
                </div>
              )}
            </div>
          ) : (
            <svg className="w-5 h-5 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          )}
        </div>
      </td>

      {/* Due date */}
      <td className="py-2 px-2 w-28">
        {dateDisplay && (
          <span className={`text-xs ${dateDisplay.color}`}>{dateDisplay.label}</span>
        )}
      </td>

      {/* Custom field columns */}
      {visibleFieldIds.map((fieldId) => {
        const field = customFields.find((f) => f.id === fieldId);
        if (!field) return <td key={fieldId} className="py-2 px-2 w-28" />;
        const value = (task.customFieldValues ?? []).find((v) => v.customFieldId === fieldId);
        return (
          <td key={fieldId} className="py-2 px-2 w-28 text-xs text-gray-600">
            {renderFieldValue(field, value)}
          </td>
        );
      })}
    </tr>
  );
};

export default TaskRow;
