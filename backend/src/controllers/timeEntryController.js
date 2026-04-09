const asyncHandler = require("../middleware/asyncHandler");
const successResponse = require("../utils/successResponse");
const timeEntryService = require("../services/timeEntryService");
const taskService = require("../services/taskService");
const { emitToProject } = require("../config/socket");

// POST /api/tasks/:taskId/time-entries/:fieldId
const addTimeEntry = asyncHandler(async (req, res) => {
  const { taskId, fieldId } = req.params;
  const userId = req.user.userId;
  const { durationMinutes, source } = req.body;

  const entry = await timeEntryService.addTimeEntry(
    taskId,
    fieldId,
    userId,
    durationMinutes,
    source ?? "manual"
  );

  res.status(201).json(successResponse(entry));

  // Broadcast updated task so all list views refresh the actual time total
  taskService
    .getTaskById(taskId)
    .then((fullTask) => emitToProject(fullTask.projectId, "task:updated", fullTask))
    .catch(() => {});
});

// GET /api/tasks/:taskId/time-entries/:fieldId
const getTaskTimeEntries = asyncHandler(async (req, res) => {
  const { taskId, fieldId } = req.params;
  const entries = await timeEntryService.getTaskTimeEntries(taskId, fieldId);
  res.json(successResponse(entries));
});

module.exports = { addTimeEntry, getTaskTimeEntries };
