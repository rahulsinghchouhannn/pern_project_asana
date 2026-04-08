import { useState, useRef, useEffect } from "react";
import sectionService from "@/services/sectionService";

/**
 * SectionRow — collapsible section header rendered as a <tr> inside the list table.
 *
 * Props:
 *  section          – { id, name, position }
 *  projectId        – UUID
 *  taskCount        – number of tasks in this section (shown when collapsed)
 *  collapsed        – boolean controlled by parent
 *  onToggle()       – toggle collapsed state in parent
 *  onUpdated(s)     – called after section rename persists
 *  onDeleteOnly()   – called when "Delete section only" is confirmed
 *  onDeleteWithTasks() – called when "Delete section and all tasks" is confirmed
 *  onAddTask()      – called when "+" is clicked
 *  colCount         – total column count (for colSpan)
 *  dragHandleProps  – @hello-pangea/dnd drag handle props (optional)
 */
const SectionRow = ({
  section,
  projectId,
  taskCount = 0,
  collapsed,
  onToggle,
  onUpdated,
  onDeleteOnly,
  onDeleteWithTasks,
  onAddTask,
  onMoveUp,
  onMoveDown,
  colCount = 4,
  dragHandleProps,
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [showMenu, setShowMenu] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  // Track the saved name so Escape can revert
  const savedNameRef = useRef(section.name);

  // Sync name when section prop changes (socket update from another user)
  useEffect(() => {
    if (!editing) {
      setName(section.name);
      savedNameRef.current = section.name;
    }
  }, [section.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const startEdit = () => {
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const saveName = async (value) => {
    const trimmed = value.trim() || "Untitled section";
    setName(trimmed);
    savedNameRef.current = trimmed;
    try {
      const res = await sectionService.updateSection(projectId, section.id, { name: trimmed });
      onUpdated?.(res.data.data);
    } catch {}
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveName(val), 500);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      saveName(name);
      setEditing(false);
    }
    if (e.key === "Escape") {
      clearTimeout(debounceRef.current);
      setName(savedNameRef.current);
      setEditing(false);
    }
  };

  const handleNameBlur = () => {
    clearTimeout(debounceRef.current);
    saveName(name);
    setEditing(false);
  };

  return (
    <tr className="group/section border-t-2 border-b border-gray-200 bg-gray-50/60">
      <td colSpan={colCount + 1} className="py-0 pr-2">
        <div className="flex items-center h-9 gap-1">
          {/* Section drag handle */}
          {dragHandleProps && (
            <span
              {...dragHandleProps}
              className="shrink-0 opacity-0 group-hover/section:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-opacity select-none px-1"
              title="Drag to reorder section"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
              </svg>
            </span>
          )}

          {/* Collapse arrow */}
          <button
            onClick={onToggle}
            className="shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
            title={collapsed ? "Expand section" : "Collapse section"}
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${collapsed ? "-rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Section name — inline edit */}
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameBlur}
              className="flex-1 text-sm font-semibold text-gray-700 bg-white border border-indigo-300 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-300 min-w-0 max-w-xs"
            />
          ) : (
            <button
              onClick={startEdit}
              className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors text-left truncate max-w-xs"
              title="Click to rename"
            >
              {name}
            </button>
          )}

          {/* Task count badge — always visible when collapsed, visible on hover otherwise */}
          {(collapsed || taskCount > 0) && (
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium
              ${collapsed
                ? "bg-gray-200 text-gray-600"
                : "bg-gray-100 text-gray-500 opacity-0 group-hover/section:opacity-100 transition-opacity"
              }`}
            >
              {taskCount}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quick add task button */}
          <button
            onClick={onAddTask}
            className="shrink-0 opacity-0 group-hover/section:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-indigo-600"
            title="Add task to section"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* ... menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="opacity-0 group-hover/section:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              title="Section options"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-30 py-1">
                <button
                  onClick={() => { setShowMenu(false); startEdit(); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename
                </button>

                {(onMoveUp || onMoveDown) && <div className="my-1 border-t border-gray-100" />}

                {onMoveUp && (
                  <button
                    onClick={() => { setShowMenu(false); onMoveUp(); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Move up
                  </button>
                )}

                {onMoveDown && (
                  <button
                    onClick={() => { setShowMenu(false); onMoveDown(); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Move down
                  </button>
                )}

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={() => { setShowMenu(false); onDeleteOnly?.(); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete section only
                </button>

                <button
                  onClick={() => { setShowMenu(false); onDeleteWithTasks?.(); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete section and all tasks
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default SectionRow;
