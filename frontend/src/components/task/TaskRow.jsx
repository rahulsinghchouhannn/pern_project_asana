import { useState, useRef, useEffect } from "react";
import taskService from "@/services/taskService";
import AssigneeDropdown from "./AssigneeDropdown";
import DueDatePicker from "./DueDatePicker";

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F97316", "#22C55E", "#3B82F6"];
const getAvatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const getDueDateDisplay = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);
  const diffMs = dayStart.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return { label: "Today", color: "text-green-600 font-medium" };
  if (diffDays === -1) return { label: "Yesterday", color: "text-red-500 font-medium" };

  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label, color: diffDays < 0 ? "text-red-500" : "text-gray-500" };
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
      const opt = (field.options ?? []).find((o) => o.value === value.valueOption);
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

/**
 * TaskRow — inline-editable row for an existing task.
 * All field changes auto-save with 500ms debounce (title) or immediately (assignee, due date).
 * The right-arrow button opens the full TaskDetailModal.
 */
const TaskRow = ({
  task,
  projectId,
  projectMembers = [],
  customFields = [],
  visibleFieldIds = [],
  onUpdated,
  onOpenDetail,
}) => {
  const [title, setTitle] = useState(task.title ?? "");
  const [assignees, setAssignees] = useState(task.assignees ?? []);
  const [dueDate, setDueDate] = useState(task.dueDate ?? null);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted ?? false);
  const [showAssignee, setShowAssignee] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const debounceRef = useRef(null);

  // Sync assignee/date/completion from socket updates (not title — don't overwrite typing)
  useEffect(() => {
    setAssignees(task.assignees ?? []);
    setDueDate(task.dueDate ?? null);
    setIsCompleted(task.isCompleted ?? false);
  }, [task.updatedAt, task.isCompleted]);

  // Reset title only when the row is mounted for a different task
  useEffect(() => {
    setTitle(task.title ?? "");
  }, [task.id]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!val.trim()) return;
      try {
        const res = await taskService.updateTask(task.id, { title: val.trim() });
        onUpdated?.(res.data.data);
      } catch {}
    }, 500);
  };

  const handleToggleComplete = async (e) => {
    e.stopPropagation();
    const next = !isCompleted;
    setIsCompleted(next);
    try {
      const res = next
        ? await taskService.completeTask(task.id)
        : await taskService.reopenTask(task.id);
      onUpdated?.(res.data.data);
    } catch {
      setIsCompleted(!next); // revert on failure
    }
  };

  const handleAssigneeSelect = async (member) => {
    setAssignees([member]);
    setShowAssignee(false);
    try {
      const res = await taskService.addAssignee(task.id, member.userId);
      onUpdated?.(res.data.data);
    } catch {}
  };

  const handleDateSelect = async (date) => {
    setDueDate(date ? date.toISOString() : null);
    setShowDatePicker(false);
    try {
      const res = await taskService.updateTask(task.id, {
        dueDate: date ? date.toISOString() : null,
      });
      onUpdated?.(res.data.data);
    } catch {}
  };

  const primaryAssignee = assignees[0] ?? null;
  const firstName = primaryAssignee?.name?.split(" ")[0] ?? null;
  const dateDisplay = getDueDateDisplay(dueDate);

  return (
    <tr className="group border-b border-gray-100 hover:bg-gray-50/70 h-10">
      {/* ── Name ─────────────────────────────────────────── */}
      <td className="py-0 pl-4 pr-2">
        <div className="flex items-center gap-2 h-10 min-w-0">
          {/* Completion circle */}
          <button
            onClick={handleToggleComplete}
            className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
              isCompleted
                ? "bg-indigo-500 border-indigo-500"
                : "border-gray-300 hover:border-indigo-400"
            }`}
            title={isCompleted ? "Reopen" : "Complete"}
          />

          {/* Editable title — no border at rest, focus ring when active */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onClick={(e) => e.stopPropagation()}
            className={`flex-1 text-sm bg-transparent outline-none min-w-0 rounded px-1 py-0.5
              focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-shadow
              ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
          />

          {task.subtaskCount > 0 && (
            <span className="shrink-0 text-xs text-gray-400 bg-gray-100 rounded px-1">
              {task.subtaskCount}
            </span>
          )}

          {/* Arrow to open full detail panel — visible on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail?.(task.id); }}
            title="Open detail"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </td>

      {/* ── Assignee ─────────────────────────────────────── */}
      <td className="py-0 px-3 w-[120px] relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowAssignee((v) => !v); setShowDatePicker(false); }}
          className="flex items-center gap-1.5 max-w-full"
          title={primaryAssignee ? primaryAssignee.name : "Assign member"}
        >
          {primaryAssignee ? (
            <>
              {primaryAssignee.avatarUrl ? (
                <img
                  src={primaryAssignee.avatarUrl}
                  alt={primaryAssignee.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: getAvatarColor(primaryAssignee.name ?? "") }}
                >
                  {getInitials(primaryAssignee.name ?? "")}
                </div>
              )}
              <span className="text-xs text-gray-600 truncate max-w-[72px]">{firstName}</span>
            </>
          ) : (
            <svg className="w-5 h-5 text-gray-200 hover:text-gray-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          )}
        </button>

        {showAssignee && (
          <AssigneeDropdown
            projectId={projectId}
            members={projectMembers}
            onSelect={handleAssigneeSelect}
            onClose={() => setShowAssignee(false)}
          />
        )}
      </td>

      {/* ── Due date ─────────────────────────────────────── */}
      <td className="py-0 px-3 w-[100px] relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowDatePicker((v) => !v); setShowAssignee(false); }}
          className="flex items-center"
          title="Set due date"
        >
          {dueDate ? (
            <span className={`text-xs ${dateDisplay?.color}`}>{dateDisplay?.label}</span>
          ) : (
            <svg className="w-4 h-4 text-gray-200 hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {showDatePicker && (
          <DueDatePicker
            value={dueDate}
            onChange={handleDateSelect}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </td>

      {/* ── Custom field cells ────────────────────────────── */}
      {visibleFieldIds.map((fieldId) => {
        const field = customFields.find((f) => f.id === fieldId);
        if (!field) return <td key={fieldId} className="py-0 px-3 w-28" />;
        const value = (task.customFieldValues ?? []).find((v) => v.customFieldId === fieldId);
        return (
          <td key={fieldId} className="py-0 px-3 w-28 text-xs text-gray-600">
            {renderFieldValue(field, value)}
          </td>
        );
      })}
    </tr>
  );
};

export default TaskRow;
