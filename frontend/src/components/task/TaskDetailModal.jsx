import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import taskService from "@/services/taskService";
import customFieldService from "@/services/customFieldService";
import timeEntryService from "@/services/timeEntryService";
import { parseTimeInput, formatMinutes, describeMinutes } from "@/utils/timeFormat";
import { getRunningTimer, setRunningTimer, subscribeTimer, getElapsedMinutes } from "@/utils/timerStore";
import ActivityFeed from "@/components/collaboration/ActivityFeed";
import usePermissions from "@/hooks/usePermissions";

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
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

const AUTOSAVE_DELAY_MS = 500;

const toEditableFormat = (minutes) => {
  if (minutes == null || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return String(m);
  return `${h}:${String(m).padStart(2, "0")}`;
};

const EstimatedTimeField = ({ fieldId, value, editable, onSave }) => {
  const [localMinutes, setLocalMinutes] = useState(
    () => value?.valueNumber != null ? Number(value.valueNumber) : null
  );
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const lastSavedRef = useRef(localMinutes);
  const activeEditRef = useRef(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (activeEditRef.current) return;
    const v = value?.valueNumber != null ? Number(value.valueNumber) : null;
    setLocalMinutes(v);
    lastSavedRef.current = v;
  }, [value]);

  const commitEdit = () => {
    activeEditRef.current = false;
    setEditing(false);
    setSuggestion(null);
    if (!isDirtyRef.current) return;
    isDirtyRef.current = false;
    const parsed = parseTimeInput(inputVal);
    const minutes = parsed != null && parsed > 0 ? parsed : null;
    setLocalMinutes(minutes);
    onSave(fieldId, { valueNumber: minutes }, { immediate: false });
  };

  if (editing) {
    return (
      <div className="relative w-full">
        <input
          autoFocus
          type="text"
          value={inputVal}
          onChange={(e) => {
            const raw = e.target.value;
            isDirtyRef.current = true;
            setInputVal(raw);
            const parsed = parseTimeInput(raw);
            setSuggestion(parsed != null ? describeMinutes(parsed) : null);
          }}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
            if (e.key === "Escape") {
              isDirtyRef.current = false;
              activeEditRef.current = false;
              setEditing(false);
              setSuggestion(null);
            }
          }}
          placeholder="e.g. 1:30"
          disabled={!editable}
          className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {suggestion && (
          <div className="absolute top-full left-0 mt-0.5 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5 text-xs text-gray-700 whitespace-nowrap">
            {suggestion}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (!editable) return;
        activeEditRef.current = true;
        isDirtyRef.current = false;
        setInputVal(toEditableFormat(localMinutes));
        setSuggestion(localMinutes ? describeMinutes(localMinutes) : null);
        setEditing(true);
      }}
      className="w-full text-left text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-indigo-300"
    >
      {formatMinutes(localMinutes) ?? "—"}
    </button>
  );
};

const ActualTimeField = ({ taskId, field, editable, onTotalChange }) => {
  const { user } = useAppSelector((s) => s.auth);
  const userId = user?.id;
  const [savedTotal, setSavedTotal] = useState(
    () => field?.value?.valueNumber != null ? Number(field.value.valueNumber) : 0
  );
  const [showPanel, setShowPanel] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [addTimeInput, setAddTimeInput] = useState("");
  const [addTimeSuggestion, setAddTimeSuggestion] = useState(null);
  const [entries, setEntries] = useState([]);
  const [savingTime, setSavingTime] = useState(false);
  const [timerData, setTimerData] = useState(() => userId ? getRunningTimer(userId) : null);
  const [, setTick] = useState(0);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const panelPosRef = useRef({ top: 0, left: 0 });

  useEffect(() => {
    setSavedTotal(field?.value?.valueNumber != null ? Number(field.value.valueNumber) : 0);
  }, [field?.value]);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeTimer(() => {
      setTimerData(getRunningTimer(userId));
    });
    return unsub;
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setShowPanel(false);
        setShowAddTime(false);
        setAddTimeInput("");
        setAddTimeSuggestion(null);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [showPanel]);

  const isRunning = timerData?.taskId === taskId && timerData?.customFieldId === field.id;
  const elapsedMinutes = isRunning ? getElapsedMinutes(timerData.startedAt) : 0;
  const cellDisplay = isRunning ? (formatMinutes(elapsedMinutes) ?? "0m") : formatMinutes(savedTotal);

  const openPanel = (e) => {
    if (!editable) return;
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelW = 300;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8));
      panelPosRef.current = { top: rect.bottom + 4, left };
    }
    timeEntryService.getTaskTimeEntries(taskId, field.id)
      .then((res) => setEntries(res.data.data ?? []))
      .catch(() => {});
    setShowPanel(true);
    setShowAddTime(false);
    setAddTimeInput("");
    setAddTimeSuggestion(null);
  };

  const handleAddTime = async () => {
    const minutes = parseTimeInput(addTimeInput);
    if (!minutes || minutes <= 0) return;
    setSavingTime(true);
    try {
      const res = await timeEntryService.addTimeEntry(taskId, field.id, {
        durationMinutes: minutes,
        source: "manual",
      });
      setEntries((prev) => [res.data.data, ...prev]);
      setSavedTotal((prev) => {
        const next = prev + minutes;
        onTotalChange?.(next);
        return next;
      });
      setAddTimeInput("");
      setAddTimeSuggestion(null);
      setShowAddTime(false);
    } catch {
    } finally {
      setSavingTime(false);
    }
  };

  const handleStartTimer = async () => {
    if (!userId) return;
    const existing = getRunningTimer(userId);
    if (existing && !(existing.taskId === taskId && existing.customFieldId === field.id)) {
      const elapsed = getElapsedMinutes(existing.startedAt);
      if (elapsed > 0) {
        try {
          await timeEntryService.addTimeEntry(existing.taskId, existing.customFieldId, {
            durationMinutes: elapsed,
            source: "timer",
          });
        } catch {}
      }
    }
    setRunningTimer(userId, {
      taskId,
      customFieldId: field.id,
      startedAt: new Date().toISOString(),
    });
  };

  const handleStopTimer = async () => {
    if (!userId || !timerData) return;
    const elapsed = getElapsedMinutes(timerData.startedAt);
    setRunningTimer(userId, null);
    if (elapsed > 0) {
      try {
        const res = await timeEntryService.addTimeEntry(taskId, field.id, {
          durationMinutes: elapsed,
          source: "timer",
        });
        setEntries((prev) => [res.data.data, ...prev]);
        setSavedTotal((prev) => {
          const next = prev + elapsed;
          onTotalChange?.(next);
          return next;
        });
      } catch {}
    }
  };

  const totalMinutesInPanel = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const totalDisplay = formatMinutes(totalMinutesInPanel) ?? "0m";

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        onClick={openPanel}
        disabled={!editable}
        className="w-full text-left text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-indigo-300 disabled:bg-gray-50 disabled:cursor-default"
      >
        {savedTotal > 0 || isRunning ? cellDisplay : "—"}
      </button>

      {showPanel && (
        <div
          ref={panelRef}
          className="fixed z-9999 bg-white border border-gray-200 rounded-xl shadow-xl"
          style={{ top: panelPosRef.current.top, left: panelPosRef.current.left, width: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {showAddTime && (
            <div className="p-3 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={addTimeInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setAddTimeInput(raw);
                  const parsed = parseTimeInput(raw);
                  setAddTimeSuggestion(parsed != null ? describeMinutes(parsed) : null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddTime(); }
                  if (e.key === "Escape") {
                    setShowAddTime(false);
                    setAddTimeInput("");
                    setAddTimeSuggestion(null);
                  }
                }}
                placeholder="e.g. 1:30"
                className="w-full text-sm border border-indigo-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {addTimeSuggestion && <div className="mt-1 px-1 text-xs text-gray-500 truncate">{addTimeSuggestion}</div>}
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowAddTime(false);
                    setAddTimeInput("");
                    setAddTimeSuggestion(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTime}
                  disabled={savingTime || !parseTimeInput(addTimeInput)}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
                >
                  {savingTime ? "Saving…" : "Add time"}
                </button>
              </div>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {entries.length === 0 && !showAddTime && (
              <p className="text-xs text-gray-400 text-center py-4">No time logged yet</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-800">{formatMinutes(entry.durationMinutes) ?? "0m"}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              {totalDisplay} <span className="text-xs font-normal text-gray-400">TOTAL</span>
            </span>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button onClick={handleStopTimer} className="text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50">
                  Stop timer
                </button>
              ) : (
                <button onClick={handleStartTimer} className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50">
                  Start timer
                </button>
              )}
              {!showAddTime && (
                <button onClick={() => setShowAddTime(true)} className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50">
                  Add time
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskDetailModal = ({ taskId, projectId, statuses = [], projectMembers = [], onClose, onUpdated }) => {
  const { user } = useAppSelector((s) => s.auth);
  const { can, denyToast } = usePermissions(projectId);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [customFields, setCustomFields] = useState([]);
  // Map: fieldId → current value row (from task.customFieldValues)
  const [fieldValues, setFieldValues] = useState({});
  const assigneeReqIdRef = useRef(0);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    taskService
      .getTaskById(taskId)
      .then((res) => {
        const t = res.data.data;
        setTask(t);
        setSelectedAssigneeId(t.assignees?.[0]?.userId ?? "");
        // Index existing values by fieldId
        const map = {};
        (t.customFieldValues ?? []).forEach((v) => { map[v.customFieldId] = v; });
        setFieldValues(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    setSelectedAssigneeId(task?.assignees?.[0]?.userId ?? "");
  }, [task?.id, task?.assignees]);

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
    if (!can("edit_task")) { denyToast(); return; }
    setSaving(true);
    try {
      const res = await customFieldService.setTaskFieldValue(taskId, fieldId, valueData);
      const updated = res.data.data;
      setFieldValues((prev) => ({ ...prev, [fieldId]: updated }));
      setTask((prev) => {
        if (!prev) return prev;
        const nextTask = {
          ...prev,
          customFieldValues: [
            ...(prev.customFieldValues ?? []).filter((v) => v.customFieldId !== fieldId),
            updated,
          ],
        };
        onUpdated?.(nextTask);
        return nextTask;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const debouncedCustomFieldChange = useDebounce(handleCustomFieldChange, AUTOSAVE_DELAY_MS);

  const save = async (patch) => {
    if (!task) return;
    if (!can("edit_task")) {
      denyToast();
      return;
    }
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

  const debouncedSave = useDebounce(save, AUTOSAVE_DELAY_MS);

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

  const applySingleAssignee = async (nextUserId) => {
    if (!can("assign_task")) { denyToast(); return; }
    if (!task) return;
    const reqId = ++assigneeReqIdRef.current;
    setSaving(true);
    try {
      const existingIds = (task.assignees ?? []).map((a) => a.userId);
      for (const uid of existingIds) {
        if (uid !== nextUserId) await taskService.removeAssignee(task.id, uid);
      }
      if (nextUserId && !existingIds.includes(nextUserId)) {
        await taskService.addAssignee(task.id, nextUserId);
      }
      const refreshed = await taskService.getTaskById(task.id);
      if (reqId !== assigneeReqIdRef.current) return;
      const updated = refreshed.data.data;
      setTask(updated);
      setSelectedAssigneeId(updated.assignees?.[0]?.userId ?? "");
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      if (reqId === assigneeReqIdRef.current) setSaving(false);
    }
  };

  const debouncedSingleAssigneeSave = useDebounce(applySingleAssignee, AUTOSAVE_DELAY_MS);

  const handleAssigneeSelect = (userId) => {
    setSelectedAssigneeId(userId);
    const member = projectMembers.find((m) => m.userId === userId);
    setTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignees: member ? [{ userId: member.userId, name: member.name, avatarUrl: member.avatarUrl }] : [],
      };
    });
    debouncedSingleAssigneeSave(userId || null);
  };

  const renderCustomFieldInput = (field) => {
    const value = fieldValues[field.id];

    if (field.type === "estimated_time") {
      return (
        <EstimatedTimeField
          fieldId={field.id}
          value={value}
          editable={can("edit_task")}
          onSave={debouncedCustomFieldChange}
        />
      );
    }

    if (field.type === "actual_time") {
      return (
        <ActualTimeField
          taskId={task.id}
          field={{ ...field, value }}
          editable={can("edit_task")}
          onTotalChange={(nextTotal) => {
            const updatedValue = { ...(value ?? {}), customFieldId: field.id, valueNumber: nextTotal };
            setFieldValues((prev) => ({ ...prev, [field.id]: updatedValue }));
            setTask((prev) => {
              if (!prev) return prev;
              const nextTask = {
                ...prev,
                customFieldValues: [
                  ...(prev.customFieldValues ?? []).filter((v) => v.customFieldId !== field.id),
                  updatedValue,
                ],
              };
              onUpdated?.(nextTask);
              return nextTask;
            });
          }}
        />
      );
    }

    const options = field.options ?? field.fieldOptions ?? [];
    const baseInputClass =
      "w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50 disabled:cursor-default";

    if (field.type === "dropdown") {
      return (
        <select
          value={value?.valueOption ?? ""}
          disabled={!can("edit_task")}
          className={baseInputClass}
          onChange={(e) => debouncedCustomFieldChange(field.id, { valueOption: e.target.value || null })}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "text") {
      return (
        <input
          type="text"
          defaultValue={value?.valueText ?? ""}
          disabled={!can("edit_task")}
          className={baseInputClass}
          onChange={(e) => debouncedCustomFieldChange(field.id, { valueText: e.target.value || null })}
        />
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          defaultValue={value?.valueNumber ?? ""}
          disabled={!can("edit_task")}
          className={baseInputClass}
          onChange={(e) =>
            debouncedCustomFieldChange(field.id, {
              valueNumber: e.target.value !== "" ? Number(e.target.value) : null,
            })
          }
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          defaultValue={formatDate(value?.valueDate)}
          disabled={!can("edit_task")}
          className={baseInputClass}
          onChange={(e) =>
            debouncedCustomFieldChange(field.id, {
              valueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />
      );
    }

    if (field.type === "user") {
      return (
        <select
          value={value?.valueUserId ?? ""}
          disabled={!can("edit_task")}
          className={baseInputClass}
          onChange={(e) => debouncedCustomFieldChange(field.id, { valueUserId: e.target.value || null })}
        >
          <option value="">—</option>
          {projectMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      );
    }

    return <span className="text-sm text-gray-400">—</span>;
  };

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
              onChange={(e) => can("edit_task") && handleFieldChange("title", e.target.value)}
              onClick={() => !can("edit_task") && denyToast()}
              readOnly={!can("edit_task")}
              rows={2}
              className={`w-full text-lg font-semibold text-gray-900 resize-none border-0 focus:outline-none focus:ring-0 p-0 leading-snug ${!can("edit_task") ? "cursor-default select-text" : ""}`}
              placeholder="Task name"
            />

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
              <textarea
                value={task.description ?? ""}
                onChange={(e) => can("edit_task") && handleFieldChange("description", e.target.value)}
                onClick={() => !can("edit_task") && denyToast()}
                readOnly={!can("edit_task")}
                rows={3}
                placeholder={can("edit_task") ? "Add a description…" : "No description"}
                className={`mt-1 w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!can("edit_task") ? "bg-gray-50 cursor-default" : ""}`}
              />
            </div>

            {/* Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due date</label>
                <input
                  type="date"
                  value={formatDate(task.dueDate)}
                  onChange={(e) =>
                    handleFieldChange("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  onClick={() => !can("edit_task") && denyToast()}
                  readOnly={!can("edit_task")}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-50 read-only:cursor-default"
                />
              </div>
            </div>

            {/* Assignee (single-select) */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignee</label>
              <div className="mt-2">
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => handleAssigneeSelect(e.target.value)}
                  disabled={!can("assign_task")}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:cursor-default"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custom fields</label>
                <div className="mt-2 space-y-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-xs text-gray-600 font-medium truncate">{field.name}</span>
                      {renderCustomFieldInput(field)}
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

            {/* Activity Feed (comments + history) */}
            <ActivityFeed
              taskId={taskId}
              projectId={projectId ?? task?.projectId}
              projectMembers={projectMembers}
              currentUserId={user?.id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
