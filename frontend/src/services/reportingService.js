import api from "./api";

const reportingService = {
  getOrgDashboard: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.projectId) params.set("projectId", filters.projectId);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return api.get(`/reporting/dashboard?${params.toString()}`);
  },

  getProjectDashboard: (projectId) =>
    api.get(`/reporting/projects/${projectId}/dashboard`),
};

export default reportingService;
