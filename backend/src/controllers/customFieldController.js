const asyncHandler = require("../middleware/asyncHandler");
const successResponse = require("../utils/successResponse");
const customFieldService = require("../services/customFieldService");
const taskService = require("../services/taskService");
const { emitToProject } = require("../config/socket");

// GET /api/projects/:projectId/custom-fields
const getProjectFields = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const fields = await customFieldService.getProjectFields(projectId);
  res.json(successResponse(fields));
});

// POST /api/projects/:projectId/custom-fields
const createField = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const field = await customFieldService.createField(projectId, userId, req.validated);
  res.status(201).json(successResponse(field));
});

// PUT /api/projects/:projectId/custom-fields/:fieldId
const updateField = asyncHandler(async (req, res) => {
  const { fieldId } = req.params;
  const field = await customFieldService.updateField(fieldId, req.validated);
  res.json(successResponse(field));
});

// DELETE /api/projects/:projectId/custom-fields/:fieldId
const deleteField = asyncHandler(async (req, res) => {
  const { fieldId } = req.params;
  await customFieldService.deleteField(fieldId);
  res.json(successResponse({ deleted: true }));
});

// POST /api/projects/:projectId/custom-fields/reorder
const reorderFields = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await customFieldService.reorderFields(projectId, req.validated.orderedIds);
  res.json(successResponse({ reordered: true }));
});

// GET /api/projects/:projectId/custom-fields/values
const getProjectFieldValues = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const map = await customFieldService.getProjectTaskFieldValues(projectId);
  res.json(successResponse(map));
});

// GET /api/tasks/:taskId/custom-field-values
const getTaskFieldValues = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const values = await customFieldService.getTaskFieldValues(taskId);
  res.json(successResponse(values));
});

// PUT /api/tasks/:taskId/custom-field-values/:fieldId
const setTaskFieldValue = asyncHandler(async (req, res) => {
  const { taskId, fieldId } = req.params;
  const value = await customFieldService.setTaskFieldValue(taskId, fieldId, req.validated);
  res.json(successResponse(value));
  // Fire-and-forget: broadcast updated task so all clients reflect the new field value
  taskService.getTaskById(taskId)
    .then((fullTask) => emitToProject(fullTask.projectId, "task:updated", fullTask))
    .catch(() => {});
});

module.exports = {
  getProjectFields,
  getProjectFieldValues,
  createField,
  updateField,
  deleteField,
  reorderFields,
  getTaskFieldValues,
  setTaskFieldValue,
};
