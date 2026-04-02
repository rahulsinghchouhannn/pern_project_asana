import React, { useState, useMemo } from "react";
import TaskDetailModal from "../TaskDetailModal";
import CreateTaskModal from "../CreateTaskModal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Build 6-week grid for a given year/month
const buildGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const cells = [];

  // Prev month fill
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, currentMonth: false });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  // Next month fill to complete 6 rows
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), currentMonth: false });
  }
  return cells;
};

const PRIORITY_COLORS = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
  none: "#6366F1",
};

const CalendarView = ({
  projectId,
  tasks = [],
  statuses = [],
  projectMembers = [],
  onTaskCreated,
  onTaskUpdated,
}) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createForDate, setCreateForDate] = useState(null);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  // Map tasks by their local dueDate key "YYYY-M-D"
  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const local = toLocalDate(t.dueDate);
      if (!local) return;
      const key = `${local.getFullYear()}-${local.getMonth()}-${local.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const handleDayClick = (date) => {
    setCreateForDate(date.toISOString());
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-800 w-36 text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="ml-2 px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            Today
          </button>
        </div>
        <span className="text-xs text-gray-400">{tasks.filter((t) => t.dueDate).length} tasks with due dates</span>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
          {grid.map(({ date, currentMonth }, i) => {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayTasks = tasksByDay[key] ?? [];
            const isToday = isSameDay(date, today);
            const overflow = dayTasks.length > 3 ? dayTasks.length - 3 : 0;
            const visibleTasks = dayTasks.slice(0, 3);

            return (
              <div
                key={i}
                onClick={() => handleDayClick(date)}
                className={`bg-white min-h-24 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors`}
              >
                {/* Date number */}
                <div className="flex justify-end mb-1">
                  <span
                    className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? "bg-indigo-600 text-white" : ""}
                      ${!currentMonth ? "text-gray-300" : isToday ? "" : "text-gray-700"}`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Task pills */}
                {visibleTasks.map((task) => {
                  const status = statuses.find((s) => s.id === task.statusId);
                  const color = status?.color ?? PRIORITY_COLORS[task.priority] ?? "#6366F1";
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                      className="mb-0.5 px-1.5 py-0.5 rounded text-xs truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color + "22", color }}
                      title={task.title}
                    >
                      {task.isCompleted && <span className="mr-1 opacity-60">✓</span>}
                      {task.title}
                    </div>
                  );
                })}

                {/* Overflow */}
                {overflow > 0 && (
                  <div className="text-xs text-indigo-500 font-medium px-1 hover:underline cursor-pointer">
                    +{overflow} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {createForDate && (
        <CreateTaskModal
          projectId={projectId}
          statuses={statuses}
          defaultStatusId={statuses[0]?.id ?? ""}
          defaultDueDate={createForDate}
          onCreated={(task) => { onTaskCreated?.(task); setCreateForDate(null); }}
          onClose={() => setCreateForDate(null)}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(task) => { onTaskUpdated?.(task); }}
        />
      )}
    </div>
  );
};

export default CalendarView;
