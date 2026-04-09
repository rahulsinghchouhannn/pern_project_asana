import api, { getOrgHeader } from "./api";

const timeEntryService = {
  /**
   * Add a time entry (manual or from stopped timer).
   * body: { durationMinutes: number, source: "manual" | "timer" }
   */
  addTimeEntry: (taskId, fieldId, body) =>
    api.post(`/tasks/${taskId}/time-entries/${fieldId}`, body, {
      headers: getOrgHeader(),
    }),

  /** Get all time entries for a task's actual_time field, with user info. */
  getTaskTimeEntries: (taskId, fieldId) =>
    api.get(`/tasks/${taskId}/time-entries/${fieldId}`, {
      headers: getOrgHeader(),
    }),
};

export default timeEntryService;
