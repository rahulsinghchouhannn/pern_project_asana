import React, { useEffect, useRef, useState, useCallback } from "react";
import taskService from "@/services/taskService";
import customFieldService from "@/services/customFieldService";
import TaskPriorityBadge from "./TaskPriorityBadge";
import CustomFieldValue from "@/components/customFields/CustomFieldValue";

const PRIORITIES = ["none", "low", "medium", "high", "urgent"];

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

const formatHistoryDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Debounce hook
const useDebounce = (fn, delay) => {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
};

const TaskDetailModal = ({ taskId, projectId, statuses = [], projectMembers = [], onClose, onUpdated }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [addAssigneeId, setAddAssigneeId] = useState("");
  const [customFields, setCustomFields] = useState([]);
  // Map: fieldId → current value row (from task.customFieldValues)
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    taskService
      .getTaskById(taskId)
      .then((res) => {
        const t = res.data.data;
        setTask(t);
        // Index existing values by fieldId
        const map = {};
        (t.customFieldValues ?? []).forEach((v) => { map[v.customFieldId] = v; });
        setFieldValues(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  // Load project's custom fields
  useEffect(() => {
    const pid = projectId ?? task?.projectId;
    if (!pid) return;
    customFieldService
      .getProjectFields(pid)
      .then((res) => setCustomFields(res.data.data ?? []))
      .catch(console.error);
  }, [projectId, task?.projectId]);

  const handleCustomFieldChange = async (fieldId, valueData) => {
    try {
      const res = await customFieldService.setTaskFieldValue(taskId, fieldId, valueData);
      const updated = res.data.data;
      setFieldValues((prev) => ({ ...prev, [fieldId]: updated }));
    } catch (err) {
      console.error(err);
    }
  };

  const save = async (patch) => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await taskService.updateTask(task.id, patch);
      const updated = res.data.data;
      setTask(updated);
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = useDebounce(save, 600);

  const handleFieldChange = (field, value) => {
    setTask((t) => ({ ...t, [field]: value }));
    debouncedSave({ [field]: value });
  };

  const handleComplete = async () => {
    if (!task) return;
    try {
      const res = task.isCompleted
        ? await taskService.reopenTask(task.id)
        : await taskService.completeTask(task.id);
      const updated = res.data.data;
      setTask(updated);
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAssignee = async () => {
    if (!addAssigneeId) return;
    try {
      const res = await taskService.addAssignee(task.id, addAssigneeId);
      setTask(res.data.data);
      setAddAssigneeId("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveAssignee = async (userId) => {
    try {
      await taskService.removeAssignee(task.id, userId);
      setTask((t) => ({ ...t, assignees: t.assignees.filter((a) => a.userId !== userId) }));
    } catch (e) {
      console.error(e);
    }
  };

  const currentStatus = statuses.find((s) => s.id === task?.statusId);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {task && (
              <button
                onClick={handleComplete}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  task.isCompleted
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-gray-300 hover:border-indigo-500"
                }`}
                title={task.isCompleted ? "Reopen" : "Complete"}
              >
                {task.isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}
            <span className="text-xs text-gray-400">{saving ? "Saving…" : "Auto-saved"}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : !task ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Task not found</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Title */}
            <textarea
              value={task.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              rows={2}
              className="w-full text-lg font-semibold text-gray-900 resize-none border-0 focus:outline-none focus:ring-0 p-0 leading-snug"
              placeholder="Task name"
            />

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
              <textarea
                value={task.description ?? ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={3}
                placeholder="Add a description…"
                className="mt-1 w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Fields row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                <select
                  value={task.statusId}
                  onChange={(e) => handleFieldChange("statusId", e.target.value)}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</label>
                <select
                  value={task.priority ?? "none"}
                  onChange={(e) => handleFieldChange("priority", e.target.value)}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start date</label>
                <input
                  type="date"
                  value={formatDate(task.startDate)}
                  onChange={(e) =>
                    handleFieldChange("startDate", e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Due date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due date</label>
                <input
                  type="date"
                  value={formatDate(task.dueDate)}
                  onChange={(e) =>
                    handleFieldChange("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignees</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.assignees?.map((a) => (
                  <div
                    key={a.userId}
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-indigo-700">
                        {a.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-700">{a.name}</span>
                    <button
                      onClick={() => handleRemoveAssignee(a.userId)}
                      className="text-gray-400 hover:text-gray-600 ml-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {projectMembers.length > 0 && (
                <div className="mt-2 flex gap-2">
                  <select
                    value={addAssigneeId}
                    onChange={(e) => setAddAssigneeId(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Assign member…</option>
                    {projectMembers
                      .filter((m) => !task.assignees?.find((a) => a.userId === m.userId))
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddAssignee}
                    disabled={!addAssigneeId}
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custom fields</label>
                <div className="mt-2 space-y-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-xs text-gray-600 font-medium truncate">{field.name}</span>
                      <CustomFieldValue
                        field={field}
                        value={fieldValues[field.id]}
                        onChange={handleCustomFieldChange}
                        projectMembers={projectMembers}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: tag.color + "33", color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks?.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide"
                  onClick={() => setShowSubtasks((v) => !v)}
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showSubtasks ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Subtasks ({task.subtasks.length})
                </button>
                {showSubtasks && (
                  <ul className="mt-2 space-y-1">
                    {task.subtasks.map((sub) => (
                      <li key={sub.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                            sub.isCompleted ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                          }`}
                        />
                        <span className={sub.isCompleted ? "line-through text-gray-400" : ""}>
                          {sub.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Attachments */}
            {task.attachments?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Attachments ({task.attachments.length})
                </label>
                <ul className="mt-2 space-y-1">
                  {task.attachments.map((att) => (
                    <li key={att.id} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <a href={att.fileUrl} className="text-indigo-600 hover:underline truncate" target="_blank" rel="noreferrer">
                        {att.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Activity / History */}
            <div>
              <button
                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide"
                onClick={() => setShowHistory((v) => !v)}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${showHistory ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Activity
              </button>
              {showHistory && (
                <ul className="mt-2 space-y-2">
                  {(task.history ?? []).length === 0 && (
                    <li className="text-xs text-gray-400">No activity yet.</li>
                  )}
                  {(task.history ?? []).map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-gray-600 font-medium text-[10px]">
                          {entry.userName?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{entry.userName}</span>{" "}
                        <span className="text-gray-500">{entry.action.replace(/_/g, " ")}</span>
                        {entry.toValue && (
                          <span className="text-gray-500"> → {entry.toValue}</span>
                        )}
                        <div className="text-gray-400 mt-0.5">{formatHistoryDate(entry.createdAt)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
