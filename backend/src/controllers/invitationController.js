const asyncHandler = require("../middleware/asyncHandler");
const invitationService = require("../services/invitationService");
const successResponse = require("../utils/successResponse");

/**
 * GET /api/invitations/info/:token
 * Public — no auth required.
 * Returns invitation metadata so the frontend can decide whether to show
 * login vs register, and which project to redirect to after acceptance.
 */
const getInvitationInfo = asyncHandler(async (req, res) => {
  const info = await invitationService.getInvitationByToken(req.params.token);
  res.status(200).json(successResponse(info));
});

module.exports = { getInvitationInfo };
