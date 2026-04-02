import api, { getOrgHeader } from "./api";

const projectService = {
  createProject: (data) =>
    api.post("/projects", data, { headers: getOrgHeader() }),

  getOrgProjects: () =>
    api.get("/projects", { headers: getOrgHeader() }),

  getProjectById: (projectId) =>
    api.get(`/projects/${projectId}`, { headers: getOrgHeader() }),

  updateProject: (projectId, data) =>
    api.put(`/projects/${projectId}`, data, { headers: getOrgHeader() }),

  deleteProject: (projectId) =>
    api.delete(`/projects/${projectId}`, { headers: getOrgHeader() }),

  archiveProject: (projectId) =>
    api.post(`/projects/${projectId}/archive`, {}, { headers: getOrgHeader() }),

  completeProject: (projectId) =>
    api.post(`/projects/${projectId}/complete`, {}, { headers: getOrgHeader() }),

  getMembers: (projectId) =>
    api.get(`/projects/${projectId}/members`, { headers: getOrgHeader() }),

  addMember: (projectId, data) =>
    api.post(`/projects/${projectId}/members`, data, { headers: getOrgHeader() }),

  removeMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`, { headers: getOrgHeader() }),

  getStatuses: (projectId) =>
    api.get(`/projects/${projectId}/statuses`, { headers: getOrgHeader() }),

  createStatus: (projectId, data) =>
    api.post(`/projects/${projectId}/statuses`, data, { headers: getOrgHeader() }),

  updateStatus: (projectId, statusId, data) =>
    api.put(`/projects/${projectId}/statuses/${statusId}`, data, { headers: getOrgHeader() }),

  deleteStatus: (projectId, statusId) =>
    api.delete(`/projects/${projectId}/statuses/${statusId}`, { headers: getOrgHeader() }),

  reorderStatuses: (projectId, orderedIds) =>
    api.post(`/projects/${projectId}/statuses/reorder`, { orderedIds }, { headers: getOrgHeader() }),
};

export default projectService;
