const asyncHandler = require("../middleware/asyncHandler");
const activityService = require("../services/activityService");
const successResponse = require("../utils/successResponse");

const getTaskActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const activity = await activityService.getTaskActivity(req.params.taskId, limit);
  res.status(200).json(successResponse(activity));
});

const getProjectActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const activity = await activityService.getProjectActivity(req.params.projectId, limit);
  res.status(200).json(successResponse(activity));
});

module.exports = { getTaskActivity, getProjectActivity };
