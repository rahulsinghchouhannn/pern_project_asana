const asyncHandler = require("../middleware/asyncHandler");
const userService = require("../services/userService");
const successResponse = require("../utils/successResponse");
const errorResponse = require("../utils/errorResponse");

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
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

module.exports = { getMe, getAllUsers };
