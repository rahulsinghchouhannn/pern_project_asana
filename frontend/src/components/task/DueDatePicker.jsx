import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const isToday = (date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
};

// Picker width matches w-72 (288px); estimated height ~300px
const PICKER_W = 288;
const PICKER_H = 304;

const DueDatePicker = ({ value, onChange, onClose, anchorEl }) => {
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value) : new Date()));
  const [style, setStyle] = useState({});
  const ref = useRef(null);

  // Compute fixed position from anchor element
  useEffect(() => {
    if (!anchorEl) return;

    const updatePos = () => {
      const rect = anchorEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow < PICKER_H + 8 ? rect.top - PICKER_H - 4 : rect.bottom + 4;
      const left = Math.min(rect.left, window.innerWidth - PICKER_W - 8);
      setStyle({ position: "fixed", top, left, zIndex: 9999 });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [anchorEl]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selected = value ? new Date(value) : null;

  const handleDayClick = (date) => {
    onChange?.(date);
    onClose?.();
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const content = (
    <div
      ref={ref}
      className="bg-white rounded-xl shadow-xl border border-gray-200 w-72 p-3"
      style={
        anchorEl
          ? style
          : { position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 50 }
      }
    >
      {/* Start date / Due date toggle */}
      <div className="flex gap-2 mb-3">
        <button className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          + Start date
        </button>
        <button className="flex-1 text-xs py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 font-medium">
          Due date
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const todayCell = isToday(date);
          const sel = isSameDay(date, selected);
          return (
            <button
              key={i}
              onClick={() => handleDayClick(date)}
              className={`
                flex items-center justify-center text-xs rounded-full mx-auto w-7 h-7 transition-colors
                ${sel
                  ? "bg-indigo-600 text-white font-semibold"
                  : todayCell
                  ? "border-2 border-indigo-500 text-indigo-600 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
            title="Add time"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
            title="Repeat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => { onChange?.(null); onClose?.(); }}
          className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );

  if (anchorEl) {
    return ReactDOM.createPortal(content, document.body);
  }
  return content;
};

export default DueDatePicker;
