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

const formatDueDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart.getTime() === today.getTime()) {
    return { label: "Today", color: "text-green-600" };
  }
  if (dayStart < today) {
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      color: "text-red-500",
    };
  }
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    color: "text-gray-500",
  };
};

/**
 * InlineTaskRow — renders an editable row directly in the task list table.
 *
 * Props:
 *  statusId        – UUID of the status to create the task under
 *  projectId       – UUID of the project
 *  projectMembers  – array of { userId, name, email, avatarUrl }
 *  colCount        – total number of columns in the table (default 3)
 *  onCreated(task)    – called when the user finalizes (blur/Enter); parent adds task to list and closes row
 *  onBeforeCreate()   – called synchronously BEFORE the createTask API call; parent increments a buffer counter
 *  onSilentSave(id|null) – called after create resolves (id on success, null on error); parent flushes buffer
 *  onClose()          – called when the row should be dismissed with no task
 *  onOpenDetail(id)   – called when the user clicks the arrow to open task detail
 */
const InlineTaskRow = ({
  statusId,
  projectId,
  projectMembers = [],
  colCount = 3,
  onCreated,
  onBeforeCreate,
  onSilentSave,
  onClose,
  onOpenDetail,
}) => {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [showAssignee, setShowAssignee] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameInputRef = useRef(null);
  const rowRef = useRef(null);
  // Stable ref so async callbacks always read the latest task id
  const taskIdRef = useRef(null);
  // Stores the full task object returned by the backend after first save
  const taskRef = useRef(null);
  // Guard: prevents two concurrent create requests when user types fast
  const creatingRef = useRef(false);
  // Stores the in-flight create promise so finalize() can await it instead of
  // getting null and closing the row before the HTTP response arrives.
  const pendingCreateRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    return () => clearTimeout(debounceRef.current);
  }, []);

  // Returns the saved task (create or update), or null on guard/error.
  // Does NOT notify the parent — callers decide when to finalize.
  const createOrUpdateTitle = async (newTitle) => {
    if (!newTitle.trim()) return null;
    // If a create is already in-flight (e.g. debounce fired before Enter/blur),
    // return the pending promise so the caller waits for it rather than getting
    // null immediately (which would cause finalize() to call onClose() before
    // taskRef.current is set, making the task invisible after creation).
    if (creatingRef.current) return pendingCreateRef.current;
    setSaving(true);
    try {
      if (!taskIdRef.current) {
        // onBeforeCreate MUST be called synchronously before the await so the
        // parent's pendingCreateCount is > 0 before the event loop is freed.
        // The server emits task:created before sending the HTTP response, so the
        // socket event arrives while this await is still pending — the counter
        // ensures the socket handler buffers that event instead of adding the
        // task to the list prematurely.
        onBeforeCreate?.();
        creatingRef.current = true;
        let resolveCreate;
        pendingCreateRef.current = new Promise((resolve) => { resolveCreate = resolve; });
        try {
          const res = await taskService.createTask(projectId, {
            title: newTitle.trim(),
            statusId,
          });
          const newTask = res.data.data;
          taskIdRef.current = newTask.id;
          taskRef.current = newTask;
          creatingRef.current = false;
          onSilentSave?.(newTask.id); // decrement counter, flush buffer (task ID suppressed)
          resolveCreate(newTask);
          pendingCreateRef.current = null;
          return newTask;
        } catch {
          creatingRef.current = false;
          onSilentSave?.(null); // decrement counter, flush buffer without suppressing any task
          resolveCreate(null);
          pendingCreateRef.current = null;
          return null;
        }
      } else {
        await taskService.updateTask(taskIdRef.current, { title: newTitle.trim() });
        if (taskRef.current) taskRef.current = { ...taskRef.current, title: newTitle.trim() };
        return taskRef.current;
      }
    } catch {
      creatingRef.current = false;
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Called on Enter or blur-outside: flush debounce, save, tell parent, close.
  const finalize = () => {
    clearTimeout(debounceRef.current);
    if (!title.trim() && !taskIdRef.current) {
      onClose?.();
      return;
    }
    createOrUpdateTitle(title).then(() => {
      const saved = taskRef.current;
      if (saved) onCreated?.(saved); // parent adds to list and closes the row
      else onClose?.();
    });
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    clearTimeout(debounceRef.current);
    // Debounce saves silently — does NOT close the row or notify the parent.
    debounceRef.current = setTimeout(() => createOrUpdateTitle(val), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      clearTimeout(debounceRef.current);
      onClose?.();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      finalize();
    }
  };

  const handleBlur = (e) => {
    // If focus moves to another element inside this row (assignee button,
    // date picker, detail arrow) do nothing — the row is still active.
    if (rowRef.current?.contains(e.relatedTarget)) return;
    finalize();
  };

  const handleAssigneeSelect = async (member) => {
    setAssignee(member);
    setShowAssignee(false);
    const tid = taskIdRef.current;
    if (tid) {
      try {
        const res = await taskService.addAssignee(tid, member.userId);
        if (taskRef.current) {
          taskRef.current = { ...taskRef.current, assignees: res.data.data.assignees ?? [member] };
        }
      } catch {}
    }
  };

  const handleDateSelect = async (date) => {
    setDueDate(date);
    setShowDatePicker(false);
    const tid = taskIdRef.current;
    if (tid) {
      try {
        await taskService.updateTask(tid, {
          dueDate: date ? date.toISOString() : null,
        });
        if (taskRef.current) {
          taskRef.current = { ...taskRef.current, dueDate: date ? date.toISOString() : null };
        }
      } catch {}
    }
  };

  const handleOpenDetail = () => {
    const tid = taskIdRef.current;
    if (tid) onOpenDetail?.(tid);
  };

  const dateDisplay = formatDueDate(dueDate);

  return (
    <tr ref={rowRef} className="border-b border-gray-100 bg-indigo-50/20">
      {/* Name column */}
      <td className="py-2 pl-8 pr-2 overflow-hidden border-r border-gray-200">
        <div className="flex items-center gap-2 group">
          {/* Completion circle (visual only on new row) */}
          <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-gray-300" />

          <input
            ref={nameInputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Write a task name"
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 text-gray-800 min-w-0"
          />

          {saving && (
            <span className="text-xs text-gray-400 flex-shrink-0 italic">saving…</span>
          )}

          {/* Arrow to open full detail panel */}
          <button
            onClick={handleOpenDetail}
            title="Open task detail"
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </td>

      {/* Assignee column */}
      <td className="py-2 px-3 w-[160px] relative border-r border-gray-200">
        <button
          onClick={() => {
            setShowAssignee((v) => !v);
            setShowDatePicker(false);
          }}
          className="flex items-center"
          title="Assign member"
        >
          {assignee ? (
            assignee.avatarUrl ? (
              <img
                src={assignee.avatarUrl}
                alt={assignee.name}
                className="w-6 h-6 rounded-full object-cover"
                title={assignee.name}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: getAvatarColor(assignee.name ?? "") }}
                title={assignee.name}
              >
                {getInitials(assignee.name ?? "")}
              </div>
            )
          ) : (
            <svg
              className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
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

      {/* Due date column */}
      <td className="py-2 px-3 w-[110px] relative border-r border-gray-200">
        <button
          onClick={() => {
            setShowDatePicker((v) => !v);
            setShowAssignee(false);
          }}
          className="flex items-center"
          title="Set due date"
        >
          {dueDate ? (
            <span className={`text-xs font-medium ${dateDisplay?.color}`}>
              {dateDisplay?.label}
            </span>
          ) : (
            <svg
              className="w-4 h-4 text-gray-300 hover:text-gray-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
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

      {/* Extra cells for any custom field columns */}
      {colCount > 3 &&
        Array.from({ length: colCount - 3 }).map((_, i) => (
          <td key={i} className="py-2 px-2" />
        ))}
    </tr>
  );
};

export default InlineTaskRow;
