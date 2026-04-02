import api, { getOrgHeader } from "./api";

const taskService = {
  // ── Project tasks ────────────────────────────────────────────────────────
  createTask: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data, { headers: getOrgHeader() }),

  getProjectTasks: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/tasks`, { headers: getOrgHeader(), params }),

  // ── Single task ──────────────────────────────────────────────────────────
  getTaskById: (taskId) =>
    api.get(`/tasks/${taskId}`, { headers: getOrgHeader() }),

  updateTask: (taskId, data) =>
    api.put(`/tasks/${taskId}`, data, { headers: getOrgHeader() }),

  deleteTask: (taskId) =>
    api.delete(`/tasks/${taskId}`, { headers: getOrgHeader() }),

  completeTask: (taskId) =>
    api.post(`/tasks/${taskId}/complete`, {}, { headers: getOrgHeader() }),

  reopenTask: (taskId) =>
    api.post(`/tasks/${taskId}/reopen`, {}, { headers: getOrgHeader() }),

  // ── Assignees ────────────────────────────────────────────────────────────
  addAssignee: (taskId, userId) =>
    api.post(`/tasks/${taskId}/assignees`, { userId }, { headers: getOrgHeader() }),

  removeAssignee: (taskId, userId) =>
    api.delete(`/tasks/${taskId}/assignees/${userId}`, { headers: getOrgHeader() }),

  // ── Position / Kanban ────────────────────────────────────────────────────
  updatePosition: (taskId, statusId, position) =>
    api.patch(`/tasks/${taskId}/position`, { statusId, position }, { headers: getOrgHeader() }),

  bulkUpdatePositions: (updates) =>
    api.post(`/tasks/bulk-position`, { updates }, { headers: getOrgHeader() }),

  // ── Subtasks / History ───────────────────────────────────────────────────
  getSubtasks: (taskId) =>
    api.get(`/tasks/${taskId}/subtasks`, { headers: getOrgHeader() }),

  getTaskHistory: (taskId) =>
    api.get(`/tasks/${taskId}/history`, { headers: getOrgHeader() }),

  // ── My Tasks ─────────────────────────────────────────────────────────────
  getMyTasks: () =>
    api.get(`/tasks/my`, { headers: getOrgHeader() }),

  // ── View-specific endpoints ───────────────────────────────────────────────
  getBoardTasks: (projectId) =>
    api.get(`/projects/${projectId}/tasks/board`, { headers: getOrgHeader() }),

  getCalendarTasks: (projectId, year, month) =>
    api.get(`/projects/${projectId}/tasks/calendar`, {
      headers: getOrgHeader(),
      params: { year, month },
    }),

  getTimelineTasks: (projectId) =>
    api.get(`/projects/${projectId}/tasks/timeline`, { headers: getOrgHeader() }),

  updateTaskDates: (taskId, data) =>
    api.patch(`/tasks/${taskId}/dates`, data, { headers: getOrgHeader() }),
};

export default taskService;
