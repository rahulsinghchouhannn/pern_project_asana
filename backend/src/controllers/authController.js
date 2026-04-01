const asyncHandler = require("../middleware/asyncHandler");
const authService = require("../services/authService");
const successResponse = require("../utils/successResponse");
const errorResponse = require("../utils/errorResponse");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { users } = require("../db/schema");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated);
  res.status(201).json(successResponse(result));
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated);
  res.status(200).json(successResponse(result));
});

const requestMagicLink = asyncHandler(async (req, res) => {
  const result = await authService.requestMagicLink(req.validated.email);
  res.status(200).json(successResponse(result));
});

const verifyMagicLink = asyncHandler(async (req, res) => {
  const result = await authService.verifyMagicLink(req.validated.token);
  res.status(200).json(successResponse(result));
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.validated.refreshToken);
  res.status(200).json(successResponse(result));
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.validated.refreshToken);
  res.status(200).json(successResponse({ message: "Logged out successfully" }));
});

const getMe = asyncHandler(async (req, res) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isEmailVerified: users.isEmailVerified,
      lastActiveOrgId: users.lastActiveOrgId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, req.user.userId))
    .limit(1);

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  res.status(200).json(successResponse(user));
});

module.exports = {
  register,
  login,
  requestMagicLink,
  verifyMagicLink,
  refreshToken,
  logout,
  getMe,
};
