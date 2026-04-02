const asyncHandler = require("../middleware/asyncHandler");
const userService = require("../services/userService");
const activityService = require("../services/activityService");
const successResponse = require("../utils/successResponse");
const errorResponse = require("../utils/errorResponse");

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }
  res.status(200).json(successResponse(user));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const result = await userService.getAllUsers({ limit, offset });
  res.status(200).json(successResponse(result));
});

const getUserActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const activity = await activityService.getUserActivity(req.user.userId, req.org.orgId, limit);
  res.status(200).json(successResponse(activity));
});

const archiveAll = asyncHandler(async (req, res) => {
  await activityService.archiveAll(req.user.userId, req.org.orgId);
  res.status(200).json(successResponse({ archived: true }));
});

const markActivityRead = asyncHandler(async (req, res) => {
  await activityService.markRead(req.params.id, req.user.userId);
  res.status(200).json(successResponse({ read: true }));
});

module.exports = { getMe, getAllUsers, getUserActivity, archiveAll, markActivityRead };
