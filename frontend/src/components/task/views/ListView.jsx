import React, { useState } from "react";
import TaskRow from "../TaskRow";
import TaskDetailModal from "../TaskDetailModal";
import CreateTaskModal from "../CreateTaskModal";

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const StatusSection = ({ status, tasks, statuses, onTaskClick, onAddTask }) => {
  const [open, setOpen] = useState(true);

  return (
    <tbody>
      <tr className="bg-gray-50 border-b border-gray-100">
        <td colSpan={5} className="py-2 pl-4 pr-2">
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
          <TaskRow key={task.id} task={task} statuses={statuses} onClick={onTaskClick} />
        ))}

      {open && (
        <tr className="border-b border-gray-50">
          <td colSpan={5} className="py-1.5 pl-10 pr-2">
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
        <span className="text-xs text-gray-400">{tasks.length} tasks</span>
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
            </tr>
          </thead>

          {statuses.map((status) => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] ?? []}
              statuses={statuses}
              onTaskClick={(t) => setSelectedTaskId(t.id)}
              onAddTask={(statusId) => setCreateForStatus(statusId)}
            />
          ))}

          <tbody>
            <tr>
              <td colSpan={5} className="py-3 pl-4">
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
