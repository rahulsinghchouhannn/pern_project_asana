import React, { useEffect, useState } from "react";
import TaskRow from "../TaskRow";
import TaskDetailModal from "../TaskDetailModal";
import InlineTaskRow from "../InlineTaskRow";
import customFieldService from "@/services/customFieldService";

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Status section ────────────────────────────────────────────────────────────

const StatusSection = ({
  status,
  tasks,
  customFields,
  visibleFieldIds,
  projectId,
  projectMembers,
  inlineStatusId,
  onUpdated,
  onAddTask,
  onOpenDetail,
  onInlineCreated,
  onInlineClose,
}) => {
  const [open, setOpen] = useState(true);
  // +1 for the trailing "+" th cell
  const colSpan = 3 + visibleFieldIds.length + 1;

  return (
    <tbody>
      {/* Section header */}
      <tr className="bg-gray-50 border-b border-gray-100">
        <td colSpan={colSpan} className="py-2 pl-4 pr-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5"
            >
              <ChevronIcon open={open} />
              <span className="text-xs font-semibold text-gray-700">{status.name}</span>
            </button>
            <span
              className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: (status.color ?? "#E0E0E0") + "33",
                color: status.color ?? "#666",
              }}
            >
              {tasks.length}
            </span>
          </div>
        </td>
      </tr>

      {/* Existing task rows — inline editable */}
      {open &&
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            projectId={projectId}
            projectMembers={projectMembers}
            customFields={customFields}
            visibleFieldIds={visibleFieldIds}
            onUpdated={onUpdated}
            onOpenDetail={onOpenDetail}
          />
        ))}

      {/* Inline new-task row */}
      {open && inlineStatusId === status.id && (
        <InlineTaskRow
          key={`inline-${status.id}`}
          statusId={status.id}
          projectId={projectId}
          projectMembers={projectMembers}
          colCount={3 + visibleFieldIds.length}
          onCreated={onInlineCreated}
          onClose={onInlineClose}
          onOpenDetail={onOpenDetail}
        />
      )}

      {/* "Add task…" secondary trigger */}
      {open && inlineStatusId !== status.id && (
        <tr className="border-b border-gray-50">
          <td colSpan={colSpan} className="py-1.5 pl-10 pr-2">
            <button
              onClick={() => onAddTask(status.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add task…
            </button>
          </td>
        </tr>
      )}
    </tbody>
  );
};

// ─── Main ListView ─────────────────────────────────────────────────────────────

const ListView = ({
  projectId,
  tasks = [],
  statuses = [],
  projectMembers = [],
  onTaskCreated,
  onTaskUpdated,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [inlineStatusId, setInlineStatusId] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    customFieldService
      .getProjectFields(projectId)
      .then((res) => {
        const fields = res.data.data ?? [];
        setCustomFields(fields);
        setVisibleFieldIds([]); // no custom fields visible by default
      })
      .catch(() => {});
  }, [projectId]);

  const toggleField = (fieldId) => {
    setVisibleFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const visibleFields = customFields.filter((f) => visibleFieldIds.includes(f.id));

  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter((t) => t.statusId === status.id);
    return acc;
  }, {});

  const handleAddTask = (statusId) => setInlineStatusId(statusId);
  const handleInlineClose = () => setInlineStatusId(null);

  const handleInlineCreated = (newTask) => {
    onTaskCreated?.(newTask);
    // Row stays open so user can keep typing another task
  };

  const handleOpenDetail = (taskId) => {
    setInlineStatusId(null);
    setSelectedTaskId(taskId);
  };

  // Footer colSpan = Name + Assignee + Due date + custom fields + "+" column
  const footerColSpan = 3 + visibleFields.length + 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <button
          onClick={() => handleAddTask(statuses[0]?.id ?? null)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
        <span className="text-xs text-gray-400">{tasks.length} tasks</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              {/* Name — takes all remaining space */}
              <th className="text-left text-xs font-medium text-gray-500 py-2 pl-10 pr-2">
                Name
              </th>
              {/* Assignee — fixed 120px */}
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-[120px]">
                Assignee
              </th>
              {/* Due date — fixed 100px */}
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-[100px]">
                Due date
              </th>

              {/* Visible custom field columns */}
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-28 whitespace-nowrap"
                >
                  {field.name}
                </th>
              ))}

              {/* + button — add custom columns */}
              <th className="py-2 px-2 w-8 text-right">
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowColumnMenu((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded hover:bg-gray-100"
                    title="Add column"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  {showColumnMenu && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-30 p-3">
                      {customFields.length === 0 ? (
                        <p className="text-xs text-gray-400">No custom fields yet.</p>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Toggle columns</p>
                          {customFields.map((field) => (
                            <label key={field.id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={visibleFieldIds.includes(field.id)}
                                onChange={() => toggleField(field.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs text-gray-700">{field.name}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          {statuses.map((status) => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] ?? []}
              customFields={customFields}
              visibleFieldIds={visibleFieldIds}
              projectId={projectId}
              projectMembers={projectMembers}
              inlineStatusId={inlineStatusId}
              onUpdated={onTaskUpdated}
              onAddTask={handleAddTask}
              onOpenDetail={handleOpenDetail}
              onInlineCreated={handleInlineCreated}
              onInlineClose={handleInlineClose}
            />
          ))}

          {/* Add section footer */}
          <tbody>
            <tr>
              <td colSpan={footerColSpan} className="py-3 pl-4">
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add section
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Task detail side panel — opened only via the row's arrow button */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={projectId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(task) => onTaskUpdated?.(task)}
        />
      )}
    </div>
  );
};

export default ListView;
