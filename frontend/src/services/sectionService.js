import api, { getOrgHeader } from "./api";

const sectionService = {
  // List all sections for a project (ordered by position)
  getSections: (projectId) =>
    api.get(`/projects/${projectId}/sections`, { headers: getOrgHeader() }),

  // Create a new section
  createSection: (projectId, data = {}) =>
    api.post(`/projects/${projectId}/sections`, data, { headers: getOrgHeader() }),

  // Rename or reposition a single section
  updateSection: (projectId, sectionId, data) =>
    api.patch(`/projects/${projectId}/sections/${sectionId}`, data, { headers: getOrgHeader() }),

  // Bulk-reorder sections by providing the new ordered array of IDs
  reorderSections: (projectId, sectionIds) =>
    api.post(`/projects/${projectId}/sections/reorder`, { sectionIds }, { headers: getOrgHeader() }),

  // Delete section only — tasks become unsectioned
  deleteSection: (projectId, sectionId) =>
    api.delete(`/projects/${projectId}/sections/${sectionId}`, { headers: getOrgHeader() }),

  // Delete section AND all tasks inside it
  deleteSectionWithTasks: (projectId, sectionId) =>
    api.delete(`/projects/${projectId}/sections/${sectionId}/with-tasks`, { headers: getOrgHeader() }),

  // Get the number of tasks inside a section (used by confirmation dialog)
  getSectionTaskCount: (projectId, sectionId) =>
    api.get(`/projects/${projectId}/sections/${sectionId}/task-count`, { headers: getOrgHeader() }),
};

export default sectionService;
