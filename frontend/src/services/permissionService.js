import api from "./api";

const permissionService = {
  getMyPermissions: (orgId, projectId = null) => {
    const params = projectId ? { projectId } : {};
    return api.get(`/organizations/${orgId}/my-permissions`, { params });
  },

  getOrgRoles: (orgId) => api.get(`/organizations/${orgId}/roles`),

  createRole: (orgId, data) => api.post(`/organizations/${orgId}/roles`, data),

  updateRole: (orgId, roleId, data) =>
    api.put(`/organizations/${orgId}/roles/${roleId}`, data),

  deleteRole: (orgId, roleId) =>
    api.delete(`/organizations/${orgId}/roles/${roleId}`),

  assignOrgRole: (orgId, userId, roleId) =>
    api.put(`/organizations/${orgId}/members/${userId}/role`, { roleId }),

  assignProjectRole: (projectId, userId, roleId) =>
    api.put(`/projects/${projectId}/members/${userId}/role`, { roleId }),
};

export default permissionService;
