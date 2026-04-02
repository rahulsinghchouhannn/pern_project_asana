import React, { useEffect, useState } from "react";
import TaskRow from "../TaskRow";
import TaskDetailModal from "../TaskDetailModal";
import CreateTaskModal from "../CreateTaskModal";
import customFieldService from "@/services/customFieldService";

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Render a custom field cell value inline (read-only display in table)
const FieldCell = ({ field, value }) => {
  if (!value) return <span className="text-gray-300">—</span>;

  switch (field.type) {
    case "text":
      return <span className="truncate">{value.valueText ?? "—"}</span>;
    case "number":
      return <span>{value.valueNumber ?? "—"}</span>;
    case "date":
      return (
        <span>
          {value.valueDate
            ? new Date(value.valueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—"}
        </span>
      );
    case "dropdown": {
      if (!value.valueOption) return <span className="text-gray-300">—</span>;
      const options = field.options ?? [];
      const opt = options.find((o) => o.value === value.valueOption);
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: opt?.color ? opt.color + "22" : "#e5e7eb",
            color: opt?.color ?? "#6b7280",
          }}
        >
          {value.valueOption}
        </span>
      );
    }
    case "user":
      return <span className="truncate">{value.valueUserId ? "Assigned" : "—"}</span>;
    default:
      return <span className="text-gray-300">—</span>;
  }
};

const StatusSection = ({ status, tasks, statuses, customFields, visibleFieldIds, onTaskClick, onAddTask }) => {
  const [open, setOpen] = useState(true);
  const colSpan = 5 + visibleFieldIds.length;

  return (
    <tbody>
      <tr className="bg-gray-50 border-b border-gray-100">
        <td colSpan={colSpan} className="py-2 pl-4 pr-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5">
              <ChevronIcon open={open} />
              <span className="text-xs font-semibold text-gray-700">{status.name}</span>
            </button>
            <span
              className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: (status.color ?? "#E0E0E0") + "33", color: status.color ?? "#666" }}
            >
              {tasks.length}
            </span>
          </div>
        </td>
      </tr>

      {open &&
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            statuses={statuses}
            onClick={onTaskClick}
            customFields={customFields}
            visibleFieldIds={visibleFieldIds}
          />
        ))}

      {open && (
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

const ListView = ({
  projectId,
  tasks = [],
  statuses = [],
  projectMembers = [],
  onTaskCreated,
  onTaskUpdated,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createForStatus, setCreateForStatus] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    customFieldService
      .getProjectFields(projectId)
      .then((res) => {
        const fields = res.data.data ?? [];
        setCustomFields(fields);
        // All fields visible by default
        setVisibleFieldIds(fields.map((f) => f.id));
      })
      .catch(console.error);
  }, [projectId]);

  const toggleFieldVisibility = (fieldId) => {
    setVisibleFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const visibleFields = customFields.filter((f) => visibleFieldIds.includes(f.id));

  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter((t) => t.statusId === status.id);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setCreateForStatus(statuses[0]?.id ?? null)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>

        <div className="flex items-center gap-2">
          {customFields.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCustomize((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Columns
              </button>

              {showCustomize && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-30 p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Toggle columns</p>
                  {customFields.map((field) => (
                    <label key={field.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleFieldIds.includes(field.id)}
                        onChange={() => toggleFieldVisibility(field.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-700">{field.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <span className="text-xs text-gray-400">{tasks.length} tasks</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 py-2 pl-10 pr-2">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-2 w-20">Assignee</th>
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-2 w-28">Due date</th>
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-2 w-24">Priority</th>
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-2 w-24">Status</th>
              {visibleFields.map((field) => (
                <th key={field.id} className="text-left text-xs font-medium text-gray-500 py-2 px-2 w-28 whitespace-nowrap">
                  {field.name}
                </th>
              ))}
            </tr>
          </thead>

          {statuses.map((status) => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] ?? []}
              statuses={statuses}
              customFields={customFields}
              visibleFieldIds={visibleFieldIds}
              onTaskClick={(t) => setSelectedTaskId(t.id)}
              onAddTask={(statusId) => setCreateForStatus(statusId)}
            />
          ))}

          <tbody>
            <tr>
              <td colSpan={5 + visibleFields.length} className="py-3 pl-4">
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

      {createForStatus && (
        <CreateTaskModal
          projectId={projectId}
          statuses={statuses}
          defaultStatusId={createForStatus}
          onCreated={(task) => { onTaskCreated?.(task); setCreateForStatus(null); }}
          onClose={() => setCreateForStatus(null)}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={projectId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(task) => { onTaskUpdated?.(task); }}
        />
      )}
    </div>
  );
};

export default ListView;
