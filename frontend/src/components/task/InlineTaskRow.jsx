import React, { useState, useRef, useEffect } from "react";
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
 *  onCreated(task) – called once when the task is first created
 *  onClose()       – called when the row should be dismissed
 *  onOpenDetail(id)– called when the user clicks the arrow to open task detail
 */
const InlineTaskRow = ({
  statusId,
  projectId,
  projectMembers = [],
  colCount = 3,
  onCreated,
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
  // Stable ref so async callbacks always read the latest task id
  const taskIdRef = useRef(null);
  // Guard: prevents two concurrent create requests when user types fast
  const creatingRef = useRef(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    return () => clearTimeout(debounceRef.current);
  }, []);

  const createOrUpdateTitle = async (newTitle) => {
    if (!newTitle.trim()) return;
    if (creatingRef.current) return; // prevent concurrent creates
    setSaving(true);
    try {
      if (!taskIdRef.current) {
        creatingRef.current = true;
        const res = await taskService.createTask(projectId, {
          title: newTitle.trim(),
          statusId,
        });
        const newTask = res.data.data;
        taskIdRef.current = newTask.id;
        creatingRef.current = false;
        onCreated?.(newTask);
      } else {
        await taskService.updateTask(taskIdRef.current, { title: newTitle.trim() });
      }
    } catch {
      creatingRef.current = false; // allow retry on error
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => createOrUpdateTitle(val), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      clearTimeout(debounceRef.current);
      onClose?.();
    }
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current);
      createOrUpdateTitle(title);
    }
  };

  const handleAssigneeSelect = async (member) => {
    setAssignee(member);
    setShowAssignee(false);
    const tid = taskIdRef.current;
    if (tid) {
      try {
        await taskService.addAssignee(tid, member.userId);
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
      } catch {}
    }
  };

  const handleOpenDetail = () => {
    const tid = taskIdRef.current;
    if (tid) onOpenDetail?.(tid);
  };

  const dateDisplay = formatDueDate(dueDate);

  return (
    <tr className="border-b border-gray-100 bg-indigo-50/20">
      {/* Name column */}
      <td className="py-2 pl-4 pr-2">
        <div className="flex items-center gap-2 group">
          {/* Completion circle (visual only on new row) */}
          <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-gray-300" />

          <input
            ref={nameInputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
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
      <td className="py-2 px-2 w-20 relative">
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
      <td className="py-2 px-2 w-28 relative">
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
