import React, { useEffect, useState } from "react";
import TaskRow from "../TaskRow";
import TaskDetailModal from "../TaskDetailModal";
import InlineTaskRow from "../InlineTaskRow";
import customFieldService from "@/services/customFieldService";
import AddCustomFieldModal from "@/components/customFields/AddCustomFieldModal";

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

// ─── Field type icons (Asana-style) ───────────────────────────────────────────

const FIELD_TYPE_ICONS = {
  text:     <span className="font-bold text-[10px]">T</span>,
  number:   <span className="font-bold text-[10px]">#</span>,
  dropdown: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  date:     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  user:     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>,
};

// ─── Status section ────────────────────────────────────────────────────────────

const StatusSection = ({
  status,
  tasks,
  customFields,
  visibleFieldIds,
  fieldValuesMap,
  projectId,
  projectMembers,
  inlineStatusId,
  onUpdated,
  onAddTask,
  onOpenDetail,
  onInlineCreated,
  onInlineBeforeCreate,
  onInlineSilentSave,
  onInlineClose,
}) => {
  const [open, setOpen] = useState(true);
  // +1 for the trailing spacer th cell
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

      {/* Existing task rows */}
      {open &&
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            projectId={projectId}
            projectMembers={projectMembers}
            customFields={customFields}
            visibleFieldIds={visibleFieldIds}
            fieldValues={fieldValuesMap[task.id] ?? []}
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
          onBeforeCreate={onInlineBeforeCreate}
          onSilentSave={onInlineSilentSave}
          onClose={onInlineClose}
          onOpenDetail={onOpenDetail}
        />
      )}

      {/* "Add task…" trigger */}
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
  customFieldsVersion = 0,
  onTaskCreated,
  onTaskUpdated,
  onTaskBeforeCreate,
  onTaskSilentSave,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [inlineStatusId, setInlineStatusId] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);
  const [fieldValuesMap, setFieldValuesMap] = useState({});
  const [showAddField, setShowAddField] = useState(false);

  // Fetch custom field definitions — re-runs when a field is added/removed
  useEffect(() => {
    if (!projectId) return;
    customFieldService
      .getProjectFields(projectId)
      .then((res) => {
        const fields = res.data.data ?? [];
        setCustomFields(fields);
        // Auto-show any field not yet in visibleFieldIds (includes first load and new fields)
        setVisibleFieldIds((prev) => {
          const existing = new Set(prev);
          const added = fields.filter((f) => !existing.has(f.id)).map((f) => f.id);
          return added.length > 0 ? [...prev, ...added] : prev;
        });
      })
      .catch(() => {});
  }, [projectId, customFieldsVersion]);

  // Fetch all custom field values for the project in one request
  useEffect(() => {
    if (!projectId) return;
    customFieldService
      .getProjectFieldValues(projectId)
      .then((res) => {
        setFieldValuesMap(res.data.data ?? {});
      })
      .catch(() => {});
  }, [projectId, customFieldsVersion]);

  const handleFieldCreated = (field) => {
    setCustomFields((prev) => [...prev, field]);
    setVisibleFieldIds((prev) => [...prev, field.id]);
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
    setInlineStatusId(null);
  };

  const handleInlineBeforeCreate = () => onTaskBeforeCreate?.();
  const handleInlineSilentSave = (taskId) => onTaskSilentSave?.(taskId);

  const handleOpenDetail = (taskId) => {
    setInlineStatusId(null);
    setSelectedTaskId(taskId);
  };

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
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              {/* Name — fixed wide column */}
              <th className="text-left text-xs font-medium text-gray-500 py-2 pl-10 pr-2 w-125 border-r border-gray-200">
                Name
              </th>
              {/* Assignee */}
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-[160px] border-r border-gray-200">
                Assignee
              </th>
              {/* Due date */}
              <th className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-[110px] border-r border-gray-200">
                Due date
              </th>

              {/* Visible custom field columns */}
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="text-left text-xs font-medium text-gray-500 py-2 px-3 w-28 whitespace-nowrap border-r border-gray-200"
                >
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">{FIELD_TYPE_ICONS[field.type]}</span>
                    {field.name}
                  </span>
                </th>
              ))}

              {/* + button — add custom field */}
              <th className="py-2 px-2 w-8 text-right">
                <button
                  onClick={() => setShowAddField(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded hover:bg-gray-100"
                  title="Add custom field"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </th>
              {/* spacer */}
              <th />
            </tr>
          </thead>

          {statuses.map((status) => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] ?? []}
              customFields={customFields}
              visibleFieldIds={visibleFieldIds}
              fieldValuesMap={fieldValuesMap}
              projectId={projectId}
              projectMembers={projectMembers}
              inlineStatusId={inlineStatusId}
              onUpdated={onTaskUpdated}
              onAddTask={handleAddTask}
              onOpenDetail={handleOpenDetail}
              onInlineCreated={handleInlineCreated}
              onInlineBeforeCreate={handleInlineBeforeCreate}
              onInlineSilentSave={handleInlineSilentSave}
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

      {/* Add custom field modal */}
      {showAddField && (
        <AddCustomFieldModal
          projectId={projectId}
          onCreated={handleFieldCreated}
          onClose={() => setShowAddField(false)}
        />
      )}

      {/* Task detail side panel */}
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
