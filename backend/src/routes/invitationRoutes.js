const express = require("express");
const invitationController = require("../controllers/invitationController");

const router = express.Router();

// GET /api/invitations/info/:token — public, no auth required
router.get("/info/:token", invitationController.getInvitationInfo);

module.exports = router;
