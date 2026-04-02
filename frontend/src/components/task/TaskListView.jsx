import React, { useEffect, useState, useCallback } from "react";
import taskService from "@/services/taskService";
import usePermissions from "@/hooks/usePermissions";
import TaskRow from "./TaskRow";
import TaskDetailModal from "./TaskDetailModal";
import CreateTaskModal from "./CreateTaskModal";

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

const StatusSection = ({ status, tasks, statuses, projectMembers, onTaskClick, onAddTask }) => {
  const [open, setOpen] = useState(true);

  return (
    <tbody>
      {/* Section header */}
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

      {/* Task rows */}
      {open &&
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            statuses={statuses}
            onClick={onTaskClick}
          />
        ))}

      {/* Add task row */}
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

const TaskListView = ({ project, statuses = [], projectMembers = [] }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createForStatus, setCreateForStatus] = useState(null);
  const { can } = usePermissions(project?.id);

  const loadTasks = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await taskService.getProjectTasks(project.id, { limit: 100 });
      setTasks(res.data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask } : t))
    );
  };

  // Group tasks by status, maintaining status order
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter((t) => t.statusId === status.id);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading tasks…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {can("create_task") && (
            <button
              onClick={() => setCreateForStatus(statuses[0]?.id ?? null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>{tasks.length} tasks</span>
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
            </tr>
          </thead>

          {statuses.map((status) => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] ?? []}
              statuses={statuses}
              projectMembers={projectMembers}
              onTaskClick={(t) => setSelectedTaskId(t.id)}
              onAddTask={(statusId) => setCreateForStatus(statusId)}
            />
          ))}

          {/* Add section row */}
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

      {/* Create task modal */}
      {createForStatus && (
        <CreateTaskModal
          projectId={project.id}
          statuses={statuses}
          defaultStatusId={createForStatus}
          onCreated={handleTaskCreated}
          onClose={() => setCreateForStatus(null)}
        />
      )}

      {/* Task detail panel */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          statuses={statuses}
          projectMembers={projectMembers}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default TaskListView;
