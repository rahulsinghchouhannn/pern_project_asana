import api, { getOrgHeader } from "./api";

const activityService = {
  getTaskActivity: (taskId) =>
    api.get(`/tasks/${taskId}/activity`, { headers: getOrgHeader() }),

  getProjectActivity: (projectId) =>
    api.get(`/projects/${projectId}/activity`, { headers: getOrgHeader() }),

  getUserActivity: (params = {}) =>
    api.get(`/users/me/activity`, { headers: getOrgHeader(), params }),

  archiveAll: () =>
    api.post(`/users/me/activity/archive-all`, {}, { headers: getOrgHeader() }),

  markRead: (activityId) =>
    api.patch(`/users/activity/${activityId}/read`, {}, { headers: getOrgHeader() }),
};

export default activityService;
