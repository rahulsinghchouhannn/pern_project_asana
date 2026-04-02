import React, { useState, useRef, useMemo, useCallback } from "react";
import TaskDetailModal from "../TaskDetailModal";
import taskService from "@/services/taskService";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAY_MS = 86400000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const toDay = (dateStr) => startOfDay(new Date(dateStr));

const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);

const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);

const formatDate = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatMonthYear = (d) =>
  d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

// ─── Constants ────────────────────────────────────────────────────────────────

const ZOOM_CONFIGS = {
  week:    { colDays: 1, colWidth: 40, labelEvery: 7,  labelFmt: (d) => d.getDate().toString() },
  month:   { colDays: 1, colWidth: 24, labelEvery: 7,  labelFmt: (d) => d.getDate().toString() },
  quarter: { colDays: 7, colWidth: 48, labelEvery: 1,  labelFmt: (d) => `W${Math.ceil(d.getDate() / 7)}` },
};

const LEFT_PANEL_W = 220;
const ROW_H = 40;

// ─── Component ────────────────────────────────────────────────────────────────

const TimelineView = ({
  projectId,
  tasks: propTasks = [],
  statuses = [],
  projectMembers = [],
  onTaskUpdated,
}) => {
  const [zoom, setZoom] = useState("month");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [localTasks, setLocalTasks] = useState(propTasks);
  const containerRef = useRef(null);
  const dragRef = useRef(null); // { taskId, type: "move"|"resize", startX, origStart, origDue }

  // Sync when parent tasks change
  React.useEffect(() => {
    setLocalTasks(propTasks);
  }, [propTasks]);

  const cfg = ZOOM_CONFIGS[zoom];

  // Determine date range: 2 weeks before earliest start, 2 weeks after latest due
  const { originDay, totalCols } = useMemo(() => {
    const tasksWithDates = localTasks.filter((t) => t.startDate && t.dueDate);
    if (tasksWithDates.length === 0) {
      const today = startOfDay(new Date());
      return { originDay: addDays(today, -14), totalCols: Math.ceil(90 / cfg.colDays) };
    }
    const earliest = tasksWithDates.reduce(
      (min, t) => (toDay(t.startDate) < min ? toDay(t.startDate) : min),
      toDay(tasksWithDates[0].startDate)
    );
    const latest = tasksWithDates.reduce(
      (max, t) => (toDay(t.dueDate) > max ? toDay(t.dueDate) : max),
      toDay(tasksWithDates[0].dueDate)
    );
    const origin = addDays(earliest, -14);
    const span = diffDays(origin, addDays(latest, 14));
    return {
      originDay: origin,
      totalCols: Math.ceil(span / cfg.colDays) + 1,
    };
  }, [localTasks, zoom, cfg.colDays]);

  const totalWidth = totalCols * cfg.colWidth;

  // Convert pixel offset (from left of right panel) → date
  const pxToDate = useCallback(
    (px) => addDays(originDay, Math.round(px / cfg.colWidth) * cfg.colDays),
    [originDay, cfg]
  );

  // Convert date → pixel offset
  const dateToPx = useCallback(
    (date) => (diffDays(originDay, toDay(date)) / cfg.colDays) * cfg.colWidth,
    [originDay, cfg]
  );

  // Build header date labels
  const headerLabels = useMemo(() => {
    const labels = [];
    let prev = null;
    for (let i = 0; i < totalCols; i++) {
      const d = addDays(originDay, i * cfg.colDays);
      const monthYear = formatMonthYear(d);
      if (monthYear !== prev) { labels.push({ col: i, label: monthYear, isMonth: true }); prev = monthYear; }
    }
    return labels;
  }, [originDay, totalCols, cfg]);

  const dayLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < totalCols; i += cfg.labelEvery) {
      const d = addDays(originDay, i * cfg.colDays);
      labels.push({ col: i, label: cfg.labelFmt(d) });
    }
    return labels;
  }, [originDay, totalCols, cfg]);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onMouseDown = (e, taskId, type) => {
    e.preventDefault();
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;
    dragRef.current = {
      taskId,
      type,
      startX: e.clientX,
      origStart: task.startDate,
      origDue: task.dueDate,
    };

    const onMove = (moveEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const daysDelta = Math.round((dx / cfg.colWidth) * cfg.colDays);
      if (daysDelta === 0) return;

      setLocalTasks((prev) =>
        prev.map((t) => {
          if (t.id !== dragRef.current.taskId) return t;
          if (dragRef.current.type === "move") {
            return {
              ...t,
              startDate: addDays(new Date(dragRef.current.origStart), daysDelta).toISOString(),
              dueDate: addDays(new Date(dragRef.current.origDue), daysDelta).toISOString(),
            };
          } else {
            // resize: extend/shrink dueDate
            const newDue = addDays(new Date(dragRef.current.origDue), daysDelta);
            if (newDue <= new Date(dragRef.current.origStart)) return t;
            return { ...t, dueDate: newDue.toISOString() };
          }
        })
      );
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const { taskId, origStart, origDue } = dragRef.current;
      const updated = localTasks.find ? localTasks.find((t) => t.id === taskId) : null;
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      // Get latest state via setLocalTasks callback
      setLocalTasks((prev) => {
        const t = prev.find((x) => x.id === taskId);
        if (!t) return prev;
        const startChanged = t.startDate !== origStart;
        const dueChanged = t.dueDate !== origDue;
        if (!startChanged && !dueChanged) return prev;

        // Persist to backend
        const payload = {};
        if (startChanged) payload.startDate = t.startDate;
        if (dueChanged) payload.dueDate = t.dueDate;
        taskService.updateTaskDates(taskId, payload)
          .then((res) => onTaskUpdated?.({ ...t, ...res.data.data }))
          .catch(() => {
            // Rollback
            setLocalTasks((prev2) =>
              prev2.map((x) => x.id === taskId ? { ...x, startDate: origStart, dueDate: origDue } : x)
            );
          });
        return prev;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const today = startOfDay(new Date());
  const todayPx = dateToPx(today);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-500">
          {localTasks.filter((t) => t.startDate && t.dueDate).length} tasks with date range
          {localTasks.filter((t) => !t.startDate || !t.dueDate).length > 0 &&
            ` · ${localTasks.filter((t) => !t.startDate || !t.dueDate).length} without dates`}
        </span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {["week", "month", "quarter"].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors
                ${zoom === z ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left panel — task names */}
        <div className="flex-shrink-0 border-r border-gray-200 overflow-y-auto" style={{ width: LEFT_PANEL_W }}>
          {/* Header spacer */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-100 h-10" />

          {localTasks.map((task, idx) => {
            const status = statuses.find((s) => s.id === task.statusId);
            const hasDates = task.startDate && task.dueDate;
            return (
              <div
                key={task.id}
                className="flex items-center gap-2 px-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                style={{ height: ROW_H }}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: status?.color ?? "#9CA3AF", opacity: hasDates ? 1 : 0.4 }}
                />
                <span className={`text-xs truncate ${hasDates ? "text-gray-700" : "text-gray-400"}`}>
                  {task.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right panel — bars */}
        <div className="flex-1 overflow-auto relative">
          {/* Header */}
          <div
            className="sticky top-0 bg-white z-10 border-b border-gray-100"
            style={{ width: totalWidth, minWidth: "100%" }}
          >
            {/* Month row */}
            <div className="relative h-5 border-b border-gray-50">
              {headerLabels.map(({ col, label }) => (
                <div
                  key={col}
                  className="absolute top-0 h-full flex items-center text-xs text-gray-400 font-medium px-1 whitespace-nowrap"
                  style={{ left: col * cfg.colWidth }}
                >
                  {label}
                </div>
              ))}
            </div>
            {/* Day row */}
            <div className="relative h-5">
              {dayLabels.map(({ col, label }) => (
                <div
                  key={col}
                  className="absolute top-0 h-full flex items-center justify-center text-xs text-gray-300"
                  style={{ left: col * cfg.colWidth, width: cfg.colWidth * cfg.labelEvery }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Grid + bars */}
          <div className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Today line */}
            {todayPx >= 0 && todayPx <= totalWidth && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400 opacity-60 z-10 pointer-events-none"
                style={{ left: todayPx }}
              />
            )}

            {localTasks.map((task, idx) => {
              const status = statuses.find((s) => s.id === task.statusId);
              const color = status?.color ?? "#6366F1";
              const hasDates = task.startDate && task.dueDate;

              const top = idx * ROW_H;

              if (!hasDates) {
                // No-date dot: show on today's column
                return (
                  <div
                    key={task.id}
                    className="absolute flex items-center"
                    style={{ top: top + ROW_H / 2 - 5, left: todayPx - 5, width: 10, height: 10 }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: color, opacity: 0.5 }}
                      title={task.title}
                    />
                  </div>
                );
              }

              const barLeft = dateToPx(toDay(task.startDate));
              const barRight = dateToPx(addDays(toDay(task.dueDate), 1));
              const barWidth = Math.max(barRight - barLeft, cfg.colWidth);

              return (
                <div
                  key={task.id}
                  className="absolute flex items-center"
                  style={{ top: top + 6, height: ROW_H - 12, left: barLeft, width: barWidth }}
                >
                  {/* Bar */}
                  <div
                    onMouseDown={(e) => onMouseDown(e, task.id, "move")}
                    className="flex-1 h-full rounded-md flex items-center px-2 cursor-grab active:cursor-grabbing select-none overflow-hidden group"
                    style={{ backgroundColor: color + "33", border: `1.5px solid ${color}66` }}
                    title={`${task.title}\n${formatDate(new Date(task.startDate))} – ${formatDate(new Date(task.dueDate))}`}
                  >
                    <span className="text-xs truncate font-medium" style={{ color }}>
                      {task.title}
                    </span>
                  </div>

                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, task.id, "resize"); }}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-60"
                    style={{ color }}
                  >
                    <div className="w-0.5 h-3 rounded-full bg-current" />
                  </div>
                </div>
              );
            })}

            {/* Row backgrounds */}
            {localTasks.map((_, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 border-b border-gray-50"
                style={{ top: idx * ROW_H, height: ROW_H }}
              />
            ))}

            {/* Total height spacer */}
            <div style={{ height: localTasks.length * ROW_H }} />
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(task) => {
            setLocalTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)));
            onTaskUpdated?.(task);
          }}
        />
      )}
    </div>
  );
};

export default TimelineView;
