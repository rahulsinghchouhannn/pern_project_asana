import api, { getOrgHeader } from "./api";

const customFieldService = {
  // ── Project fields ────────────────────────────────────────────────────────
  getProjectFields: (projectId) =>
    api.get(`/projects/${projectId}/custom-fields`, { headers: getOrgHeader() }),

  createField: (projectId, data) =>
    api.post(`/projects/${projectId}/custom-fields`, data, { headers: getOrgHeader() }),

  updateField: (projectId, fieldId, data) =>
    api.put(`/projects/${projectId}/custom-fields/${fieldId}`, data, { headers: getOrgHeader() }),

  deleteField: (projectId, fieldId) =>
    api.delete(`/projects/${projectId}/custom-fields/${fieldId}`, { headers: getOrgHeader() }),

  reorderFields: (projectId, orderedIds) =>
    api.post(`/projects/${projectId}/custom-fields/reorder`, { orderedIds }, { headers: getOrgHeader() }),

  // ── Task field values ─────────────────────────────────────────────────────
  getProjectFieldValues: (projectId) =>
    api.get(`/projects/${projectId}/custom-fields/values`, { headers: getOrgHeader() }),

  getTaskFieldValues: (taskId) =>
    api.get(`/tasks/${taskId}/custom-field-values`, { headers: getOrgHeader() }),

  setTaskFieldValue: (taskId, fieldId, valueData) =>
    api.put(`/tasks/${taskId}/custom-field-values/${fieldId}`, valueData, { headers: getOrgHeader() }),
};

export default customFieldService;
