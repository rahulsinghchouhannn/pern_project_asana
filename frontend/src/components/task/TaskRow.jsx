import { useState, useRef, useEffect } from "react";
import taskService from "@/services/taskService";
import customFieldService from "@/services/customFieldService";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractDisplayValue = (fieldType, valueObj) => {
  if (!valueObj) return null;
  switch (fieldType) {
    case "text":     return valueObj.valueText ?? null;
    case "number":   return valueObj.valueNumber != null ? Number(valueObj.valueNumber) : null;
    case "date":     return valueObj.valueDate ?? null;
    case "dropdown": return valueObj.valueOption ?? null;
    default:         return null;
  }
};

// ─── CustomFieldCell ──────────────────────────────────────────────────────────
//
// Inline-editable cell for a single custom field value.
// - Text/number: click to edit, blur saves (500ms debounce while typing)
// - Dropdown: click opens a popover, selection saves immediately
// - Date: click opens DueDatePicker, selection saves immediately
// - Saves silently in background; reverts to last saved value on failure
//
const CustomFieldCell = ({ field, initialValue, taskId }) => {
  const [localValue, setLocalValue] = useState(() => extractDisplayValue(field.type, initialValue));
  const [editing, setEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const debounceRef = useRef(null);
  // Tracks the last value known to be successfully persisted — used to revert on error
  const lastSavedRef = useRef(extractDisplayValue(field.type, initialValue));
  // Tracks whether the cell is in any active edit state — prevents an incoming
  // prop sync from overwriting text the user is currently typing
  const activeEditRef = useRef(false);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Sync from parent when initialValue reference changes (e.g. fieldValuesMap
  // populates after the initial render, or after a customFieldsVersion refetch).
  // Skipped while the user is actively editing so we don't clobber their input.
  useEffect(() => {
    if (activeEditRef.current) return;
    const newVal = extractDisplayValue(field.type, initialValue);
    setLocalValue(newVal);
    lastSavedRef.current = newVal;
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = async (value) => {
    const prev = lastSavedRef.current;
    try {
      const body = {};
      switch (field.type) {
        case "text":     body.valueText    = value;  break;
        case "number":   body.valueNumber  = value;  break;
        case "date":     body.valueDate    = value;  break;
        case "dropdown": body.valueOption  = value;  break;
      }
      await customFieldService.setTaskFieldValue(taskId, field.id, body);
      lastSavedRef.current = value;
    } catch {
      setLocalValue(prev); // revert on failure
    }
  };

  // ── Text / Number ─────────────────────────────────────────────────────────────
  if (field.type === "text" || field.type === "number") {
    const isEmpty = localValue == null || localValue === "";
    if (editing) {
      return (
        <input
          autoFocus
          type={field.type === "number" ? "number" : "text"}
          value={localValue ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const v = field.type === "number"
              ? (raw === "" ? null : Number(raw))
              : (raw || null);
            setLocalValue(v);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => doSave(v), 500);
          }}
          onBlur={() => {
            clearTimeout(debounceRef.current);
            doSave(localValue);
            activeEditRef.current = false;
            setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-xs bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none"
        />
      );
    }
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          activeEditRef.current = true;
          setEditing(true);
        }}
        className={`w-full text-left text-xs px-1 py-0.5 rounded min-h-[22px] block transition-colors hover:bg-gray-100
          ${isEmpty ? "text-gray-200" : "text-gray-700"}`}
        title="Click to edit"
      >
        {isEmpty ? "—" : String(localValue)}
      </button>
    );
  }

  // ── Dropdown ──────────────────────────────────────────────────────────────────
  if (field.type === "dropdown") {
    const options = field.options ?? [];
    const opt = options.find((o) => o.value === localValue);
    return (
      <div className="relative w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            activeEditRef.current = true;
            setShowDropdown((v) => !v);
          }}
          className={`w-full text-left min-h-[22px] px-1 rounded transition-colors hover:bg-gray-100
            ${!localValue ? "text-gray-200" : ""}`}
        >
          {localValue ? (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: opt?.color ? opt.color + "22" : "#e5e7eb",
                color: opt?.color ?? "#6b7280",
              }}
            >
              {localValue}
            </span>
          ) : (
            <span className="text-xs">—</span>
          )}
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => { activeEditRef.current = false; setShowDropdown(false); }}
            />
            <div className="absolute z-20 left-0 top-full mt-0.5 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1">
              <button
                onClick={() => {
                  setLocalValue(null);
                  activeEditRef.current = false;
                  setShowDropdown(false);
                  doSave(null);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
              >
                — Clear
              </button>
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setLocalValue(o.value);
                    activeEditRef.current = false;
                    setShowDropdown(false);
                    doSave(o.value);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  {o.color && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: o.color }}
                    />
                  )}
                  {o.value}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Date ──────────────────────────────────────────────────────────────────────
  if (field.type === "date") {
    const dateStr = localValue
      ? new Date(localValue).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
    return (
      <div className="relative w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            activeEditRef.current = true;
            setShowDate((v) => !v);
          }}
          className={`w-full text-left text-xs min-h-[22px] px-1 rounded transition-colors hover:bg-gray-100
            ${dateStr ? "text-gray-700" : "text-gray-200"}`}
        >
          {dateStr ?? "—"}
        </button>
        {showDate && (
          <DueDatePicker
            value={localValue}
            onChange={(date) => {
              const iso = date ? date.toISOString() : null;
              setLocalValue(iso);
              activeEditRef.current = false;
              setShowDate(false);
              doSave(iso);
            }}
            onClose={() => { activeEditRef.current = false; setShowDate(false); }}
          />
        )}
      </div>
    );
  }

  return <span className="text-xs text-gray-300">—</span>;
};

// ─── TaskRow ──────────────────────────────────────────────────────────────────

const TaskRow = ({
  task,
  projectId,
  projectMembers = [],
  customFields = [],
  visibleFieldIds = [],
  fieldValues = [],
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
  // Tracks whether the title input is currently focused — prevents socket updates
  // from overwriting text the user is actively typing
  const isEditingTitleRef = useRef(false);

  // Sync title/assignees/date/completion from socket updates (task:updated events).
  // Title sync is skipped while the user is actively typing in the title input.
  useEffect(() => {
    if (!isEditingTitleRef.current) {
      setTitle(task.title ?? "");
    }
    setAssignees(task.assignees ?? []);
    setDueDate(task.dueDate ?? null);
    setIsCompleted(task.isCompleted ?? false);
  }, [task.updatedAt, task.isCompleted]);

  // Reset title (and editing flag) when the row switches to a different task
  useEffect(() => {
    isEditingTitleRef.current = false;
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
      setIsCompleted(!next);
    }
  };

  const handleAssigneeSelect = async (member) => {
    setAssignees([member]);
    setShowAssignee(false);
    try {
      // Remove all existing assignees first so this is a replace, not an add.
      // The taskAssignees table has a unique constraint on (taskId, userId), so
      // re-adding an already-assigned member would throw and silently fail.
      const existing = assignees.filter((a) => a.userId !== member.userId);
      for (const a of existing) {
        await taskService.removeAssignee(task.id, a.userId);
      }
      const res = await taskService.addAssignee(task.id, member.userId);
      onUpdated?.(res.data.data);
    } catch {
      // Revert optimistic update on failure
      setAssignees(task.assignees ?? []);
    }
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
      <td className="py-0 pl-8 pr-2 w-125 overflow-hidden border-r border-gray-200">
        <div className="flex items-center gap-2 h-10 min-w-0 overflow-hidden">
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

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onFocus={() => { isEditingTitleRef.current = true; }}
            onBlur={() => { isEditingTitleRef.current = false; }}
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
      <td className="py-0 px-3 w-[160px] relative border-r border-gray-200">
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
      <td className="py-0 px-3 w-[110px] relative border-r border-gray-200">
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
        if (!field) return <td key={fieldId} className="py-0 px-3 w-28 border-r border-gray-200" />;
        const value = fieldValues.find((v) => v.customFieldId === fieldId);
        return (
          <td key={fieldId} className="py-0 px-2 w-28 border-r border-gray-200">
            <CustomFieldCell
              field={field}
              initialValue={value}
              taskId={task.id}
            />
          </td>
        );
      })}

      {/* spacer */}
      <td />
    </tr>
  );
};

export default TaskRow;
