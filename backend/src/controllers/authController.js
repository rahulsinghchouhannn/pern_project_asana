const asyncHandler = require("../middleware/asyncHandler");
const authService = require("../services/authService");
const successResponse = require("../utils/successResponse");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.validated);
  res.status(201).json(successResponse(user));
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated);
  res.status(200).json(successResponse(result));
});

module.exports = { register, login };
