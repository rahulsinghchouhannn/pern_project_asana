const asyncHandler = require("../middleware/asyncHandler");
const taskService = require("../services/taskService");
const successResponse = require("../utils/successResponse");

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.params.projectId,
    req.org.orgId,
    req.user.userId,
    req.validated
  );
  res.status(201).json(successResponse(task));
});

const listByProject = asyncHandler(async (req, res) => {
  const tasks = await taskService.getProjectTasks(req.params.projectId, req.validated);
  res.status(200).json(successResponse(tasks));
});

const getById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  res.status(200).json(successResponse(task));
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.id,
    req.user.userId,
    req.validated
  );
  res.status(200).json(successResponse(task));
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);
  res.status(200).json(successResponse({ deleted: true }));
});

const complete = asyncHandler(async (req, res) => {
  const task = await taskService.completeTask(req.params.id, req.user.userId);
  res.status(200).json(successResponse(task));
});

const reopen = asyncHandler(async (req, res) => {
  const task = await taskService.reopenTask(req.params.id, req.user.userId);
  res.status(200).json(successResponse(task));
});

const addAssignee = asyncHandler(async (req, res) => {
  const task = await taskService.addAssignee(
    req.params.id,
    req.validated.userId,
    req.user.userId
  );
  res.status(201).json(successResponse(task));
});

const removeAssignee = asyncHandler(async (req, res) => {
  await taskService.removeAssignee(req.params.id, req.params.userId, req.user.userId);
  res.status(200).json(successResponse({ removed: true }));
});

const updatePosition = asyncHandler(async (req, res) => {
  await taskService.updateTaskPosition(
    req.params.id,
    req.validated.statusId,
    req.validated.position
  );
  res.status(200).json(successResponse({ updated: true }));
});

const bulkUpdatePositions = asyncHandler(async (req, res) => {
  await taskService.bulkUpdatePositions(req.validated.updates);
  res.status(200).json(successResponse({ updated: true }));
});

const getSubtasks = asyncHandler(async (req, res) => {
  const subtasks = await taskService.getSubtasks(req.params.id);
  res.status(200).json(successResponse(subtasks));
});

const getHistory = asyncHandler(async (req, res) => {
  const history = await taskService.getTaskHistory(req.params.id);
  res.status(200).json(successResponse(history));
});

const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getMyTasks(req.user.userId, req.org.orgId);
  res.status(200).json(successResponse(tasks));
});

const getBoardTasks = asyncHandler(async (req, res) => {
  const columns = await taskService.getBoardTasks(req.params.projectId);
  res.status(200).json(successResponse(columns));
});

const getCalendarTasks = asyncHandler(async (req, res) => {
  const { year, month } = req.validated;
  const tasks = await taskService.getCalendarTasks(req.params.projectId, year, month);
  res.status(200).json(successResponse(tasks));
});

const getTimelineTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTimelineTasks(req.params.projectId);
  res.status(200).json(successResponse(tasks));
});

const updateTaskDates = asyncHandler(async (req, res) => {
  const result = await taskService.updateTaskDates(req.params.id, req.user.userId, req.validated);
  res.status(200).json(successResponse(result));
});

module.exports = {
  create,
  listByProject,
  getById,
  update,
  deleteTask,
  complete,
  reopen,
  addAssignee,
  removeAssignee,
  updatePosition,
  bulkUpdatePositions,
  getSubtasks,
  getHistory,
  getMyTasks,
  getBoardTasks,
  getCalendarTasks,
  getTimelineTasks,
  updateTaskDates,
};
