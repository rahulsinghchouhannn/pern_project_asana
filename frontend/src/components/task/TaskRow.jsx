import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import taskService from "@/services/taskService";
import customFieldService from "@/services/customFieldService";
import timeEntryService from "@/services/timeEntryService";
import { parseTimeInput, formatMinutes, describeMinutes } from "@/utils/timeFormat";
import { getRunningTimer, setRunningTimer, subscribeTimer, getElapsedMinutes } from "@/utils/timerStore";
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
    case "text":           return valueObj.valueText ?? null;
    case "number":         return valueObj.valueNumber != null ? Number(valueObj.valueNumber) : null;
    case "date":           return valueObj.valueDate ?? null;
    case "dropdown":       return valueObj.valueOption ?? null;
    case "user":           return valueObj.valueUserId ?? null;
    case "estimated_time": return valueObj.valueNumber != null ? Number(valueObj.valueNumber) : null;
    case "actual_time":    return valueObj.valueNumber != null ? Number(valueObj.valueNumber) : null;
    default:               return null;
  }
};

// ─── UserFieldDropdown ────────────────────────────────────────────────────────

const UserFieldDropdown = ({ style, projectMembers, selectedUserId, onSelect }) => {
  const [search, setSearch] = useState("");
  const filtered = projectMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div
      className="w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1.5 border-b border-gray-100">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full text-xs px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        onClick={() => onSelect(null)}
        className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
      >
        — Clear
      </button>
      {filtered.map((m) => (
        <button
          key={m.userId}
          onClick={() => onSelect(m.userId)}
          className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50
            ${selectedUserId === m.userId ? "bg-indigo-50 text-indigo-700" : "text-gray-700"}`}
        >
          {m.avatarUrl ? (
            <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full shrink-0 object-cover" />
          ) : (
            <span
              className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: getAvatarColor(m.name) }}
            >
              {getInitials(m.name)}
            </span>
          )}
          <span className="truncate">{m.name}</span>
        </button>
      ))}
      {filtered.length === 0 && (
        <p className="px-3 py-2 text-xs text-gray-400">No members found</p>
      )}
    </div>
  );
};

// ─── EstimatedTimeCell ────────────────────────────────────────────────────────

// Convert stored minutes into an editable string that round-trips through parseTimeInput.
// e.g. 44 → "44",  90 → "1:30",  671 → "11:11"
const toEditableFormat = (minutes) => {
  if (minutes == null || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return String(m);
  return `${h}:${String(m).padStart(2, "0")}`;
};

const EstimatedTimeCell = ({ field, initialValue, taskId, readOnly = false, onPermissionDenied }) => {
  const [localMinutes, setLocalMinutes] = useState(
    () => initialValue?.valueNumber != null ? Number(initialValue.valueNumber) : null
  );
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const lastSavedRef = useRef(localMinutes);
  const activeEditRef = useRef(false);
  // Only save to DB when the user has actually typed something in this edit session
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (activeEditRef.current) return;
    const v = initialValue?.valueNumber != null ? Number(initialValue.valueNumber) : null;
    setLocalMinutes(v);
    lastSavedRef.current = v;
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = async (minutes) => {
    const prev = lastSavedRef.current;
    try {
      await customFieldService.setTaskFieldValue(taskId, field.id, {
        valueNumber: minutes,
      });
      lastSavedRef.current = minutes;
    } catch {
      setLocalMinutes(prev);
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    isDirtyRef.current = true;
    setInputVal(raw);
    const parsed = parseTimeInput(raw);
    setSuggestion(parsed != null ? describeMinutes(parsed) : null);
  };

  const commitEdit = () => {
    activeEditRef.current = false;
    setEditing(false);
    setSuggestion(null);
    // Only update if the user actually typed something in this session
    if (!isDirtyRef.current) return;
    isDirtyRef.current = false;
    const parsed = parseTimeInput(inputVal);
    const minutes = parsed != null && parsed > 0 ? parsed : null;
    setLocalMinutes(minutes);
    doSave(minutes);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") {
      // Cancel edit — discard changes, do not save
      isDirtyRef.current = false;
      activeEditRef.current = false;
      setEditing(false);
      setSuggestion(null);
    }
  };

  const displayed = formatMinutes(localMinutes);

  if (editing) {
    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 1:30"
          className="w-full text-xs bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none"
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
      onClick={(e) => {
        e.stopPropagation();
        if (readOnly) { onPermissionDenied?.(); return; }
        activeEditRef.current = true;
        isDirtyRef.current = false;
        // Initialize input in a format that round-trips through parseTimeInput
        // so the existing value is shown correctly and won't be overwritten on blur
        setInputVal(toEditableFormat(localMinutes));
        setSuggestion(localMinutes ? describeMinutes(localMinutes) : null);
        setEditing(true);
      }}
      className={`w-full text-left text-xs px-1 py-0.5 rounded min-h-5.5 block transition-colors hover:bg-gray-100
        ${displayed ? "text-gray-700" : "text-gray-200"}`}
      title="Click to edit"
    >
      {displayed ?? "—"}
    </button>
  );
};

// ─── ActualTimeCell ───────────────────────────────────────────────────────────

const ActualTimeCell = ({ field, initialValue, taskId, readOnly = false, onPermissionDenied }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const userId = currentUser?.id;

  const [savedTotal, setSavedTotal] = useState(
    () => initialValue?.valueNumber != null ? Number(initialValue.valueNumber) : 0
  );
  const [showPanel, setShowPanel] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [addTimeInput, setAddTimeInput] = useState("");
  const [addTimeSuggestion, setAddTimeSuggestion] = useState(null);
  const [entries, setEntries] = useState([]);
  const [savingTime, setSavingTime] = useState(false);
  const [timerData, setTimerData] = useState(() => userId ? getRunningTimer(userId) : null);
  // Tick increments every minute to update the elapsed display
  const [, setTick] = useState(0);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const panelPosRef = useRef({ top: 0, left: 0 });

  // Sync savedTotal from prop (e.g. socket update)
  useEffect(() => {
    setSavedTotal(initialValue?.valueNumber != null ? Number(initialValue.valueNumber) : 0);
  }, [initialValue]);

  // Subscribe to timer store changes
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeTimer(() => {
      setTimerData(getRunningTimer(userId));
    });
    return unsub;
  }, [userId]);

  // Tick every minute for running timer display
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
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
  // When running: show only the current session elapsed time (starts from 0).
  // When stopped: show the saved total of all entries.
  const cellDisplay = isRunning
    ? (formatMinutes(elapsedMinutes) ?? "0m")
    : formatMinutes(savedTotal);

  const openPanel = (e) => {
    e.stopPropagation();
    if (readOnly) { onPermissionDenied?.(); return; }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelW = 300;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8));
      panelPosRef.current = { top: rect.bottom + 4, left };
    }
    // Fetch entries fresh on open
    timeEntryService.getTaskTimeEntries(taskId, field.id)
      .then((res) => setEntries(res.data.data ?? []))
      .catch(() => {});
    setShowPanel(true);
    setShowAddTime(false);
    setAddTimeInput("");
    setAddTimeSuggestion(null);
  };

  const handleAddTimeInputChange = (e) => {
    const raw = e.target.value;
    setAddTimeInput(raw);
    const parsed = parseTimeInput(raw);
    setAddTimeSuggestion(parsed != null ? describeMinutes(parsed) : null);
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
      setSavedTotal((prev) => prev + minutes);
      setAddTimeInput("");
      setAddTimeSuggestion(null);
      setShowAddTime(false);
    } catch {
      // keep UI as-is on error
    } finally {
      setSavingTime(false);
    }
  };

  const handleAddTimeKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTime(); }
    if (e.key === "Escape") {
      setShowAddTime(false);
      setAddTimeInput("");
      setAddTimeSuggestion(null);
    }
  };

  const handleStartTimer = async () => {
    if (!userId) return;
    const existing = getRunningTimer(userId);

    if (existing && !(existing.taskId === taskId && existing.customFieldId === field.id)) {
      // Auto-save the previous timer silently
      const elapsed = getElapsedMinutes(existing.startedAt);
      if (elapsed > 0) {
        try {
          await timeEntryService.addTimeEntry(existing.taskId, existing.customFieldId, {
            durationMinutes: elapsed,
            source: "timer",
          });
        } catch {
          // ignore — still switch the timer
        }
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
    // Clear from localStorage immediately
    setRunningTimer(userId, null);
    if (elapsed > 0) {
      try {
        const res = await timeEntryService.addTimeEntry(taskId, field.id, {
          durationMinutes: elapsed,
          source: "timer",
        });
        setEntries((prev) => [res.data.data, ...prev]);
        setSavedTotal((prev) => prev + elapsed);
      } catch {}
    }
  };

  const totalMinutesInPanel = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const totalDisplay = formatMinutes(totalMinutesInPanel) ?? "0m";

  const formatLoggedAt = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDay = new Date(d);
    entryDay.setHours(0, 0, 0, 0);
    if (entryDay.getTime() === today.getTime()) return "Today";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative w-full">
      {/* Cell trigger */}
      <button
        ref={triggerRef}
        onClick={openPanel}
        className={`w-full text-left text-xs px-1 py-0.5 rounded min-h-5.5 flex items-center gap-1 transition-colors hover:bg-gray-100
          ${savedTotal > 0 || isRunning ? "text-gray-700" : "text-gray-200"}`}
        title="Click to view time"
      >
        {isRunning && (
          <span className="shrink-0 text-red-500">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="7" />
            </svg>
          </span>
        )}
        {savedTotal > 0 || isRunning ? cellDisplay : "—"}
      </button>

      {/* Panel portal */}
      {showPanel && ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="fixed z-9999 bg-white border border-gray-200 rounded-xl shadow-xl"
          style={{ top: panelPosRef.current.top, left: panelPosRef.current.left, width: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add time input row */}
          {showAddTime && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={addTimeInput}
                  onChange={handleAddTimeInputChange}
                  onKeyDown={handleAddTimeKeyDown}
                  placeholder="e.g. 1:30"
                  className="w-full text-sm border border-indigo-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {addTimeSuggestion && (
                  <div className="mt-1 px-1 text-xs text-gray-500 truncate">{addTimeSuggestion}</div>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Today</span>
                  {currentUser && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(currentUser.name ?? "") }}
                    >
                      {getInitials(currentUser.name ?? "")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingTime ? "Saving…" : "Add time"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Entries list */}
          <div className="max-h-48 overflow-y-auto">
            {entries.length === 0 && !showAddTime && (
              <p className="text-xs text-gray-400 text-center py-4">No time logged yet</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-800">
                  {formatMinutes(entry.durationMinutes) ?? "0m"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatLoggedAt(entry.loggedAt)}</span>
                  {entry.userAvatarUrl ? (
                    <img src={entry.userAvatarUrl} alt="" className="w-5 h-5 rounded-full shrink-0 object-cover" />
                  ) : (
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: getAvatarColor(entry.userName ?? "") }}
                    >
                      {getInitials(entry.userName ?? "")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer: total + action buttons */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              {totalDisplay} <span className="text-xs font-normal text-gray-400">TOTAL</span>
            </span>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button
                  onClick={handleStopTimer}
                  className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="3" width="10" height="10" rx="1" />
                  </svg>
                  Stop timer
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16" stroke="currentColor">
                    <circle cx="8" cy="8" r="6.5" strokeWidth="1.5" />
                    <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" strokeWidth="0" />
                  </svg>
                  Start timer
                </button>
              )}
              {!showAddTime && (
                <button
                  onClick={() => setShowAddTime(true)}
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add time
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── CustomFieldCell ──────────────────────────────────────────────────────────

const DROPDOWN_W = 160;
const DROPDOWN_H = 200;

const CustomFieldCell = ({ field, initialValue, taskId, projectMembers = [], readOnly = false, onPermissionDenied }) => {
  // Intercept timer field types first
  if (field.type === "estimated_time") {
    return <EstimatedTimeCell field={field} initialValue={initialValue} taskId={taskId} readOnly={readOnly} onPermissionDenied={onPermissionDenied} />;
  }
  if (field.type === "actual_time") {
    return <ActualTimeCell field={field} initialValue={initialValue} taskId={taskId} readOnly={readOnly} onPermissionDenied={onPermissionDenied} />;
  }

  const [localValue, setLocalValue] = useState(() => extractDisplayValue(field.type, initialValue));
  const [editing, setEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const debounceRef = useRef(null);
  const dropdownTriggerRef = useRef(null);
  const dateTriggerRef = useRef(null);
  const lastSavedRef = useRef(extractDisplayValue(field.type, initialValue));
  const activeEditRef = useRef(false);

  const openDropdown = (e) => {
    e.stopPropagation();
    activeEditRef.current = true;
    if (dropdownTriggerRef.current) {
      const rect = dropdownTriggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < DROPDOWN_H + 8 ? rect.top - DROPDOWN_H - 4 : rect.bottom + 2;
      const left = Math.min(rect.left, window.innerWidth - DROPDOWN_W - 8);
      setDropdownStyle({ position: "fixed", top, left, zIndex: 9999 });
    }
    setShowDropdown((v) => !v);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

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
        case "user":     body.valueUserId  = value;  break;
      }
      await customFieldService.setTaskFieldValue(taskId, field.id, body);
      lastSavedRef.current = value;
    } catch {
      setLocalValue(prev);
    }
  };

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
          if (readOnly) { onPermissionDenied?.(); return; }
          activeEditRef.current = true;
          setEditing(true);
        }}
        className={`w-full text-left text-xs px-1 py-0.5 rounded min-h-5.5 block transition-colors hover:bg-gray-100
          ${isEmpty ? "text-gray-200" : "text-gray-700"}`}
        title="Click to edit"
      >
        {isEmpty ? "—" : String(localValue)}
      </button>
    );
  }

  if (field.type === "dropdown") {
    const options = field.options ?? [];
    const opt = options.find((o) => o.value === localValue);
    return (
      <div className="relative w-full">
        <button
          ref={dropdownTriggerRef}
          onClick={(e) => { if (readOnly) { e.stopPropagation(); onPermissionDenied?.(); return; } openDropdown(e); }}
          className={`w-full text-left min-h-5.5 px-1 rounded transition-colors hover:bg-gray-100
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

        {showDropdown && ReactDOM.createPortal(
          <>
            <div
              className="fixed inset-0 z-9998"
              onClick={() => { activeEditRef.current = false; setShowDropdown(false); }}
            />
            <div
              className="w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-9999"
              style={dropdownStyle}
            >
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
          </>,
          document.body
        )}
      </div>
    );
  }

  if (field.type === "date") {
    const dateStr = localValue
      ? new Date(localValue).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
    return (
      <div className="relative w-full">
        <button
          ref={dateTriggerRef}
          onClick={(e) => {
            e.stopPropagation();
            if (readOnly) { onPermissionDenied?.(); return; }
            activeEditRef.current = true;
            setShowDate((v) => !v);
          }}
          className={`w-full text-left text-xs min-h-5.5 px-1 rounded transition-colors hover:bg-gray-100
            ${dateStr ? "text-gray-700" : "text-gray-200"}`}
        >
          {dateStr ?? "—"}
        </button>
        {showDate && (
          <DueDatePicker
            value={localValue}
            anchorEl={dateTriggerRef.current}
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

  if (field.type === "user") {
    const selectedMember = projectMembers.find((m) => m.userId === localValue);
    return (
      <div className="relative w-full">
        <button
          ref={dropdownTriggerRef}
          onClick={(e) => { if (readOnly) { e.stopPropagation(); onPermissionDenied?.(); return; } openDropdown(e); }}
          className="w-full text-left min-h-5.5 px-1 rounded transition-colors hover:bg-gray-100 flex items-center gap-1.5"
        >
          {selectedMember ? (
            <>
              {selectedMember.avatarUrl ? (
                <img src={selectedMember.avatarUrl} alt="" className="w-5 h-5 rounded-full shrink-0 object-cover" />
              ) : (
                <span
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: getAvatarColor(selectedMember.name) }}
                >
                  {getInitials(selectedMember.name)}
                </span>
              )}
              <span className="text-xs text-gray-700 truncate">{selectedMember.name}</span>
            </>
          ) : (
            <span className="text-xs text-gray-200">—</span>
          )}
        </button>

        {showDropdown && ReactDOM.createPortal(
          <>
            <div
              className="fixed inset-0 z-9998"
              onClick={() => { activeEditRef.current = false; setShowDropdown(false); }}
            />
            <UserFieldDropdown
              style={dropdownStyle}
              projectMembers={projectMembers}
              selectedUserId={localValue}
              onSelect={(userId) => {
                setLocalValue(userId);
                activeEditRef.current = false;
                setShowDropdown(false);
                doSave(userId);
              }}
            />
          </>,
          document.body
        )}
      </div>
    );
  }

  return <span className="text-xs text-gray-300">—</span>;
};

// ─── TaskContextMenu ──────────────────────────────────────────────────────────

const TaskContextMenu = ({ x, y, task, isSubtask, onClose, onConvertType, onAddSubtask, onDelete }) => {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({ position: "fixed", top: y, left: x, zIndex: 9999 });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const adjustedLeft = x + rect.width > window.innerWidth ? x - rect.width : x;
    const adjustedTop  = y + rect.height > window.innerHeight ? y - rect.height : y;
    setStyle({ position: "fixed", top: adjustedTop, left: adjustedLeft, zIndex: 9999 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [onClose]);

  const isMilestone = task.taskType === "milestone";

  return ReactDOM.createPortal(
    <div ref={menuRef} style={style} className="w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1">
      <button
        onClick={() => { onClose(); onConvertType(isMilestone ? "task" : "milestone"); }}
        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        {isMilestone ? (
          <>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="7" strokeWidth={2} />
            </svg>
            Convert to Task
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1 L15 8 L8 15 L1 8 Z" />
            </svg>
            Convert to Milestone
          </>
        )}
      </button>

      {!isSubtask && (
        <button
          onClick={() => { onClose(); onAddSubtask(); }}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add subtask
        </button>
      )}

      <div className="my-1 border-t border-gray-100" />

      <button
        onClick={() => { onClose(); onDelete(); }}
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete task
      </button>
    </div>,
    document.body
  );
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
  isSubtask = false,
  expanded = false,
  onToggleExpand,
  onAddSubtask,
  onDeleteTask,
  canCreate = true,
  canEdit = true,
  canAssign = true,
  canDelete = true,
  onPermissionDenied,
  innerRef,
  draggableProps,
  dragHandleProps,
  onSubtaskDragStart,
  onSubtaskDragEnd,
  rowProps = {},
}) => {
  const [title, setTitle] = useState(task.title ?? "");
  const [assignees, setAssignees] = useState(task.assignees ?? []);
  const [dueDate, setDueDate] = useState(task.dueDate ?? null);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted ?? false);
  const [taskType, setTaskType] = useState(task.taskType ?? "task");
  const [showAssignee, setShowAssignee] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const debounceRef = useRef(null);
  const assigneeTriggerRef = useRef(null);
  const dateTriggerRef = useRef(null);
  const isEditingTitleRef = useRef(false);

  useEffect(() => {
    if (!isEditingTitleRef.current) setTitle(task.title ?? "");
    setAssignees(task.assignees ?? []);
    setDueDate(task.dueDate ?? null);
    setIsCompleted(task.isCompleted ?? false);
    setTaskType(task.taskType ?? "task");
  }, [task.updatedAt, task.isCompleted, task.taskType]);

  useEffect(() => {
    isEditingTitleRef.current = false;
    setTitle(task.title ?? "");
  }, [task.id]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleConvertType = async (newType) => {
    if (!canEdit) { onPermissionDenied?.(); return; }
    const prevType = taskType;
    setTaskType(newType);
    try {
      const res = await taskService.updateTask(task.id, { taskType: newType });
      onUpdated?.(res.data.data);
    } catch {
      setTaskType(prevType);
    }
  };

  const handleDelete = () => {
    if (!canDelete) { onPermissionDenied?.(); return; }
    onDeleteTask?.(task.id, task.parentTaskId ?? null);
  };
  const handleAddSubtaskClick = () => {
    if (!canCreate) { onPermissionDenied?.(); return; }
    onAddSubtask?.(task.id);
  };

  const handleTitleChange = (e) => {
    if (!canEdit) return;
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
    if (!canEdit) { onPermissionDenied?.(); return; }
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
    if (!canAssign) { onPermissionDenied?.(); return; }
    setAssignees([member]);
    setShowAssignee(false);
    try {
      const existing = assignees.filter((a) => a.userId !== member.userId);
      for (const a of existing) await taskService.removeAssignee(task.id, a.userId);
      const res = await taskService.addAssignee(task.id, member.userId);
      onUpdated?.(res.data.data);
    } catch {
      setAssignees(task.assignees ?? []);
    }
  };

  const handleDateSelect = async (date) => {
    if (!canEdit) { onPermissionDenied?.(); return; }
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
  const isMilestone = taskType === "milestone";
  const subtaskCount = task.subtaskCount ?? 0;
  const hasSubtasks = subtaskCount > 0 || expanded;
  const nameCellPadding = isSubtask ? "pl-12" : "pl-2";

  return (
    <>
      <tr
        ref={innerRef}
        {...draggableProps}
        {...rowProps}
        onContextMenu={handleContextMenu}
        className={`group border-b border-gray-100 hover:bg-gray-50/70 h-10 ${isSubtask ? "bg-gray-50/30" : ""}`}
      >
        {/* ── Name ─────────────────────────────────────────── */}
        <td className={`py-0 ${nameCellPadding} pr-2 w-125 overflow-hidden border-r border-gray-200`}>
          <div className="flex items-center gap-1 h-10 min-w-0 overflow-hidden">
            {!isSubtask && dragHandleProps ? (
              <span
                {...dragHandleProps}
                className="shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-opacity select-none px-0.5"
                title="Drag to reorder"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
              </span>
            ) : isSubtask && onSubtaskDragStart ? (
              <span
                draggable
                onDragStart={(e) => onSubtaskDragStart(task, e, e.currentTarget.closest("tr"))}
                onDragEnd={onSubtaskDragEnd}
                className="shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-opacity select-none px-0.5"
                title="Drag to reorder"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
              </span>
            ) : (
              <span className="shrink-0 w-4" />
            )}

            {!isSubtask && hasSubtasks ? (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand?.(task.id); }}
                className="shrink-0 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title={expanded ? "Collapse subtasks" : "Expand subtasks"}
              >
                <svg
                  className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : !isSubtask ? (
              <span className="shrink-0 w-4" />
            ) : null}

            {isMilestone ? (
              <button
                onClick={handleToggleComplete}
                className="shrink-0 flex items-center justify-center w-4 h-4 transition-opacity hover:opacity-80"
                title={isCompleted ? "Reopen" : "Complete"}
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5"
                  fill={isCompleted ? "#22c55e" : "none"}
                  stroke="#22c55e"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                >
                  <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleToggleComplete}
                className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
                  isCompleted ? "bg-indigo-500 border-indigo-500" : "border-gray-300 hover:border-indigo-400"
                }`}
                title={isCompleted ? "Reopen" : "Complete"}
              />
            )}

            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onFocus={() => { isEditingTitleRef.current = true; }}
              onBlur={() => { isEditingTitleRef.current = false; }}
              onClick={(e) => { e.stopPropagation(); if (!canEdit) onPermissionDenied?.(); }}
              readOnly={!canEdit}
              className={`flex-1 text-sm bg-transparent outline-none min-w-0 rounded px-1 py-0.5
                focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-shadow
                ${!canEdit ? "cursor-default" : ""}
                ${isCompleted ? "line-through text-gray-400" : isMilestone ? "font-semibold text-gray-800" : "text-gray-800"}`}
            />

            {!isSubtask && subtaskCount > 0 && (
              <span className="shrink-0 text-xs text-gray-400 bg-gray-100 rounded px-1 flex items-center gap-0.5">
                {subtaskCount}
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 2h4M2 5h6M2 8h4" />
                </svg>
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
        <td className="py-0 px-3 w-40 relative border-r border-gray-200">
          <button
            ref={assigneeTriggerRef}
            onClick={(e) => { e.stopPropagation(); if (!canAssign) { onPermissionDenied?.(); return; } setShowAssignee((v) => !v); setShowDatePicker(false); }}
            className="flex items-center gap-1.5 max-w-full"
            title={primaryAssignee ? primaryAssignee.name : "Assign member"}
          >
            {primaryAssignee ? (
              <>
                {primaryAssignee.avatarUrl ? (
                  <img src={primaryAssignee.avatarUrl} alt={primaryAssignee.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ backgroundColor: getAvatarColor(primaryAssignee.name ?? "") }}
                  >
                    {getInitials(primaryAssignee.name ?? "")}
                  </div>
                )}
                <span className="text-xs text-gray-600 truncate max-w-18">{firstName}</span>
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
              anchorEl={assigneeTriggerRef.current}
              onSelect={handleAssigneeSelect}
              onClose={() => setShowAssignee(false)}
            />
          )}
        </td>

        {/* ── Due date ─────────────────────────────────────── */}
        <td className="py-0 px-3 w-27.5 relative border-r border-gray-200">
          <button
            ref={dateTriggerRef}
            onClick={(e) => { e.stopPropagation(); if (!canEdit) { onPermissionDenied?.(); return; } setShowDatePicker((v) => !v); setShowAssignee(false); }}
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
              anchorEl={dateTriggerRef.current}
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
                projectMembers={projectMembers}
                readOnly={!canEdit}
                onPermissionDenied={onPermissionDenied}
              />
            </td>
          );
        })}

        {/* spacer */}
        <td />
      </tr>

      {contextMenu && (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          task={{ ...task, taskType }}
          isSubtask={isSubtask}
          onClose={() => setContextMenu(null)}
          onConvertType={handleConvertType}
          onAddSubtask={handleAddSubtaskClick}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default TaskRow;
